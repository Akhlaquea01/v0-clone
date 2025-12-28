/**
 * @fileoverview Project React Query Hooks
 *
 * This module provides React Query hooks for project-related operations.
 * These hooks handle data fetching, caching, and mutations for projects,
 * integrating with the server actions defined in the actions module.
 *
 * Hooks:
 * - useGetProjects: Fetches all projects for the current user
 * - useCreateProject: Creates a new project with optimistic updates
 * - useDeleteProject: Deletes a project and related data
 * - useGetProjectById: Fetches a single project by ID
 *
 * @module modules/projects/hooks/project
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createProject, deleteProject, getProjectById, getProjects } from "../actions"

/**
 * Hook to fetch all projects for the current user
 *
 * Retrieves the list of projects owned by the authenticated user.
 * The projects are cached with the "projects" query key.
 *
 * @returns {UseQueryResult} React Query result object containing:
 *   - data: Array of project objects
 *   - isPending: Boolean indicating loading state
 *   - isError: Boolean indicating error state
 *   - error: Error object if request failed
 *
 * @example
 * const { data: projects, isPending } = useGetProjects();
 */
export const useGetProjects = () => {
    return useQuery({
        queryKey: ["projects"],
        queryFn: () => getProjects()
    })
}

/**
 * Hook to create a new project
 *
 * Creates a new project with the given description and triggers
 * the AI agent to start processing. On success, invalidates both
 * the projects list cache and the usage status cache.
 *
 * @returns {UseMutationResult} React Query mutation result containing:
 *   - mutateAsync: Async function to create project
 *   - isPending: Boolean indicating mutation in progress
 *   - isError: Boolean indicating mutation failed
 *   - error: Error object if mutation failed
 *
 * @example
 * const { mutateAsync, isPending } = useCreateProject();
 * const newProject = await mutateAsync("Build a todo app");
 */
export const useCreateProject = () => {
    const queryClient = useQueryClient()

    return useMutation({
        /**
         * Mutation function that calls the createProject server action
         * @param {string} value - The project description
         */
        mutationFn: (value) => createProject(value),

        /**
         * On successful project creation:
         * 1. Invalidate projects list to show new project
         * 2. Invalidate status to update remaining credits
         */
        onSuccess: () => {
            // Invalidate projects list to refetch and show new project
            queryClient.invalidateQueries({ queryKey: ["projects"] })

            // Invalidate usage status since creating a project consumes credits
            queryClient.invalidateQueries({ queryKey: ["status"] })
        }
    })
}

/**
 * Hook to delete a project
 *
 * Deletes a project and all its related data (messages, fragments).
 * On success, invalidates the projects list cache.
 *
 * @returns {UseMutationResult} React Query mutation result containing:
 *   - mutateAsync: Async function to delete project
 *   - isPending: Boolean indicating mutation in progress
 *   - isError: Boolean indicating mutation failed
 *   - error: Error object if mutation failed
 *
 * @example
 * const { mutateAsync, isPending } = useDeleteProject();
 * await mutateAsync("cuid123456");
 */
export const useDeleteProject = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (projectId) => deleteProject(projectId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] })
        }
    })
}

/**
 * Hook to fetch a single project by ID
 *
 * Retrieves detailed information about a specific project.
 * Useful for the project view page and header component.
 *
 * @param {string} projectId - The unique identifier of the project
 * @returns {UseQueryResult} React Query result object containing:
 *   - data: Project object with name, createdAt, etc.
 *   - isPending: Boolean indicating loading state
 *   - isError: Boolean indicating error state
 *   - error: Error object if request failed
 *
 * @example
 * const { data: project, isPending } = useGetProjectById("cuid123456");
 */
export const useGetProjectById = (projectId) => {
    return useQuery({
        queryKey: ["project", projectId],
        queryFn: () => getProjectById(projectId)
    })
}
