import {
  ActionFunction,
  LoaderFunction,
  MetaFunction,
  redirect,
} from "@remix-run/node";
import { getUserSession } from "~/services/auth.server";
import { HTTPStatus } from "~/enums/http-status";
import { DASHBOARD_PATH, LOGIN_PATH, VERIFY_EMAIL_PATH } from "~/routes";
import {
  createUserEmailCodeById,
  getUserEmailAuthById,
  UpdateUserEmailAuthCodeById,
  UpdateUserEmailAuthVerifiedById,
} from "~/models/user.server";
import { defaultMeta } from "~/utils/default-meta";
import MailAuthForm from "~/components/forms/MailAuthForm";
import { json, useActionData } from "@remix-run/react";
import { ResponseActionData } from "~/types/response-action-data";
import { z } from "zod";
import { MAX_EMAIL_CODE_TIME } from "~/constants/validation";

export const meta: MetaFunction = () =>
  defaultMeta("Verificar Email", VERIFY_EMAIL_PATH);

export const loader: LoaderFunction = async ({ request }) => {
  const user = await getUserSession(request);
  if (!user) {
    return redirect(LOGIN_PATH, HTTPStatus.UNAUTHORIZED);
  }

  let emailCode = await getUserEmailAuthById(user.id);
  if (!emailCode) {
    emailCode = await createUserEmailCodeById(user.id);
  }

  if (!emailCode) {
    return redirect(LOGIN_PATH, HTTPStatus.UNAUTHORIZED);
  }

  if (emailCode.verified) {
    return redirect(DASHBOARD_PATH, HTTPStatus.OK);
  }

  if (emailCode.updatedAt.getTime() + MAX_EMAIL_CODE_TIME < Date.now()) {
    await UpdateUserEmailAuthCodeById(user.id);
  }

  return null;
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.clone().formData();
  const formPayload = Object.fromEntries(formData);

  const verifyEmailSchema = z.object({
    code: z.string().trim().min(1),
  });

  try {
    const parsedPayload = verifyEmailSchema.parse(formPayload);

    const user = await getUserSession(request);
    if (!user) {
      return redirect(LOGIN_PATH, HTTPStatus.UNAUTHORIZED);
    }

    const mailAuth = await getUserEmailAuthById(user.id);
    if (!mailAuth) {
      return redirect(LOGIN_PATH, HTTPStatus.UNAUTHORIZED);
    }

    if (mailAuth.code !== parsedPayload.code) {
      return json(
        { message: "Código inválido" },
        { status: HTTPStatus.UNAUTHORIZED }
      );
    }

    await UpdateUserEmailAuthVerifiedById(user.id, true);
    return redirect(DASHBOARD_PATH);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json(
        { message: "Erro de validação" },
        { status: HTTPStatus.BAD_REQUEST }
      );
    }

    return json(
      { message: "Erro interno" },
      { status: HTTPStatus.INTERNAL_SERVER_ERROR }
    );
  }
};

export default function VerifyEmail() {
  const actionData = useActionData<ResponseActionData>();

  return (
    <>
      <MailAuthForm actionData={actionData}></MailAuthForm>
    </>
  );
}
