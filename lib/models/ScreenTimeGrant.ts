import mongoose, { Schema, Types } from "mongoose";
import { GRANT_STATUSES, GrantStatus } from "@/lib/constants/grantConstants";

/**
 * Screen time grant document interface
 * A grant can include one or more of:
 * - bonusMinutes: Delta to add/subtract to daily allowed minutes
 * - overrideWakeUpTime: New wake-up time for that day
 * - overrideBedTime: New bedtime for that day
 * 
 * Grants have a status:
 * - requested: Created by a child device, awaiting parent approval
 * - granted: Approved and effective
 * - rejected: Declined by a parent
 */
interface IScreenTimeGrant {
  familyGroupId: Types.ObjectId;
  childUserId: Types.ObjectId;
  grantedByUserId: Types.ObjectId;
  applicableDate: string; // YYYY-MM-DD format
  bonusMinutes: number | null;
  overrideWakeUpTime: string | null;
  overrideBedTime: string | null;
  status: GrantStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

// Screen time grant schema
const ScreenTimeGrantSchema = new Schema<IScreenTimeGrant>(
  {
    familyGroupId: {
      type: Schema.Types.ObjectId,
      ref: "FamilyGroup",
      required: true,
      index: true
    },
    childUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    grantedByUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    applicableDate: {
      type: String,
      required: true,
      validate: {
        validator: function (v: string) {
          return /^\d{4}-\d{2}-\d{2}$/.test(v);
        },
        message: "applicableDate must be in YYYY-MM-DD format"
      }
    },
    bonusMinutes: {
      type: Number,
      default: null,
      validate: {
        validator: function (v: number | null) {
          if (v === null) return true;
          // Allow -180 to +180 minutes (3 hours)
          return Number.isInteger(v) && v >= -180 && v <= 180;
        },
        message: "bonusMinutes must be null or an integer between -180 and 180"
      }
    },
    overrideWakeUpTime: {
      type: String,
      default: null,
      validate: {
        validator: function (v: string | null) {
          if (v === null) return true;
          return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
        },
        message: "overrideWakeUpTime must be in HH:MM 24-hour format"
      }
    },
    overrideBedTime: {
      type: String,
      default: null,
      validate: {
        validator: function (v: string | null) {
          if (v === null) return true;
          return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
        },
        message: "overrideBedTime must be in HH:MM 24-hour format"
      }
    },
    status: {
      type: String,
      enum: GRANT_STATUSES,
      default: "granted"
    },
    notes: {
      type: String,
      default: null
    },
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

// Create compound index for efficient queries by family, child, and date
ScreenTimeGrantSchema.index({ familyGroupId: 1, childUserId: 1, applicableDate: 1 });
// Index for date-based queries
ScreenTimeGrantSchema.index({ applicableDate: 1 });

// Create and export the ScreenTimeGrant model
const ScreenTimeGrantModel: mongoose.Model<IScreenTimeGrant> =
  mongoose.models.ScreenTimeGrant ||
  mongoose.model<IScreenTimeGrant>("ScreenTimeGrant", ScreenTimeGrantSchema);

// Export types for frontend usage
export type screenTimeGrant = {
  _id: string;
  familyGroupId: string;
  childUserId: string;
  grantedByUserId: string;
  applicableDate: string;
  bonusMinutes: number | null;
  overrideWakeUpTime: string | null;
  overrideBedTime: string | null;
  status: GrantStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
};

export default ScreenTimeGrantModel;
