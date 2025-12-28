"use server";

/**
 * @fileoverview Usage Status Server Action
 *
 * This module provides the server action for fetching the current user's
 * usage/credit status. It integrates with the rate limiting system to
 * show users their remaining credits and reset time.
 *
 * @module modules/usage/actions
 */

import { auth } from "@clerk/nextjs/server";
import { DURATION, FREE_POINTS, PRO_POINTS, getUsageStatus } from "@/lib/usage";

/**
 * Retrieves the current user's usage status
 *
 * Returns information about:
 * - Remaining credits (points)
 * - Time until credits reset
 * - Total consumed credits
 * - Maximum points based on subscription tier
 *
 * This data is used by the Usage component to display credit information
 * and the upgrade prompt for free-tier users.
 *
 * @async
 * @returns {Promise<Object>} Usage status object
 * @property {number} remainingPoints - Credits remaining for the period
 * @property {number} msBeforeNext - Milliseconds until credits reset
 * @property {number} consumedPoints - Credits used in current period
 * @property {boolean} isFirstRequest - Whether this is user's first request
 * @property {number} maxPoints - Maximum credits based on subscription
 * @throws {Error} If user is not authenticated
 *
 * @example
 * const usage = await status();
 * // usage = {
 * //   remainingPoints: 4,
 * //   msBeforeNext: 2592000000,  // 30 days in ms
 * //   consumedPoints: 1,
 * //   isFirstRequest: false,
 * //   maxPoints: 5
 * // }
 */
export const status = async () => {
    try {
        // =====================================================================
        // AUTHENTICATION
        // =====================================================================

        const { userId } = await auth();

        if (!userId) {
            throw new Error("Unauthorized");
        }

        // =====================================================================
        // DETERMINE USER TIER
        // =====================================================================

        const { has } = await auth();

        // Check if user has a pro subscription
        // Pro users get more credits than free-tier users
        const hasProAccess = has({ plan: "pro" });

        // Set maximum points based on subscription tier
        const maxPoints = hasProAccess ? PRO_POINTS : FREE_POINTS;

        // =====================================================================
        // FETCH USAGE DATA
        // =====================================================================

        const result = await getUsageStatus();

        // If no usage record exists, user hasn't used any credits yet
        if (!result) {
            return {
                remainingPoints: maxPoints,
                msBeforeNext: DURATION * 1000,  // Full duration until reset
                consumedPoints: 0,
                isFirstRequest: true,
                maxPoints
            };
        }

        // =====================================================================
        // CALCULATE REMAINING POINTS
        // =====================================================================

        // remainingPoints may be directly available or needs calculation
        const remainingPoints = result.remainingPoints ??
            (maxPoints - (result.consumedPoints || 0));

        return {
            remainingPoints,
            msBeforeNext: result.msBeforeNext || DURATION * 1000,
            consumedPoints: result.consumedPoints || 0,
            isFirstRequest: false,
            maxPoints
        };

    } catch (error) {
        console.error("Error in status action:", error);
        throw error;
    }
};
