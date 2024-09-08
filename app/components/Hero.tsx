import {Link} from "@remix-run/react";
import {APP_NAME} from "~/constants";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import {AnimatedBackground} from "animated-backgrounds";
import {ReactElement} from "react";

/**
 * Hero component that displays the hero section of the application.
 *
 * @returns {ReactElement} The rendered Hero component.
 */
export default function Hero(): ReactElement {
  return (
    <div className="relative">
      {/* Animated background component */}
      <AnimatedBackground animationName="particleNetwork" />

      <div className="bg-black bg-opacity-50 w-full">
        <div className="max-w-4xl mx-auto py-32 sm:py-48 lg:py-56 ">
          <div className="mb-8 flex justify-center">
            <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-white ring-4 ring-gray-100/10 hover:ring-gray-50/20">
              {/* Promotional message with a link to the pricing page */}
              Novos planos gratuitos!
              <Link to="/pricing" className="ml-2 font-semibold text-blue-300">
                <span aria-hidden="true" className="absolute inset-0" />
                Saiba mais <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>

          <div className="text-center">
            {/* Main heading of the hero section */}
            <h1 className="text-4xl font-bold text-white sm:text-6xl uppercase w-fit">
              Automatize o seu negócio, seja ele de pequeno ou grande porte 📈
            </h1>
            {/* Description of the application */}
            <p className="mt-6 text-lg leading-8 text-gray-300">
              {APP_NAME} é uma solução de chatbot automatizada com IA,
              totalmente customizável e que respeita a privacidade dos seus
              usuários.
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              Crie uma conta agora e comece a usar o {APP_NAME}. É grátis!
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              {/* Link to the registration page */}
              <Link
                to="/register"
                className="rounded-md bg-blue-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Cadastrar
              </Link>
              {/* Link to the login page */}
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
    </div>
  );
}
