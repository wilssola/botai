import HCaptcha from "@hcaptcha/react-hcaptcha";
import { Form, Link } from "@remix-run/react";
import {
  MIN_PASSWORD_LENGTH,
  MIN_USERNAME_LENGTH,
} from "~/constants/validation";
import { FORGOT_PASSWORD_PATH, LOGIN_PATH, REGISTER_PATH } from "~/routes";
import { ResponseActionData } from "~/types/response-action-data";
import AuthInput from "../inputs/AuthInput";
import Logo from "../Logo";

type AuthFormProps = {
  mode: "login" | "register";
  hcaptchaSiteKey?: string;
  actionData?: ResponseActionData;
};

export default function AuthForm(props: AuthFormProps) {
  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="mx-auto h-10 w-auto flex justify-center items-center">
          <Logo />
        </div>
        <h2 className="mt-10 text-center text-2xl font-semibold leading-9 tracking-tight text-gray-900">
          {props.mode === "login" ? "Acesse sua conta" : "Crie sua conta"}
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <Form className="space-y-6" method="POST">
          <div>
            {props.mode === "register" && (
              <AuthInput
                id="username"
                name="username"
                type="text"
                label="Usuário"
                placeholder="Digite seu usuário"
                required={true}
                minLength={MIN_USERNAME_LENGTH}
              ></AuthInput>
            )}

            <AuthInput
              id="email"
              name="email"
              type="email"
              label="Email"
              placeholder="Digite seu email"
              required={true}
            ></AuthInput>

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
            ></AuthInput>

            {props.mode === "register" && (
              <AuthInput
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirme sua senha"
                required={true}
                minLength={MIN_PASSWORD_LENGTH}
              ></AuthInput>
            )}
          </div>

          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              {props.mode === "login" ? "Logar" : "Cadastrar"}
            </button>

            {props.hcaptchaSiteKey && (
              <div className="flex items-center justify-center mt-5">
                <HCaptcha sitekey={props.hcaptchaSiteKey} />
              </div>
            )}
          </div>

          {props.actionData?.message && (
            <p className="text-center text-red-500 text-sm">
              {props.actionData.message}
            </p>
          )}
        </Form>

        <p className="mt-5 text-center text-sm text-gray-500">
          {props.mode === "login" ? "Não tem uma conta?" : "Já tem uma conta?"}
          <Link
            to={props.mode === "login" ? REGISTER_PATH : LOGIN_PATH}
            className="ml-2 font-semibold leading-6 text-blue-600 hover:text-blue-500"
          >
            {props.mode === "login" ? "Cadastrar" : "Logar"}
          </Link>
        </p>
      </div>
    </div>
  );
}
