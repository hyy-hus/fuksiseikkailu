import { MouseEventHandler, ReactNode } from "react";

import { cva } from "class-variance-authority";
import clsx from "clsx";

const button = cva(
    "px-2 py-1 md:px-4 md:py-2 border-2 border-black font-medium disabled:opacity-50 cursor-pointer disabled:cursor-default inline-flex gap-2 items-center justify-center transition-all duration-200 ease-in-out active:scale-95 select-none shadow-[4px_4px_black]",
    {
        variants: {
            variant: {
                blue: "bg-white hover:bg-blue-500 disabled:hover:bg-blue-400 text-black dark:bg-slate-800 dark:hover:bg-slate-700 dark:disabled:hover:bg-slate-800 dark:text-slate-300",
                red: "bg-rose-100 border-black hover:bg-rose-500 hover:border-rose-900 disabled:hover:bg-rose-400 text-black dark:bg-pink-900 dark:hover:bg-pink-800 dark:disabled:hover:bg-pink-900 dark:text-pink-200",
                green: "bg-emerald-100 hover:bg-emerald-600 disabled:hover:bg-emerald-500 text-black dark:bg-emerald-900 dark:hover:bg-emerald-800 dark:disabled:hover:bg-emerald-900 dark:text-emerald-200",
                gray: "bg-gray-400 hover:bg-gray-500 disabled:hover:bg-gray-500 text-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 dark:disabled:hover:bg-gray-800 dark:text-gray-200",
                transparent: "bg-transparent text-zinc-900 border-none hover:bg-gray-400/20 disabled:hover:bg-transparent text-gray-50 dark:bg-transparent dark:hover:bg-slate-600/20 dark:disabled:hover:bg-transparent dark:text-gray-200",
            },
        },
        defaultVariants: {
            variant: "blue",
        }
    }
)

type variant_name = "blue" | "red" | "green" | "gray" | "transparent";

function get_variant(variant: variant_name) {
    return clsx(
        "border-2 border-black px-2 py-1 md:py-2 font-medium",
        "transition-all duration-200",
        "shadow-[4px_4px_black]",
        "hover:shadow-[2px_2px_black] hover:translate-y-[2px]",
        "active:shadow-[0px_0px_black] active:translate-y-[4px]",
        variant == "blue" && "bg-blue-200",
        variant == "red" && "bg-rose-200",
        variant == "green" && "bg-emerald-200",
        variant == "gray" && "bg-white",
        variant == "transparent" && "bg-transparent",
         
    );
} 

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
            className={get_variant(variant)}
            type={type}
            disabled={disabled}
            onClick={onClick}
        >
            {children}
        </button>
    )
}
