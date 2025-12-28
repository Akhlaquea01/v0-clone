"use client";

/**
 * @fileoverview Project List Component
 *
 * This component displays a list of the user's projects on the home page.
 * It provides a responsive layout with a grid for desktop and a carousel
 * for mobile/tablet devices.
 *
 * Features:
 * - Responsive grid layout (3 columns on desktop)
 * - Carousel for mobile/tablet views
 * - Delete functionality with confirmation
 * - Skeleton loading states
 * - Hover effects and transitions
 * - Date formatting for project creation time
 *
 * @module modules/home/components/project-list
 */

import { useGetProjects, useDeleteProject } from "@/modules/projects/hooks/project";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { FolderKanban, Calendar, ArrowRight, Trash2, Loader2 } from "lucide-react";
import React, { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

/**
 * ProjectList Component
 *
 * Displays the user's projects in a responsive grid/carousel layout.
 * Shows skeleton loading state while fetching and hides when empty.
 *
 * @component
 * @returns {JSX.Element|null} The rendered project list or null if empty
 *
 * @example
 * <ProjectList />
 */
const ProjectList = () => {
    // =========================================================================
    // HOOKS & STATE
    // =========================================================================

    /**
     * Fetch user's projects
     */
    const { data: projects, isPending } = useGetProjects();

    /**
     * Delete project mutation
     */
    const { mutateAsync: deleteProject, isPending: isDeleting } = useDeleteProject();

    /**
     * State for delete confirmation dialog
     */
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState(null);

    // =========================================================================
    // HANDLERS
    // =========================================================================

    /**
     * Opens the delete confirmation dialog
     *
     * @param {Event} e - Click event
     * @param {Object} project - Project to delete
     */
    const openDeleteDialog = (e, project) => {
        e.preventDefault();
        e.stopPropagation();
        setProjectToDelete(project);
        setDeleteDialogOpen(true);
    };

    /**
     * Handles project deletion after confirmation
     */
    const handleConfirmDelete = async () => {
        if (!projectToDelete) return;

        try {
            await deleteProject(projectToDelete.id);
            toast.success(`Project "${projectToDelete.name}" deleted successfully`);
        } catch (error) {
            toast.error(error.message || "Failed to delete project");
        } finally {
            setDeleteDialogOpen(false);
            setProjectToDelete(null);
        }
    };

    // =========================================================================
    // UTILITY FUNCTIONS
    // =========================================================================

    /**
     * Formats a date for display
     *
     * @param {Date|string} date - The date to format
     * @returns {string} Formatted date string (e.g., "Dec 28, 2024")
     */
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    // =========================================================================
    // LOADING STATE
    // =========================================================================

    if (isPending) {
        return (
            <div className="w-full mt-16">
                <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
                    Your Projects
                </h2>
                {/* Skeleton grid while loading */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-36 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    // =========================================================================
    // EMPTY STATE
    // =========================================================================

    // Don't render anything if there are no projects
    if (!projects || projects.length === 0) {
        return null;
    }

    // =========================================================================
    // PROJECT CARD COMPONENT (reusable for both grid and carousel)
    // =========================================================================

    /**
     * Renders a single project card with delete button
     *
     * @param {Object} project - The project data
     * @returns {JSX.Element} The rendered project card
     */
    const renderProjectCard = (project) => (
        <Card
            className="group hover:shadow-xl transition-all duration-300 border-zinc-800/50 hover:border-emerald-500/50 cursor-pointer bg-zinc-900/30 backdrop-blur-sm overflow-hidden relative"
        >
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between mb-3">
                    {/* Project icon */}
                    <div className="p-2.5 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                        <FolderKanban className="w-5 h-5 text-emerald-500" />
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Delete button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-red-500 hover:bg-red-500/10"
                            onClick={(e) => openDeleteDialog(e, project)}
                            disabled={isDeleting}
                        >
                            {isDeleting && projectToDelete?.id === project.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="h-4 w-4" />
                            )}
                        </Button>

                        {/* Arrow indicator (animates on hover) */}
                        <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                    </div>
                </div>
                {/* Project name */}
                <CardTitle className="text-lg text-zinc-100 group-hover:text-emerald-400 transition-colors line-clamp-1">
                    {project.name}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {/* Creation date */}
                <div className="flex items-center text-sm text-zinc-400">
                    <Calendar className="w-3.5 h-3.5 mr-2" />
                    <span>{formatDate(project.createdAt)}</span>
                </div>
            </CardContent>
        </Card>
    );

    // =========================================================================
    // RENDER
    // =========================================================================

    return (
        <>
            <div className="w-full mt-16">
                {/* Section header */}
                <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
                    Your Projects
                </h2>

                {/* Desktop: Grid layout (3 columns) */}
                <div className="hidden lg:grid grid-cols-3 gap-4 max-w-6xl mx-auto">
                    {projects.map((project) => (
                        <Link href={`/projects/${project.id}`} key={project.id}>
                            {renderProjectCard(project)}
                        </Link>
                    ))}
                </div>

                {/* Mobile/Tablet: Carousel layout */}
                <div className="lg:hidden max-w-4xl mx-auto px-4">
                    <Carousel
                        opts={{
                            align: "start",
                            loop: true,
                        }}
                        className="w-full"
                    >
                        <CarouselContent className="-ml-4">
                            {projects.map((project) => (
                                <CarouselItem
                                    key={project.id}
                                    className="pl-4 md:basis-1/2"
                                >
                                    <Link href={`/projects/${project.id}`}>
                                        {renderProjectCard(project)}
                                    </Link>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        {/* Carousel navigation buttons */}
                        <CarouselPrevious className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100" />
                        <CarouselNext className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100" />
                    </Carousel>
                </div>
            </div>

            {/* Delete Confirmation Dialog - rendered at root level */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="bg-zinc-900 border-zinc-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Project</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{projectToDelete?.name}"? This will permanently delete all messages and generated code. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default ProjectList;
