import ScreenTimeGrantModel, { screenTimeGrant } from "@/lib/models/ScreenTimeGrant";
import { GrantStatus } from "@/lib/constants/grantConstants";
import { getMongoose } from "@/lib/utils/mongo";
import logger from "@/lib/utils/serverLogger";
import mongoose from "mongoose";

/**
 * Convert document to frontend-friendly type
 */
function toScreenTimeGrant(doc: mongoose.Document): screenTimeGrant {
  const obj = doc.toObject();
  return {
    _id: obj._id.toString(),
    familyGroupId: obj.familyGroupId.toString(),
    childUserId: obj.childUserId.toString(),
    grantedByUserId: obj.grantedByUserId.toString(),
    applicableDate: obj.applicableDate,
    bonusMinutes: obj.bonusMinutes,
    overrideWakeUpTime: obj.overrideWakeUpTime,
    overrideBedTime: obj.overrideBedTime,
    status: obj.status,
    notes: obj.notes,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
    isDeleted: obj.isDeleted
  };
}

/**
 * Find all GRANTED grants for a child on a specific date in a family group
 * Only returns grants with status 'granted' for effective allowance calculations
 * Returns grants ordered chronologically by creation date
 */
export async function findGrantsByChildAndDate(
  familyGroupId: string,
  childUserId: string,
  applicableDate: string
): Promise<screenTimeGrant[]> {
  await getMongoose();

  const grants = await ScreenTimeGrantModel.find({
    familyGroupId: new mongoose.Types.ObjectId(familyGroupId),
    childUserId: new mongoose.Types.ObjectId(childUserId),
    applicableDate,
    status: "granted",
    isDeleted: false
  }).sort({ createdAt: 1 });

  return grants.map(toScreenTimeGrant);
}

/**
 * Find all grants for a family group on a specific date
 * Returns grants ordered chronologically by creation date
 */
export async function findGrantsByFamilyAndDate(
  familyGroupId: string,
  applicableDate: string
): Promise<screenTimeGrant[]> {
  await getMongoose();

  const grants = await ScreenTimeGrantModel.find({
    familyGroupId: new mongoose.Types.ObjectId(familyGroupId),
    applicableDate,
    isDeleted: false
  }).sort({ createdAt: 1 });

  return grants.map(toScreenTimeGrant);
}

/**
 * Find all grants for a family group within a date range
 * Returns grants ordered chronologically by creation date
 */
export async function findGrantsByFamilyAndDateRange(
  familyGroupId: string,
  startDate: string,
  endDate: string
): Promise<screenTimeGrant[]> {
  await getMongoose();

  const grants = await ScreenTimeGrantModel.find({
    familyGroupId: new mongoose.Types.ObjectId(familyGroupId),
    applicableDate: { $gte: startDate, $lte: endDate },
    isDeleted: false
  }).sort({ applicableDate: 1, createdAt: 1 });

  return grants.map(toScreenTimeGrant);
}

/**
 * Create a new screen time grant
 */
export async function createScreenTimeGrant(
  familyGroupId: string,
  childUserId: string,
  grantedByUserId: string,
  applicableDate: string,
  bonusMinutes: number | null,
  overrideWakeUpTime: string | null,
  overrideBedTime: string | null,
  status: GrantStatus = "granted",
  notes: string | null = null
): Promise<screenTimeGrant> {
  await getMongoose();

  logger.info(
    "[ScreenTimeGrants]",
    `Creating grant for child ${childUserId} in family ${familyGroupId} on ${applicableDate} with status ${status}`
  );

  const newGrant = await ScreenTimeGrantModel.create({
    familyGroupId: new mongoose.Types.ObjectId(familyGroupId),
    childUserId: new mongoose.Types.ObjectId(childUserId),
    grantedByUserId: new mongoose.Types.ObjectId(grantedByUserId),
    applicableDate,
    bonusMinutes,
    overrideWakeUpTime,
    overrideBedTime,
    status,
    notes
  });

  return toScreenTimeGrant(newGrant);
}

/**
 * Find a grant by its ID
 */
export async function findGrantById(grantId: string): Promise<screenTimeGrant | null> {
  await getMongoose();

  const grant = await ScreenTimeGrantModel.findOne({
    _id: new mongoose.Types.ObjectId(grantId),
    isDeleted: false
  });

  return grant ? toScreenTimeGrant(grant) : null;
}

/**
 * Update the status of a grant
 */
export async function updateGrantStatus(
  grantId: string,
  status: GrantStatus,
  grantedByUserId: string
): Promise<screenTimeGrant | null> {
  await getMongoose();

  logger.info(
    "[ScreenTimeGrants]",
    `Updating grant ${grantId} status to ${status} by user ${grantedByUserId}`
  );

  const updatedGrant = await ScreenTimeGrantModel.findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(grantId), isDeleted: false },
    { 
      status,
      grantedByUserId: new mongoose.Types.ObjectId(grantedByUserId),
      updatedAt: new Date()
    },
    { new: true }
  );

  return updatedGrant ? toScreenTimeGrant(updatedGrant) : null;
}

/**
 * Find all grants for a child on a specific date in a family group (all statuses)
 * Returns grants ordered chronologically by creation date
 */
export async function findAllGrantsByChildAndDate(
  familyGroupId: string,
  childUserId: string,
  applicableDate: string
): Promise<screenTimeGrant[]> {
  await getMongoose();

  const grants = await ScreenTimeGrantModel.find({
    familyGroupId: new mongoose.Types.ObjectId(familyGroupId),
    childUserId: new mongoose.Types.ObjectId(childUserId),
    applicableDate,
    isDeleted: false
  }).sort({ createdAt: 1 });

  return grants.map(toScreenTimeGrant);
}

/**
 * Soft delete a grant
 */
export async function deleteScreenTimeGrant(grantId: string): Promise<boolean> {
  await getMongoose();

  logger.info("[ScreenTimeGrants]", `Soft deleting grant ${grantId}`);

  const result = await ScreenTimeGrantModel.updateOne(
    { _id: new mongoose.Types.ObjectId(grantId) },
    { isDeleted: true }
  );

  return result.modifiedCount > 0;
}
