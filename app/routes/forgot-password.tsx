import type { MetaFunction } from "@remix-run/node";
import { defaultMeta } from "~/utils/default-meta";
import { FORGOT_PASSWORD_PATH } from "~/routes";

export const meta: MetaFunction = () =>
  defaultMeta("Esqueci minha Senha", FORGOT_PASSWORD_PATH);
