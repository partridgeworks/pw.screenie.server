import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import UserModel, { user } from "@/lib/models/User";
import { findUserByClerkId, createUserFromClerk, findUserByEmail } from "@/lib/db/Users";
import { getMongoose } from "@/lib/utils/mongo";
import { getAuthFromAPIKey, ApiKeyAuthResult } from "@/lib/server/apiKeyAuth";
import { Role, Permissions, getPermissionsForRole } from "@/lib/constants/roleConstants";
import logger from "@/lib/utils/serverLogger";

/**
 * Result type for tryGetCurrentUserForAPI - a discriminated union
 * that ensures type-safe handling of success/failure cases.
 * Now includes effective role and permissions.
 */
export type APIAuthResult =
  | {
    success: true;
    user: user;
    authenticatedWithApiKey: boolean;
    effectiveRole: Role;
    permissions: Permissions;
  }
  | { success: false; response: NextResponse };

/**
 * Retrieves the current authenticated user via Clerk authentication.
 * Creates a new local user record if one doesn't exist.
 * Throws if no authenticated user can be determined.
 * 
 * Use this in server components and server actions where you expect
 * the user to be authenticated (protected by middleware).
 */
export async function getCurrentUser(): Promise<user> {
  await getMongoose();

  // Clerk authentication
  const { userId } = await auth();
  if (!userId) {
    logger.warn("[Auth]", "No authenticated Clerk user found");
    throw new Error("Unauthorized: no authenticated Clerk user");
  }

  const clerk = await currentUser();
  if (!clerk) {
    logger.warn("[Auth]", "Clerk currentUser() returned null");
    throw new Error("Clerk currentUser() returned null");
  }

  const clerkId = clerk.id;
  // Clerk primary email can be in different locations depending on provider
  const email =
    clerk.emailAddresses?.find((e) => e.id === clerk.primaryEmailAddressId)?.emailAddress ||
    clerk.emailAddresses?.[0]?.emailAddress ||
    null;
  const firstName = clerk.firstName ?? "";
  const lastName = clerk.lastName ?? "";
  const name = `${firstName} ${lastName}`.trim() || "User";

  logger.info("[Auth]", `Looking up user for clerkId: ${clerkId}`);

  // Try to find existing local user by clerkId
  let localUser = await findUserByClerkId(clerkId);

  if (!localUser) {

    // Find local user by email and link accounts
    let didLinkAccount = false;
    if (email) {
      localUser = await findUserByEmail(email || "");
      if (localUser) {
        logger.info("[Auth]", `Linking existing local user ${email} to clerkId: ${clerkId}`);
        // Update the existing user to set the clerkId and approve them
        await getMongoose();
        await UserModel.updateOne(
          { _id: localUser._id },
          { $set: { clerkId, status: "approved" } }
        ).exec();
        // Refresh localUser with updated data
        localUser = await findUserByClerkId(clerkId);
        didLinkAccount = true;
      }
    }

    if (!didLinkAccount) {
      // Create a new user if none exists
      logger.info("[Auth]", `Creating new local user for: ${email}`);
      localUser = await createUserFromClerk(
        clerkId,
        name,
        email || `no-email-${clerkId}@example.local`
      );
    }
  }

  if (!localUser) {
    throw new Error("Failed to retrieve or create local user for authenticated Clerk user");
  }

  logger.info("[Auth]", `User authenticated: ${localUser.email} (status: ${localUser.status})`);
  return localUser;
}

/**
 * API-specific authentication wrapper that handles errors gracefully.
 * Returns a discriminated union: either a success with the user, or a failure with an HTTP response.
 * 
 * The effective role is determined by the authentication method:
 * - If authenticated via API key: effectiveRole = keyRole from the API key
 * - If authenticated via Clerk session: effectiveRole = userRole from the User
 * 
 * Permissions are derived from the effective role using the hardcoded permission map.
 * 
 * Usage:
 * ```typescript
 * const authResult = await tryGetCurrentUserForAPI(req);
 * if (!authResult.success) {
 *   return authResult.response;
 * }
 * const { user, permissions } = authResult;
 * if (!permissions.canWrite) {
 *   return NextResponse.json({ message: "Write access required" }, { status: 403 });
 * }
 * ```
 * 
 * @param req The NextRequest object from the API route
 * @returns APIAuthResult - either { success: true, user, effectiveRole, permissions } or { success: false, response }
 */
export async function tryGetCurrentUserForAPI(req: NextRequest): Promise<APIAuthResult> {
  try {
    await getMongoose();

    // Try API key authentication first
    const apiKeyAuth = await getAuthFromAPIKey(req);
    if (apiKeyAuth) {
      const effectiveRole = apiKeyAuth.keyRole;
      const permissions = getPermissionsForRole(effectiveRole);

      return {
        success: true,
        user: apiKeyAuth.user,
        authenticatedWithApiKey: true,
        effectiveRole,
        permissions
      };
    }

    // Fall back to Clerk authentication
    const localUser = await getCurrentUser();
    const effectiveRole = localUser.userRole;
    const permissions = getPermissionsForRole(effectiveRole);

    return {
      success: true,
      user: localUser,
      authenticatedWithApiKey: false,
      effectiveRole,
      permissions
    };
  } catch (error) {
    const err = error as Error;
    logger.warn("[Auth]", `API authentication failed: ${err.message}`);

    return {
      success: false,
      response: NextResponse.json(
        { message: "Unauthorized: authentication required" },
        { status: 401 }
      )
    };
  }
}

/**
 * Check if the current user has a specific role.
 * Throws if the user doesn't have the required role.
 * 
 * @param currentUser The authenticated user
 * @param requiredRole The role required to access the resource
 */
export function requireRole(currentUser: user, requiredRole: "user" | "admin"): void {
  if (requiredRole === "admin" && currentUser.applicationRole !== "admin") {
    logger.warn("[Auth]", `User ${currentUser.email} attempted admin action without permission`);
    throw new Error("Forbidden: admin access required");
  }
}

/**
 * Check if the current user has approved status.
 * Returns false if the user is pending or suspended.
 */
export function isUserApproved(currentUser: user): boolean {
  return currentUser.status === "approved";
}

/**
 * Helper to create a 403 Forbidden response for write permission
 */
export function forbiddenWriteResponse(): NextResponse {
  return NextResponse.json(
    { message: "Forbidden: write permission required" },
    { status: 403 }
  );
}

/**
 * Helper to create a 403 Forbidden response for read permission
 */
export function forbiddenReadResponse(): NextResponse {
  return NextResponse.json(
    { message: "Forbidden: read permission required" },
    { status: 403 }
  );
}

/**
 * Checks write permission and returns a 403 response if not allowed.
 * Returns null if the permission check passes.
 */
export function requireWritePermission(permissions: Permissions): NextResponse | null {
  if (!permissions.canWrite) {
    logger.warn("[Auth]", "Write permission denied");
    return forbiddenWriteResponse();
  }
  return null;
}

/**
 * Checks read permission and returns a 403 response if not allowed.
 * Returns null if the permission check passes.
 */
export function requireReadPermission(permissions: Permissions): NextResponse | null {
  if (!permissions.canRead) {
    logger.warn("[Auth]", "Read permission denied");
    return forbiddenReadResponse();
  }
  return null;
}
