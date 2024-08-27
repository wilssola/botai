import { ZodError } from "zod";

export type ResponseActionData = {
  message: string;
  error?: ZodError;
};
