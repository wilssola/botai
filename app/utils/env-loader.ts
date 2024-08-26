import { json } from "@remix-run/react";

export type EnvLoaderData = {
  ENV: {
    HCAPTCHA_SITEKEY: string;
  };
};

// https://remix.run/docs/en/main/guides/envvars
export default async function envLoader() {
  return json({
    ENV: {
      HCAPTCHA_SITEKEY: process.env.HCAPTCHA_SITEKEY,
    },
  });
}
