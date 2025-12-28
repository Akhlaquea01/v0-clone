/**
 * @fileoverview Inngest Workflow Functions
 *
 * This module defines the Inngest-powered AI code agent workflow.
 * The agent processes user requests to generate, modify, and manage
 * code within a sandboxed Next.js environment.
 *
 * Architecture:
 * - Uses E2B Code Interpreter for sandboxed code execution
 * - Employs Inngest Agent Kit for multi-agent orchestration
 * - Integrates with Google's Gemini model for AI reasoning
 *
 * Workflow:
 * 1. Create/connect to E2B sandbox
 * 2. Load previous conversation context and files
 * 3. Run AI agent with coding tools
 * 4. Generate fragment title and response
 * 5. Save results to database
 *
 * @module inngest/functions
 */

import { inngest } from "./client";
import {
    gemini,
    createAgent,
    createTool,
    createNetwork,
    createState,
} from "@inngest/agent-kit";
import Sandbox from "@e2b/code-interpreter";
import z from "zod";
import { PROMPT, FRAGMENT_TITLE_PROMPT, RESPONSE_PROMPT } from "@/prompt";
import { lastAssistantTextMessageContent } from "./utils";
import db from "@/lib/db";
import { MessageRole, MessageType } from "@prisma/client";

/**
 * Initialize the Gemini model for AI reasoning
 * Model name is loaded from environment variables
 */
const model = gemini({ model: process.env.MODEL });

/**
 * Main Code Agent Function
 *
 * This Inngest function handles the complete AI code generation workflow.
 * It's triggered when a user creates a project or sends a message.
 *
 * Steps:
 * 1. get-sandbox-id: Creates an E2B sandbox for isolated code execution
 * 2. get-previous-messages: Loads conversation history and existing files
 * 3. Network execution: Runs the AI agent with coding tools
 * 4. Fragment generation: Creates title and user-friendly response
 * 5. get-sandbox-url: Gets the live preview URL
 * 6. save-result: Persists the result to the database
 *
 * @event code-agent/run
 * @param {Object} event.data.value - The user's message/prompt
 * @param {string} event.data.projectId - The project ID for context
 */
