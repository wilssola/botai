import { BotSession, BotState, BotStatus, Prisma, User } from "@prisma/client";
import { db, enhancedb } from "~/services/db.server";

export type BotSessionFull = Prisma.BotSessionGetPayload<{
  include: {
    state: true;
    commands: {
      include: {
        children: true;
      };
    };
  };
}>;

/**
 * Creates a new bot session for the user with the given ID.
 *
 * @param {string} userId - The ID of the user to create the bot session for.
 * @returns The newly created bot session.
 */
export async function createBotSessionByUserId(userId: User["id"]) {
  return db.botSession.create({
    data: {
      // Default to enabled
      enabled: true,

      // Create a new bot state for the session
      state: {
        create: {
          // Default to offline
          status: BotStatus.OFFLINE,
        },
      },

      // Connect the user to the bot session
      user: {
        connect: { id: userId },
      },
    },

    // Include the bot state and commands in the response
    include: {
      state: true,
      commands: {
        include: {
          children: true,
        },
      },
    },
  });
}

/**
 * Finds a bot session by the given user ID.
 *
 * @param {string} userId - The ID of the user to find the bot session for.
 * @param {Request} [userReq] - The request to use for authentication.
 * @returns The bot session, or null if none was found.
 */
export async function getBotSessionByUserId(userId: string, userReq?: Request) {
  const query = {
    where: { userId },
    include: {
      state: true,
      commands: {
        include: {
          children: true,
        },
      },
    },
  };

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
    return (await enhancedb(userReq)).botSession.delete(query);
  }

  return db.botSession.delete(query);
}

/**
 * Updates a bot session by ID.
 *
 * @param {string} sessionId - The ID of the bot session to update.
 * @param {Partial<BotSession>} updates - The updates to apply to the bot session.
 * @param {Request} [userReq] - The request to use for authentication.
 * @returns {Promise<BotSession>} The updated bot session.
 */
export async function updateBotSessionById(
  sessionId: string,
  updates: Partial<BotSession>,
  userReq?: Request
): Promise<BotSession> {
  const query = {
    where: {
      id: sessionId,
    },
    data: updates,
  };

  if (userReq) {
    return (await enhancedb(userReq)).botSession.update(query);
  }

  return db.botSession.update(query);
}

export async function createBotCommandBySessionId(
  sessionId: string,
  name: string,
  inputs: string[],
  output: string,
  enableAi: boolean,
  promptAi: string,
  priority: number,
  userReq?: Request
) {
  const query = {
    data: {
      name,
      inputs,
      output,
      enableAi,
      promptAi,
      priority,
      session: {
        connect: { id: sessionId },
      },
    },
  };

  if (userReq) {
    return (await enhancedb(userReq)).botCommand.create(query);
  }

  return db.botCommand.create(query);
}

export async function createBotSubCommandByCommandId(
  sessionId: string,
  commandId: string,
  name: string,
  inputs: string[],
  output: string,
  enableAi: boolean,
  promptAi: string,
  priority: number,
  userReq?: Request
) {
  const query = {
    data: {
      name,
      inputs,
      output,
      enableAi,
      promptAi,
      priority,
      parent: {
        connect: { id: commandId },
      },
      session: {
        connect: { id: sessionId },
      },
    },
  };

  if (userReq) {
    return (await enhancedb(userReq)).botCommand.create(query);
  }

  return db.botCommand.create(query);
}

export async function updateBotCommandByCommandId(
  commandId: string,
  name: string,
  inputs: string[],
  output: string,
  enableAi: boolean,
  promptAi: string,
  priority: number,
  userReq?: Request
) {
  const query = {
    where: { id: commandId },
    data: {
      name,
      inputs,
      output,
      enableAi,
      promptAi,
      priority,
    },
  };

  if (userReq) {
    return (await enhancedb(userReq)).botCommand.update(query);
  }

  return db.botCommand.update(query);
}

export async function deleteBotCommandById(
  commandId: string,
  userReq?: Request
) {
  const query = { where: { id: commandId } };

  if (userReq) {
    return (await enhancedb(userReq)).botCommand.delete(query);
  }

  return db.botCommand.delete(query);
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
export async function getBotStates(status?: BotStatus) {
  return status
    ? db.botState.findMany({
        where: { status },
        include: {
          session: true,
        },
      })
    : db.botState.findMany({
        include: {
          session: true,
        },
      });
}

/**
 * Updates a bot state by ID.
 * @param {string} id - The ID of the bot state to update.
 * @param {Partial<BotState>} updates - The updates to apply to the bot state.
 * @returns The updated bot state.
 */
export async function updateBotStateById(
  id: string,
  updates: Partial<BotState>
) {
  return db.botState.update({
    where: { id },
    data: updates,
  });
}
