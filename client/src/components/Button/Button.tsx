import { MouseEventHandler, ReactNode } from "react";

interface ButtonProps {
    type?: "button" | "submit";
    disabled?: boolean;
    children?: ReactNode;
    className?: string;
    name?: string;
    onClick?: MouseEventHandler<HTMLButtonElement>
}

export function Button({
    type = "button",
    disabled = false,
    children,
    className,
    name,
    onClick
}: ButtonProps) {
    return (
        <button
            name={name ?? ""}
            className={`${className ?? ""} bg-blue-400 text-white-200 px-4 py-2 rounded hover:bg-blue-500`}
            type={type}
            disabled={disabled}
            onClick={onClick}
        >
            {children}
        </button>
    )
}
