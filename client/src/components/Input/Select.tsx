import { Option } from "@components/Forms/Form";
import { ChangeEventHandler } from "react";

interface SelectProps {
    disabled?: boolean;
    className?: string;
    name?: string;
    label?: string;
    value?: string | number;
    invalid?: boolean;
    errorMessage?: string;
    options?: Option[];
    onChange?: ChangeEventHandler<HTMLSelectElement>;
}

export function Select({
    disabled = false,
    invalid = false,
    errorMessage,
    options = [],
    className,
    name,
    label,
    value,
    onChange,
}: SelectProps) {
    const colors = invalid ? "border-pink-700/30 bg-pink-900/30" : "bg-white dark:bg-slate-900 focus-within:bg-fuksi-200 dark:focus-within:bg-slate-800 border-2 border-black dark:border-slate-700 dark:hover:border-slate-600 dark:has-[:disabled]:hover:border-slate-700 dark:text-slate-300";

    return (
        <div>
            <label htmlFor={name} className={`group relative flex flex-col border mt-2 has-[:invalid]:border-pink-700/30 has-[:invalid]:bg-pink-900/30   ${colors} ${className}`}>
                <span className="
                absolute -top-2 left-2 text-xs pointer-events-none px-1 w-fit
                ">
                    <span className="relative z-20 dark:text-slate-400 dark:group-has-[:disabled]:text-slate-600">{label}</span>
                    <div className={`absolute left-0 bottom-[2px] inline h-2 w-10 ${!invalid ? "bg-white dark:bg-slate-900 group-focus-within:bg-fuksi-200 dark:group-focus-within:bg-slate-800" : "bg-pink-transparent border-pink-700"} z-10 w-full group-has-[:invalid]:bg-transparent`}></div>
                </span>
                {

                }
                <select
                    name={name ?? ""}
                    className="w-full text-base outline-none px-3 py-3 bg-transparent disabled:text-slate-500"
                    disabled={disabled}
                    onChange={onChange}
                    value={value}
                >
                    {
                        options.map(opt => (
                            <option key={opt.key} value={opt.key}>{opt.value}</option>
                        ))
                    }
                </select>
            </label>
            {invalid && errorMessage && (
                <div className="mt-1 text-sm text-red-600 dark:text-rose-400/50">
                    {errorMessage}
                </div>
            )}
        </div>
    )
}
