import { Form } from "@remix-run/react";
import { ResponseActionData } from "~/types/response-action-data";
import AuthInput from "../inputs/AuthInput";
import Logo from "../Logo";
import React from "react";

type MailAuthFormProps = {
  actionData?: ResponseActionData;
};

/**
 * MailAuthForm component for handling email verification.
 *
 * @param {MailAuthFormProps} props - The properties for the MailAuthForm component.
 * @returns {React.ReactElement} The rendered MailAuthForm component.
 */
export default function MailAuthForm(
  props: MailAuthFormProps
): React.ReactElement {
  return (
    <div className="flex w-screen h-screen items-center justify-center px-6 py-12 lg:px-8 bg-gradient-to-r from-blue-400 to-blue-900">
      <div className="bg-white shadow-lg rounded-lg p-8 flex flex-col items-center space-y-6">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-auto flex items-center">
            <Logo />
          </div>
          <h2 className="text-2xl font-semibold leading-9 tracking-tight text-gray-900 flex items-center">
            Verifique seu email
          </h2>
        </div>

        <Form className="space-y-6 w-full" method="POST">
          <div className="flex flex-col space-y-4">
            <AuthInput
              id="code"
              name="code"
              type="code"
              label="Código"
              placeholder="Digite seu código"
              required
            />
          </div>

          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-blue-500 hover:bg-blue-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Verificar
            </button>
          </div>

          {props.actionData?.message && (
            <p className="text-center text-red-500 text-sm">
              {props.actionData.message}
            </p>
          )}
        </Form>
      </div>
    </div>
  );
}
