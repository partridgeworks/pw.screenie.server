import mongoose, { Schema, Types } from "mongoose";
import {
  FAMILY_POSITIONS,
  FAMILY_MEMBER_STATUSES,
  FamilyPosition,
  FamilyMemberStatus
} from "@/lib/constants/familyConstants";

// Family member subdocument interface
interface IFamilyMember {
  userId: Types.ObjectId;
  position: FamilyPosition;
  status: FamilyMemberStatus;
  addedAt: Date;
}

// Family group document interface
interface IFamilyGroup {
  name: string;
  members: IFamilyMember[];
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

// Family member subdocument schema
const FamilyMemberSchema = new Schema<IFamilyMember>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    position: { type: String, enum: FAMILY_POSITIONS, required: true },
    status: { type: String, enum: FAMILY_MEMBER_STATUSES, required: true, default: "active" },
    addedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

// Family group schema
const FamilyGroupSchema = new Schema<IFamilyGroup>(
  {
    name: { type: String, required: true, trim: true },
    members: { type: [FamilyMemberSchema], default: [] },
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

// Create index for efficient queries on members
FamilyGroupSchema.index({ "members.userId": 1 });

// Create and export the FamilyGroup model
const FamilyGroupModel: mongoose.Model<IFamilyGroup> =
  mongoose.models.FamilyGroup || mongoose.model<IFamilyGroup>("FamilyGroup", FamilyGroupSchema);

// Export types for frontend usage
export type familyMember = IFamilyMember & { userId: string };
export type familyGroup = Omit<IFamilyGroup, "members"> & {
  _id: string;
  members: familyMember[];
};

export default FamilyGroupModel;
