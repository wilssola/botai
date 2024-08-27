import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect, useActionData, useLoaderData } from "@remix-run/react";
import { getClientIPAddress } from "remix-utils/get-client-ip-address";
import { z as zod } from "zod";
import AuthForm from "~/components/forms/AuthForm";
import {
  HCAPTCHA_RESPONSE,
  MIN_PASSWORD_LENGTH,
  MIN_USERNAME_LENGTH,
} from "~/constants";
import { HTTPStatus } from "~/enums/http-status";
import { verifyHCaptcha } from "~/models/captcha.server";
import { DASHBOARD_PATH } from "~/routes";
import { AuthStrategies } from "~/services/auth";
import { auth } from "~/services/auth.server";
import { ResponseActionData } from "~/types/response-action-data";
import envLoader, { EnvLoaderData } from "~/utils/env-loader";

export const loader: LoaderFunction = async ({ request }) => {
  await auth.isAuthenticated(request, {
    successRedirect: DASHBOARD_PATH,
  });

  return await envLoader();
};

export const action: ActionFunction = async ({ request }) => {
  // https://github.com/sergiodxa/remix-auth/issues/263
  const formData = await request.clone().formData();
  const formPayload = Object.fromEntries(formData);
  console.log(formPayload);

  const loginSchema = zod.object({
    username: zod.string().trim().min(MIN_USERNAME_LENGTH),
    email: zod.string().trim().email(),
    password: zod.string().trim().min(MIN_PASSWORD_LENGTH),
    [HCAPTCHA_RESPONSE]: zod.string().trim().min(1),
  });

  try {
    const parsedPayload = loginSchema.parse(formPayload);

    const hCaptcha = await verifyHCaptcha(
      parsedPayload[HCAPTCHA_RESPONSE],
      getClientIPAddress(request)
    );

    if (hCaptcha) {
      const user = await auth.authenticate(
        AuthStrategies.FORM_REGISTER,
        request
      );

      if (!user) {
        return json(
          { message: "Registration failed" },
          { status: HTTPStatus.UNAUTHORIZED }
        );
      }

      return redirect(DASHBOARD_PATH);
    }

    return json(
      { message: "Captcha not verified" },
      { status: HTTPStatus.BAD_REQUEST }
    );
  } catch (error) {
    return json(
      { message: "Parameters validation error", error },
      { status: HTTPStatus.BAD_REQUEST }
    );
  }
};

export default function Register() {
  const { ENV } = useLoaderData<EnvLoaderData>() as EnvLoaderData;
  const actionData = useActionData<ResponseActionData>() as ResponseActionData;

  return (
    <AuthForm
      mode="register"
      hcaptchaSiteKey={ENV.HCAPTCHA_SITEKEY}
      actionData={actionData}
    ></AuthForm>
  );
}
