/**
 * @fileoverview Usage Status React Query Hook
 *
 * This module provides a React Query hook for fetching the user's
 * usage/credit status. Used by the Usage component and other parts
 * of the application that need to know the user's remaining credits.
 *
 * @module modules/usage/hooks/usage
 */

import { useQuery } from "@tanstack/react-query";
import { status } from "../actions";

/**
 * Hook to fetch user's usage status
 *
 * Retrieves the current user's credit/usage information including:
 * - Remaining credits for the current period
 * - Time until credits reset
 * - Total consumed credits
 * - Maximum credits based on subscription tier
 *
 * The data is cached with the "status" query key and is automatically
 * invalidated when the user creates a project or sends a message.
 *
 * @returns {UseQueryResult} React Query result object containing:
 *   - data: Usage status object
 *   - isPending: Boolean indicating loading state
 *   - isError: Boolean indicating error state
 *   - error: Error object if request failed
 *
 * @example
 * const { data: usage, isPending, error } = useStatus();
 *
 * if (usage) {
 *   console.log(`${usage.remainingPoints} credits remaining`);
 * }
 */
export const useStatus = () => {
    return useQuery({
        queryKey: ["status"],
        queryFn: () => status()
    });
};
