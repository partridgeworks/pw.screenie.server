import ScreenTimeSessionModel, { screenTimeSession } from "@/lib/models/ScreenTimeSession";
import { getMongoose } from "@/lib/utils/mongo";
import logger from "@/lib/utils/serverLogger";
import mongoose from "mongoose";

/**
 * Convert document to frontend-friendly type
 */
function toScreenTimeSession(doc: mongoose.Document): screenTimeSession {
  const obj = doc.toObject();
  return {
    _id: obj._id.toString(),
    childId: obj.childId.toString(),
    familyId: obj.familyId.toString(),
    startedAt: obj.startedAt,
    duration: obj.duration,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt
  };
}

/**
 * Find all session records for a child on a specific date in a family group
 * @param familyId - The family group ID
 * @param childId - The child user ID
 * @param dateString - The date in YYYY-MM-DD format
 * @returns Array of session records for that date
 */
export async function findSessionsByChildAndDate(
  familyId: string,
  childId: string,
  dateString: string
): Promise<screenTimeSession[]> {
  await getMongoose();

  // Parse the date string to get start and end of day
  const startOfDay = new Date(`${dateString}T00:00:00.000Z`);
  const endOfDay = new Date(`${dateString}T23:59:59.999Z`);

  const records = await ScreenTimeSessionModel.find({
    familyId: new mongoose.Types.ObjectId(familyId),
    childId: new mongoose.Types.ObjectId(childId),
    startedAt: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  }).sort({ startedAt: 1 });

  return records.map(toScreenTimeSession);
}

/**
 * Create a new screen time session record
 * @param familyId - The family group ID
 * @param childId - The child user ID
 * @param startedAt - The date and time when the session started
 * @param duration - Duration in minutes
 * @returns The created session record
 */
export async function createScreenTimeSession(
  familyId: string,
  childId: string,
  startedAt: Date,
  duration: number
): Promise<screenTimeSession> {
  await getMongoose();

  logger.info(
    "[ScreenTimeSessions]",
    `Creating session for child ${childId} in family ${familyId} at ${startedAt.toISOString()}: ${duration} minutes`
  );

  const session = await ScreenTimeSessionModel.create({
    familyId: new mongoose.Types.ObjectId(familyId),
    childId: new mongoose.Types.ObjectId(childId),
    startedAt,
    duration
  });

  return toScreenTimeSession(session);
}

/**
 * Get total consumed minutes for a child on a specific date
 * @param familyId - The family group ID
 * @param childId - The child user ID
 * @param dateString - The date in YYYY-MM-DD format
 * @returns Total minutes consumed across all sessions on that date
 */
export async function getTotalConsumedMinutes(
  familyId: string,
  childId: string,
  dateString: string
): Promise<number> {
  const records = await findSessionsByChildAndDate(familyId, childId, dateString);
  return records.reduce((total, record) => total + record.duration, 0);
}
