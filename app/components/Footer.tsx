import { APP_NAME } from "~/constants";

export default function Footer() {
  return (
    <footer className="bg-black py-12">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <p className="text-white">
            &copy; {new Date().getFullYear()} {APP_NAME}. Todos os direitos
            reservados.
          </p>
          <div className="flex space-x-6">
            <a href="#" className="text-gray-400 hover:text-gray-300">
              Termos de Serviço
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-300">
              Política de Privacidade
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
