import { MouseEventHandler, ReactNode } from "react";

import { cva } from "class-variance-authority";

const button = cva(
    "px-4 py-2 rounded font-medium disabled:opacity-50 cursor-pointer disabled:cursor-default",
    {
        variants: {
            variant: {
                blue: "bg-blue-400 hover:bg-blue-500 disabled:hover:bg-blue-400 text-blue-50 dark:bg-slate-800 dark:hover:bg-slate-700 dark:disabled:hover:bg-slate-800 dark:text-slate-300",
                red: "bg-rose-400 hover:bg-rose-500 disabled:hover:bg-rose-400 text-rose-50 dark:bg-pink-900 dark:hover:bg-pink-800 dark:disabled:hover:bg-pink-900 dark:text-pink-200",
                green: "bg-emerald-500 hover:bg-emerald-600 disabled:hover:bg-emerald-500 text-emerald-50 dark:bg-emerald-900 dark:hover:bg-emerald-800 dark:disabled:hover:bg-emerald-900 dark:text-emerald-200",
                gray: "bg-gray-400 hover:bg-gray-500 disabled:hover:bg-gray-500 text-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 dark:disabled:hover:bg-gray-800 dark:text-gray-200",
                transparent: "bg-transparent text-zinc-900 hover:bg-gray-400/20 disabled:hover:bg-transparent text-gray-50 dark:bg-transparent dark:hover:bg-slate-600/20 dark:disabled:hover:bg-transparent dark:text-gray-200",
            },
        },
        defaultVariants: {
            variant: "blue",
        }
    }
)

interface ButtonProps {
    type?: "button" | "submit";
    variant?: "blue" | "red" | "green" | "gray" | "transparent";
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
