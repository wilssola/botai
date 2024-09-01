/**
 * Represents the data structure for a response action.
 *
 * @property {string} message - The message associated with the response action.
 * @property {unknown} [error] - An optional error object associated with the response action.
 */
export type ResponseActionData = {
  message: string;
  error?: unknown;
};
