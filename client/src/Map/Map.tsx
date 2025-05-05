import { useRef, useEffect } from 'react'
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

interface CheckpointData {
    number: number,
    name: string,
    description: string,
    location: [number, number],
    address: string,
    area: string,
    accessible: boolean,
    host_description: string,
    rating: number,
    favourite: boolean,
    completed: boolean,
}

interface MapProps {
    clickCallback: (checkpoint: CheckpointData) => void;
    checkpoints: CheckpointData[];
    selected: CheckpointData | undefined;
}

const Map: React.FC<MapProps> = (props: MapProps) => {
    // const [points, setPoints] = useState([]);

    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);

    useEffect(() => {
        const default_coordinates: [number, number] = props.selected ? props.selected.location : [60.16936416230424, 24.94024164353307];

        if (!mapRef.current && mapContainerRef.current) {
            // Initialize map only if it's not done before
            mapRef.current = L.map(mapContainerRef.current).setView(default_coordinates, 14);

            // Add tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(mapRef.current);

            // //Add a marker
            // L.marker([60.16936416230424, 24.94024164353307])
            //     .addTo(mapRef.current)
            //     .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
            //     .openPopup();

            const blueIcon = L.divIcon({
                className: "custom-circle",
                html: "<div style='width:20px;height:20px;border-radius:50%;background:blue;'></div>",
                iconSize: [20, 20],
                iconAnchor: [10, 0],
            })

            const redIcon = L.divIcon({
                className: "custom-circle",
                html: "<div style='width:20px;height:20px;border-radius:50%;background:red;'></div>",
                iconSize: [20, 20],
                iconAnchor: [10, 0],
            })


            const markers = props.checkpoints.map((checkpoint: CheckpointData) => {
                return L.marker([checkpoint.location[0], checkpoint.location[1]], {
                    icon: blueIcon,
                    draggable: false,
                })
                    .bindTooltip(checkpoint.name, {
                        direction: "top",
                        permanent: true,
                        offset: L.point(0, 0),
                    })
                    .on("dragend", (e) => {
                        const newPos = e.target.getLatLng();
                        console.log("New position:", newPos);
                        e.target.setIcon(blueIcon);
                        e.target.dragging.disable();
                    })
                    .on("click", (e) => {
                        e.target.setIcon(redIcon);
                        e.target.dragging.enable();
                        props.clickCallback(checkpoint);
                    })
            });

            const markerCluster = L.markerClusterGroup({
                disableClusteringAtZoom: 19,
            });
            markers.forEach((marker) => {
                markerCluster.addLayer(marker);
            })
            mapRef.current.addLayer(markerCluster);

            // mapRef.current.on("click", (e) => clickCallback(e, mapRef.current));
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.off("click", () => { });
                mapRef.current.remove();
                mapRef.current = null;
            }
        }
    }, [props]);

    // useEffect(() => {
    //     console.log(points);
    //     if (points.length >= 4) {
    //         L.polygon(points).addTo(mapRef.current);
    //     }
    // }, [points])

    return <div ref={mapContainerRef} style={{ height: "800px", width: "100%" }} />;
};

export default Map
