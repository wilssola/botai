import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

type TokenInputProps = {
  value: string;
  className?: string;
  buttonClassName?: string;
};

export default function TokenInput(props: TokenInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="flex items-center justify-between">
      <input
        className={`block w-full rounded-md border-2 p-2 text-gray-900 shadow-sm ${props.className}`}
        type={isVisible ? "text" : "password"}
        value={props.value}
        readOnly
      />
      <button
        className={`ml-2 block border-2 p-3 rounded-md text-white shadow-sm ${props.buttonClassName}`}
        onClick={() => setIsVisible(!isVisible)}
      >
        {isVisible ? <FaEye /> : <FaEyeSlash />}
      </button>
    </div>
  );
}
