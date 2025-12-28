/**
 * @fileoverview Project Header Component
 *
 * This component renders the header bar for the project view.
 * It displays the project name with a dropdown menu for navigation
 * and settings like theme switching.
 *
 * Features:
 * - Project name display
 * - Dropdown menu with navigation options
 * - Theme switcher (Light/Dark/System)
 * - Loading state while fetching project data
 *
 * @module modules/projects/components/project-header
 */

import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import {
    ChevronDownIcon,
    ChevronLeftIcon,
    SunMoonIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuPortal,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { useGetProjectById } from "../hooks/project";

/**
 * ProjectHeader Component
 *
 * Renders the header section of the project view with:
 * - App logo
 * - Project name (with loading state)
 * - Dropdown menu for navigation and settings
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} props.projectId - The ID of the current project
 * @returns {JSX.Element} The rendered project header
 *
 * @example
 * <ProjectHeader projectId="cuid123456" />
 */
const ProjectHeader = ({ projectId }) => {
    // =========================================================================
    // HOOKS
    // =========================================================================

    /**
     * Fetch project data to display the name
     */
    const { data: project, isPending } = useGetProjectById(projectId);

    /**
     * Theme hook for toggling between light/dark/system modes
     */
    const { setTheme, theme } = useTheme();

    // =========================================================================
    // RENDER
    // =========================================================================

    return (
        <header className="p-2 flex justify-between items-center border-b">
            <DropdownMenu>
                {/* Dropdown trigger button with logo and project name */}
                <DropdownMenuTrigger asChild>
                    <Button
                        variant={"ghost"}
                        size={"sm"}
                        className={
                            "focus-visible:ring-0 hover:bg-transparent hover:opacity-75 transition-opacity !pl-2"
                        }
                    >
                        {/* App logo */}
                        <Image
                            src={"/logo.svg"}
                            alt="Vibe"
                            width={28}
                            height={28}
                            className="shrink-0 invert-0 dark:invert"
                        />

                        {/* Project name with loading state */}
                        <span className="text-sm font-medium">
                            {isPending ? (
                                <Spinner />
                            ) : (
                                project?.name || "Untitled Project"
                            )}
                        </span>

                        {/* Dropdown indicator */}
                        <ChevronDownIcon className="size-4 ml-2" />
                    </Button>
                </DropdownMenuTrigger>

                {/* Dropdown menu content */}
                <DropdownMenuContent side={"bottom"} align={"start"}>
                    {/* Navigation: Back to Dashboard */}
                    <DropdownMenuItem asChild>
                        <Link href={"/"}>
                            <ChevronLeftIcon className="size-4" />
                            <span>Go to Dashboard</span>
                        </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {/* Theme Switcher Submenu */}
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger className={"gap-2"}>
                            <SunMoonIcon className="size-4 text-muted-foreground" />
                            <span>Appearance</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent sideOffset={5}>
                                {/* Theme options as radio group */}
                                <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                                    <DropdownMenuRadioItem value="light">
                                        Light
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="dark">
                                        Dark
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="system">
                                        System
                                    </DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    );
};

export default ProjectHeader;
