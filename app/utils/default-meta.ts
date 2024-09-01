import {APP_NAME} from "~/constants";

export const defaultMeta = (pageName? : string) => {
    return [
        { title: `${pageName? APP_NAME : `${APP_NAME} | ${pageName}`}` },
        { name: "description", content: `Bem-vindo ao ${APP_NAME}` },
    ];
};