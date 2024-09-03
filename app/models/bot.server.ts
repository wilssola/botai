import {
  BotCommand,
  BotSession,
  BotState,
  BotStatus,
  User,
} from "@prisma/client";
import { db, enhancedb } from "~/services/db.server";

export async function createBotSessionByUserId(userId: User["id"]) {
  return await db.botSession.create({
    data: {
      enabled: true,
      state: {
        create: {
          status: BotStatus.OFFLINE,
        },
      },
      user: {
        connect: { id: userId },
      },
    },
    include: {
      state: true,
    },
  });
}

export async function getBotSessionByUserId(userId: string, userReq?: Request) {
  const query = { where: { userId }, include: { state: true } };

  if (userReq) {
    return (await enhancedb(userReq)).botSession.findUnique(query);
  }

  return db.botSession.findUnique(query);
}

export async function getBotSessionById(sessionId: string, userReq?: Request) {
  const query = { where: { id: sessionId } };

  if (userReq) {
    return (await enhancedb(userReq)).botSession.findUnique(query);
  }

  return db.botSession.findUnique(query);
}

export async function deleteBotSessionById(
  sessionId: string,
  userReq?: Request
) {
  const query = { where: { id: sessionId } };

  if (userReq) {
    return await (await enhancedb(userReq)).botSession.delete(query);
  }

  return await db.botSession.delete(query);
}

export async function updateBotSessionById(
  sessionId: string,
  updates: Partial<BotSession>,
  userReq?: Request
) {
  const query = {
    where: {
      id: sessionId,
    },
    data: updates,
  };

  if (userReq) {
    return await (await enhancedb(userReq)).botSession.update(query);
  }

  return await db.botSession.update(query);
}

export async function createBotCommandBySessionId(
  sessionId: string,
  command: BotCommand,
  userReq?: Request
) {
  const query = {
    where: {
      id: sessionId,
    },
    data: {
      commands: {
        create: command,
      },
    },
  };

  if (userReq) {
    return await (await enhancedb(userReq)).botSession.update(query);
  }

  return await db.botSession.update(query);
}

export async function getBotCommandsBySessionId(
  sessionId: string,
  userReq?: Request
) {
  const query = { where: { sessionId } };

  if (userReq) {
    return (await enhancedb(userReq)).botCommand.findMany(query);
  }

  return db.botCommand.findMany(query);
}

export async function getBotCommandById(commandId: string, userReq?: Request) {
  const query = {
    where: {
      id: commandId,
    },
  };

  if (userReq) {
    return (await enhancedb(userReq)).botCommand.findUnique(query);
  }

  return db.botCommand.findUnique(query);
}

/**
 * Gets all bot states with the given status.
 * @param {BotStatus} status - The status of the bot states to get.
 * @returns The bot states with the given status.
 */
export async function getBotStates(status: BotStatus) {
  return db.botState.findMany({
    where: { status },
    include: {
      session: true,
    },
  });
}

export async function streamBotStates() {
  return await db.botState.stream();
}

export async function updateBotStateById(
  id: string,
  updates: Partial<BotState>
) {
  return db.botState.update({ where: { id: id }, data: updates });
}
