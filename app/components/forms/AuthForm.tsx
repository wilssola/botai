import HCaptcha from "@hcaptcha/react-hcaptcha";
import { Form, Link } from "@remix-run/react";
import {
  MIN_PASSWORD_LENGTH,
  MIN_USERNAME_LENGTH,
} from "~/constants/validation";
import { FORGOT_PASSWORD_PATH, LOGIN_PATH, REGISTER_PATH } from "~/routes";
import { ResponseActionData } from "~/types/response-action-data";
import AuthInput from "~/components/inputs/AuthInput";
import Logo from "~/components/Logo";
import { ReactElement } from "react";

type AuthFormProps = {
  mode: "login" | "register" | "forgot-password";
  hCaptchaSiteKey?: string;
  actionData?: ResponseActionData;
};

/**
 * AuthForm component for handling user authentication.
 *
 * @param {AuthFormProps} props - The properties for the AuthForm component.
 * @returns {ReactElement} The rendered AuthForm component.
 */
export default function AuthForm(props: AuthFormProps): ReactElement {
  return (
    <div className="flex w-screen h-screen items-center justify-center px-6 py-12 lg:px-8 bg-gradient-to-r from-blue-200 to-blue-300">
      <div className="bg-white shadow-lg rounded-lg p-8 flex flex-col items-center space-y-6">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-auto flex items-center">
            <Logo />
          </div>
          <h2 className="text-2xl font-semibold leading-9 tracking-tight text-gray-900 flex items-center">
            {props.mode === "login"
              ? "Acesse sua conta" // Display text for login mode
              : props.mode === "register"
              ? "Crie sua conta" // Display text for register mode
              : "Recupere sua senha"}{" "}
            // Display text for forgot-password mode
          </h2>
        </div>

        <Form className="space-y-6 w-full" method="POST">
          <div className="flex flex-col space-y-4">
            {props.mode === "register" && (
              <AuthInput
                id="username"
                name="username"
                type="text"
                label="Usuário"
                placeholder="Digite seu usuário"
                required={true}
                minLength={MIN_USERNAME_LENGTH}
              />
            )}

            <AuthInput
              id="email"
              name="email"
              type="email"
              label="Email"
              placeholder="Digite seu email"
              required={true}
            />

            {props.mode !== "forgot-password" && (
              <AuthInput
                id="password"
                name="password"
                type="password"
                label="Senha"
                linkPath={props.mode === "login" ? FORGOT_PASSWORD_PATH : null}
                linkText={props.mode === "login" ? "Esqueceu sua senha?" : null}
                placeholder="Digite sua senha"
                required={true}
                minLength={MIN_PASSWORD_LENGTH}
              />
            )}

            {props.mode === "register" && (
              <AuthInput
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirme sua senha"
                required={true}
                minLength={MIN_PASSWORD_LENGTH}
              />
            )}
          </div>

          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              {props.mode === "login"
                ? "Logar" // Button text for login mode
                : props.mode === "register"
                ? "Cadastrar" // Button text for register mode
                : "Recuperar"}{" "}
              // Button text for forgot-password mode
            </button>

            {props.hCaptchaSiteKey && (
              <div className="flex items-center justify-center mt-5">
                <HCaptcha sitekey={props.hCaptchaSiteKey} />
              </div>
            )}
          </div>

          {props.actionData?.message && (
            <p className="text-center text-red-500 text-sm">
              {props.actionData.message}
            </p>
          )}
        </Form>

        <p className="text-center text-sm text-gray-500">
          {props.mode === "login"
            ? "Não tem uma conta?" // Text for login mode
            : props.mode === "register"
            ? "Já tem uma conta?" // Text for register mode
            : "Lembrou sua senha?"}{" "}
          // Text for forgot-password mode
          <Link
            to={
              props.mode === "register" || props.mode === "forgot-password"
                ? LOGIN_PATH
                : REGISTER_PATH
            }
            className="ml-2 font-semibold leading-6 text-blue-500 hover:text-blue-600"
          >
            {props.mode === "register" || props.mode === "forgot-password"
              ? "Logar" // Link text for register or forgot-password mode
              : "Cadastrar"}{" "}
            // Link text for login mode
          </Link>
        </p>
      </div>
    </div>
  );
}
