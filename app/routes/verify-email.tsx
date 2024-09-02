import {ActionFunction, LoaderFunction, MetaFunction, redirect,} from "@remix-run/node";
import {getUserSession} from "~/services/auth.server";
import {HTTPStatus} from "~/enums/http-status";
import {DASHBOARD_PATH, LOGIN_PATH, VERIFY_EMAIL_PATH} from "~/routes";
import {
  createUserMailAuthCodeById,
  getUserMailAuthById,
  updateUserEmailAuthVerifiedById,
  updateUserMailAuthCodeById,
} from "~/models/user.server";
import {defaultMeta} from "~/utils/default-meta";
import MailAuthForm from "~/components/forms/MailAuthForm";
import {json, useActionData} from "@remix-run/react";
import {ResponseActionData} from "~/types/response-action-data";
import {z} from "zod";
import {APP_NAME, MAX_EMAIL_CODE_TIME} from "~/constants";
import {sendMail} from "~/services/mailer.server";

/**
 * Meta function to set the default meta tags for the verify email page.
 * @returns The meta tags for the verify email page.
 */
export const meta: MetaFunction = () =>
  defaultMeta("Verificar Email", VERIFY_EMAIL_PATH);

/**
 * Loader function to handle the initial data fetching for the verify email page.
 * @param param0 - The request object.
 * @param param0.request - The request object.
 * @returns The response object or null.
 */
export const loader: LoaderFunction = async ({ request }) => {
  const user = await getUserSession(request);
  if (!user) {
    return redirect(LOGIN_PATH, HTTPStatus.UNAUTHORIZED);
  }

  let mailAuth = await getUserMailAuthById(user.id);
  if (!mailAuth) {
    mailAuth = await createUserMailAuthCodeById(user.id);
  }

  if (mailAuth!.verified) {
    return redirect(DASHBOARD_PATH, HTTPStatus.OK);
  }

  if (mailAuth!.updatedAt.getTime() + MAX_EMAIL_CODE_TIME < Date.now()) {
    mailAuth = await updateUserMailAuthCodeById(user.id);

    await sendMail(
      user.email,
      `${APP_NAME} | Código de verificação`,
      `Seu código de verificação é: ${mailAuth!.code}`,
      `Seu código de verificação é: <strong>${mailAuth!.code}</strong>`
    );
  }

  return null;
};

/**
 * Action function to handle the form submission for verifying the email.
 * @param param0 - The request object.
 * @param param0.request - The request object.
 * @returns The response object.
 */
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

    const mailAuth = await getUserMailAuthById(user.id);
    if (!mailAuth) {
      return redirect(LOGIN_PATH, HTTPStatus.UNAUTHORIZED);
    }

    if (mailAuth.code !== parsedPayload.code) {
      return json(
        { message: "Código inválido" },
        { status: HTTPStatus.UNAUTHORIZED }
      );
    }

    await updateUserEmailAuthVerifiedById(user.id, true);
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

/**
 * Component to render the verify email page.
 * @returns The verify email page component.
 */
export default function VerifyEmail() {
  const actionData = useActionData<ResponseActionData>();

  return (
    <>
      <MailAuthForm actionData={actionData}></MailAuthForm>
    </>
  );
}
