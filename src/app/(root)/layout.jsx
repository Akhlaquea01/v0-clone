import React from "react";
import { onBoardUser } from "@/modules/auth/actions";
import Navbar from "@/modules/home/components/navbar";


const Layout = async ({ children }) => {
    // First, onboard the user (create/update in DB if logged in)
    await onBoardUser();

    return (
        <main className="flex flex-col min-h-screen relative overflow-x-hidden">
            <Navbar />
            <div className="fixed inset-0 -z-10 h-full w-full bg-background dark:bg-[radial-gradient(120%_120%_at_50%_50%,_rgba(0,_0,_0,_0.5)_0%,_rgba(0,_0,_0,_0)_100%)][background-size:16px_16px]" />
            <div className="flex-1 w-full mt-20">
                {children}
            </div>
        </main>
    );
};

export default Layout;
