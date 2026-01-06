import mongoose, { Schema } from "mongoose";
import { ROLES, KEY_TYPES, Role, KeyType } from "@/lib/constants/roleConstants";

// Define the API key document interface explicitly for proper typing
interface IApiKey {
  userId: mongoose.Types.ObjectId;
  keyHash: string;
  keyPrefix: string;
  keyRole: Role;
  keyType: KeyType;
  name?: string;
  expiresOn?: Date;
  isDeleted: boolean;
  CreationDate: Date;
  LastUpdatedDate: Date;
}

// Mongoose schema for ApiKey
const ApiKeySchema = new Schema<IApiKey>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    keyHash: { type: String, required: true, unique: true, index: true },
    keyPrefix: { type: String, required: true },
    keyRole: { type: String, enum: ROLES, required: true, default: "readOnly" },
    keyType: { type: String, enum: KEY_TYPES, required: true, default: "general" },
    name: { type: String, trim: true },
    expiresOn: { type: Date },
    isDeleted: { type: Boolean, default: false, index: true },
    CreationDate: { type: Date, default: Date.now },
    LastUpdatedDate: { type: Date, default: Date.now }
  },
  { timestamps: { createdAt: "CreationDate", updatedAt: "LastUpdatedDate" } }
);

// Create compound index for efficient queries
ApiKeySchema.index({ userId: 1, isDeleted: 1 });
ApiKeySchema.index({ keyHash: 1, isDeleted: 1 });

// Create and export the ApiKey model
const ApiKeyModel: mongoose.Model<IApiKey> =
  mongoose.models.ApiKey || mongoose.model<IApiKey>("ApiKey", ApiKeySchema);

// Export type with lowercase name for frontend usage - converts ObjectIds to strings
export type apiKey = Omit<IApiKey, "userId"> & { _id: string; userId: string };

export default ApiKeyModel;
