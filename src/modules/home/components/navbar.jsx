/**
 * @fileoverview Navigation Bar Component
 *
 * This component renders the main navigation bar for the application.
 * It appears at the top of the home page and handles both authenticated
 * and unauthenticated user states.
 *
 * Features:
 * - Fixed position at top of viewport
 * - Logo with home link
 * - Sign In/Sign Up buttons for unauthenticated users
 * - User button (avatar dropdown) for authenticated users
 * - Transparent background for clean look
 *
 * @module modules/home/components/navbar
 */

import Link from 'next/link';
import React from 'react';
import Image from 'next/image';
import {
    SignedIn,
    SignedOut,
    SignInButton,
    SignUpButton,
    UserButton
} from '@clerk/nextjs';

import { Button } from '@/components/ui/button';

/**
 * Navbar Component
 *
 * Renders the main navigation bar with:
 * - Logo linking to home page
 * - Authentication buttons (Sign In/Sign Up) for guests
 * - User button (profile dropdown) for authenticated users
 *
 * @component
 * @returns {JSX.Element} The rendered navigation bar
 *
 * @example
 * // Used in the root layout
 * <Navbar />
 */
const Navbar = () => {
    return (
        <nav className='p-4 bg-transparent fixed top-0 left-0 right-0 z-50 transition-all duration-200 border-b border-transparent'>
            {/* Container with max width for consistent layout */}
            <div className="max-w-5xl mx-auto w-full flex justify-between items-center">
                {/* Logo and home link */}
                <Link href="/" className="flex items-center gap-2">
                    <Image
                        src="/logo.svg"
                        alt="Logo"
                        width={32}
                        height={32}
                        className='shrink-0 dark:invert'
                    />
                </Link>

                {/*
                  Authentication buttons for unauthenticated users
                  Clerk's SignedOut component only renders when no user is signed in
                */}
                <SignedOut>
                    <div className='flex gap-2'>
                        {/* Sign In button - outline style */}
                        <SignInButton>
                            <Button variant={"outline"} size={"sm"}>
                                Sign In
                            </Button>
                        </SignInButton>

                        {/* Sign Up button - primary/default style */}
                        <SignUpButton>
                            <Button variant={"default"} size={"sm"}>
                                Sign Up
                            </Button>
                        </SignUpButton>
                    </div>
                </SignedOut>

                {/*
                  User button for authenticated users
                  Clerk's SignedIn component only renders when a user is signed in
                  UserButton shows avatar and provides dropdown with profile/logout options
                */}
                <SignedIn>
                    <UserButton />
                </SignedIn>
            </div>
        </nav>
    );
};

export default Navbar;
