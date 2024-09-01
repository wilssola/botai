import type { ActionFunction, MetaFunction } from "@remix-run/node";
import { json, useActionData, useLoaderData } from "@remix-run/react";
import { getClientIPAddress } from "remix-utils/get-client-ip-address";
import z from "zod";
import AuthForm from "~/components/forms/AuthForm";
import {
  MIN_PASSWORD_LENGTH,
  MIN_USERNAME_LENGTH,
} from "~/constants/validation";
import { HCAPTCHA_RESPONSE } from "~/constants/params";
import { HTTPStatus } from "~/enums/http-status";
import { verifyHCaptcha } from "~/models/captcha.server";
import { REGISTER_PATH, VERIFY_EMAIL_PATH } from "~/routes";
import { AuthStrategies } from "~/services/auth";
import { auth } from "~/services/auth.server";
import { createUserSession } from "~/services/session.server";
import { ResponseActionData } from "~/types/response-action-data";
import { EnvLoaderData } from "~/utils/env-loader.server";
import { defaultMeta } from "~/utils/default-meta";

export const meta: MetaFunction = () => defaultMeta("Cadastro", REGISTER_PATH);

export { loader } from "~/routes/login";

export const action: ActionFunction = async ({ request }) => {
  // https://github.com/sergiodxa/remix-auth/issues/263
  const formData = await request.clone().formData();
  const formPayload = Object.fromEntries(formData);

  const registerSchema = z
    .object({
      username: z.string().trim().min(MIN_USERNAME_LENGTH),
      email: z.string().trim().email(),
      password: z.string().trim().min(MIN_PASSWORD_LENGTH),
      confirmPassword: z.string().trim().min(MIN_PASSWORD_LENGTH),
      [HCAPTCHA_RESPONSE]: z.string().trim().min(1),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    });

  try {
    const parsedPayload = registerSchema.parse(formPayload);

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

      return createUserSession(user, VERIFY_EMAIL_PATH);
    }

    return json(
      { message: "Captcha not verified" },
      { status: HTTPStatus.BAD_REQUEST }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json(
        { message: "Parameters validation error", error },
        { status: HTTPStatus.BAD_REQUEST }
      );
    }

    return json(
      { message: "Internal server error" },
      { status: HTTPStatus.INTERNAL_SERVER_ERROR }
    );
  }
};

export default function Register() {
  const { ENV } = useLoaderData<EnvLoaderData>();
  const actionData = useActionData<ResponseActionData>();

  return (
    <>
      <AuthForm
        mode="register"
        hcaptchaSiteKey={ENV.HCAPTCHA_SITEKEY}
        actionData={actionData}
      ></AuthForm>
    </>
  );
}
