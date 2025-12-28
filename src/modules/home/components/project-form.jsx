"use client";

/**
 * @fileoverview Project Form Component
 *
 * This is the main input form on the home page where users can create new projects.
 * It provides template suggestions for common project types and a custom input field
 * for describing user's own ideas.
 *
 * Features:
 * - Pre-built project templates for quick starts
 * - Auto-resizing textarea for comfortable input
 * - Form validation with Zod schema
 * - Keyboard shortcuts (Enter to submit, Shift+Enter for newline)
 * - Loading states during project creation
 *
 * @module modules/home/components/project-form
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import TextAreaAutosize from "react-textarea-autosize";
import { ArrowUpIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";
import z from "zod";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";
import { Spinner } from "@/components/ui/spinner";
import { useCreateProject } from "@/modules/projects/hooks/project";

/**
 * Zod validation schema for the project form
 *
 * @constant {z.ZodObject} formSchema
 * @property {string} content - Project description (1-1000 characters)
 */
const formSchema = z.object({
    content: z
        .string()
        .min(1, "Project description is required")
        .max(1000, "Description is too long"),
});

/**
 * Pre-defined project templates for quick starts
 *
 * Each template includes:
 * - emoji: Visual icon for the template card
 * - title: Short description shown on the card
 * - prompt: Full prompt that gets inserted into the textarea
 *
 * @constant {Array<{emoji: string, title: string, prompt: string}>}
 */
const PROJECT_TEMPLATES = [
    {
        emoji: "🎬",
        title: "Build a Netflix clone",
        prompt:
            "Build a Netflix-style homepage with a hero banner (use a nice, dark-mode compatible gradient here), movie sections, responsive cards, and a modal for viewing details using mock data and local state. Use dark mode.",
    },
    {
        emoji: "📦",
        title: "Build an admin dashboard",
        prompt:
            "Create an admin dashboard with a sidebar, stat cards, a chart placeholder, and a basic table with filter and pagination using local state. Use clear visual grouping and balance in your design for a modern, professional look.",
    },
    {
        emoji: "📋",
        title: "Build a kanban board",
        prompt:
            "Build a kanban board with drag-and-drop using react-beautiful-dnd and support for adding and removing tasks with local state. Use consistent spacing, column widths, and hover effects for a polished UI.",
    },
    {
        emoji: "🗂️",
        title: "Build a file manager",
        prompt:
            "Build a file manager with folder list, file grid, and options to rename or delete items using mock data and local state. Focus on spacing, clear icons, and visual distinction between folders and files.",
    },
    {
        emoji: "📺",
        title: "Build a YouTube clone",
        prompt:
            "Build a YouTube-style homepage with mock video thumbnails, a category sidebar, and a modal preview with title and description using local state. Ensure clean alignment and a well-organized grid layout.",
    },
    {
        emoji: "🛍️",
        title: "Build a store page",
        prompt:
            "Build a store page with category filters, a product grid, and local cart logic to add and remove items. Focus on clear typography, spacing, and button states for a great e-commerce UI.",
    },
    {
        emoji: "🏡",
        title: "Build an Airbnb clone",
        prompt:
            "Build an Airbnb-style listings grid with mock data, filter sidebar, and a modal with property details using local state. Use card spacing, soft shadows, and clean layout for a welcoming design.",
    },
    {
        emoji: "🎵",
        title: "Build a Spotify clone",
        prompt:
            "Build a Spotify-style music player with a sidebar for playlists, a main area for song details, and playback controls. Use local state for managing playback and song selection. Prioritize layout balance and intuitive control placement for a smooth user experience. Use dark mode.",
    },
];

/**
 * ProjectsForm Component
 *
 * Main form component for creating new projects on the home page.
 * Allows users to either select from pre-built templates or describe
 * their own custom project idea.
 *
 * @component
 * @returns {JSX.Element} The rendered project creation form
 *
 * @example
 * <ProjectsForm />
 */
const ProjectsForm = () => {
    // =========================================================================
    // STATE & HOOKS
    // =========================================================================

    /**
     * Tracks whether the textarea is currently focused
     * Used for applying focus styles to the form container
     */
    const [isFocused, setIsFocused] = useState(false);

    /**
     * Next.js router for navigation after project creation
     */
    const router = useRouter();

    /**
     * Mutation hook for creating new projects
     * Returns the new project data on success
     */
    const { mutateAsync, isPending } = useCreateProject();

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
     * Handles template selection
     *
     * When a user clicks a template card, populate the textarea
     * with the template's prompt text.
     *
     * @param {string} prompt - The template prompt to insert
     */
    const handleTemplate = (prompt) => {
        form.setValue("content", prompt);
    };

    /**
     * Handles form submission
     *
     * Creates a new project with the entered description,
     * then navigates to the project view page.
     *
     * @async
     * @param {Object} values - Form values
     * @param {string} values.content - The project description
     */
    const onSubmit = async (values) => {
        try {
            // Create the project via mutation
            const res = await mutateAsync(values.content);

            // Navigate to the new project's page
            router.push(`/projects/${res.id}`);

            // Show success feedback
            toast.success("Project created successfully");

            // Reset form for potential future use
            form.reset();
        } catch (error) {
            // Display error message to user
            toast.error(error.message || "Failed to create project");
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
        <div className="space-y-8">
            {/*
              Template Grid
              Displays clickable template cards for quick project creation
            */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {PROJECT_TEMPLATES.map((template, index) => (
                    <button
                        key={index}
                        onClick={() => handleTemplate(template.prompt)}
                        className="group relative p-4 rounded-xl border bg-card hover:bg-accent/50 transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md hover:border-primary/30"
                    >
                        <div className="flex flex-col gap-2">
                            {/* Template emoji icon */}
                            <span className="text-3xl" role="img" aria-label={template.title}>
                                {template.emoji}
                            </span>
                            {/* Template title */}
                            <h3 className="text-sm font-medium group-hover:text-primary transition-colors">
                                {template.title}
                            </h3>
                        </div>
                        {/* Hover gradient overlay */}
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </button>
                ))}
            </div>

            {/* Divider between templates and custom input */}
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        Or describe your own idea
                    </span>
                </div>
            </div>

            {/* Custom project description form */}
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className={cn(
                        "relative border p-4 pt-1 rounded-xl bg-sidebar dark:bg-sidebar transition-all",
                        isFocused && "shadow-lg ring-2 ring-primary/20"
                    )}
                >
                    {/* Project description input field */}
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
        </div>
    );
};

export default ProjectsForm;
