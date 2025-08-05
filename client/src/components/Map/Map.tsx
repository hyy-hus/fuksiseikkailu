import { useRef, useLayoutEffect } from 'react'
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { PublicCheckpoint } from '@api/model';

const blueIcon = L.divIcon({
    className: "custom-circle",
    html: "<div style='width:20px;height:20px;border-radius:50%;background:blue;'></div>",
    iconSize: [20, 20],
    iconAnchor: [10, 0],
});

const redIcon = L.divIcon({
    className: "custom-circle",
    html: "<div style='width:20px;height:20px;border-radius:50%;background:red;'></div>",
    iconSize: [20, 20],
    iconAnchor: [10, 0],
});

interface MapProps {
    clickCallback: (checkpoint_id: number) => void;
    checkpoints: PublicCheckpoint[];
    selected_id: number | undefined;
    onMarkerDrag: (checkpointId: number, newLat: number, newLng: number) => void;
}

export function Map({
    clickCallback, checkpoints, selected_id, onMarkerDrag
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
                maxZoom: 19,
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(mapRef.current);

            markerClusterRef.current = L.markerClusterGroup({ disableClusteringAtZoom: 19 });
            mapRef.current.addLayer(markerClusterRef.current);
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
            console.log(lat, long);
            return L.marker([lat, long], {
                icon: blueIcon,
                draggable: false,
            })
                .bindTooltip(checkpoint.org_name, {
                    direction: "top",
                    permanent: true,
                    offset: L.point(0, 0),
                })
                .on("dragend", (e) => {
                    const newPos = e.target.getLatLng();
                    console.log("New position:", newPos);
                    e.target.setIcon(blueIcon);
                    e.target.dragging.disable();
                    onMarkerDrag(checkpoint.id, newPos.lat, newPos.lng);
                })
                .on("click", (e) => {
                    e.target.setIcon(redIcon);
                    e.target.dragging.enable();
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

