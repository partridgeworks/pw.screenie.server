import ScreenTimeAllowanceModel, {
  screenTimeAllowance,
  screenTimeSchedule,
  dailyAllowance
} from "@/lib/models/ScreenTimeAllowance";
import { getMongoose } from "@/lib/utils/mongo";
import { DAYS_OF_WEEK, DayOfWeek } from "@/lib/constants/familyConstants";
import logger from "@/lib/utils/serverLogger";
import mongoose from "mongoose";

/**
 * Create default schedule with unlimited time for all days
 */
function createDefaultSchedule(): screenTimeSchedule {
  const schedule = {} as screenTimeSchedule;
  for (const day of DAYS_OF_WEEK) {
    schedule[day] = {
      allowedMinutes: null,
      wakeUpTime: null,
      bedTime: null
    };
  }
  return schedule;
}

/**
 * Convert MongoDB Map to frontend-friendly schedule object
 */
function mapToSchedule(
  scheduleMap: Map<DayOfWeek, dailyAllowance> | undefined
): screenTimeSchedule {
  if (!scheduleMap) {
    return createDefaultSchedule();
  }

  const schedule = {} as screenTimeSchedule;
  for (const day of DAYS_OF_WEEK) {
    const dayAllowance = scheduleMap.get(day);
    schedule[day] = dayAllowance || {
      allowedMinutes: null,
      wakeUpTime: null,
      bedTime: null
    };
  }
  return schedule;
}

/**
 * Convert document to frontend-friendly type
 */
function toScreenTimeAllowance(doc: mongoose.Document): screenTimeAllowance {
  const obj = doc.toObject();
  return {
    _id: obj._id.toString(),
    userId: obj.userId.toString(),
    familyGroupId: obj.familyGroupId.toString(),
    schedule: mapToSchedule(obj.schedule),
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
    isDeleted: obj.isDeleted
  };
}

/**
 * Find screen time allowance for a user in a specific family group
 */
export async function findScreenTimeAllowanceByUserId(
  userId: string,
  familyGroupId: string
): Promise<screenTimeAllowance | null> {
  await getMongoose();

  const allowance = await ScreenTimeAllowanceModel.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    familyGroupId: new mongoose.Types.ObjectId(familyGroupId),
    isDeleted: false
  });

  return allowance ? toScreenTimeAllowance(allowance) : null;
}

/**
 * Get or create screen time allowance for a user in a specific family group
 * Returns existing allowance or creates a new one with default values
 */
export async function getOrCreateScreenTimeAllowance(
  userId: string,
  familyGroupId: string
): Promise<screenTimeAllowance> {
  await getMongoose();

  const existing = await findScreenTimeAllowanceByUserId(userId, familyGroupId);
  if (existing) {
    return existing;
  }

  logger.info("[ScreenTimeAllowances]", `Creating new allowance for user ${userId} in family group ${familyGroupId}`);

  const newAllowance = await ScreenTimeAllowanceModel.create({
    userId: new mongoose.Types.ObjectId(userId),
    familyGroupId: new mongoose.Types.ObjectId(familyGroupId)
  });

  return toScreenTimeAllowance(newAllowance);
}

/**
 * Update screen time allowance for a user in a specific family group
 */
export async function updateScreenTimeAllowance(
  userId: string,
  familyGroupId: string,
  schedule: screenTimeSchedule
): Promise<screenTimeAllowance | null> {
  await getMongoose();

  logger.info("[ScreenTimeAllowances]", `Updating allowance for user ${userId} in family group ${familyGroupId}`);

  // Validate the schedule
  for (const day of DAYS_OF_WEEK) {
    const daySchedule = schedule[day];
    if (!daySchedule) {
      throw new Error(`Missing schedule for ${day}`);
    }

    // Validate allowedMinutes
    if (
      daySchedule.allowedMinutes !== null &&
      (daySchedule.allowedMinutes < 0 || daySchedule.allowedMinutes > 1440)
    ) {
      throw new Error(`Invalid allowedMinutes for ${day}: must be 0-1440 or null`);
    }

    // Validate time formats
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (daySchedule.wakeUpTime !== null && !timeRegex.test(daySchedule.wakeUpTime)) {
      throw new Error(`Invalid wakeUpTime format for ${day}: must be HH:MM`);
    }
    if (daySchedule.bedTime !== null && !timeRegex.test(daySchedule.bedTime)) {
      throw new Error(`Invalid bedTime format for ${day}: must be HH:MM`);
    }
  }

  // Convert schedule object to Map for MongoDB
  const scheduleMap = new Map<DayOfWeek, dailyAllowance>();
  for (const day of DAYS_OF_WEEK) {
    scheduleMap.set(day, schedule[day]);
  }

  const updatedAllowance = await ScreenTimeAllowanceModel.findOneAndUpdate(
    {
      userId: new mongoose.Types.ObjectId(userId),
      familyGroupId: new mongoose.Types.ObjectId(familyGroupId),
      isDeleted: false
    },
    { schedule: scheduleMap },
    { new: true, upsert: true }
  );

  return updatedAllowance ? toScreenTimeAllowance(updatedAllowance) : null;
}

/**
 * Update a single day's screen time allowance in a specific family group
 */
export async function updateDayAllowance(
  userId: string,
  familyGroupId: string,
  day: DayOfWeek,
  allowance: dailyAllowance
): Promise<screenTimeAllowance | null> {
  await getMongoose();

  logger.info("[ScreenTimeAllowances]", `Updating ${day} allowance for user ${userId} in family group ${familyGroupId}`);

  // Get current allowance or create with defaults
  const current = await getOrCreateScreenTimeAllowance(userId, familyGroupId);
  current.schedule[day] = allowance;

  return updateScreenTimeAllowance(userId, familyGroupId, current.schedule);
}

/**
 * Delete screen time allowance for a user in a specific family group (soft delete)
 */
export async function deleteScreenTimeAllowance(
  userId: string,
  familyGroupId: string
): Promise<boolean> {
  await getMongoose();

  logger.info("[ScreenTimeAllowances]", `Deleting allowance for user ${userId} in family group ${familyGroupId}`);

  const result = await ScreenTimeAllowanceModel.findOneAndUpdate(
    {
      userId: new mongoose.Types.ObjectId(userId),
      familyGroupId: new mongoose.Types.ObjectId(familyGroupId)
    },
    { isDeleted: true }
  );

  return !!result;
}
