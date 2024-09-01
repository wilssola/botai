import {json} from "@remix-run/react";

/**
 * Type definition for environment loader data.
 * @property {Object} ENV - Environment variables.
 * @property {string} ENV.APP_DOMAIN - The application domain.
 * @property {string} ENV.HCAPTCHA_SITEKEY - The hCaptcha site key.
 */
export type EnvLoaderData = {
  ENV: {
    APP_DOMAIN: string;
    HCAPTCHA_SITEKEY: string;
  };
};

/**
 * Loads environment variables and returns them as JSON.
 * @returns A promise that resolves to a JSON response containing environment variables.
 * @see https://remix.run/docs/en/main/guides/envvars
 */
export async function envLoader() {
  return json({
    ENV: {
      APP_DOMAIN: process.env.APP_DOMAIN,
      HCAPTCHA_SITEKEY: process.env.HCAPTCHA_SITEKEY,
    },
  } as EnvLoaderData);
}
