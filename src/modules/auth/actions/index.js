"use server";

/**
 * @fileoverview Authentication Server Actions
 *
 * This module provides server-side actions for user authentication and
 * profile management. It integrates Clerk authentication with the local
 * Prisma database to maintain user records.
 *
 * Actions:
 * - onBoardUser: Creates or updates user record from Clerk data
 * - getCurrentUser: Retrieves the current user's database record
 *
 * @module modules/auth/actions
 */

import db from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";

/**
 * Onboards a user by syncing their Clerk profile to the database
 *
 * This function should be called when a user first accesses the application
 * or when their profile might have changed. It performs an upsert operation
 * to either create a new user or update an existing one.
 *
 * @async
 * @returns {Promise<Object>} Result object with success status and user data
 * @property {boolean} success - Whether the operation succeeded
 * @property {Object} [user] - The created/updated user object (on success)
 * @property {string} message - Status message
 *
 * @example
 * // Called in the root layout on page load
 * const result = await onBoardUser();
 * if (result.success) {
 *   console.log('User synced:', result.user.email);
 * }
 */
export const onBoardUser = async () => {
    try {
        // Get the current user from Clerk
        const user = await currentUser();

        if (!user) {
            return {
                success: false,
                message: "User not found",
            };
        }

        // Extract user data from Clerk
        const { id, emailAddresses, firstName, lastName, imageUrl } = user;

        // Build the full name from Clerk's firstName and lastName
        const fullName = firstName && lastName
            ? `${firstName} ${lastName}`
            : firstName || lastName || '';

        // Upsert the user record
        // - If user exists (by clerkId): update their info
        // - If user doesn't exist: create new record
        const newUser = await db.user.upsert({
            where: {
                clerkId: id,
            },
            create: {
                clerkId: id,
                email: emailAddresses[0]?.emailAddress || '',
                name: fullName,
                image: imageUrl || null,
            },
            update: {
                email: emailAddresses[0].emailAddress,
                name: fullName,
                image: imageUrl,
            },
        });

        return {
            success: true,
            user: newUser,
            message: "User created successfully",
        };
    } catch (error) {
        console.log(error);
        return {
            success: false,
            message: "User not found",
        };
    }
};

/**
 * Retrieves the current user's database record
 *
 * This function looks up the authenticated user in the local database
 * using their Clerk ID. It returns a subset of user fields needed for
 * authorization and display purposes.
 *
 * @async
 * @returns {Promise<Object|null>} The user object or null if not found
 * @property {string} id - The database user ID
 * @property {string} email - User's email address
 * @property {string|null} name - User's display name
 * @property {string|null} image - User's profile image URL
 * @property {string} clerkId - User's Clerk ID for reference
 *
 * @example
 * const user = await getCurrentUser();
 * if (user) {
 *   console.log('Current user:', user.email);
 * } else {
 *   console.log('No authenticated user');
 * }
 */
export const getCurrentUser = async () => {
    try {
        // Get the current user from Clerk
        const user = await currentUser();

        if (!user) {
            return null;
        }

        const { id } = user;

        // Look up the user in our database
        const dbUser = await db.user.findUnique({
            where: {
                clerkId: id,
            },
            select: {
                id: true,        // Database ID (needed for relations)
                email: true,     // Email for display/reference
                name: true,      // Display name
                image: true,     // Profile image
                clerkId: true,   // Clerk ID for reference
            },
        });

        return dbUser;
    } catch (error) {
        console.log(error);
        return null;
    }
};
