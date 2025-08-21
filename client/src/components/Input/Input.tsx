import { ChangeEventHandler, ReactNode } from "react";

export type FieldType = "text" | "textarea" | "password" | "email" | "tel" | "url" | "number" | "datetime-local" | "date" | "time" | "search" | "toggle" | "option";

interface InputProps {
    type?: FieldType,
    disabled?: boolean;
    children?: ReactNode;
    className?: string;
    name?: string;
    label?: string;
    value?: string | number;
    placeholder?: string;
    invalid?: boolean;
    errorMessage?: string;
    onChange?: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
}

export function Input({
    type = "text",
    disabled = false,
    invalid = false,
    errorMessage,
    children,
    className,
    name,
    label,
    value,
    placeholder,
    onChange,
}: InputProps) {
    const colors = invalid ? "border-pink-700/30 bg-pink-900/30" : "bg-fuksi-200 dark:bg-fuksi-900 focus-within:bg-fuksi-100 dark:focus-within:bg-fuksi-950 border-black dark:border-fuksi-700 dark:hover:border-fuksi-500 dark:has-[:disabled]:hover:border-slate-700 dark:text-slate-300";

    return (
        <div>
            <label htmlFor={name} className={`group relative flex flex-col border-3 bg-fuksi-200 border-black mt-2 has-[:invalid]:border-pink-700/30 has-[:invalid]:bg-pink-900/30   ${colors} ${className}`}>
                <span className="
                absolute -top-3 left-2 text-xs pointer-events-none px-1 w-fit
                ">
                    <span className="relative z-20 dark:text-slate-400 dark:group-has-[:disabled]:text-slate-600">{label}</span>
                    <div className={`absolute left-0 bottom-[1px] inline h-2 w-10 ${!invalid ? "bg-fuksi-200 dark:bg-fuksi-900 group-focus-within:bg-fuksi-100 dark:group-focus-within:bg-slate-800" : "bg-pink-transparent border-pink-700"} z-10 w-full group-has-[:invalid]:bg-transparent`}></div>
                </span>

                {
                    type === "textarea" ? (
                        <textarea
                            name={name ?? ""}
                            className="w-full text-base outline-none px-3 py-3 bg-transparent disabled:text-slate-500"
                            disabled={disabled}
                            onChange={onChange}
                            placeholder={placeholder}
                            value={value}
                            rows={5}
                        >
                        </textarea>
                    ) : (
                        <input
                            name={name ?? ""}
                            className="w-full text-base outline-none px-3 py-3 bg-transparent disabled:text-slate-500"
                            type={type}
                            disabled={disabled}
                            onChange={onChange}
                            placeholder={placeholder}
                            value={value}
                        >
                            {children}
                        </input>
                    )
                }


            </label>
            {invalid && errorMessage && (
                <div className="mt-1 text-sm text-red-600 dark:text-rose-400/50">
                    {errorMessage}
                </div>
            )}
        </div>
    )
}
