"use client";

import dynamic from "next/dynamic";

const ProjectView = dynamic(
    () => import("@/modules/projects/components/project-view"),
    { ssr: false }
);

export default function ProjectViewWrapper({ projectId }) {
    return <ProjectView projectId={projectId} />;
}
