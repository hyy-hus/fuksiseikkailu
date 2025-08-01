export function Spinner() {
    return (
        <svg className="size-20 animate-spin" viewBox="0 0 100 100">
            <mask id="cutout">
                <rect x="0" y="0" width="100" height="100" fill="white" />
                <circle cx="50" cy="50" r="35" fill="black" />
            </mask>
            <g mask="url(#cutout)">
                <circle cx="50" cy="50" r="50"
                    className="fill-sky-500 dark:fill-sky-900"
                />
                <path d="M50 50 L50 0 A 50 50 0 0 0 0 50 z" className="fill-sky-300 dark:fill-sky-300" />
            </g>
        </svg>
    )
}
