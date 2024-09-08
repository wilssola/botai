/**
 * Constants for the application.
 */

// The name of the application
export const APP_NAME = "BotAI";

// The session name derived from the application name
export const SESSION_NAME = `${APP_NAME.toLowerCase()
  .trim()
  .replace(" ", "-")}-session`;

// Maximum time (in milliseconds) for an email code to be valid
export const MAX_EMAIL_CODE_TIME = 5 * 60 * 1000;
