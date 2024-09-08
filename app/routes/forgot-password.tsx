import type {ActionFunction, MetaFunction} from "@remix-run/node";
import {json, useActionData, useLoaderData} from "@remix-run/react";
import {getClientIPAddress} from "remix-utils/get-client-ip-address";
import z from "zod";
import AuthForm from "~/components/forms/AuthForm";
import {HCAPTCHA_RESPONSE} from "~/constants/params";
import {HTTPStatus} from "~/enums/http-status";
import {verifyHCaptcha} from "~/models/captcha.server";
import {FORGOT_PASSWORD_PATH} from "~/routes";
import {ResponseActionData} from "~/types/response-action-data";
import {EnvLoaderData} from "~/utils/env-loader.server";
import {defaultMeta} from "~/utils/default-meta";
import {getUserByEmail} from "~/models/user.server";
import {ReactElement} from "react";

/**
 * Generates meta tags for the forgot password page.
 *
 * @returns Meta tags for the forgot password page.
 */
export const meta: MetaFunction = () =>
  defaultMeta("Esqueci minha Senha", FORGOT_PASSWORD_PATH);

// Reuse the loader from the login route
export { loader } from "~/routes/login";

/**
 * Action function to handle forgot password form submission.
 *
 * @param {Object} context - The context object containing the request.
 * @param {Request} context.request - The request object.
 * @returns {Promise<Response>} The response object.
 */
export const action: ActionFunction = async ({ request }) => {
  // Clone the request and extract form data
  const formData = await request.clone().formData();
  const formPayload = Object.fromEntries(formData);

  // Define the schema for form validation
  const forgotPasswordSchema = z.object({
    email: z.string().trim().email(),
    [HCAPTCHA_RESPONSE]: z.string().trim().min(1),
  });

  try {
    // Parse and validate the form payload
    const parsedPayload = forgotPasswordSchema.parse(formPayload);

    // Verify the hCaptcha response
    const hCaptcha = await verifyHCaptcha(
      parsedPayload[HCAPTCHA_RESPONSE],
      getClientIPAddress(request)
    );

    if (hCaptcha) {
      // Check if the user exists
      const user = await getUserByEmail(parsedPayload.email);
      if (!user) {
        return json(
          { message: "Erro na requisição" },
          { status: HTTPStatus.BAD_REQUEST }
        );
      }

      // Return success response
      return json(
        { message: "Email de recuperação enviado" },
        { status: HTTPStatus.OK }
      );
    }

    // Return error response if captcha verification fails
    return json(
      { message: "Captcha não verificado" },
      { status: HTTPStatus.BAD_REQUEST }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Return validation error response
      return json(
        { message: "Erro de validação dos parâmetros", error },
        { status: HTTPStatus.BAD_REQUEST }
      );
    }

    // Return internal server error response
    return json(
      { message: "Erro interno do servidor" },
      { status: HTTPStatus.INTERNAL_SERVER_ERROR }
    );
  }
};

/**
 * Component for the forgot password page.
 *
 * @returns {ReactElement} The forgot password page component.
 */
export default function ForgotPassword(): ReactElement {
  // Load environment variables
  const { ENV } = useLoaderData<EnvLoaderData>();
  // Load action data
  const actionData = useActionData<ResponseActionData>();

  return (
    <>
      {/* AuthForm component for forgot password */}
      <AuthForm
        mode="forgot-password"
        hCaptchaSiteKey={ENV.HCAPTCHA_SITEKEY}
        actionData={actionData}
      ></AuthForm>
    </>
  );
}
