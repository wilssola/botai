import { Form } from "@remix-run/react";
import { ResponseActionData } from "~/types/response-action-data";
import AuthInput from "../inputs/AuthInput";
import Logo from "../Logo";

type MailAuthFormProps = {
  actionData?: ResponseActionData;
};

export default function MailAuthForm(props: MailAuthFormProps) {
  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="mx-auto h-10 w-auto flex justify-center items-center">
          <Logo />
        </div>
        <h2 className="mt-10 text-center text-2xl font-semibold leading-9 tracking-tight text-gray-900">
          "Verifique seu email"
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <Form className="space-y-6" method="POST">
          <div>
            <AuthInput
              id="code"
              name="code"
              type="code"
              label="Código"
              placeholder="Digite seu código"
              required={true}
            ></AuthInput>
          </div>

          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              "Verificar"
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
