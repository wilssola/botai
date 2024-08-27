import { MetaFunction } from "@remix-run/node";
import { json, Link } from "@remix-run/react";
import { APP_NAME } from "~/constants";

export const loader = () => {
  return json(null, { status: 404 });
};

export const meta: MetaFunction = () => {
  return [
    { title: `${APP_NAME} | 404` },
    { name: "description", content: `Página não encontrada` },
  ];
};

export default function $() {
  return (
    <>
      <main className="grid min-h-full place-items-center bg-white px-6 py-24 sm:py-32 lg:px-8">
        <div className="text-center">
          <p className="text-base font-semibold text-blue-600">404</p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl uppercase">
            Página não encontrada 😔
          </h1>
          <p className="mt-6 text-base leading-7 text-gray-600">
            Desculpe, parece que não encontramos o que você procurava.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              to="/"
              className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Voltar para a página inicial
            </Link>
            <Link to="/login" className="text-sm font-semibold text-gray-900">
              Logar <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
