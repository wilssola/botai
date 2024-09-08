import {LoaderFunction, MetaFunction} from "@remix-run/node";
import {json, Link} from "@remix-run/react";
import {APP_NAME} from "~/constants";
import {HTTPStatus} from "~/enums/http-status";
import {ReactElement} from "react";

/**
 * Generates meta tags for the 404 page.
 *
 * @returns Meta tags for the 404 page.
 */
export const meta: MetaFunction = () => {
  return [
    { title: `${APP_NAME} | ${HTTPStatus.NOT_FOUND}` },
    { name: "description", content: `Página não encontrada` },
  ];
};

/**
 * Loader function for the 404 page.
 *
 * @returns {Response} A JSON response with a 404 status.
 */
export const loader: LoaderFunction = () => {
  return json(null, { status: 404 });
};

/**
 * Component for the 404 page.
 *
 * @returns {ReactElement} The 404 page component.
 */
export default function $(): ReactElement {
  return (
    <>
      <main className="grid min-h-full place-items-center bg-gradient-to-r from-blue-200 to-blue-300 px-6 py-24 sm:py-32 lg:px-8 h-screen w-screen">
        <div className="text-center">
          <p className="text-base font-semibold text-blue-600">404</p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl uppercase">
            Página não encontrada 😔
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-700">
            Desculpe, parece que não encontramos o que você procurava.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              to="/"
              className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Voltar para a página inicial
            </Link>
            <Link to="/login" className="text-sm font-semibold">
              Logar <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
