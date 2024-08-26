import { XMarkIcon } from "@heroicons/react/20/solid";
import { Link } from "@remix-run/react";
import { useState } from "react";

export default function Banner() {
  const [open, setOpen] = useState(true);

  if (!open) return null;

  return (
    <div className="relative isolate flex items-center gap-x-6 shadow-md bg-gray-50 px-6 py-2.5 sm:px-3.5 sm:before:flex-1">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="text-sm leading-6 text-gray-900">
          <strong className="font-semibold">
            Esse projeto é para um desafio de vaga na &nbsp;
            <Link
              to="https://gatewayfy.com"
              target="_blank"
              rel="noreferrer"
              className="text-green-500"
            >
              Gatewayfy
            </Link>
          </strong>
          <svg
            viewBox="0 0 2 2"
            aria-hidden="true"
            className="mx-2 inline h-0.5 w-0.5 fill-current"
          >
            <circle r={1} cx={1} cy={1} />
          </svg>
          Acesse o repositório do projeto no GitHub
        </p>
        <Link
          to="https://github.com/wilssola/desafio-gatewayfy"
          className="flex-none rounded-full bg-gray-900 px-3.5 py-1 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
        >
          Acessar <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>

      <div className="flex flex-1 justify-end">
        <button
          onClick={() => setOpen(false)}
          type="button"
          className="-m-3 p-3 focus-visible:outline-offset-[-4px]"
        >
          <span className="sr-only">Fechar</span>
          <XMarkIcon aria-hidden="true" className="h-5 w-5 text-gray-900" />
        </button>
      </div>
    </div>
  );
}
