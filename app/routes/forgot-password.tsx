import type { ActionFunction, MetaFunction } from "@remix-run/node";
import { json, useActionData, useLoaderData } from "@remix-run/react";
import { getClientIPAddress } from "remix-utils/get-client-ip-address";
import z from "zod";
import AuthForm from "~/components/forms/AuthForm";
import { HCAPTCHA_RESPONSE } from "~/constants/params";
import { HTTPStatus } from "~/enums/http-status";
import { verifyHCaptcha } from "~/models/captcha.server";
import { FORGOT_PASSWORD_PATH } from "~/routes";
import { ResponseActionData } from "~/types/response-action-data";
import { EnvLoaderData } from "~/utils/env-loader.server";
import { defaultMeta } from "~/utils/default-meta";
import { getUserByEmail } from "~/models/user.server";

export const meta: MetaFunction = () =>
  defaultMeta("Esqueci minha Senha", FORGOT_PASSWORD_PATH);

export { loader } from "~/routes/login";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.clone().formData();
  const formPayload = Object.fromEntries(formData);

  const forgotPasswordSchema = z.object({
    email: z.string().trim().email(),
    [HCAPTCHA_RESPONSE]: z.string().trim().min(1),
  });

  try {
    const parsedPayload = forgotPasswordSchema.parse(formPayload);

    const hCaptcha = await verifyHCaptcha(
      parsedPayload[HCAPTCHA_RESPONSE],
      getClientIPAddress(request)
    );

    if (hCaptcha) {
      const user = await getUserByEmail(parsedPayload.email);
      if (!user) {
        return json(
          { message: "Erro na requisição" },
          { status: HTTPStatus.BAD_REQUEST }
        );
      }

      return json(
        { message: "Email de recuperação enviado" },
        { status: HTTPStatus.OK }
      );
    }

    return json(
      { message: "Captcha não verificado" },
      { status: HTTPStatus.BAD_REQUEST }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json(
        { message: "Erro de validação dos parâmetros", error },
        { status: HTTPStatus.BAD_REQUEST }
      );
    }

    return json(
      { message: "Erro interno do servidor" },
      { status: HTTPStatus.INTERNAL_SERVER_ERROR }
    );
  }
};

export default function ForgotPassword() {
  const { ENV } = useLoaderData<EnvLoaderData>();
  const actionData = useActionData<ResponseActionData>();

  return (
    <>
      <AuthForm
        mode="forgot-password"
        hCaptchaSiteKey={ENV.HCAPTCHA_SITEKEY}
        actionData={actionData}
      ></AuthForm>
    </>
  );
}
