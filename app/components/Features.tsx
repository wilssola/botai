import { FaCheckCircle } from "react-icons/fa";

const features = [
  {
    name: "Fácil de usar",
    description: "Nossa plataforma é intuitiva e fácil de usar.",
  },
  {
    name: "Segurança",
    description: "Garantimos a segurança dos seus dados.",
  },
  {
    name: "Suporte",
    description: "Estamos disponíveis para ajudar a qualquer momento.",
  },
];

export default function Features() {
  return (
    <div id="features" className="bg-white py-24 sm:py-32 lg:py-40">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="sm:text-center">
          <h2 className="text-lg font-semibold leading-8 text-blue-600">
            Nossos Recursos
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Tudo o que você precisa em um só lugar
          </p>
        </div>
        <div className="mt-20 max-w-lg sm:mx-auto md:max-w-none">
          <div className="grid grid-cols-1 gap-y-16 md:grid-cols-3 md:gap-x-8">
            {features.map((feature) => (
              <div key={feature.name} className="relative">
                <dt>
                  <FaCheckCircle className="absolute h-6 w-6 text-green-500" />
                  <p className="ml-10 text-lg font-medium leading-6 text-gray-900">
                    {feature.name}
                  </p>
                </dt>
                <dd className="mt-2 ml-10 text-base text-gray-600">
                  {feature.description}
                </dd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
