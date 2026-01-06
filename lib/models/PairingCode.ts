import mongoose, { Schema, Types } from "mongoose";
import { PAIRING_STATUSES, PairingStatus } from "@/lib/constants/pairingConstants";

/**
 * Pairing code document interface
 * Used for device pairing flow to obtain API keys on devices with limited input
 */
interface IPairingCode {
  code: string;
  userId: Types.ObjectId | null;
  deviceName: string;
  status: PairingStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PairingCodeSchema = new Schema<IPairingCode>(
  {
    code: {
      type: String,
      required: true,
      maxlength: 8,
      uppercase: true,
      index: true,
      unique: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },
    deviceName: {
      type: String,
      default: "device",
      maxlength: 100
    },
    status: {
      type: String,
      enum: PAIRING_STATUSES,
      default: "issued",
      required: true,
      index: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index for efficient lookups
PairingCodeSchema.index({ code: 1, status: 1 });

const PairingCodeModel: mongoose.Model<IPairingCode> =
  mongoose.models.PairingCode || mongoose.model<IPairingCode>("PairingCode", PairingCodeSchema);

// Export type with lowercase name for frontend usage
export type pairingCode = Omit<IPairingCode, "userId"> & {
  _id: string;
  userId: string | null;
};

export default PairingCodeModel;
