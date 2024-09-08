import {FaRobot} from "react-icons/fa";
import {NavLink} from "@remix-run/react";
import {APP_NAME} from "~/constants";
import {HOME_PATH} from "~/routes";
import {ReactElement} from "react";

/**
 * Logo component that displays the application logo and name.
 *
 * @returns {ReactElement} The rendered Logo component.
 */
export default function Logo(): ReactElement {
  return (
    <NavLink
      to={HOME_PATH}
      className="flex items-center -m-1.5 p-1.5 text-amber-400"
    >
      {/* Screen reader only text for accessibility */}
      <span className="sr-only">{APP_NAME}</span>
      {/* Robot icon */}
      <FaRobot aria-hidden="true" className="h-8 w-auto" />
      {/* Application name */}
      <span className="ml-3 text-xl font-bold">{APP_NAME}</span>
    </NavLink>
  );
}
