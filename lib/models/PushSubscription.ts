import mongoose, { Schema, Types } from "mongoose";
import { PUSH_SUBSCRIPTION_STATUSES, PushSubscriptionStatus } from "@/lib/constants/pushConstants";

// Push subscription document interface
interface IPushSubscription {
  userId: Types.ObjectId;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  deviceInfo?: string;
  status: PushSubscriptionStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Push subscription schema
const PushSubscriptionSchema = new Schema<IPushSubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    endpoint: {
      type: String,
      required: true,
      unique: true
    },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true }
    },
    deviceInfo: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: PUSH_SUBSCRIPTION_STATUSES,
      default: "active"
    }
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

// Index for efficient lookups by endpoint
PushSubscriptionSchema.index({ endpoint: 1 });

// Create and export the model
const PushSubscriptionModel: mongoose.Model<IPushSubscription> =
  mongoose.models.PushSubscription ||
  mongoose.model<IPushSubscription>("PushSubscription", PushSubscriptionSchema);

// Export type for frontend usage
export type pushSubscription = IPushSubscription & { _id: string };

export default PushSubscriptionModel;
