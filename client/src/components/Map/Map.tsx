import { useRef, useLayoutEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import ReactDOMServer from "react-dom/server";
import clsx from "clsx";
import type { PublicCheckpoint } from "@api/model";

const colors = ["amber", "emerald", "violet", "indigo", "fuchsia", "rose"] as const;
const COLOR_CLASSES: Record<string, string> = {
    amber: "bg-amber-500 border-amber-300",
    emerald: "bg-emerald-500 border-emerald-300",
    violet: "bg-violet-500 border-violet-300",
    indigo: "bg-indigo-500 border-indigo-300",
    fuchsia: "bg-fuchsia-500 border-fuchsia-300",
    rose: "bg-rose-500 border-rose-300",
};

function Marker(id: number, area?: number, selected?: boolean, cluster?: boolean) {
    const idx = (area ?? 0) % Object.keys(COLOR_CLASSES).length;
    const key = colors[idx];
    const colorClass = COLOR_CLASSES[key];

    const style = clsx(
        "w-10 h-10 rounded-full border-[3px] flex items-center justify-center font-bold shadow",
        selected ? "bg-sky-400 border-sky-200" : colorClass,
        cluster ? "blur-xs opacity-75 font-normal" : "",
    );

    return L.divIcon({
        className: "custom-circle",
        html: ReactDOMServer.renderToString(<div className={style}>{cluster ? "" : id}</div>),
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

function LeafletMap({
    clickCallback,
    dragEnabled = false,
    checkpoints,
    selected_id,
    onMarkerDrag,
}: MapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markerClusterRef = useRef<L.MarkerClusterGroup | null>(null);
    const markersRef = useRef<globalThis.Map<number, L.Marker>>(new globalThis.Map<number, L.Marker>());
    const markerMetaRef = useRef(new Map<number, { number: number; area?: number }>());

    // Refs to avoid stale closures in the single map click handler
    const selectedIdRef = useRef<number | undefined>(selected_id);
    const placeSelectedAtRef = useRef<(sid: number, ll: L.LatLng) => void>(() => { });

    // keep latest selected_id available to the click handler
    useLayoutEffect(() => {
        selectedIdRef.current = selected_id;
    }, [selected_id]);

    // keep latest placeSelectedAt implementation available to the click handler
    useLayoutEffect(() => {
        placeSelectedAtRef.current = (sid: number, latlng: L.LatLng) => {
            const m = markersRef.current.get(sid);
            if (!m) return;
            const meta = markerMetaRef.current.get(sid);

            // move locally
            m.setLatLng(latlng);
            m.setIcon(Marker(meta?.number ?? sid, meta?.area, true));
            if (dragEnabled) m.dragging && m.dragging.enable();

            // persist
            onMarkerDrag(sid, latlng.lat, latlng.lng);
        };
    }, [dragEnabled, onMarkerDrag]);

    // helper: (re)build markers into the cluster
    const refreshMarkers = () => {
        const cluster = markerClusterRef.current;
        if (!cluster) return;

        cluster.clearLayers();
        markersRef.current.clear();
        markerMetaRef.current.clear();

        const markers = checkpoints.map((checkpoint: PublicCheckpoint) => {
            const lat = parseFloat(checkpoint.latitude) || 0;
            const lng = parseFloat(checkpoint.longitude) || 0;
            const isSelected = checkpoint.id === selected_id;

            const marker = L.marker([lat, lng], {
                icon: Marker(checkpoint.number, checkpoint.area, isSelected),
                draggable: dragEnabled && isSelected,
            })
                .bindTooltip(`#${checkpoint.number}: ${checkpoint.org_name}`, {
                    direction: "top",
                    permanent: false,
                    offset: L.point(0, 0),
                })
                .on("dragend", (e) => {
                    const newPos = e.target.getLatLng();
                    // keep visual state simple after drag; selection effect will restyle if needed
                    e.target.setIcon(Marker(checkpoint.number, checkpoint.area, false));
                    e.target.dragging && e.target.dragging.disable();

                    onMarkerDrag(checkpoint.id, newPos.lat, newPos.lng);
                })
                .on("click", () => {
                    if (dragEnabled) {
                        marker.setIcon(Marker(checkpoint.number, checkpoint.area, true));
                        marker.dragging && marker.dragging.enable();
                    }
                    clickCallback(checkpoint.id);
                });

            (marker as any)._checkpointId = checkpoint.id;

            markerMetaRef.current.set(checkpoint.id, {
                number: checkpoint.number,
                area: checkpoint.area,
            });
            markersRef.current.set(checkpoint.id, marker);
            return marker;
        });

        markers.forEach((m) => cluster.addLayer(m));
    };

    // 1) init map + cluster, add a single click handler that reads latest refs
    useLayoutEffect(() => {
        if (mapRef.current || !mapContainerRef.current) return;

        const default_coordinates: [number, number] = [60.16936416230424, 24.94024164353307];
        mapRef.current = L.map(mapContainerRef.current, {
            zoomAnimation: true,
            fadeAnimation: true,
        }).setView(default_coordinates, 15);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            minZoom: 15,
            maxZoom: 19,
            attribution: "&copy; OpenStreetMap contributors",
        }).addTo(mapRef.current);

        markerClusterRef.current = L.markerClusterGroup({
            disableClusteringAtZoom: 16,
            spiderfyOnEveryZoom: false,
            showCoverageOnHover: false,
            chunkedLoading: true,
            iconCreateFunction: (cluster) => {
                const count = cluster.getChildCount();
                const areaCounts = new Map<number, number>();
                cluster.getAllChildMarkers().forEach((m: any) => {
                    const id = m._checkpointId as number | undefined;
                    console.log(id);
                    if (id == null) {
                        return;
                    }


                    const meta = markerMetaRef.current.get(id);
                    if (meta?.area == null) {
                        return;
                    }

                    areaCounts.set(meta.area, (areaCounts.get(meta.area) ?? 0) + 1);
                });

                let dominantArea: number | undefined;
                let max = -1;
                console.log(areaCounts);
                areaCounts.forEach((v, k) => { if (v > max) { max = v; dominantArea = k; } })

                return Marker(count, dominantArea, false, true);
            }
        });
        mapRef.current.addLayer(markerClusterRef.current);

        // Single click handler; uses refs so it always sees latest selected_id
        const handler = (e: L.LeafletMouseEvent) => {
            const oe = e.originalEvent as MouseEvent;

            if (oe.shiftKey) {
                const sid = selectedIdRef.current;
                if (!sid) return;
                placeSelectedAtRef.current(sid, e.latlng);
                return;
            }

            clickCallback(undefined as unknown as number);
        };

        mapRef.current.on("click", handler);

        // ensure correct sizing after mount
        setTimeout(() => mapRef.current?.invalidateSize(), 0);

        // initial markers
        refreshMarkers();

        return () => {
            mapRef.current?.off("click", handler);
            mapRef.current?.remove();
            mapRef.current = null;
            markerClusterRef.current = null;
            markersRef.current.clear();
            markerMetaRef.current.clear();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // once

    // 2) rebuild markers when checkpoint data changes
    useLayoutEffect(() => {
        if (!markerClusterRef.current) return;
        refreshMarkers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [checkpoints]);

    // 3) update icons/drag state when selection or dragEnabled changes
    useLayoutEffect(() => {
        markersRef.current.forEach((marker, id) => {
            const meta = markerMetaRef.current.get(id);
            const isSelected = id === selected_id;
            marker.setIcon(Marker(meta?.number ?? id, meta?.area, isSelected));
            if (dragEnabled && isSelected) marker.dragging && marker.dragging.enable();
            else marker.dragging && marker.dragging.disable();
        });
    }, [selected_id, dragEnabled]);

    // 4) focus ONLY when selection changes (dragging won’t recenter)
    useLayoutEffect(() => {
        const map = mapRef.current;
        const cluster = markerClusterRef.current;
        if (!map || !cluster || !selected_id) return;

        if (dragEnabled) {
            const selectedMarker = markersRef.current.get(selected_id);
            if (selectedMarker) {
                cluster.zoomToShowLayer(selectedMarker, () => {
                    const target = selectedMarker.getLatLng();
                    map.setView(target, map.getZoom(), { animate: true });
                });
            }
        }
    }, [selected_id]);

    return <div ref={mapContainerRef} className="w-full h-full min-w-100 min-h-100 z-0" />;
}

export { LeafletMap as Map };

