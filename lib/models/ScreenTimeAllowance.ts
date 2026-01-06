import mongoose, { Schema, Types } from "mongoose";
import { DAYS_OF_WEEK, DayOfWeek } from "@/lib/constants/familyConstants";

/**
 * Daily allowance settings for a single day of the week
 * - allowedMinutes: null = unlimited, otherwise max 1440 (24 hours)
 * - wakeUpTime: HH:MM format (24-hour), null = no restriction
 * - bedTime: HH:MM format (24-hour), null = no restriction
 */
interface IDailyAllowance {
  allowedMinutes: number | null;
  wakeUpTime: string | null;
  bedTime: string | null;
}

/**
 * Screen time allowance document interface
 * Uses a Map structure for efficient day-based lookups
 */
interface IScreenTimeAllowance {
  userId: Types.ObjectId;
  familyGroupId: Types.ObjectId;
  schedule: Map<DayOfWeek, IDailyAllowance>;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

// Daily allowance subdocument schema
const DailyAllowanceSchema = new Schema<IDailyAllowance>(
  {
    allowedMinutes: {
      type: Number,
      default: null,
      min: 0,
      max: 1440, // 24 hours in minutes
      validate: {
        validator: function (v: number | null) {
          return v === null || (Number.isInteger(v) && v >= 0 && v <= 1440);
        },
        message: "allowedMinutes must be null or an integer between 0 and 1440"
      }
    },
    wakeUpTime: {
      type: String,
      default: null,
      validate: {
        validator: function (v: string | null) {
          if (v === null) return true;
          return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
        },
        message: "wakeUpTime must be in HH:MM 24-hour format"
      }
    },
    bedTime: {
      type: String,
      default: null,
      validate: {
        validator: function (v: string | null) {
          if (v === null) return true;
          return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
        },
        message: "bedTime must be in HH:MM 24-hour format"
      }
    }
  },
  { _id: false }
);

// Screen time allowance schema
const ScreenTimeAllowanceSchema = new Schema<IScreenTimeAllowance>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    familyGroupId: {
      type: Schema.Types.ObjectId,
      ref: "FamilyGroup",
      required: true,
      index: true
    },
    schedule: {
      type: Map,
      of: DailyAllowanceSchema,
      default: () => {
        const defaultSchedule = new Map<DayOfWeek, IDailyAllowance>();
        for (const day of DAYS_OF_WEEK) {
          defaultSchedule.set(day, {
            allowedMinutes: null,
            wakeUpTime: null,
            bedTime: null
          });
        }
        return defaultSchedule;
      }
    },
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

// Add compound unique index for userId + familyGroupId
ScreenTimeAllowanceSchema.index({ userId: 1, familyGroupId: 1 }, { unique: true });

// Create and export the ScreenTimeAllowance model
const ScreenTimeAllowanceModel: mongoose.Model<IScreenTimeAllowance> =
  mongoose.models.ScreenTimeAllowance ||
  mongoose.model<IScreenTimeAllowance>("ScreenTimeAllowance", ScreenTimeAllowanceSchema);

// Export types for frontend usage
export type dailyAllowance = IDailyAllowance;

export type screenTimeSchedule = {
  [K in DayOfWeek]: dailyAllowance;
};

export type screenTimeAllowance = {
  _id: string;
  userId: string;
  familyGroupId: string;
  schedule: screenTimeSchedule;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
};

export default ScreenTimeAllowanceModel;
