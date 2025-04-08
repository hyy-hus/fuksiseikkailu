import type { SVGProps } from "react";
const SvgFavoritePlain = (props: SVGProps<SVGSVGElement>) => (
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
                d="M9.26 7.937v10.584l3.97-2.646 3.968 2.646V7.937Z"
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
export default SvgFavoritePlain;
