import { PrismaClient } from "@prisma/client";
import { enhance } from "@zenstackhq/runtime";
import { singleton } from "~/singleton.server";
import { getUserSession } from "~/services/auth.server";

export const db = singleton("db", () => new PrismaClient());

export const enhancedb = async (req: Request) => {
  const session = await getUserSession(req);
  const user = session ? { id: session.id } : undefined;

  return enhance(
    db,
    { user },
    {
      transactionTimeout: 10000,
      transactionMaxWait: 10000,
    }
  );
};
