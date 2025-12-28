/**
 * @fileoverview Inngest Utility Functions
 *
 * This module provides utility functions for working with Inngest agent
 * results. These helpers extract and process data from the AI agent's
 * responses.
 *
 * @module inngest/utils
 */

/**
 * Extracts the content of the last assistant text message from an agent result
 *
 * This function finds the most recent assistant message in the agent's output
 * and extracts its text content. It handles both simple string content and
 * complex array-based content structures.
 *
 * Used to:
 * - Detect task completion (by finding <task_summary> tags)
 * - Extract the final response for display to users
 *
 * @param {Object} result - The agent execution result
 * @param {Array<Object>} result.output - Array of message objects from the agent
 * @returns {string|undefined} The text content of the last assistant message,
 *                              or undefined if no assistant message found
 *
 * @example
 * const result = await agent.run(prompt);
 * const lastMessage = lastAssistantTextMessageContent(result);
 *
 * if (lastMessage?.includes("<task_summary>")) {
 *   // Task is complete
 * }
 */
export function lastAssistantTextMessageContent(result) {
    // Find the index of the last assistant message in the output array
    const lastAssistantTextMessageIndex = result.output.findLastIndex(
        (message) => message.role === "assistant"
    );

    // Get the message object at that index
    const message = result.output[lastAssistantTextMessageIndex];

    // Extract text content, handling different content structures:
    // - String content: return directly
    // - Array content: join text parts together
    // - No content: return undefined
    return message?.content
        ? typeof message.content === "string"
            ? message.content
            : message.content.map((c) => c.text).join("")
        : undefined;
}
