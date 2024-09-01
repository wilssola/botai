import { APP_NAME } from "~/constants";

export const defaultMeta = (pageName?: string, path?: string) => {
  return [
    { title: `${pageName ? APP_NAME : `${APP_NAME} | ${pageName}`}` },
    { name: "description", content: `Bem-vindo ao ${APP_NAME}` },
    getCanonicalLink(path),
  ];
};

export function getCanonicalLink(path?: string) {
  return {
    tagName: "link",
    rel: "canonical",
    href: `https://${process.env.APP_DOMAIN}${path}`,
  };
}
