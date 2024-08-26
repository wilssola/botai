import { RocketLaunchIcon } from "@heroicons/react/20/solid";
import { NavLink } from "@remix-run/react";
import { APP_NAME } from "~/consts";

export default function Logo() {
  return (
    <NavLink to="/" className="flex items-center -m-1.5 p-1.5 text-gray-600">
      <span className="sr-only">{APP_NAME}</span>
      <RocketLaunchIcon aria-hidden="true" className="h-8 w-auto" />
      <span className="ml-3 text-xl font-extrabold uppercase">{APP_NAME}</span>
    </NavLink>
  );
}
