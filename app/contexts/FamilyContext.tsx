"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import { fetcher } from "@/app/utils/fetcher";
import { familyGroup } from "@/lib/models/FamilyGroup";
import { screenTimeGrant } from "@/lib/models/ScreenTimeGrant";
import { FamilyMemberStatus, FamilyPosition } from "@/lib/constants/familyConstants";
import { GrantStatus } from "@/lib/constants/grantConstants";
import { EffectiveDailyAllowance, ScreenTimeStats, ChildUser } from "@/lib/types/screentime";
import { screenTimeSession } from "@/lib/models/ScreenTimeSession";
import { getTodayDateString } from "@/lib/utils/dateTime";
import logger from "@/app/utils/clientLogger";

// ============================================================================
// Types
// ============================================================================

export interface FamilyMemberWithInfo {
  userId: string;
  position: FamilyPosition;
  status: FamilyMemberStatus;
  addedAt: Date;
  name: string;
  email: string;
  userStatus: string;
  avatarName?: string;
}

interface FamilyGroupResponse {
  familyGroup: familyGroup;
  members: FamilyMemberWithInfo[];
}

interface GrantsResponse {
  grants: screenTimeGrant[];
}

interface ScreenTimeOnDateResponse {
  childUser: ChildUser;
  date: string;
  dateDisplay: string;
  dayOfWeek: string;
  effectiveAllowance: EffectiveDailyAllowance;
}

interface FamilyContextValue {
  // Family group data
  familyGroup: familyGroup | undefined;
  members: FamilyMemberWithInfo[];
  isLoading: boolean;
  error: Error | undefined;

  // Member accessors
  getChildren: () => FamilyMemberWithInfo[];
  getParents: () => FamilyMemberWithInfo[];
  getMemberById: (userId: string) => FamilyMemberWithInfo | undefined;

  // Grants management
  grants: screenTimeGrant[];
  grantsLoading: boolean;
  grantsError: Error | undefined;
  getGrantsByChild: (childId: string) => screenTimeGrant[];
  getGrantsByStatus: (status: GrantStatus) => screenTimeGrant[];
  getGrantsByChildAndStatus: (childId: string, status: GrantStatus) => screenTimeGrant[];
  getPendingGrantRequests: () => screenTimeGrant[];
  getPendingGrantRequestsForChild: (childId: string) => screenTimeGrant[];

  // Grant actions
  respondToGrant: (grantId: string, status: "granted" | "rejected") => Promise<void>;
  createGrant: (params: CreateGrantParams) => Promise<screenTimeGrant>;

  // Refresh functions
  refreshFamily: () => void;
  refreshGrants: () => void;
  refreshAll: () => void;

  // Utility
  familyGroupId: string;
}

export interface CreateGrantParams {
  childId: string;
  applicableDate: string;
  bonusMinutes?: number | null;
  overrideWakeUpTime?: string | null;
  overrideBedTime?: string | null;
  notes?: string | null;
}

// ============================================================================
// Context
// ============================================================================

const FamilyContext = createContext<FamilyContextValue | undefined>(undefined);

// Cache configuration - data is considered fresh for 30 seconds
const SWR_CONFIG = {
  dedupingInterval: 30000, // Dedupe requests within 30 seconds
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
};

// ============================================================================
// Provider
// ============================================================================

