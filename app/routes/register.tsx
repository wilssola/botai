import type {ActionFunction, MetaFunction} from "@remix-run/node";
import {json, useActionData, useLoaderData} from "@remix-run/react";
import {getClientIPAddress} from "remix-utils/get-client-ip-address";
import z from "zod";
import AuthForm from "~/components/forms/AuthForm";
import {MIN_PASSWORD_LENGTH, MIN_USERNAME_LENGTH,} from "~/constants/validation";
import {HCAPTCHA_RESPONSE} from "~/constants/params";
import {HTTPStatus} from "~/enums/http-status";
import {verifyHCaptcha} from "~/models/captcha.server";
import {REGISTER_PATH, VERIFY_EMAIL_PATH} from "~/routes";
import {AuthStrategies} from "~/services/auth";
import {auth} from "~/services/auth.server";
import {createUserSession} from "~/services/session.server";
import {ResponseActionData} from "~/types/response-action-data";
import {EnvLoaderData} from "~/utils/env-loader.server";
import {defaultMeta} from "~/utils/default-meta";

/**
 * Generates meta tags for the register page.
 *
 * @returns Meta tags for the register page.
 */
export const meta: MetaFunction = () => defaultMeta("Cadastro", REGISTER_PATH);

// Reuse the loader from the login route
export { loader } from "~/routes/login";

/**
 * Action function to handle register form submission.
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
    // Parse and validate the form payload
    const parsedPayload = registerSchema.parse(formPayload);

    // Verify the hCaptcha response
    const hCaptcha = await verifyHCaptcha(
      parsedPayload[HCAPTCHA_RESPONSE],
      getClientIPAddress(request)
    );

    if (hCaptcha) {
      // Authenticate the user
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

      // Create a user session and redirect to the email verification page
      return createUserSession(user, VERIFY_EMAIL_PATH);
    }

    // Return error response if captcha verification fails
    return json(
      { message: "Captcha not verified" },
      { status: HTTPStatus.BAD_REQUEST }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Return validation error response
      return json(
        { message: "Parameters validation error", error },
        { status: HTTPStatus.BAD_REQUEST }
      );
    }

    // Return internal server error response
    return json(
      { message: "Internal server error" },
      { status: HTTPStatus.INTERNAL_SERVER_ERROR }
    );
  }
};

/**
 * Component for the register page.
 *
 * @returns {JSX.Element} The register page component.
 */
export default function Register(): JSX.Element {
  // Load environment variables
  const { ENV } = useLoaderData<EnvLoaderData>();
  // Load action data
  const actionData = useActionData<ResponseActionData>();

  return (
    <>
      {/* AuthForm component for register */}
      <AuthForm
        mode="register"
        hCaptchaSiteKey={ENV.HCAPTCHA_SITEKEY}
        actionData={actionData}
      ></AuthForm>
    </>
  );
}
