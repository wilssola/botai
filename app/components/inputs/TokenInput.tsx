import { ReactElement, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

type TokenInputProps = {
  value: string;
  className?: string;
  buttonClassName?: string;
};

/**
 * TokenInput component for displaying a token with a toggleable visibility.
 *
 * @param {TokenInputProps} props - The properties for the TokenInput component.
 * @returns {ReactElement} The rendered TokenInput component.
 */
export default function TokenInput(props: TokenInputProps): ReactElement {
  // State to manage the visibility of the token
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="flex items-center justify-between">
      {/* Input field to display the token */}
      <input
        className={`block w-full rounded-md p-2 text-gray-900 shadow-sm ${props.className}`}
        type={isVisible ? "text" : "password"} // Toggle between text and password type
        value={props.value}
        readOnly
      />
      {/* Button to toggle the visibility of the token */}
      <button
        className={`ml-2 block p-3 rounded-md text-white shadow-sm ${props.buttonClassName}`}
        onClick={() => setIsVisible(!isVisible)}
      >
        {isVisible ? <FaEye /> : <FaEyeSlash />}{" "}
        {/* Icon changes based on visibility */}
      </button>
    </div>
  );
}
