import {APP_NAME} from "~/constants";

/**
 * Generates default meta tags for a page.
 * @param {string} [pageName] - The name of the page.
 * @param {string} [path] - The path of the page.
 * @returns {Array<Object>} An array of meta tag objects.
 */
export const defaultMeta = (pageName?: string, path?: string) => {
  return [
    { title: `${pageName ? APP_NAME : `${APP_NAME} | ${pageName}`}` },
    { name: "description", content: `Bem-vindo ao ${APP_NAME}` },
  ];
};

/**
 * Generates a canonical link tag for a given path.
 * @param {string} [path] - The path to generate the canonical link for.
 * @returns {Object} An object representing the canonical link tag.
 */
export function getCanonicalLink(path?: string) {
  // TODO: Find a way to pass server secret to the client, or use a different approach
  return {
    tagName: "link",
    rel: "canonical",
    href: `https://${process.env.APP_DOMAIN}${path}`,
  };
}
