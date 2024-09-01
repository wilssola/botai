import type {
  ActionFunction,
  LoaderFunction,
  MetaFunction,
} from "@remix-run/node";
import { json, useActionData, useLoaderData } from "@remix-run/react";
import { getClientIPAddress } from "remix-utils/get-client-ip-address";
import { z, ZodError } from "zod";
import AuthForm from "~/components/forms/AuthForm";
import { MIN_PASSWORD_LENGTH } from "~/constants/validation";
import { HCAPTCHA_RESPONSE } from "~/constants/params";
import { HTTPStatus } from "~/enums/http-status";
import { verifyHCaptcha } from "~/models/captcha.server";
import { DASHBOARD_PATH, LOGIN_PATH } from "~/routes";
import { AuthStrategies } from "~/services/auth";
import { auth } from "~/services/auth.server";
import { createUserSession } from "~/services/session.server";
import { ResponseActionData } from "~/types/response-action-data";
import envLoaderServer, { EnvLoaderData } from "~/utils/env-loader.server";
import sessionLoaderServer from "~/utils/session-loader.server";
import { defaultMeta } from "~/utils/default-meta";

export const meta: MetaFunction = () => defaultMeta("Login", LOGIN_PATH);

export const loader: LoaderFunction = async ({ request }) => {
  await sessionLoaderServer(request, { successRedirect: DASHBOARD_PATH });
  return await envLoaderServer();
};

export const action: ActionFunction = async ({ request }) => {
  // https://github.com/sergiodxa/remix-auth/issues/263
  const formData = await request.clone().formData();
  const formPayload = Object.fromEntries(formData);

  const loginSchema = z.object({
    email: z.string().trim().email(),
    password: z.string().trim().min(MIN_PASSWORD_LENGTH),
    [HCAPTCHA_RESPONSE]: z.string().trim().min(1),
  });

  try {
    const parsedPayload = loginSchema.parse(formPayload);

    const hCaptcha = await verifyHCaptcha(
      parsedPayload[HCAPTCHA_RESPONSE],
      getClientIPAddress(request)
    );

    if (hCaptcha) {
      const user = await auth.authenticate(AuthStrategies.FORM_LOGIN, request);

      if (!user) {
        return json(
          { message: "Invalid credentials" },
          { status: HTTPStatus.UNAUTHORIZED }
        );
      }

      return createUserSession(user, DASHBOARD_PATH);
    }

    return json(
      { message: "Captcha not verified" },
      { status: HTTPStatus.BAD_REQUEST }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return json(
        { message: "Parameters validation error", error: error.issues },
        { status: HTTPStatus.BAD_REQUEST }
      );
    }

    return json(
      { message: "Internal server error" },
      { status: HTTPStatus.INTERNAL_SERVER_ERROR }
    );
  }
};

export default function Login() {
  const { ENV } = useLoaderData<EnvLoaderData>();
  const actionData = useActionData<ResponseActionData>();

  return (
    <>
      <AuthForm
        mode="login"
        hcaptchaSiteKey={ENV.HCAPTCHA_SITEKEY}
        actionData={actionData}
      ></AuthForm>
    </>
  );
}
