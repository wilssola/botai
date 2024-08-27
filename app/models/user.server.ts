import { User } from "@prisma/client";
import argon2 from "argon2";
import db from "../db.server";
export type { Password, User } from "@prisma/client";

export async function createUserByCredentials({
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

  const user = await db.user.create({
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

  return user;
}

export async function getUserByCredentials({
  email,
  password,
}: Pick<User, "email"> & { password: string }) {
  const userWithPassword = await db.user.findUnique({
    where: { email },
    include: {
      password: true,
    },
  });

  // Para prevenir ataques de tempo, calcular um hash inútil para evitar um invasor deduzir se o usuário existe ou não.
  // https://en.wikipedia.org/wiki/Timing_attack
  if (!userWithPassword || !userWithPassword.password) {
    await argon2.hash(password);
    return null;
  }

  const passwordMatch = await argon2.verify(
    userWithPassword.password.hash,
    password
  );

  if (!passwordMatch) {
    return null;
  }

  const userWithoutPassword = { ...userWithPassword } as Omit<User, "password">;
  return userWithoutPassword;
}

export async function getUserById(id: User["id"]) {
  return await db.user.findUnique({
    where: { id },
  });
}

export async function getUserByEmail(email: User["email"]) {
  return await db.user.findUnique({
    where: { email },
  });
}

export async function getUserByUserName(username: User["username"]) {
  return await db.user.findUnique({
    where: { username },
  });
}

export async function updateUserById(
  id: User["id"],
  updates: Partial<Omit<User, "password">>
) {
  return await db.user.update({
    where: { id },
    data: updates,
  });
}

export async function updateUserPassword(id: User["id"], password: string) {
  const passwordHash = await argon2.hash(password);

  return await db.user.update({
    where: { id },
    data: {
      password: {
        update: {
          hash: passwordHash,
        },
      },
    },
  });
}

export async function deleteUserById(id: User["id"]) {
  return await db.user.delete({
    where: { id },
  });
}
