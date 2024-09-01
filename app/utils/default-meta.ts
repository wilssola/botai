import { APP_NAME } from "~/constants";
import * as process from "node:process";

export const defaultMeta = (pageName?: string, path?: string) => {
  return [
    { title: `${pageName ? APP_NAME : `${APP_NAME} | ${pageName}`}` },
    { name: "description", content: `Bem-vindo ao ${APP_NAME}` },
  ];
};

export function getCanonicalLink(path?: string) {
  // TODO: Find a way to pass server secret to the client, or use a different approach
  return {
    tagName: "link",
    rel: "canonical",
    href: `https://${process.env.APP_DOMAIN}${path}`,
  };
}
