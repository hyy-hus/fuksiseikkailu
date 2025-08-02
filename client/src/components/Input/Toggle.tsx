interface ToggleProps {
    value?: boolean;
    onChange?: (value: boolean) => void;
}

export function Toggle({ value = false, onChange }: ToggleProps) {
    function toggle() {
        onChange?.(!value);
    }

    return (
        <button
            type="button"
            aria-pressed={value}
            onClick={toggle}
            onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                    toggle();
                }
            }}
            className={`
            group border border-zinc-400 dark:border-slate-700 rounded-full
            inline-flex items-center w-12 h-6 px-1 py-1
            cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500
            transition-colors duration-300 ease-in-out
            active:[&>div]:scale-80
            ${value ? "bg-green-300 dark:bg-emerald-500" : "bg-zinc-300 dark:bg-slate-700"}
            `}>
            <div className={
                `bg-zinc-100 border border-zinc-400 dark:border-none rounded-full w-4 h-4
                transition-transform duration-300 ease-in-out
                ${value ? "translate-x-14/10" : "translate-x-0"}
                `}></div>
        </button>
    )
}
