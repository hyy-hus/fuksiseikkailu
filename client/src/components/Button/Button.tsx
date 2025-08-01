import { MouseEventHandler, ReactNode } from "react";

import { cva } from "class-variance-authority";

const button = cva(
    "px-4 py-2 rounded font-medium disabled:opacity-50",
    {
        variants: {
            variant: {
                blue: "bg-blue-400 hover:bg-blue-500 disabled:hover:bg-blue-400 text-blue-50",
                red: "bg-red-400 hover:bg-red-500 disabled:hover:bg-red-400 text-red-50",
                green: "bg-green-500 hover:bg-green-600 disabled:hover:gb-green-500 text-green-50",
            },
        },
        defaultVariants: {
            variant: "blue",
        }
    }
)

interface ButtonProps {
    type?: "button" | "submit";
    variant?: "blue" | "red" | "green";
    disabled?: boolean;
    children?: ReactNode;
    className?: string;
    name?: string;
    onClick?: MouseEventHandler<HTMLButtonElement>
}

export function Button({
    type = "button",
    variant = "blue",
    disabled = false,
    children,
    className,
    name,
    onClick
}: ButtonProps) {
    return (
        <button
            name={name ?? ""}
            className={button({ variant, className })}
            type={type}
            disabled={disabled}
            onClick={onClick}
        >
            {children}
        </button>
    )
}
