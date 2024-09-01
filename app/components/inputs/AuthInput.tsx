import { Link } from "@remix-run/react";
import {
  HTMLInputAutoCompleteAttribute,
  HTMLInputTypeAttribute,
  ReactElement,
} from "react";

type AuthInputProps = {
  id: string;
  name: string;
  type: HTMLInputTypeAttribute;
  label?: string;
  placeholder?: string;
  linkPath?: string | null;
  linkText?: string | null;
  autoComplete?: HTMLInputAutoCompleteAttribute;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
};

export default function AuthInput(
  props: AuthInputProps
): ReactElement<AuthInputProps> {
  return (
    <div className="mt-2 mb-2">
      <div className="flex items-center justify-between">
        <label
          htmlFor={props.id}
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          {props.label}
        </label>
        {props.linkPath && props.linkText && (
          <Link
            to={props.linkPath}
            className="text-sm font-semibold text-blue-600 hover:text-blue-500"
          >
            {props.linkText}
          </Link>
        )}
      </div>
      <label htmlFor={props.id} className="sr-only">
        {props.label}
      </label>
      <input
        id={props.id}
        name={props.name}
        type={props.type}
        placeholder={props.placeholder}
        autoComplete={props.autoComplete}
        required={props.required}
        minLength={props.minLength}
        maxLength={props.maxLength}
        className="block w-full rounded-md border-0 p-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
      />
    </div>
  );
}
