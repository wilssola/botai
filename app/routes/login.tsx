import type {ActionFunction, LoaderFunction, MetaFunction,} from "@remix-run/node";
import {json, useActionData, useLoaderData} from "@remix-run/react";
import {getClientIPAddress} from "remix-utils/get-client-ip-address";
import {z, ZodError} from "zod";
import AuthForm from "~/components/forms/AuthForm";
import {MIN_PASSWORD_LENGTH} from "~/constants/validation";
import {HCAPTCHA_RESPONSE} from "~/constants/params";
import {HTTPStatus} from "~/enums/http-status";
import {verifyHCaptcha} from "~/models/captcha.server";
import {DASHBOARD_PATH, LOGIN_PATH} from "~/routes";
import {AuthStrategies} from "~/services/auth";
import {auth} from "~/services/auth.server";
import {createUserSession} from "~/services/session.server";
import {ResponseActionData} from "~/types/response-action-data";
import {envLoader, EnvLoaderData} from "~/utils/env-loader.server";
import sessionLoader from "~/utils/session-loader.server";
import {defaultMeta} from "~/utils/default-meta";
import {ReactElement} from "react";

/**
 * Generates meta tags for the login page.
 *
 * @returns Meta tags for the login page.
 */
export const meta: MetaFunction = () => defaultMeta("Login", LOGIN_PATH);

/**
 * Loader function for the login page.
 *
 * @param {Object} context - The context object containing the request.
 * @param {Request} context.request - The request object.
 * @returns {Promise<EnvLoaderData>} The environment loader data.
 */
export const loader: LoaderFunction = async ({ request }) => {
  // Redirect to dashboard if the user is already authenticated
  await sessionLoader(request, { successRedirect: DASHBOARD_PATH });
  return await envLoader();
};

/**
 * Action function to handle login form submission.
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
  const loginSchema = z.object({
    email: z.string().trim().email(),
    password: z.string().trim().min(MIN_PASSWORD_LENGTH),
    [HCAPTCHA_RESPONSE]: z.string().trim().min(1),
  });

  try {
    // Parse and validate the form payload
    const parsedPayload = loginSchema.parse(formPayload);

    // Verify the hCaptcha response
    const hCaptcha = await verifyHCaptcha(
      parsedPayload[HCAPTCHA_RESPONSE],
      getClientIPAddress(request)
    );

    if (hCaptcha) {
      // Authenticate the user
      const user = await auth.authenticate(AuthStrategies.FORM_LOGIN, request);

      if (!user) {
        return json(
          { message: "Invalid credentials" },
          { status: HTTPStatus.UNAUTHORIZED }
        );
      }

      // Create a user session and redirect to the dashboard
      return createUserSession(user, DASHBOARD_PATH);
    }

    // Return error response if captcha verification fails
    return json(
      { message: "Captcha not verified" },
      { status: HTTPStatus.BAD_REQUEST }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      // Return validation error response
      return json(
        { message: "Parameters validation error", error: error.issues },
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
 * Component for the login page.
 *
 * @returns {ReactElement} The login page component.
 */
export default function Login(): ReactElement {
  // Load environment variables
  const { ENV } = useLoaderData<EnvLoaderData>();
  // Load action data
  const actionData = useActionData<ResponseActionData>();

  return (
    <>
      {/* AuthForm component for login */}
      <AuthForm
        mode="login"
        hCaptchaSiteKey={ENV.HCAPTCHA_SITEKEY}
        actionData={actionData}
      ></AuthForm>
    </>
  );
}
