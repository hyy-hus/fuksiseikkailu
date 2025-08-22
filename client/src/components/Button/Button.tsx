import { MouseEventHandler, ReactNode } from "react";

import clsx from "clsx";

type variant_name = "blue" | "red" | "green" | "gray" | "fuksi" | "transparent";

function get_variant(variant: variant_name) {
    const common = clsx("flex items-center justify-center gap-2",
        "border-2 border black px-2 py-1 md:py-2 font-medium",
        "transition-all duration-200"
    );

    if (variant == "transparent") {
        return clsx(common, "px-2 py-1 md:py-2 font-medium text-black bg-transparent cursor-pointer border-none");
    }

    return clsx(
        common,
        "shadow-[4px_4px_black]",
        "hover:shadow-[2px_2px_black] hover:translate-y-[2px]",
        "active:shadow-[0px_0px_black] active:translate-y-[4px]",
        variant == "blue" && "bg-blue-400",
        variant == "red" && "bg-rose-400",
        variant == "green" && "bg-emerald-400",
        variant == "gray" && "bg-white",
        variant == "fuksi" && "bg-fuksi",
    );
} 

interface ButtonProps {
    type?: "button" | "submit";
    variant?: variant_name;
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
            className={clsx(get_variant(variant), className)}
            type={type}
            disabled={disabled}
            onClick={onClick}
        >
            {children}
        </button>
    )
}