export const codeAgentFunction = inngest.createFunction(
    { id: "code-agent" },
    { event: "code-agent/run" },

    async ({ event, step }) => {
        // =====================================================================
        // STEP 1: CREATE SANDBOX
        // =====================================================================

        /**
         * Create or connect to an E2B sandbox environment
         * Uses a pre-configured Next.js template for consistent development
         */
        const sandboxId = await step.run("get-sandbox-id", async () => {
            const sandbox = await Sandbox.create("v0-nextjs-build-new");
            return sandbox.sandboxId;
        });

        // =====================================================================
        // STEP 2: LOAD CONVERSATION CONTEXT
        // =====================================================================

        /**
         * Load previous messages and files for conversation continuity
         * This allows the agent to understand context and build upon previous work
         */
        const { formattedMessages, latestFiles } = await step.run(
            "get-previous-messages",
            async () => {
                const formattedMessages = [];
                let latestFiles = {};

                // Get messages in chronological order with their fragments
                // Exclude error messages and limit to last 30 for token efficiency
                const messages = await db.message.findMany({
                    where: {
                        projectId: event.data.projectId,
                        type: {
                            not: "ERROR"  // Exclude error messages from context
                        }
                    },
                    orderBy: {
                        createdAt: "asc"  // Chronological order is important
                    },
                    include: {
                        fragments: true  // Include fragments to get file context
                    },
                    take: 30  // Limit to prevent token overflow
                });

                // Process each message for the agent's context
                for (const message of messages) {
                    let messageContent = message.content;

                    // If assistant message has a fragment, include file summary
                    if (message.role === "ASSISTANT" && message.fragments) {
                        const fragment = message.fragments;
                        const fileNames = Object.keys(fragment.files || {});

                        // Update latest files (maintains current state)
                        latestFiles = { ...latestFiles, ...fragment.files };

                        // Add file context to message for agent awareness
                        if (fileNames.length > 0) {
                            messageContent += `\n\n[Files created/modified: ${fileNames.join(", ")}]`;
                        }
                    }

                    // Format message for agent consumption
                    formattedMessages.push({
                        type: "text",
                        role: message.role === "ASSISTANT" ? "assistant" : "user",
                        content: messageContent
                    });
                }

                return {
                    formattedMessages,
                    latestFiles
                };
            }
        );

        // =====================================================================
        // INITIALIZE AGENT STATE
        // =====================================================================

        /**
         * Create state object for the agent network
         * - summary: Will hold the final task summary
         * - files: Current state of all files in the sandbox
         * - messages: Conversation history for context
         */
        const state = createState(
            {
                summary: "",
                files: latestFiles || {}  // Initialize with previous files
            },
            {
                messages: formattedMessages || []
            }
        );

        // =====================================================================
        // BUILD CONTEXT-AWARE PROMPT
        // =====================================================================

        /**
         * Builds the system prompt with context about existing files
         * This helps the agent understand what's already been created
         */
        const buildContextPrompt = () => {
            const existingFileNames = Object.keys(latestFiles || {});

            // No existing files - use base prompt
            if (existingFileNames.length === 0) {
                return PROMPT;
            }

            // Add context about existing files for continuity
            const filesContext = `
CONVERSATION CONTEXT:
You are continuing a previous conversation. The following files have already been created in previous interactions:
${existingFileNames.map(f => `- ${f}`).join("\n")}

When the user asks for modifications or enhancements:
1. First use readFiles to check the current content of relevant files
2. Build upon existing code instead of recreating from scratch
3. Maintain consistency with the existing codebase structure and styling
4. If the user references previous work, you have access to it in the files above

`;
            return filesContext + PROMPT;
        };

        // =====================================================================
        // CREATE CODE AGENT
        // =====================================================================

        /**
         * The main code agent with tools for:
         * - terminal: Run shell commands
         * - createOrUpdateFiles: Create or modify files
         * - readFiles: Read existing files
         */
        const codeAgent = createAgent({
            name: "code-agent",
            description: "An expert coding agent",
            system: buildContextPrompt(),
            model: model,
            tools: [
                // ---------------------------------------------------------
                // TOOL 1: Terminal
                // ---------------------------------------------------------
                createTool({
                    name: "terminal",
                    description: "Use the terminal to run commands",
                    parameters: z.object({
                        command: z.string(),
                    }),
                    handler: async ({ command }, { step }) => {
                        return await step?.run("terminal", async () => {
                            const buffers = { stdout: "", stderr: "" };

                            try {
                                const sandbox = await Sandbox.connect(sandboxId);

                                const result = await sandbox.commands.run(command, {
                                    onStdout: (data) => {
                                        buffers.stdout += data;
                                    },
                                    onStderr: (data) => {
                                        buffers.stderr += data;
                                    },
                                });

                                return result.stdout;
                            } catch (error) {
                                console.log(
                                    `Command failed: ${error} \n stdout: ${buffers.stdout}\n stderr: ${buffers.stderr}`
                                );
                                return `Command failed: ${error} \n stdout: ${buffers.stdout}\n stderr: ${buffers.stderr}`;
                            }
                        });
                    },
                }),

                // ---------------------------------------------------------
                // TOOL 2: Create or Update Files
                // ---------------------------------------------------------
                createTool({
                    name: "createOrUpdateFiles",
                    description: "Create or update files in the sandbox",
                    parameters: z.object({
                        files: z.array(
                            z.object({
                                path: z.string(),
                                content: z.string(),
                            })
                        ),
                    }),
                    handler: async ({ files }, { step, network }) => {
                        const newFiles = await step?.run(
                            "createOrUpdateFiles",
                            async () => {
                                try {
                                    const updatedFiles = network?.state?.data.files || {};
                                    const sandbox = await Sandbox.connect(sandboxId);

                                    // Write each file to the sandbox
                                    for (const file of files) {
                                        await sandbox.files.write(file.path, file.content);
                                        updatedFiles[file.path] = file.content;
                                    }

                                    return updatedFiles;
                                } catch (error) {
                                    return "Error" + error;
                                }
                            }
                        );

                        // Update state with new files
                        if (typeof newFiles === "object") {
                            network.state.data.files = newFiles;
                        }
                    },
                }),

                // ---------------------------------------------------------
                // TOOL 3: Read Files
                // ---------------------------------------------------------
                createTool({
                    name: "readFiles",
                    description: "Read files in the sandbox",
                    parameters: z.object({
                        files: z.array(z.string()),
                    }),
                    handler: async ({ files }, { step }) => {
                        return await step?.run("readFiles", async () => {
                            try {
                                const sandbox = await Sandbox.connect(sandboxId);
                                const contents = [];

                                // Read each requested file
                                for (const file of files) {
                                    const content = await sandbox.files.read(file);
                                    contents.push({ path: file, content });
                                }

                                return JSON.stringify(contents);
                            } catch (error) {
                                return "Error" + error;
                            }
                        });
                    },
                }),
            ],

            // Agent lifecycle hooks
            lifecycle: {
                /**
                 * Called after each agent response
                 * Extracts the task summary when the agent completes
                 */
                onResponse: async ({ result, network }) => {
                    const lastAssistantMessageText =
                        lastAssistantTextMessageContent(result);

                    // Check for task completion marker
                    if (lastAssistantMessageText && network) {
                        if (lastAssistantMessageText.includes("<task_summary>")) {
                            network.state.data.summary = lastAssistantMessageText;
                        }
                    }

                    return result;
                },
            },
        });

        // =====================================================================
        // CREATE AGENT NETWORK
        // =====================================================================

        /**
         * Agent network orchestrates the code agent's execution
         * - maxIter: Maximum number of agent iterations (prevents infinite loops)
         * - router: Decides which agent to run next (or stop)
         */
        const network = createNetwork({
            name: "coding-agent-network",
            agents: [codeAgent],
            maxIter: 10,

            router: async ({ network }) => {
                const summary = network.state.data.summary;

                // Stop when we have a summary (task complete)
                if (summary) {
                    return;
                }

                // Continue with code agent
                return codeAgent;
            },
        });

        // =====================================================================
        // EXECUTE AGENT NETWORK
        // =====================================================================

        const result = await network.run(event.data.value, { state });

        // =====================================================================
        // GENERATE FRAGMENT METADATA
        // =====================================================================

        /**
         * Fragment title generator
         * Creates a short, descriptive title for the code fragment
         */
        const fragmentTitleGenerator = createAgent({
            name: "fragment-title-generator",
            description: "Generate a title for the fragment",
            system: FRAGMENT_TITLE_PROMPT,
            model: model
        });

        /**
         * Response generator
         * Creates a user-friendly message explaining what was built
         */
        const responseGenerator = createAgent({
            name: "response-generator",
            description: "Generate a response for the fragment",
            system: RESPONSE_PROMPT,
            model: model
        });

        // Generate title and response in parallel
        const { output: fragmentTitleOutput } = await fragmentTitleGenerator.run(
            result.state.data.summary
        );
        const { output: responseOutput } = await responseGenerator.run(
            result.state.data.summary
        );

        /**
         * Extract fragment title from agent output
         * Handles both string and array content formats
         */
        const generateFragmentTitle = () => {
            if (fragmentTitleOutput[0].type !== "text") {
                return "Untitled";
            }

            if (Array.isArray(fragmentTitleOutput[0].content)) {
                return fragmentTitleOutput[0].content.map((c) => c).join("");
            } else {
                return fragmentTitleOutput[0].content;
            }
        };

        /**
         * Extract user response from agent output
         * Handles both string and array content formats
         */
        const generateResponse = () => {
            if (responseOutput[0].type !== "text") {
                return "Here you go";
            }

            if (Array.isArray(responseOutput[0].content)) {
                return responseOutput[0].content.map((c) => c).join("");
            } else {
                return responseOutput[0].content;
            }
        };

        // =====================================================================
        // ERROR DETECTION
        // =====================================================================

        /**
         * Check if the agent execution resulted in an error
         * Errors occur when there's no summary or no files were created
         */
        const isError =
            !result.state.data.summary ||
            Object.keys(result.state.data.files || {}).length === 0;

        // =====================================================================
        // GET SANDBOX PREVIEW URL
        // =====================================================================

        const sandboxUrl = await step.run("get-sandbox-url", async () => {
            const sandbox = await Sandbox.connect(sandboxId);
            const host = sandbox.getHost(3000);  // Next.js dev server port

            return `http://${host}`;
        });

        // =====================================================================
        // SAVE RESULTS TO DATABASE
        // =====================================================================

        await step.run("save-result", async () => {
            // Handle error case - create error message
            if (isError) {
                return await db.message.create({
                    data: {
                        projectId: event.data.projectId,
                        content: "Something went wrong. Please try again",
                        role: MessageRole.ASSISTANT,
                        type: MessageType.ERROR
                    }
                });
            }

            // Success case - create message with fragment
            return await db.message.create({
                data: {
                    projectId: event.data.projectId,
                    content: generateResponse(),
                    role: MessageRole.ASSISTANT,
                    type: MessageType.RESULT,
                    fragments: {
                        create: {
                            sandboxUrl: sandboxUrl,
                            title: generateFragmentTitle(),
                            files: result.state.data.files
                        }
                    }
                }
            });
        });

        // =====================================================================
        // RETURN RESULT
        // =====================================================================

        return {
            url: sandboxUrl,
            title: "Untitled",
            files: result.state.data.files,
            summary: result.state.data.summary,
        };
    }
);
