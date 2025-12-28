"use server";

/**
 * @fileoverview Project Server Actions
 *
 * This module contains Next.js Server Actions for project-related operations.
 * These actions run on the server and handle database operations, authentication,
 * and integration with the Inngest workflow system.
 *
 * Actions:
 * - createProject: Creates a new project and triggers AI processing
 * - getProjects: Retrieves all projects for the current user
 * - getProjectById: Retrieves a single project by ID
 *
 * @module modules/projects/actions
 */

import { inngest } from "@/inngest/client";
import db from "@/lib/db";
import { consumeCredits } from "@/lib/usage";
import { getCurrentUser } from "@/modules/auth/actions";
import { MessageRole, MessageType } from "@prisma/client";
import { generateSlug } from "random-word-slugs";

/**
 * Creates a new project with the given description
 *
 * This action:
 * 1. Authenticates the user
 * 2. Consumes usage credits (rate limiting)
 * 3. Creates the project in the database with initial user message
 * 4. Triggers the Inngest AI agent workflow
 *
 * @async
 * @param {string} value - The project description/prompt from the user
 * @returns {Promise<Object>} The created project object
 * @throws {Error} If user is not authenticated
 * @throws {Error} If user has no remaining credits
 *
 * @example
 * const project = await createProject("Build a todo app with dark mode");
 * router.push(`/projects/${project.id}`);
 */
export const createProject = async (value) => {
    // =========================================================================
    // AUTHENTICATION
    // =========================================================================

    const user = await getCurrentUser();

    if (!user) {
        throw new Error("Unauthorized");
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
        throw new Error("Rate limit exceeded. Please wait before creating more projects.");
    }

    // =========================================================================
    // PROJECT CREATION
    // =========================================================================

    // Generate a human-readable project name using random word slugs
    // Format: "adjective-noun" (e.g., "happy-tiger", "swift-cloud")
    const projectName = generateSlug(2, { format: "kebab" });

    // Create the project with an initial user message
    const newProject = await db.project.create({
        data: {
            name: projectName,
            userId: user.id,
            messages: {
                // Create the initial user message containing their prompt
                create: {
                    content: value,
                    role: MessageRole.USER,
                    type: MessageType.RESULT,
                },
            },
        },
    });

    // =========================================================================
    // TRIGGER AI AGENT
    // =========================================================================

    // Send event to Inngest to start the AI code generation workflow
    // The agent will process the user's request and generate code
    await inngest.send({
        name: "code-agent/run",
        data: {
            value: value,          // The user's prompt/description
            projectId: newProject.id,  // Project context for the agent
        },
    });

    return newProject;
};

/**
 * Retrieves all projects for the current user
 *
 * Returns projects in descending order by creation date (newest first).
 * Only returns projects owned by the authenticated user.
 *
 * @async
 * @returns {Promise<Array<Object>>} Array of project objects
 * @throws {Error} If user is not authenticated
 *
 * @example
 * const projects = await getProjects();
 * // projects = [{ id, name, createdAt, ... }, ...]
 */
export const getProjects = async () => {
    // =========================================================================
    // AUTHENTICATION
    // =========================================================================

    const user = await getCurrentUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    // =========================================================================
    // FETCH PROJECTS
    // =========================================================================

    const projects = await db.project.findMany({
        where: {
            userId: user.id,  // Only return user's own projects
        },
        orderBy: {
            createdAt: "desc",  // Newest projects first
        },
    });

    return projects;
};

/**
 * Retrieves a single project by its ID
 *
 * Verifies that the project exists and belongs to the authenticated user
 * before returning it. Used for the project view page.
 *
 * @async
 * @param {string} projectId - The unique identifier of the project
 * @returns {Promise<Object>} The project object
 * @throws {Error} If user is not authenticated
 * @throws {Error} If project is not found or doesn't belong to user
 *
 * @example
 * const project = await getProjectById("cuid123456");
 * // project = { id, name, userId, createdAt, updatedAt }
 */
export const getProjectById = async (projectId) => {
    // =========================================================================
    // AUTHENTICATION
    // =========================================================================

    const user = await getCurrentUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    // =========================================================================
    // FETCH PROJECT
    // =========================================================================

    // Find project matching both ID and userId (authorization check)
    const project = await db.project.findUnique({
        where: {
            id: projectId,
            userId: user.id,  // Ensure user owns this project
        },
    });

    if (!project) {
        throw new Error("Project not found");
    }

    return project;
};

/**
 * Deletes a project and all its related data
 *
 * This action deletes a project along with all its messages and fragments.
 * The cascade is handled by the database (onDelete: Cascade in Prisma schema).
 *
 * @async
 * @param {string} projectId - The unique identifier of the project to delete
 * @returns {Promise<Object>} Object with success status
 * @throws {Error} If user is not authenticated
 * @throws {Error} If project is not found or doesn't belong to user
 *
 * @example
 * await deleteProject("cuid123456");
 * // Deletes project, all messages, and all fragments
 */
export const deleteProject = async (projectId) => {
    // =========================================================================
    // AUTHENTICATION
    // =========================================================================

    const user = await getCurrentUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    // =========================================================================
    // VERIFY OWNERSHIP
    // =========================================================================

    const project = await db.project.findUnique({
        where: {
            id: projectId,
            userId: user.id,
        },
    });

    if (!project) {
        throw new Error("Project not found");
    }

    // =========================================================================
    // DELETE PROJECT (CASCADE)
    // =========================================================================

    // Delete the project - messages and fragments are deleted via cascade
    await db.project.delete({
        where: {
            id: projectId,
        },
    });

    return { success: true };
};

