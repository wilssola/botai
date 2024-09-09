import { FaCheck } from "react-icons/fa";
import { PRICING_PATH, REGISTER_PATH } from "~/routes";
import Header from "~/components/Header";
import { Link } from "@remix-run/react";
import Footer from "~/components/Footer";
import { ReactElement } from "react";
import { defaultMeta } from "~/utils/default-meta";

// Features included in the free plan
const freePlanFeatures = [
  "Até 5 clientes por dia",
  "Integração com WhatsApp",
  "Inteligência Artificial",
  "Relatórios de atendimento",
];

export const meta = () => defaultMeta("Preços", PRICING_PATH);

/**
 * Component for the pricing page.
 *
 * @returns {ReactElement} The pricing page component.
 */
export default function Pricing(): ReactElement {
  return (
    <>
      {/* Header component */}
      <Header />
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl sm:text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Preços
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Oferecemos preços justos, sem fidelidade e taxas ocultas.
              <p className="text-sm">Cancele quando quiser.</p>
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl rounded-3xl shadow-md sm:mt-20 lg:mx-0 lg:flex lg:max-w-none">
            <div className="p-8 sm:p-10 lg:flex-auto">
              <h3 className="text-2xl font-bold tracking-tight text-gray-900">
                Plano Gratuito
              </h3>
              <p className="mt-6 text-base leading-7 text-gray-600">
                Aproveite os recursos gratuitos para sempre.
              </p>
              <div className="mt-10 flex items-center gap-x-4">
                <h4 className="flex-none text-sm font-semibold leading-6 text-blue-600">
                  Recursos incluídos
                </h4>
                <div className="h-px flex-auto bg-gray-100" />
              </div>
              <ul className="mt-8 grid grid-cols-1 gap-4 text-sm leading-6 text-gray-600 sm:grid-cols-2 sm:gap-6">
                {freePlanFeatures.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <FaCheck
                      aria-hidden="true"
                      className="h-6 w-5 flex-none text-blue-600"
                    />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <div className="-mt-2 p-2 lg:mt-0 lg:w-full lg:max-w-md lg:flex-shrink-0">
              <div className="rounded-2xl bg-gray-50 py-10 text-center shadow-md lg:flex lg:flex-col lg:justify-center lg:py-16">
                <div className="mx-auto max-w-xs px-8">
                  <p className="text-base font-semibold text-gray-600">
                    Comece a usar agora
                  </p>
                  <p className="mt-6 flex items-baseline justify-center gap-x-2">
                    <span className="text-5xl font-bold tracking-tight text-gray-900">
                      R$0
                    </span>
                    <span className="text-sm font-semibold leading-6 tracking-wide text-gray-600">
                      BRL
                    </span>
                  </p>
                  <Link
                    to={REGISTER_PATH}
                    className="mt-10 block w-full rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    Cadastrar
                  </Link>
                  <p className="mt-6 text-xs leading-5 text-gray-600">
                    Não é necessário cartão de crédito
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Footer component */}
      <Footer />
    </>
  );
}
