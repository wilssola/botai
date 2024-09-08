import { Link } from "@remix-run/react";
import { APP_NAME } from "~/constants";
// @ts-ignore
import { AnimatedBackground } from "animated-backgrounds";

export default function Hero() {
  return (
    <div className="relative px-6 pt-14 lg:px-8">
      <AnimatedBackground animationName="particleNetwork" />

      <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
        <div className="mb-8 flex justify-center">
          <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-white ring-1 ring-gray-100/10 hover:ring-gray-50/20">
            Novos planos gratuitos!
            <Link to="/pricing" className="ml-2 font-semibold text-blue-300">
              <span aria-hidden="true" className="absolute inset-0" />
              Saiba mais <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl uppercase">
            Aumente o alcance do seu negócio 📈
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-300">
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
              className="text-sm font-semibold leading-6 text-white"
            >
              Logar <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
