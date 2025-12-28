/**
 * @fileoverview Inngest Client Configuration
 *
 * This module initializes the Inngest client for event-driven workflows.
 * Inngest is used to orchestrate the AI code agent workflow, handling
 * asynchronous processing of user requests for code generation.
 *
 * The client is used to:
 * - Send events (trigger workflows)
 * - Define functions that respond to events
 * - Manage step-based execution
 *
 * @see https://www.inngest.com/docs
 * @module inngest/client
 */

import { Inngest } from "inngest";

/**
 * Inngest client instance
 *
 * Used throughout the application to send events and define functions.
 * The "id" identifies this application in the Inngest dashboard.
 *
 * @constant {Inngest}
 *
 * @example
 * // Sending an event to trigger a workflow
 * await inngest.send({
 *   name: "code-agent/run",
 *   data: { value: "Build a todo app", projectId: "cuid123" }
 * });
 */
export const inngest = new Inngest({ id: "v0-clone" });
