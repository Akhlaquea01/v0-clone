"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getProjectById } from "@/modules/projects/actions";
import { Loader2 } from "lucide-react";

export default function ProjectPage() {
    const params = useParams();
    const projectId = params.projectId;

    const { data: project, isLoading, error } = useQuery({
        queryKey: ["project", projectId],
        queryFn: () => getProjectById(projectId),
        enabled: !!projectId,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-red-500">Error loading project: {error.message}</p>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-muted-foreground">Project not found</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full min-h-screen p-4">
            <div className="max-w-5xl mx-auto w-full">
                <h1 className="text-2xl font-bold mb-4">{project.name}</h1>
                <p className="text-muted-foreground">
                    Project ID: {project.id}
                </p>
                {/* Add more project details and chat interface here */}
            </div>
        </div>
    );
}
