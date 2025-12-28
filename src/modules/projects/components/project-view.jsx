"use client";

/**
 * @fileoverview Project View Component
 *
 * This is the main project workspace component that displays a split-pane view
 * with messages on the left and preview/code on the right. Users can interact
 * with the AI agent through messages and see the results in real-time.
 *
 * Features:
 * - Resizable split-pane layout
 * - Message history with fragment selection
 * - Live preview iframe for generated applications
 * - Code explorer for viewing generated files
 * - Theme toggle and navigation
 * - Upgrade button for non-pro users
 *
 * @module modules/projects/components/project-view
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    ResizablePanelGroup,
    ResizablePanel,
    ResizableHandle,
} from "@/components/ui/resizable";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

import ProjectHeader from "./project-header";
import MessageContainer from "./message-container";
import { Code, CrownIcon, EyeIcon } from "lucide-react";
import FragmentWeb from "./fragment-web";
import { FileExplorer } from "./file-explorer";

/**
 * ProjectView Component
 *
 * Main workspace view for a project. Provides a split-pane interface with:
 * - Left panel: Project header, message history, and message input
 * - Right panel: Tabs for preview (iframe) and code (file explorer)
 *
 * The component tracks the currently selected fragment (code generation result)
 * and displays its preview or code in the right panel.
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} props.projectId - The ID of the current project
 * @returns {JSX.Element} The rendered project view
 *
 * @example
 * <ProjectView projectId="cuid123456" />
 */
const ProjectView = ({ projectId }) => {
    // =========================================================================
    // STATE & HOOKS
    // =========================================================================

    /**
     * Currently selected fragment (code generation result)
     * Contains files, sandbox URL, and metadata for preview/code view
     */
    const [activeFragment, setActiveFragment] = useState(null);

    /**
     * Active tab in the right panel ("preview" or "code")
     */
    const [tabState, setTabState] = useState("preview");

    /**
     * Auth hook to check user's subscription status
     * Used to conditionally show upgrade button
     */
    const { has } = useAuth();

    /**
     * Check if user has pro plan access
     * Pro users don't need to see the upgrade button
     */
    const hasProAccess = has?.({ plan: "pro" });

    // =========================================================================
    // RENDER
    // =========================================================================

    return (
        <div className="h-screen">
            {/*
              Resizable split-pane layout
              Left: Messages | Right: Preview/Code
            */}
            <ResizablePanelGroup direction="horizontal">
                {/*
                  Left Panel: Messages Section
                  Contains project header, message history, and input form
                */}
                <ResizablePanel
                    defaultSize={35}
                    minSize={20}
                    className="flex flex-col min-h-0"
                >
                    {/* Project header with name and navigation */}
                    <ProjectHeader projectId={projectId} />

                    {/*
                      Message container with history and input
                      Manages fragment selection for preview
                    */}
                    <MessageContainer
                        projectId={projectId}
                        activeFragment={activeFragment}
                        setActiveFragment={setActiveFragment}
                    />
                </ResizablePanel>

                {/* Draggable resize handle */}
                <ResizableHandle withHandle />

                {/*
                  Right Panel: Preview/Code Section
                  Displays the generated application or source code
                */}
                <ResizablePanel defaultSize={65} minSize={50}>
                    <Tabs
                        className={"h-full flex flex-col"}
                        defaultValue="preview"
                        value={tabState}
                        onValueChange={(value) => setTabState(value)}
                    >
                        {/* Tab header with view toggles and actions */}
                        <div className="w-full flex items-center p-2 border-b gap-x-2">
                            {/* Preview/Code tab switcher */}
                            <TabsList className={"h-8 p-0 border rounded-md"}>
                                <TabsTrigger
                                    value="preview"
                                    className={"rounded-md px-3 flex items-center gap-x-2"}
                                >
                                    <EyeIcon className="size-4" />
                                    <span>Demo</span>
                                </TabsTrigger>

                                <TabsTrigger
                                    value="code"
                                    className={"rounded-md px-3 flex items-center gap-x-2"}
                                >
                                    <Code className="size-4" />
                                    <span>Code</span>
                                </TabsTrigger>
                            </TabsList>

                            {/*
                              Action buttons (right side)
                              Only show upgrade button for non-pro users
                            */}
                            <div className="ml-auto flex items-center gap-x-2">
                                {!hasProAccess && (
                                    <Button asChild size={"sm"}>
                                        <Link href={"/pricing"}>
                                            <CrownIcon className="size-4 mr-2" />
                                            Upgrade
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/*
                          Preview Tab Content
                          Displays iframe with the generated application
                        */}
                        <TabsContent
                            value="preview"
                            className={"flex-1 h-[calc(100%-4rem)] overflow-hidden"}
                        >
                            {activeFragment ? (
                                <FragmentWeb data={activeFragment} />
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    Select a fragment to preview
                                </div>
                            )}
                        </TabsContent>

                        {/*
                          Code Tab Content
                          Displays file explorer with generated source code
                        */}
                        <TabsContent
                            value="code"
                            className={"flex-1 h-[calc(100%-4rem)] overflow-hidden"}
                        >
                            {activeFragment?.files ? (
                                <FileExplorer files={activeFragment.files} />
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    Select a fragment to view code
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
};

export default ProjectView;
