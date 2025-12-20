"use server";

import db from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";

export const onBoardUser = async () => {
    try {
        const user = await currentUser();
        if (!user) {
            return {
                success: false,
                message: "User not found",
            };
        }

        const { id, emailAddresses, firstName, lastName, imageUrl } = user;
        //to avoaid duplicate users and update if  any change
        const newUser = await db.user.upsert({
            where: {
                clerkId: id,
            },
            create: {
                clerkId: id,
                email: emailAddresses[0]?.emailAddress || '',
                name: firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || '',
                image: imageUrl || null,
            },
            update: {
                email: emailAddresses[0].emailAddress,
                name: firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || '',
                image: imageUrl,
            },
        });

        return {
            success: true,
            user: newUser,
            message: "User created successfully",
        };
    } catch (error) {
        console.log(error);
        return {
            success: false,
            message: "User not found",
        };
    }
};

export const getCurrentUser = async () => {
    try {
        const user = await currentUser();
        if (!user) {
            return null;
        }
        const { id } = user;
        const dbUser = await db.user.findUnique({
            where: {
                clerkId: id,
            },
            select: {
                id: true,
                email: true,
                name: true,
                image: true,
                clerkId: true,
            },
        });
        return dbUser;
    } catch (error) {
        console.log(error);
        return null;
    }
}
