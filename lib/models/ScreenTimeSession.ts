import mongoose, { Schema, Types } from "mongoose";

/**
 * Screen time session document interface
 * Tracks individual screen time sessions for a child on any given date
 * Multiple sessions can exist per child per family per date
 */
interface IScreenTimeSession {
  childId: Types.ObjectId;
  familyId: Types.ObjectId;
  startedAt: Date; // Date and time when the session started
  duration: number; // Duration in minutes
  createdAt: Date;
  updatedAt: Date;
}

// Screen time session schema
const ScreenTimeSessionSchema = new Schema<IScreenTimeSession>(
  {
    childId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    familyId: {
      type: Schema.Types.ObjectId,
      ref: "FamilyGroup",
      required: true,
      index: true
    },
    startedAt: {
      type: Date,
      required: true
    },
    duration: {
      type: Number,
      required: true,
      min: 0,
      max: 1440, // Maximum 24 hours in minutes
      validate: {
        validator: function (v: number) {
          return Number.isInteger(v) && v >= 0 && v <= 1440;
        },
        message: "duration must be an integer between 0 and 1440"
      }
    }
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

// Index for date-based queries (no unique constraint - multiple sessions allowed per day)
ScreenTimeSessionSchema.index({ childId: 1, familyId: 1, startedAt: 1 });

// Create and export the ScreenTimeSession model
const ScreenTimeSessionModel: mongoose.Model<IScreenTimeSession> =
  mongoose.models.ScreenTimeSession ||
  mongoose.model<IScreenTimeSession>("ScreenTimeSession", ScreenTimeSessionSchema);

// Export type for frontend usage
export type screenTimeSession = {
  _id: string;
  childId: string;
  familyId: string;
  startedAt: Date;
  duration: number;
  createdAt: Date;
  updatedAt: Date;
};

export default ScreenTimeSessionModel;
