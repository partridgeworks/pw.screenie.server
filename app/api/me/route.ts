import { NextRequest, NextResponse } from "next/server";
import { tryGetCurrentUserForAPI, requireReadPermission } from "@/lib/server/auth";

/**
 * GET /api/me
 * Get the current authenticated user's profile
 * Requires read permission
 */
export async function GET(req: NextRequest) {
  const authResult = await tryGetCurrentUserForAPI(req);
  if (!authResult.success) {
    return authResult.response;
  }

  const { user: currentUser, permissions, effectiveRole } = authResult;

  // Check read permission
  const permissionError = requireReadPermission(permissions);
  if (permissionError) {
    return permissionError;
  }

  // Return user data (excluding sensitive fields if any)
  return NextResponse.json({
    _id: currentUser._id,
    clerkId: currentUser.clerkId,
    name: currentUser.name,
    email: currentUser.email,
    status: currentUser.status,
    applicationRole: currentUser.applicationRole,
    userRole: currentUser.userRole,
    effectiveRole
  });
}