export function FamilyProvider({
  familyGroupId,
  children
}: {
  familyGroupId: string;
  children: React.ReactNode;
}) {
  // Fetch family group and members
  const {
    data: familyData,
    error: familyError,
    isLoading: familyLoading,
    mutate: mutateFamilyData
  } = useSWR<FamilyGroupResponse>(
    `/api/family/${familyGroupId}`,
    fetcher,
    SWR_CONFIG
  );

  // Fetch all grants for this family group (today by default)
  const today = getTodayDateString();
  const {
    data: grantsData,
    error: grantsError,
    isLoading: grantsLoading,
    mutate: mutateGrantsData
  } = useSWR<GrantsResponse>(
    `/api/family/${familyGroupId}/grants?date=${today}`,
    fetcher,
    SWR_CONFIG
  );

  // ============================================================================
  // Member accessors
  // ============================================================================

  const getChildren = useCallback((): FamilyMemberWithInfo[] => {
    return (familyData?.members || []).filter(m => m.position === "child");
  }, [familyData?.members]);

  const getParents = useCallback((): FamilyMemberWithInfo[] => {
    return (familyData?.members || []).filter(m => m.position === "parent");
  }, [familyData?.members]);

  const getMemberById = useCallback((userId: string): FamilyMemberWithInfo | undefined => {
    return (familyData?.members || []).find(m => m.userId === userId);
  }, [familyData?.members]);

  // ============================================================================
  // Grants accessors
  // ============================================================================

  const grants = useMemo(() => grantsData?.grants || [], [grantsData?.grants]);

  const getGrantsByChild = useCallback((childId: string): screenTimeGrant[] => {
    return grants.filter(g => g.childUserId === childId);
  }, [grants]);

  const getGrantsByStatus = useCallback((status: GrantStatus): screenTimeGrant[] => {
    return grants.filter(g => g.status === status);
  }, [grants]);

  const getGrantsByChildAndStatus = useCallback((childId: string, status: GrantStatus): screenTimeGrant[] => {
    return grants.filter(g => g.childUserId === childId && g.status === status);
  }, [grants]);

  const getPendingGrantRequests = useCallback((): screenTimeGrant[] => {
    return grants.filter(g => g.status === "requested");
  }, [grants]);

  const getPendingGrantRequestsForChild = useCallback((childId: string): screenTimeGrant[] => {
    return grants.filter(g => g.childUserId === childId && g.status === "requested");
  }, [grants]);

  // ============================================================================
  // Grant actions
  // ============================================================================

  const respondToGrant = useCallback(async (grantId: string, status: "granted" | "rejected"): Promise<void> => {
    try {
      const response = await fetch(`/api/grant/${grantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${status === "granted" ? "accept" : "reject"} grant`);
      }

      // Refresh grants data
      await mutateGrantsData();

      // Also invalidate any related SWR cache keys for screen time pages
      await globalMutate(
        (key) => typeof key === "string" && key.includes(`/api/family/${familyGroupId}/child/`) && key.includes("/screentime/"),
        undefined,
        { revalidate: true }
      );

      logger.info("[FamilyContext]", `Grant ${grantId} ${status}`);
    } catch (err) {
      logger.error("[FamilyContext]", `Failed to respond to grant ${grantId}`, err);
      throw err;
    }
  }, [familyGroupId, mutateGrantsData]);

  const createGrant = useCallback(async (params: CreateGrantParams): Promise<screenTimeGrant> => {
    const { childId, applicableDate, bonusMinutes, overrideWakeUpTime, overrideBedTime, notes } = params;

    try {
      const response = await fetch(`/api/family/${familyGroupId}/child/${childId}/grant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicableDate,
          bonusMinutes: bonusMinutes ?? null,
          overrideWakeUpTime: overrideWakeUpTime ?? null,
          overrideBedTime: overrideBedTime ?? null,
          notes: notes ?? null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create grant");
      }

      const data = await response.json();

      // Refresh grants data
      await mutateGrantsData();

      // Also invalidate related screen time cache
      await globalMutate(
        (key) => typeof key === "string" && key.includes(`/api/family/${familyGroupId}/child/${childId}/screentime/`),
        undefined,
        { revalidate: true }
      );

      logger.info("[FamilyContext]", `Grant created for child ${childId} on ${applicableDate}`);
      return data.grant;
    } catch (err) {
      logger.error("[FamilyContext]", "Failed to create grant", err);
      throw err;
    }
  }, [familyGroupId, mutateGrantsData]);

  // ============================================================================
  // Refresh functions
  // ============================================================================

  const refreshFamily = useCallback(() => {
    logger.info("[FamilyContext]", "Refreshing family data");
    void mutateFamilyData();
  }, [mutateFamilyData]);

  const refreshGrants = useCallback(() => {
    logger.info("[FamilyContext]", "Refreshing grants data");
    void mutateGrantsData();
  }, [mutateGrantsData]);

  const refreshAll = useCallback(() => {
    logger.info("[FamilyContext]", "Refreshing all family data");
    void mutateFamilyData();
    void mutateGrantsData();
  }, [mutateFamilyData, mutateGrantsData]);

  // ============================================================================
  // Context value
  // ============================================================================

  const value: FamilyContextValue = useMemo(
    () => ({
      // Family data
      familyGroup: familyData?.familyGroup,
      members: familyData?.members || [],
      isLoading: familyLoading,
      error: familyError as Error | undefined,

      // Member accessors
      getChildren,
      getParents,
      getMemberById,

      // Grants data
      grants,
      grantsLoading,
      grantsError: grantsError as Error | undefined,
      getGrantsByChild,
      getGrantsByStatus,
      getGrantsByChildAndStatus,
      getPendingGrantRequests,
      getPendingGrantRequestsForChild,

      // Grant actions
      respondToGrant,
      createGrant,

      // Refresh functions
      refreshFamily,
      refreshGrants,
      refreshAll,

      // Utility
      familyGroupId
    }),
    [
      familyData,
      familyLoading,
      familyError,
      getChildren,
      getParents,
      getMemberById,
      grants,
      grantsLoading,
      grantsError,
      getGrantsByChild,
      getGrantsByStatus,
      getGrantsByChildAndStatus,
      getPendingGrantRequests,
      getPendingGrantRequestsForChild,
      respondToGrant,
      createGrant,
      refreshFamily,
      refreshGrants,
      refreshAll,
      familyGroupId
    ]
  );

  return (
    <FamilyContext.Provider value={value}>
      {children}
    </FamilyContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access family group data and operations.
 * Must be used within a FamilyProvider.
 *
 * @returns FamilyContextValue with family data and management functions
 */
export function useFamily(): FamilyContextValue {
  const ctx = useContext(FamilyContext);
  if (!ctx) {
    throw new Error("useFamily must be used within a FamilyProvider");
  }
  return ctx;
}

/**
 * Hook to fetch screen time statistics for a child on a specific date.
 * Must be used within a FamilyProvider.
 *
 * @param childId - The ID of the child to fetch stats for
 * @param date - The date in YYYY-MM-DD format (defaults to today)
 * @param includeGrants - Whether to include grant details (default false)
 * @returns ScreenTimeStats with allowance, consumption, and remaining time
 */
export function useScreenTimeStats(
  childId: string,
  date: string = getTodayDateString(),
  includeGrants: boolean = false
): ScreenTimeStats {
  const { familyGroupId } = useFamily();
  
  const grantsParam = includeGrants ? "?includegrants=true" : "";
  
  const { data: screenTimeData, error: screenTimeError, isLoading: screenTimeLoading, mutate: mutateScreenTime } = useSWR<ScreenTimeOnDateResponse>(
    `/api/family/${familyGroupId}/child/${childId}/screentime/on-date/${date}${grantsParam}`,
    fetcher,
    SWR_CONFIG
  );

  const { data: sessionData, error: sessionError, isLoading: sessionLoading } = useSWR<screenTimeSession[]>(
    `/api/family/${familyGroupId}/child/${childId}/session/on-date/${date}`,
    fetcher,
    SWR_CONFIG
  );

  // Calculate total consumed and remaining minutes
  const totalConsumedMinutes = sessionData?.reduce((sum, record) => sum + record.duration, 0) ?? 0;
  const effectiveAllowedMinutes = screenTimeData?.effectiveAllowance?.effectiveAllowedMinutes ?? null;
  const remainingMinutes = effectiveAllowedMinutes !== null
    ? effectiveAllowedMinutes - totalConsumedMinutes
    : null; // null means unlimited

  const isLoading = screenTimeLoading || sessionLoading;
  const error = screenTimeError || sessionError;

  const mutate = useCallback(() => {
    void mutateScreenTime();
    void globalMutate(
      `/api/family/${familyGroupId}/child/${childId}/session/on-date/${date}`,
      undefined,
      { revalidate: true }
    );
  }, [mutateScreenTime, familyGroupId, childId, date]);

  // Default empty values when loading or error
  const emptyAllowance: EffectiveDailyAllowance = {
    baseAllowance: {
      allowedMinutes: null,
      wakeUpTime: null,
      bedTime: null
    },
    effectiveAllowedMinutes: null,
    effectiveWakeUpTime: null,
    effectiveBedTime: null,
    totalBonusMinutes: 0
  };

  return {
    childUser: screenTimeData?.childUser ?? { _id: childId, name: "", email: "" },
    date,
    dateDisplay: screenTimeData?.dateDisplay ?? "",
    dayOfWeek: screenTimeData?.dayOfWeek ?? "",
    effectiveAllowance: screenTimeData?.effectiveAllowance ?? emptyAllowance,
    sessionRecords: sessionData ?? [],
    totalConsumedMinutes,
    remainingMinutes,
    isOverused: remainingMinutes !== null && remainingMinutes < 0,
    isLoading,
    error: error as Error | undefined,
    mutate
  };
}
