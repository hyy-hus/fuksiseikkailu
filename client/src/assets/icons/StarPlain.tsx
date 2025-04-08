import type { SVGProps } from "react";
const SvgStarPlain = (props: SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={85}
        height={85}
        viewBox="0 0 22.49 22.49"
        {...props}
    >
        <g transform="translate(-1.984 -1.984)">
            <circle
                cx={13.229}
                cy={13.229}
                r={10.583}
                style={{
                    opacity: 1,
                    fill: "none",
                    fillOpacity: 1,
                    stroke: "#000",
                    strokeWidth: 1.32292,
                    strokeDasharray: "none",
                    strokeOpacity: 1,
                }}
            />
            <path
                d="m13.23 6.615 1.943 3.939 4.347.631-3.145 3.066.742 4.33-3.888-2.045-3.888 2.044.743-4.329-3.146-3.066 4.347-.631z"
                style={{
                    opacity: 1,
                    fill: "none",
                    fillOpacity: 1,
                    stroke: "#000",
                    strokeWidth: 1.85208,
                    strokeDasharray: "none",
                    strokeOpacity: 1,
                }}
            />
        </g>
    </svg>
);
export default SvgStarPlain;
