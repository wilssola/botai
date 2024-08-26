import type { ActionFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { json, useActionData, useLoaderData } from "@remix-run/react";
import { getClientIPAddress } from "remix-utils/get-client-ip-address";
import { z as zod } from "zod";
import AuthForm from "~/components/forms/AuthForm";
import { HCAPTCHA_RESPONSE, MIN_PASSWORD_LENGTH } from "~/consts";
import { HTTPStatus } from "~/enums/http-status";
import { verifyHCaptcha } from "~/models/captcha.server";
import { DASHBOARD_PATH } from "~/routes";
import { RequestError } from "~/types/error";
import envLoader, { EnvLoaderData } from "~/utils/env-loader";

export { envLoader as loader };

export const action: ActionFunction = async ({ request }) => {
  const formPayload = Object.fromEntries(await request.formData());
  console.log(formPayload);

  const loginSchema = zod.object({
    email: zod.string().trim().email(),
    password: zod.string().trim().min(MIN_PASSWORD_LENGTH),
    [HCAPTCHA_RESPONSE]: zod.string().trim().min(1),
  });

  try {
    const parsedPayload = loginSchema.parse(formPayload);
    console.log(parsedPayload);

    if (
      await verifyHCaptcha(
        parsedPayload[HCAPTCHA_RESPONSE],
        getClientIPAddress(request)
      )
    ) {
      return redirect(DASHBOARD_PATH);
    } else {
      return json(
        { message: "Invalid hCaptcha response" },
        { status: HTTPStatus.BAD_REQUEST }
      );
    }
  } catch (error) {
    return json(
      { message: (error as RequestError).message },
      { status: HTTPStatus.BAD_REQUEST }
    );
  }
};

export default function Login() {
  const { ENV } = useLoaderData<EnvLoaderData>() as EnvLoaderData;
  const actionData = useActionData<RequestError>() as RequestError;

  return (
    <AuthForm
      mode="login"
      hcaptchaSiteKey={ENV.HCAPTCHA_SITEKEY}
      actionData={actionData}
    ></AuthForm>
  );
}
