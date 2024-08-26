import { ZodError } from "zod";

export type RequestError = ZodError & {
  message: string;
};
