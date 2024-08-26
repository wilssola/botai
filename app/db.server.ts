import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

// TODO: Add a singleton prisma instance to prevent repeated connections on development mode.

export default prisma;
