import {PrismaClient} from "@prisma/client";
import {withPulse} from "@prisma/extension-pulse/node";
import {enhance} from "@zenstackhq/runtime";
import mongoose from "mongoose";
import {singleton} from "~/singleton.server";
import {getUserSession} from "./auth.server";
import {withAccelerate} from '@prisma/extension-accelerate';

export const db = singleton("db", () =>
    new PrismaClient().$extends(withAccelerate()).$extends(
        withPulse({apiKey: process.env.PULSE_API_KEY!})
    )
);

export const enhancedb = async (req: Request) => {
    const session = await getUserSession(req);
    const user = session ? {id: session.id} : undefined;
    return enhance(db, {user},
        {
            transactionTimeout: 10000,
            transactionMaxWait: 10000,
        }
    );
};

export const mongodb = singleton(
    "mongodb",
    async () => await mongoose.connect(process.env.MONGO_URI!)
);