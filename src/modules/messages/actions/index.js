"use server";

/**
 * @fileoverview Message Server Actions
 *
 * This module contains Next.js Server Actions for message-related operations.
 * Messages represent the conversation between users and the AI code agent
 * within a project context.
 *
 * Actions:
 * - createMessages: Sends a new message and triggers AI processing
 * - getMessages: Retrieves all messages for a project
 *
 * @module modules/messages/actions
 */

import { MessageRole, MessageType } from "@prisma/client";
import db from "@/lib/db";
import { inngest } from "@/inngest/client";
import { getCurrentUser } from "@/modules/auth/actions";
import { consumeCredits } from "@/lib/usage";

/**
 * Creates a new message in a project
 *
 * This action:
 * 1. Authenticates the user
 * 2. Verifies project ownership
 * 3. Consumes usage credits (rate limiting)
 * 4. Creates the message in the database
 * 5. Triggers the Inngest AI agent workflow
 *
 * @async
 * @param {string} value - The message content from the user
 * @param {string} projectId - The project ID to add the message to
 * @returns {Promise<Object>} The created message object
 * @throws {Error} If user is not authenticated
 * @throws {Error} If project is not found or doesn't belong to user
 * @throws {Error} If user has no remaining credits
 *
 * @example
 * const message = await createMessages("Add a dark mode toggle", projectId);
 */
export const createMessages = async (value, projectId) => {
    // =========================================================================
    // AUTHENTICATION
    // =========================================================================

    const user = await getCurrentUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    // =========================================================================
    // PROJECT AUTHORIZATION
    // =========================================================================

    // Verify the project exists and belongs to the user
    const project = await db.project.findUnique({
        where: {
            id: projectId,
            userId: user.id,  // Ensure user owns this project
        },
    });

    if (!project) {
        throw new Error("Project not found");
    }

    // =========================================================================
    // RATE LIMITING / CREDIT CONSUMPTION
    // =========================================================================

    try {
        // Attempt to consume credits for this generation
        // Throws if user has exceeded their rate limit
        await consumeCredits();
    } catch (error) {
        // Distinguish between application errors and rate limit errors
        if (error instanceof Error && error.message === "Unauthorized") {
            throw new Error("Something went wrong. Please try again.");
        }
        // Rate limit exceeded - user has no remaining credits
        throw new Error("Rate limit exceeded. Please wait before sending more messages.");
    }

    // =========================================================================
    // MESSAGE CREATION
    // =========================================================================

    // Create the user's message in the database
    const newMessage = await db.message.create({
        data: {
            projectId: projectId,
            content: value,
            role: MessageRole.USER,
            type: MessageType.RESULT,
        },
    });

    // =========================================================================
    // TRIGGER AI AGENT
    // =========================================================================

    // Send event to Inngest to start the AI code generation workflow
    // The agent will process the user's request in the context of the project
    await inngest.send({
        name: "code-agent/run",
        data: {
            value: value,          // The user's message/request
            projectId: projectId,  // Project context for the agent
        },
    });

    return newMessage;
};

/**
 * Retrieves all messages for a project
 *
 * Returns messages in chronological order (oldest first) with their
 * associated fragments (code generation results). Verifies project
 * ownership before returning data.
 *
 * @async
 * @param {string} projectId - The project ID to fetch messages for
 * @returns {Promise<Array<Object>>} Array of message objects with fragments
 * @throws {Error} If user is not authenticated
 * @throws {Error} If project is not found or doesn't belong to user
 *
 * @example
 * const messages = await getMessages(projectId);
 * // messages = [{ id, content, role, fragments: { ... } }, ...]
 */
export const getMessages = async (projectId) => {
    // =========================================================================
    // AUTHENTICATION
    // =========================================================================

    const user = await getCurrentUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    // =========================================================================
    // PROJECT AUTHORIZATION
    // =========================================================================

    // Verify the project exists and belongs to the user
    const project = await db.project.findUnique({
        where: {
            id: projectId,
            userId: user.id,  // Ensure user owns this project
        },
    });

    if (!project) {
        throw new Error("Project not found or unauthorized");
    }

    // =========================================================================
    // FETCH MESSAGES
    // =========================================================================

    // Get all messages for the project with their associated fragments
    const messages = await db.message.findMany({
        where: {
            projectId
        },
        orderBy: {
            updatedAt: "asc"  // Chronological order for conversation flow
        },
        include: {
            fragments: true  // Include code generation results
        }
    });

    return messages;
};

/**
 * Restores a fragment to a new sandbox
 *
 * Creates a new E2B sandbox with the files from the specified fragment.
 * Updates the fragment's sandboxUrl in the database to the new sandbox URL.
 * This allows viewing previous code versions after the original sandbox expired.
 *
 * @async
 * @param {string} fragmentId - The fragment ID to restore
 * @returns {Promise<Object>} Object with success status and new sandbox URL
 * @throws {Error} If user is not authenticated
 * @throws {Error} If fragment is not found
 *
 * @example
 * const result = await restoreFragment("fragmentId123");
 * // result = { success: true, sandboxUrl: "http://..." }
 */
export const restoreFragment = async (fragmentId) => {
    // Import here to avoid loading E2B on every action
    const Sandbox = (await import("@e2b/code-interpreter")).default;

    // =========================================================================
    // AUTHENTICATION
    // =========================================================================

    const user = await getCurrentUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    // =========================================================================
    // FETCH FRAGMENT
    // =========================================================================

    const fragment = await db.fragment.findUnique({
        where: { id: fragmentId },
        include: {
            message: {
                include: {
                    project: true
                }
            }
        }
    });

    if (!fragment) {
        throw new Error("Fragment not found");
    }

    // Verify user owns the project
    if (fragment.message?.project?.userId !== user.id) {
        throw new Error("Unauthorized");
    }

    // =========================================================================
    // CREATE NEW SANDBOX
    // =========================================================================

    try {
        // Create a new sandbox with the Next.js template
        const sandbox = await Sandbox.create("v0-nextjs-build-new");

        // Restore files from the fragment
        const files = fragment.files || {};

        for (const [filePath, content] of Object.entries(files)) {
            await sandbox.files.write(filePath, content);
        }

        // Get the new sandbox URL
        const host = sandbox.getHost(3000);
        const newSandboxUrl = `http://${host}`;

        // Update the fragment with the new sandbox URL
        await db.fragment.update({
            where: { id: fragmentId },
            data: { sandboxUrl: newSandboxUrl }
        });

        return {
            success: true,
            sandboxUrl: newSandboxUrl,
            sandboxId: sandbox.sandboxId
        };
    } catch (error) {
        console.error("Failed to restore fragment:", error);
        throw new Error(`Failed to restore fragment: ${error.message}`);
    }
};

