"use client";

/**
 * @fileoverview Message Form Component
 *
 * This component provides the message input interface within a project view.
 * Users can send messages to the AI agent to request code changes or new features.
 *
 * Features:
 * - Auto-resizing textarea for comfortable input
 * - Form validation with Zod schema
 * - Usage credits display for rate-limited users
 * - Keyboard shortcuts (Enter to submit, Shift+Enter for newline)
 * - Loading states and error handling
 *
 * @module modules/projects/components/message-form
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import TextAreaAutosize from "react-textarea-autosize";
import { ArrowUpIcon } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import z from "zod";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";
import { Spinner } from "@/components/ui/spinner";
import { useCreateMessages } from "@/modules/messages/hooks/message";
import { Usage } from "@/modules/usage/components/usage";
import { useStatus } from "@/modules/usage/hooks/usage";

/**
 * Zod validation schema for the message form
 *
 * @constant {z.ZodObject} formSchema
 * @property {string} content - Message content (1-1000 characters)
 */
const formSchema = z.object({
    content: z
        .string()
        .min(1, "Message description is required")
        .max(1000, "Description is too long"),
});

/**
 * MessageForm Component
 *
 * Renders a form for sending messages to the AI code agent within a project.
 * Includes usage tracking display and proper keyboard handling.
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} props.projectId - The ID of the current project
 * @returns {JSX.Element} The rendered message form
 *
 * @example
 * <MessageForm projectId="cuid123456" />
 */
const MessageForm = ({ projectId }) => {
    // =========================================================================
    // STATE & HOOKS
    // =========================================================================

    /**
     * Tracks whether the textarea is currently focused
     * Used for applying focus styles to the form container
     */
    const [isFocused, setIsFocused] = useState(false);

    /**
     * Mutation hook for creating new messages
     * Handles the API call and cache invalidation
     */
    const { mutateAsync, isPending } = useCreateMessages(projectId);

    /**
     * Query hook for fetching user's usage/credit status
     * Used to determine if usage component should be displayed
     */
    const { data: usage } = useStatus();

    /**
     * Only show usage component when we have usage data
     * This prevents showing an empty or loading usage bar
     */
    const showUsage = !!usage;

    /**
     * React Hook Form instance with Zod validation
     * Configured for onChange validation mode for real-time feedback
     */
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            content: "",
        },
        mode: "onChange"
    });

    // =========================================================================
    // EVENT HANDLERS
    // =========================================================================

    /**
     * Handles form submission
     *
     * Sends the message to the backend, which triggers the AI agent
     * to process the request and generate code changes.
     *
     * @async
     * @param {Object} values - Form values
     * @param {string} values.content - The message content
     */
    const onSubmit = async (values) => {
        try {
            // Send message to the AI agent via the mutation
            await mutateAsync(values.content);

            // Show success feedback to user
            toast.success("Message sent successfully");

            // Reset form for next message
            form.reset();
        } catch (error) {
            // Display error message to user
            // Falls back to generic message if error.message is undefined
            toast.error(error.message || "Failed to send message");
        }
    };

    /**
     * Handles keyboard events for the textarea
     *
     * - Enter (without Shift): Submits the form
     * - Shift + Enter: Creates a new line (default textarea behavior)
     *
     * @param {React.KeyboardEvent} e - The keyboard event
     */
    const handleKeyDown = (e) => {
        // Submit on Enter (without Shift modifier)
        // Shift+Enter allows multi-line input
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            form.handleSubmit(onSubmit)();
        }
    };

    // =========================================================================
    // COMPUTED VALUES
    // =========================================================================

    /**
     * Determines if the submit button should be disabled
     * Disabled when form is submitting or content is empty/whitespace
     */
    const isButtonDisabled = isPending || !form.watch("content").trim();

    // =========================================================================
    // RENDER
    // =========================================================================

    return (
        <Form {...form}>
            {/*
              Usage credits display
              Only shown when usage data is available
            */}
            {showUsage && <Usage />}

            {/*
              Main form container
              Includes focus ring effect for better UX
            */}
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className={cn(
                    "relative border p-4 pt-1 rounded-xl bg-sidebar dark:bg-sidebar transition-all",
                    isFocused && "shadow-lg ring-2 ring-primary/20"
                )}
            >
                {/* Message input field */}
                <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                        <TextAreaAutosize
                            {...field}
                            disabled={isPending}
                            placeholder="Describe what you want to create..."
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            minRows={3}
                            maxRows={8}
                            className={cn(
                                "pt-4 resize-none border-none w-full outline-none bg-transparent",
                                isPending && "opacity-50"
                            )}
                            onKeyDown={handleKeyDown}
                        />
                    )}
                />

                {/* Form footer with keyboard hint and submit button */}
                <div className="flex gap-x-2 items-end justify-between pt-2">
                    {/* Keyboard shortcut hint */}
                    <div className="text-[10px] text-muted-foreground font-mono">
                        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                            Enter
                        </kbd>
                        &nbsp; to submit,&nbsp;
                        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                            Shift + Enter
                        </kbd>
                        &nbsp; for new line
                    </div>

                    {/* Submit button with loading state */}
                    <Button
                        className={cn(
                            "size-8 rounded-full",
                            isButtonDisabled && "bg-muted-foreground border"
                        )}
                        disabled={isButtonDisabled}
                        type="submit"
                    >
                        {isPending ? (
                            <Spinner />
                        ) : (
                            <ArrowUpIcon className="size-4" />
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
};

export default MessageForm;
