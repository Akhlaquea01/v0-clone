/**
 * @fileoverview Usage Tracking and Rate Limiting
 *
 * This module provides rate limiting functionality using the Prisma-based
 * rate limiter from rate-limiter-flexible. It tracks user credit consumption
 * and enforces usage limits based on subscription tier.
 *
 * Features:
 * - Tier-based rate limiting (Free vs Pro)
 * - Credit-based system (points consumed per generation)
 * - 30-day rolling window for credit reset
 * - Prisma integration for persistent storage
 *
 * Configuration:
 * - FREE_POINTS: 5 credits per 30 days for free users
 * - PRO_POINTS: 100 credits per 30 days for pro users
 * - GENERATION_COST: 1 credit per AI generation request
 *
 * @module lib/usage
 */

import { RateLimiterPrisma } from "rate-limiter-flexible";
import db from "./db";
import { auth } from "@clerk/nextjs/server";

// =============================================================================
// CONFIGURATION CONSTANTS
// =============================================================================

/**
 * Number of credits available for free-tier users per period
 * @constant {number}
 */
export const FREE_POINTS = 5;

/**
 * Number of credits available for pro-tier users per period
 * @constant {number}
 */
export const PRO_POINTS = 100;

/**
 * Duration of the rate limit window in seconds (30 days)
 * @constant {number}
 */
export const DURATION = 30 * 24 * 60 * 60; // 30 days in seconds

/**
 * Number of credits consumed per AI generation request
 * @constant {number}
 */
export const GENERATION_COST = 1;

// =============================================================================
// RATE LIMITER FUNCTIONS
// =============================================================================

/**
 * Creates a rate limiter instance configured for the current user's tier
 *
 * The rate limiter uses Prisma as its storage backend, with the Usage
 * table storing user consumption data. The limiter is configured based
 * on whether the user has a pro subscription.
 *
 * @async
 * @returns {Promise<RateLimiterPrisma>} Configured rate limiter instance
 *
 * @example
 * const limiter = await getUsageTracker();
 * await limiter.consume(userId, 1);  // Consume 1 credit
 */
export async function getUsageTracker() {
    const { has } = await auth();

    // Determine user's subscription tier
    const hasProAccess = has({ plan: "pro" });

    // Create rate limiter with tier-appropriate limits
    const usageTracker = new RateLimiterPrisma({
        storeClient: db,           // Use Prisma for storage
        tableName: "Usage",        // Table to store usage data
        points: hasProAccess ? PRO_POINTS : FREE_POINTS,  // Max credits
        duration: DURATION,        // Reset window in seconds
    });

    return usageTracker;
}

/**
 * Consumes credits for an AI generation request
 *
 * This function should be called before processing any AI generation
 * request. It will:
 * - Check if the user has remaining credits
 * - Deduct the generation cost from their balance
 * - Throw an error if rate limit is exceeded
 *
 * @async
 * @returns {Promise<Object>} Rate limiter result with remaining points
 * @throws {Error} If user is not authenticated
 * @throws {Error} If rate limit is exceeded (no remaining credits)
 *
 * @example
 * try {
 *   await consumeCredits();
 *   // Proceed with AI generation
 * } catch (error) {
 *   // Handle rate limit exceeded or auth error
 * }
 */
export async function consumeCredits() {
    const { userId } = await auth();

    if (!userId) {
        throw new Error("Unauthorized");
    }

    // Get the configured rate limiter
    const usageTracker = await getUsageTracker();

    // Attempt to consume credits - throws on rate limit exceeded
    const result = await usageTracker.consume(userId, GENERATION_COST);

    return result;
}

/**
 * Retrieves the current usage status for the authenticated user
 *
 * Returns information about the user's:
 * - Remaining credits (points)
 * - Time until credits reset
 * - Total consumed credits
 *
 * Returns null if the user has no usage record yet (first-time user).
 *
 * @async
 * @returns {Promise<Object|null>} Usage status or null for new users
 * @property {number} remainingPoints - Credits remaining in current period
 * @property {number} msBeforeNext - Milliseconds until credits reset
 * @property {number} consumedPoints - Credits consumed in current period
 * @throws {Error} If user is not authenticated
 *
 * @example
 * const status = await getUsageStatus();
 * if (status) {
 *   console.log(`${status.remainingPoints} credits remaining`);
 * } else {
 *   console.log('New user - full credits available');
 * }
 */
export async function getUsageStatus() {
    const { userId } = await auth();

    if (!userId) {
        throw new Error("Unauthorized");
    }

    const usageTracker = await getUsageTracker();

    try {
        // Get usage record for the user
        const result = await usageTracker.get(userId);

        if (!result) {
            // No record means user hasn't used any credits yet
            return null;
        }

        return result;
    } catch (error) {
        // Handle case where user has no record yet
        console.error("Error getting usage:", error);
        return null;
    }
}
