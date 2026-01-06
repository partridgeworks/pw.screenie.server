import { NextRequest, NextResponse } from "next/server";
import { tryGetCurrentUserForAPI, requireWritePermission } from "@/lib/server/auth";
import {
  addMemberToFamilyGroup,
  isUserParentInGroup
} from "@/lib/db/FamilyGroups";
import { findUserByEmail, createInvitedUser } from "@/lib/db/Users";
import { FamilyPosition, FamilyMemberStatus } from "@/lib/constants/familyConstants";
import logger from "@/lib/utils/serverLogger";

/**
 * Generate a placeholder email for a child user
 * Uses a template: {sanitized_name}_{timestamp}@screenie.local
 */
function generateChildPlaceholderEmail(name: string): string {
  const sanitizedName = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .substring(0, 20);
  const timestamp = Date.now();
  return `${sanitizedName}_${timestamp}@screenie.local`;
}

/**
 * Stub function for sending invitation emails
 * TODO: Implement actual email sending
 */
async function sendInvitationEmail(_email: string, _name: string, _familyName: string): Promise<void> {
  // Stub - email sending will be implemented later
  logger.info("[API/family/member]", `[STUB] Would send invitation email to ${_email}`);
}

/**
 * POST /api/family/[familyGroupId]/member
 * Add a member to the family group
 * 
 * For children: Creates a placeholder user with a generated email
 * For parents: Searches for existing user by email, creates invited user if not found
 * 
 * Requires write permission
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ familyGroupId: string }> }
) {
  const authResult = await tryGetCurrentUserForAPI(req);
  if (!authResult.success) {
    return authResult.response;
  }
  const { user: currentUser, permissions } = authResult;
  const { familyGroupId } = await params;

  // Check write permission
  const permissionError = requireWritePermission(permissions);
  if (permissionError) {
    return permissionError;
  }

  try {
    // Verify user is a parent in this group
    const isParent = await isUserParentInGroup(currentUser._id, familyGroupId);
    if (!isParent) {
      return NextResponse.json(
        { message: "You are not a parent in this family group" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, email, position, avatarName } = body as {
      name: string;
      email?: string;
      position: FamilyPosition;
      avatarName?: string;
    };

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { message: "Name is required" },
        { status: 400 }
      );
    }

    if (!position || !["parent", "child"].includes(position)) {
      return NextResponse.json(
        { message: "Position must be 'parent' or 'child'" },
        { status: 400 }
      );
    }

    // For parents, email is required
    if (position === "parent" && (!email || !email.trim())) {
      return NextResponse.json(
        { message: "Email address is required for parents" },
        { status: 400 }
      );
    }

    let userId: string;
    let memberStatus: FamilyMemberStatus;

    if (position === "child") {
      // For children: create a placeholder user with generated email
      const placeholderEmail = generateChildPlaceholderEmail(name);
      const newUser = await createInvitedUser(
        placeholderEmail,
        name.trim(),
        avatarName,
        "child"
      );
      userId = newUser._id;
      memberStatus = "active"; // Children are immediately active
      
      logger.info("[API/family/member]", `Created placeholder child user: ${userId} with email ${placeholderEmail}`);
    } else {
      // For parents: search for existing user or create invited user
      const normalizedEmail = email!.toLowerCase().trim();
      let existingUser = await findUserByEmail(normalizedEmail);

      if (existingUser) {
        // User exists - use their ID
        userId = existingUser._id;
        logger.info("[API/family/member]", `Found existing user: ${userId} for email ${normalizedEmail}`);
      } else {
        // User doesn't exist - create invited user
        const newUser = await createInvitedUser(
          normalizedEmail,
          name.trim(),
          avatarName,
          "parent"
        );
        userId = newUser._id;
        
        // Send invitation email (stub for now)
        await sendInvitationEmail(normalizedEmail, name.trim(), "the family");
        
        logger.info("[API/family/member]", `Created invited parent user: ${userId}`);
      }
      
      memberStatus = "invited"; // Parents start as invited
    }

    // Add the member to the family group
    const updatedGroup = await addMemberToFamilyGroup(
      familyGroupId,
      userId,
      position,
      memberStatus
    );

    if (!updatedGroup) {
      return NextResponse.json(
        { message: "Failed to add member (may already be in group)" },
        { status: 400 }
      );
    }

    logger.info("[API/family/member]", `Added user ${userId} to group ${familyGroupId} as ${position} with status ${memberStatus}`);

    return NextResponse.json({ familyGroup: updatedGroup }, { status: 201 });
  } catch (error) {
    const err = error as Error;
    logger.error("[API/family/member]", `Failed to add member: ${err.message}`);
    return NextResponse.json(
      { message: "Failed to add member" },
      { status: 500 }
    );
  }
}
