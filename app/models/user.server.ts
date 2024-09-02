import { User } from "@prisma/client";
import argon2 from "argon2";
import { db, enhancedb } from "~/services/db.server";
import { nanoid } from "nanoid";

export type { Password, User } from "@prisma/client";

export async function createUserByForm({
  username,
  email,
  password,
}: Pick<User, "username" | "email"> & { password: string }) {
  const userExists = await db.user.findFirst({
    where: { OR: [{ username }, { email }] },
  });
  if (userExists) {
    return null;
  }

  const passwordHash = await argon2.hash(password);
  return await db.user.create({
    data: {
      username,
      email,
      password: {
        create: {
          hash: passwordHash,
        },
      },
    },
  });
}

export async function getUserByForm({
  email,
  password,
}: Pick<User, "email"> & { password: string }) {
  const user = await db.user.findUnique({
    where: { email },
    include: {
      password: true,
    },
  });

  // Para prevenir ataques de tempo, calcular um hash inútil para evitar um invasor deduzir se o usuário existe ou não.
  // https://en.wikipedia.org/wiki/Timing_attack
  if (!user || !user.password) {
    await argon2.hash(password);
    return null;
  }

  const passwordVerify = await argon2.verify(user.password.hash, password);

  if (!passwordVerify) {
    return null;
  }

  return { ...user } as Omit<User, "password">;
}

export async function getUserById(userId: User["id"], userRequest?: Request) {
  const query = { where: { id: userId } };

  if (userRequest) {
    return (await enhancedb(userRequest)).user.findUnique(query);
  }

  return db.user.findUnique(query);
}

export async function getUserByEmail(
  email: User["email"],
  userRequest?: Request
) {
  const query = { where: { email } };

  if (userRequest) {
    return (await enhancedb(userRequest)).user.findUnique(query);
  }

  return db.user.findUnique(query);
}

export async function getUserByUsername(
  username: User["username"],
  userRequest?: Request
) {
  const query = { where: { username } };

  if (userRequest) {
    return (await enhancedb(userRequest)).user.findUnique(query);
  }

  return db.user.findUnique(query);
}

export async function createUserMailAuthCodeById(userId: User["id"]) {
  const user = await db.user.update({
    where: { id: userId },
    data: {
      mailAuth: {
        create: {
          code: nanoid(),
        },
      },
    },
    include: {
      mailAuth: true,
    },
  });

  return user.mailAuth;
}

export async function getUserMailAuthById(userId: User["id"]) {
  const query = {
    where: { userId },
  };

  return db.mailAuth.findUnique(query);
}

export async function updateUserMailAuthCodeById(userId: User["id"]) {
  const user = await db.user.update({
    where: { id: userId },
    data: {
      mailAuth: {
        update: {
          code: nanoid(),
        },
      },
    },
    include: {
      mailAuth: true,
    },
  });

  return user.mailAuth;
}

export async function updateUserEmailAuthVerifiedById(
  userId: User["id"],
  verified: boolean
) {
  return db.user.update({
    where: { id: userId },
    data: {
      mailAuth: {
        update: {
          verified,
        },
      },
    },
  });
}

export async function updateUserById(
  userId: User["id"],
  updates: Partial<Omit<User, "password">>,
  userRequest?: Request
) {
  const query = {
    where: { id: userId },
    data: updates,
  };

  if (userRequest) {
    return await (await enhancedb(userRequest)).user.update(query);
  }

  return await db.user.update(query);
}

export async function updateUserPasswordById(
  userId: User["id"],
  password: string,
  userRequest?: Request
) {
  const passwordHash = await argon2.hash(password);

  const query = {
    where: { id: userId },
    data: {
      password: {
        update: {
          hash: passwordHash,
        },
      },
    },
  };

  if (userRequest) {
    return await (await enhancedb(userRequest)).user.update(query);
  }

  return await db.user.update(query);
}

export async function deleteUserById(userId: string, userRequest?: Request) {
  const query = {
    where: { id: userId },
  };

  if (userRequest) {
    return await (await enhancedb(userRequest)).user.delete(query);
  }

  return await db.user.delete(query);
}
