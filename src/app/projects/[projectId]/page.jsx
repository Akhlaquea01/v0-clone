import ProjectViewWrapper from "./project-view-wrapper";

const Page = async ({ params }) => {
    const { projectId } = await params;

    return (
        <ProjectViewWrapper projectId={projectId} />
    );
};

export default Page;

