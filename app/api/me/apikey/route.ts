import { NextRequest, NextResponse } from "next/server";
import { tryGetCurrentUserForAPI, requireReadPermission, requireWritePermission } from "@/lib/server/auth";
import { createAPIKeyForUser, getGeneralAPIKeysForUser, revokeAPIKey } from "@/lib/server/apiKeyAuth";
import { ROLES, Role } from "@/lib/constants/roleConstants";
import logger from "@/lib/utils/serverLogger";

/**
 * GET /api/me/apikey - List all general API keys for the current user
 * 
 * Requires read permission
 */
export async function GET(req: NextRequest) {
  const authResult = await tryGetCurrentUserForAPI(req);
  if (!authResult.success) {
    return authResult.response;
  }

  const { user: currentUser, permissions } = authResult;

  // Check read permission
  const permissionError = requireReadPermission(permissions);
  if (permissionError) {
    return permissionError;
  }

  try {
    const apiKeys = await getGeneralAPIKeysForUser(currentUser._id);

    // Return keys without sensitive data (keyHash)
    const safeKeys = apiKeys.map((key) => ({
      _id: key._id,
      keyPrefix: key.keyPrefix,
      keyRole: key.keyRole,
      keyType: key.keyType,
      name: key.name,
      expiresOn: key.expiresOn,
      CreationDate: key.CreationDate
    }));

    return NextResponse.json({ apiKeys: safeKeys });
  } catch (error) {
    const err = error as Error;
    logger.error("[API Key]", `Failed to list API keys: ${err.message}`);
    return NextResponse.json(
      { message: "Failed to list API keys" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/me/apikey - Create a new API key for the current user
 * 
 * Body (optional):
 * - keyRole: "readWrite" | "readOnly" (default: "readOnly")
 * - name: Optional name/notes for the key
 */
export async function POST(req: NextRequest) {
  const authResult = await tryGetCurrentUserForAPI(req);
  if (!authResult.success) {
    return authResult.response;
  }

  const { user: currentUser, permissions } = authResult;

  // Creating API keys requires write permission
  const permissionError = requireWritePermission(permissions);
  if (permissionError) {
    return permissionError;
  }

  try {
    // Parse optional body
    let keyRole: Role = "readOnly";
    let name: string | undefined;

    try {
      const body = await req.json();
      if (body.keyRole && ROLES.includes(body.keyRole)) {
        keyRole = body.keyRole;
      }
      if (body.name && typeof body.name === "string") {
        name = body.name.trim().slice(0, 100); // Limit name length
      }
    } catch {
      // No body or invalid JSON - use defaults
    }

    const { rawKey, keyPrefix, keyId } = await createAPIKeyForUser(
      currentUser._id,
      keyRole,
      "general", // Front-end created keys are always 'general' type
      name
    );

    logger.info("[API Key]", `Created API key (${keyRole}) for user: ${currentUser.email}`);

    return NextResponse.json({
      message: "API key created successfully",
      apiKey: rawKey,
      keyId,
      keyPrefix,
      keyRole,
      warning: "Store this API key securely. It will not be shown again."
    });
  } catch (error) {
    const err = error as Error;
    logger.error("[API Key]", `Failed to create API key: ${err.message}`);
    return NextResponse.json(
      { message: "Failed to create API key" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/me/apikey - Revoke an API key
 * 
 * Body:
 * - keyId: The ID of the key to revoke
 */
export async function DELETE(req: NextRequest) {
  const authResult = await tryGetCurrentUserForAPI(req);
  if (!authResult.success) {
    return authResult.response;
  }

  const { user: currentUser, permissions } = authResult;

  // Revoking API keys requires write permission
  const permissionError = requireWritePermission(permissions);
  if (permissionError) {
    return permissionError;
  }

  try {
    const body = await req.json();
    const { keyId } = body;

    if (!keyId || typeof keyId !== "string") {
      return NextResponse.json(
        { message: "keyId is required" },
        { status: 400 }
      );
    }

    const success = await revokeAPIKey(keyId, currentUser._id);

    if (!success) {
      return NextResponse.json(
        { message: "API key not found or already revoked" },
        { status: 404 }
      );
    }

    logger.info("[API Key]", `Revoked API key ${keyId} for user: ${currentUser.email}`);

    return NextResponse.json({
      message: "API key revoked successfully"
    });
  } catch (error) {
    const err = error as Error;
    logger.error("[API Key]", `Failed to revoke API key: ${err.message}`);
    return NextResponse.json(
      { message: "Failed to revoke API key" },
      { status: 500 }
    );
  }
}
