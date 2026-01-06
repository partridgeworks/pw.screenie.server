"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import useSWR, { SWRConfig } from "swr";
import { useAuth } from "@clerk/nextjs";
import { fetcher } from "@/app/utils/fetcher";
import type { user } from "@/lib/models/User";
import logger from "@/app/utils/clientLogger";
import Link from "next/link";

interface UserContextValue {
  user: user;
  isLoading: boolean;
  error: Error | undefined;
  refresh: () => void;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ 
  initialUser, 
  children 
}: { 
  initialUser: user; 
  children: React.ReactNode;
}) {
  // Use Clerk's useAuth to wait for session to be ready before making API calls
  const { isLoaded: isClerkLoaded, isSignedIn, getToken } = useAuth();
  
  // Track if we've had a successful fetch after Clerk loaded
  const [hasSuccessfulFetch, setHasSuccessfulFetch] = useState(false);
  
  // Custom fetcher that waits for Clerk session to be ready
  const sessionAwareFetcher = useCallback(async (url: string) => {
    // If Clerk isn't loaded yet, don't make the request - use fallback data
    if (!isClerkLoaded) {
      logger.info("[UserContext]", "Clerk not loaded yet, waiting...");
      throw new Error("Session loading");
    }
    
    // If user isn't signed in according to Clerk, something is wrong
    if (!isSignedIn) {
      logger.warn("[UserContext]", "Clerk reports user not signed in");
      throw new Error("Not signed in");
    }
    
    // Force a token refresh before making the API call
    // This ensures we have a fresh token after returning from background
    try {
      await getToken({ skipCache: true });
    } catch (tokenError) {
      logger.warn("[UserContext]", "Token refresh failed, retrying request anyway", tokenError);
    }
    
    return fetcher(url);
  }, [isClerkLoaded, isSignedIn, getToken]);
  
  const { data, error, isLoading, isValidating, mutate } = useSWR<user>(
    // Only start fetching when Clerk is loaded and user is signed in
    isClerkLoaded && isSignedIn ? "/api/me" : null,
    sessionAwareFetcher,
    {
      suspense: false,
      fallbackData: initialUser,
      // Don't revalidate on mount if we have initial data - wait for Clerk
      revalidateOnMount: false,
      // Retry with exponential backoff for session-related errors
      errorRetryCount: 3,
      errorRetryInterval: 1000,
      onSuccess: () => {
        setHasSuccessfulFetch(true);
      },
      onError: (err) => {
        logger.warn("[UserContext]", "SWR fetch error", err);
      }
    }
  );
  
  // Trigger revalidation when Clerk session becomes ready
  useEffect(() => {
    if (isClerkLoaded && isSignedIn && !hasSuccessfulFetch) {
      logger.info("[UserContext]", "Clerk session ready, revalidating user data");
      void mutate();
    }
  }, [isClerkLoaded, isSignedIn, hasSuccessfulFetch, mutate]);

  // Seed the SWR cache with the initial user so `mutate(current => ...)` receives data.
  useEffect(() => {
    if (initialUser) {
      // Do not revalidate here; just populate the cache.
      void mutate(initialUser, { revalidate: false, populateCache: true });
    }
  }, [initialUser, mutate]);

  const refresh = useCallback(() => {
    logger.info("[UserContext]", "Refreshing user data");
    void mutate();
  }, [mutate]);

  // Determine the effective user data - prefer fetched data, fall back to initial
  const effectiveUser = data ?? initialUser;
  
  // We're in a loading state if:
  // 1. Clerk isn't loaded yet, OR
  // 2. SWR is loading/validating AND we don't have any user data
  const isEffectivelyLoading = !isClerkLoaded || ((isLoading || isValidating) && !effectiveUser);
  
  // Only show error if:
  // 1. Clerk is loaded AND signed in (so we expect the request to work)
  // 2. We have an error from SWR
  // 3. We don't have any fallback data to show
  // 4. We've actually tried to fetch (not just waiting for Clerk)
  const showError = isClerkLoaded && isSignedIn && error && !effectiveUser && !isValidating;

  const value: UserContextValue = useMemo(
    () => ({
      user: effectiveUser as user,
      isLoading: isEffectivelyLoading,
      error: error as Error | undefined,
      refresh
    }),
    [effectiveUser, isEffectivelyLoading, error, refresh]
  );

  // Loading state - show while Clerk is initializing or during initial data fetch
  if (isEffectivelyLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  // Error state - only show if we truly can't get user data
  if (showError) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen gap-4">
        <div className="text-error text-lg">
          Unable to verify your session. Please try signing in again.
        </div>
        <Link href="/api/auth/signin" className="btn btn-primary">
          Sign In
        </Link>
      </div>
    );
  }
  
  // If we still don't have user data after all checks, show error
  if (!effectiveUser) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen gap-4">
        <div className="text-error text-lg">
          Unable to verify your session. Please try signing in again.
        </div>
        <Link href="/api/auth/signin" className="btn btn-primary">
          Sign In
        </Link>
      </div>
    );
  }

  // User is verified - render children with context and SWR defaults
  return (
    <UserContext.Provider value={value}>
      <SWRConfig
        value={{
          fetcher,
          revalidateOnFocus: false,
          onErrorRetry: (error, _key, _config, revalidate, { retryCount }) => {
            // Retry 401s up to 3 times with backoff
            if (error.status === 401 && retryCount < 3) {
              setTimeout(() => revalidate({ retryCount }), 1000 * (retryCount + 1));
              return;
            }
            // Don't retry other client errors
            if (error.status >= 400 && error.status < 500) return;
          },
        }}
      >
        {children}
      </SWRConfig>
    </UserContext.Provider>
  );
}

/**
 * Hook to access the current authenticated user.
 * Must be used within a UserProvider.
 * 
 * @returns UserContextValue with guaranteed non-null user within protected routes
 */
export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return ctx;
}
