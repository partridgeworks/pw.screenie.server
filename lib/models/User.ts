import mongoose, { Schema } from "mongoose";
import { USER_STATUSES, USER_ROLES, UserStatus, UserRole } from "@/lib/constants/userConstants";
import { ROLES, Role } from "@/lib/constants/roleConstants";

// Define the user document interface explicitly for proper typing
interface IUser {
  clerkId?: string;
  name: string;
  email: string;
  status: UserStatus;
  applicationRole: UserRole;
  userRole: Role;
  avatarName?: string;
  CreationDate: Date;
  LastUpdatedDate: Date;
  IsDeleted: boolean;
}

// Mongoose schema for User
const UserSchema = new Schema<IUser>(
  {
    clerkId: { type: String, index: true, unique: true, sparse: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    status: { type: String, enum: USER_STATUSES, required: true, default: "pending" },
    applicationRole: { type: String, enum: USER_ROLES, required: true, default: "user" },
    userRole: { type: String, enum: ROLES, required: true, default: "readOnly" },
    avatarName: { type: String },
    CreationDate: { type: Date, default: Date.now },
    LastUpdatedDate: { type: Date, default: Date.now },
    IsDeleted: { type: Boolean, default: false }
  },
  { timestamps: { createdAt: "CreationDate", updatedAt: "LastUpdatedDate" } }
);

// Create and export the User model
const UserModel: mongoose.Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

// Export type with lowercase name for frontend usage - converts _id from ObjectId to string
export type user = IUser & { _id: string };

export default UserModel;
