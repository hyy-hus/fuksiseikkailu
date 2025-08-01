import { ChangeEventHandler, ReactNode } from "react";

interface InputProps {
    type?: "text" | "password" | "email" | "tel" | "url" | "number";
    disabled?: boolean;
    children?: ReactNode;
    className?: string;
    name?: string;
    label?: string;
    value?: string | number;
    placeholder?: string;
    onChange?: ChangeEventHandler<HTMLInputElement>;
}

export function Input({
    type = "text",
    disabled = false,
    children,
    className,
    name,
    label,
    value,
    placeholder,
    onChange,
}: InputProps) {
    return (
        <label htmlFor={name} className={`group relative flex flex-col bg-zinc-200 focus-within:bg-zinc-300 border border-zinc-400 rounded mt-2 ${className}`}>
            <span className="
                absolute -top-2 left-2 text-xs pointer-events-none px-1 w-fit
                ">
                <span className="relative z-20">{label}</span>
                <div className="absolute left-0 bottom-[1px] inline h-2 w-10 bg-zinc-200 group-focus-within:bg-zinc-300 z-10 w-full"></div>
            </span>
            <input
                name={name ?? ""}
                className="w-full text-sm outline-none px-3 py-3 bg-transparent"
                type={type}
                disabled={disabled}
                onChange={onChange}
                placeholder={placeholder}
                value={value}
            >
                {children}
            </input>
        </label>
    )
}
