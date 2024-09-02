import { FaRobot } from "react-icons/fa";
import { NavLink } from "@remix-run/react";
import { APP_NAME } from "~/constants";
import { HOME_PATH } from "~/routes";

export default function Logo() {
  return (
    <NavLink
      to={HOME_PATH}
      className="flex items-center -m-1.5 p-1.5 text-amber-400"
    >
      <span className="sr-only">{APP_NAME}</span>
      <FaRobot aria-hidden="true" className="h-8 w-auto" />
      <span className="ml-3 text-xl font-bold">{APP_NAME}</span>
    </NavLink>
  );
}
