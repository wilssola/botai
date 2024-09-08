const testimonials = [
  {
    name: "João Silva",
    feedback: "Essa plataforma mudou a forma como gerencio meu negócio.",
  },
  {
    name: "Maria Oliveira",
    feedback: "Excelente suporte e funcionalidades incríveis!",
  },
];

export default function Testimonials() {
  return (
    <div className="bg-gray-50 py-24 sm:py-32 lg:py-40">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="sm:text-center">
          <h2 className="text-lg font-semibold leading-8 text-blue-600">
            Depoimentos
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            O que nossos clientes dizem
          </p>
        </div>
        <div className="mt-20 max-w-lg sm:mx-auto md:max-w-none">
          <div className="grid grid-cols-1 gap-y-16 md:grid-cols-2 md:gap-x-8">
            {testimonials.map((testimonial) => (
              <div key={testimonial.name} className="relative">
                <blockquote className="text-lg font-medium leading-6 text-gray-900 italic">
                  <p>{testimonial.feedback}</p>
                </blockquote>
                <footer className="mt-4">
                  <p className="text-base font-semibold text-gray-700 font-light italic">
                    - {testimonial.name}
                  </p>
                </footer>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
