import { useRef, useLayoutEffect } from 'react'
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { PublicCheckpoint } from '@api/model';

import ReactDOMServer from 'react-dom/server';
import { HiLocationMarker } from "react-icons/hi";
import clsx from 'clsx';

const colors = ["amber", "emerald", "cyan", "indigo", "fuchsia", "rose"];
const COLOR_CLASSES: Record<string, string> = {
    amber: "bg-amber-500 border-amber-300",
    emerald: "bg-emerald-500 border-emerald-300",
    cyan: "bg-cyan-500 border-cyan-300",
    indigo: "bg-indigo-500 border-indigo-300",
    fuchsia: "bg-fuchsia-500 border-fuchsia-300",
    rose: "bg-rose-500 border-rose-300",
};

function Marker(id: number, area?: number, selected?: boolean) {
    const idx = (area ?? 0) % Object.keys(COLOR_CLASSES).length;
    const key = colors[idx];
    const colorClass = COLOR_CLASSES[key];

    const style = clsx(
        "w-10 h-10 rounded-full border-[3px] flex items-center justify-center font-bold shadow",
        selected ? "bg-sky-400 border-sky-300" : colorClass
    );

    return L.divIcon({
        className: "custom-circle",
        html: ReactDOMServer.renderToString(<div className={style}>{id}</div>),
        iconSize: [128, 128],
        iconAnchor: [22, 0],
    });
}

interface MapProps {
    clickCallback: (checkpoint_id: number) => void;
    dragEnabled: boolean;
    checkpoints: PublicCheckpoint[];
    selected_id: number | undefined;
    onMarkerDrag: (checkpointId: number, newLat: number, newLng: number) => void;
}

export function Map({
    clickCallback, dragEnabled = false, checkpoints, selected_id, onMarkerDrag
}: MapProps) {
    // const [points, setPoints] = useState([]);

    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markerClusterRef = useRef<L.MarkerClusterGroup | null>(null);

    const selectedCheckpoint = checkpoints.find(cp => cp.id == selected_id);

    useLayoutEffect(() => {
        if (!mapRef.current && mapContainerRef.current) {
            const default_coordinates: [number, number] = [60.16936416230424, 24.94024164353307];

            mapRef.current = L.map(mapContainerRef.current).setView(default_coordinates, 14);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                minZoom: 14,
                maxZoom: 19,
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(mapRef.current);

            markerClusterRef.current = L.markerClusterGroup({ disableClusteringAtZoom: 18 });
            mapRef.current.addLayer(markerClusterRef.current);

            mapRef.current.on("click", (e) => {
                // if (!e.originalEvent.shiftKey) {
                //     return
                // }
                //
                console.log(selected_id);

                if (!selectedCheckpoint) {
                    return;
                }

                const { lat, lng } = e.latlng;
                console.log(lat, lng);
                onMarkerDrag?.(selectedCheckpoint.id, lat, lng)
            })
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        }
    }, []);

    useLayoutEffect(() => {
        if (!markerClusterRef.current) {
            return;
        }

        markerClusterRef.current.clearLayers();

        const markers = checkpoints.map((checkpoint: PublicCheckpoint) => {
            const lat = parseFloat(checkpoint.latitude) || 0;
            const long = parseFloat(checkpoint.longitude) || 0;
            return L.marker([lat, long], {
                icon: Marker(checkpoint.number, false),
                draggable: false,
            })
                .bindTooltip(`#${checkpoint.number}: ${checkpoint.org_name}`, {
                    direction: "top",
                    permanent: false,
                    offset: L.point(0, 0),
                })
                .on("dragend", (e) => {
                    const newPos = e.target.getLatLng();
                    console.log("New position:", newPos);
                    e.target.setIcon(Marker(checkpoint.number, false));
                    e.target.dragging.disable();
                    onMarkerDrag(checkpoint.id, newPos.lat, newPos.lng);
                })
                .on("click", (e) => {
                    if (dragEnabled) {
                        e.target.setIcon(Marker(checkpoint.number, true));
                        e.target.dragging.enable();
                    }
                    clickCallback(checkpoint.id);
                })
        });

        markers.forEach(m => markerClusterRef.current!.addLayer(m));


    }, [checkpoints, selected_id]);

    // useEffect(() => {
    //     console.log(points);
    //     if (points.length >= 4) {
    //         L.polygon(points).addTo(mapRef.current);
    //     }
    // }, [points])

    return (
        <div ref={mapContainerRef}
            className="w-full h-full min-w-100 min-h-100 z-0"
        />
    );
};

