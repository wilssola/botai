import {ActionFunction, LoaderFunction, MetaFunction, redirect,} from "@remix-run/node";
import {getUserSession} from "~/services/auth.server";
import {HTTPStatus} from "~/enums/http-status";
import {DASHBOARD_PATH, LOGIN_PATH, VERIFY_EMAIL_PATH} from "~/routes";
import {createUserMailAuthCodeById, getUserMailAuthById, updateUserEmailAuthVerifiedById,} from "~/models/user.server";
import {defaultMeta} from "~/utils/default-meta";
import MailAuthForm from "~/components/forms/MailAuthForm";
import {json, useActionData} from "@remix-run/react";
import {ResponseActionData} from "~/types/response-action-data";
import {z} from "zod";
import {ServerRuntimeMetaDescriptor} from "@remix-run/server-runtime";
import React from "react";
import {sendMailAuthVerification} from "~/models/mail.server";

/**
 * Meta function to set the default meta tags for the verify email page.
 * @returns {ServerRuntimeMetaDescriptor[]} The meta tags for the verify email page.
 */
export const meta: MetaFunction = (): ServerRuntimeMetaDescriptor[] =>
  defaultMeta("Verifique seu Email", VERIFY_EMAIL_PATH);

/**
 * Loader function to handle the initial data fetching for the verify email page.
 * @param {object} param0 - The request object.
 * @param {Request} param0.request - The request object.
 * @returns {Promise<Response | null>} The response object or null.
 */
export const loader: LoaderFunction = async ({
  request,
}: {
  request: Request;
}): Promise<Response | null> => {
  const user = await getUserSession(request);
  if (!user) {
    return redirect(LOGIN_PATH, HTTPStatus.UNAUTHORIZED);
  }

  let mailAuth = await getUserMailAuthById(user.id);
  if (!mailAuth) {
    mailAuth = await createUserMailAuthCodeById(user.id);
  }

  mailAuth = await sendMailAuthVerification(user, mailAuth);
  if (mailAuth!.verified) {
    return redirect(DASHBOARD_PATH);
  }

  return null;
};

/**
 * Action function to handle the form submission for verifying the email.
 * @param {object} param0 - The request object.
 * @param {Request} param0.request - The request object.
 * @returns {Promise<Response>} The response object.
 */
export const action: ActionFunction = async ({
  request,
}: {
  request: Request;
}): Promise<Response> => {
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
 * @returns {React.ReactElement} The verify email page component.
 */
export default function VerifyEmail(): React.ReactElement {
  const actionData = useActionData<ResponseActionData>();

  return (
    <>
      <MailAuthForm actionData={actionData}></MailAuthForm>
    </>
  );
}
