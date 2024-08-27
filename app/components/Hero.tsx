import { Link } from "@remix-run/react";
import { APP_NAME } from "~/constants";

export default function Hero() {
  return (
    <div className="relative px-6 pt-14 lg:px-8">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 -top-40 -z-10 transform-gpu blur-3xl sm:-top-80"
      >
        <div
          style={{
            clipPath:
              "polygon(85% 50%, 100% 65%, 97.5% 25%, 85% 0.5%, 80% 5%, 72.5% 32.5%, 60% 62.5%, 52.5% 67.5%, 47.5% 57.5%, 45% 35%, 27.5% 75%, 0.75% 65%, 17.5% 100%, 27.5% 75%, 75% 97.5%, 75% 45%)",
          }}
          className="relative left-[calc(50%-10rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff3562] to-[#693668] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
        />
      </div>

      <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
        <div className="mb-8 flex justify-center">
          <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-gray-600 ring-1 ring-gray-900/10 hover:ring-gray-900/20">
            Novos planos gratuitos!
            <Link to="/pricing" className="ml-2 font-semibold text-blue-600">
              <span aria-hidden="true" className="absolute inset-0" />
              Saiba mais <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl uppercase">
            Aumente o alcance do seu negócio 📈
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Crie uma conta e comece a usar o {APP_NAME}.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              to="/register"
              className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Cadastrar
            </Link>
            <Link
              to="/login"
              className="text-sm font-semibold leading-6 text-gray-900"
            >
              Logar <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
