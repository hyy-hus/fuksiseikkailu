import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Map, NavigationControl } from '@vis.gl/react-maplibre'
import * as maplibregl from 'maplibre-gl'
import { Protocol } from 'pmtiles'
import { layers, namedFlavor, type Flavor } from '@protomaps/basemaps'

// Import worker via Vite's native worker bundler
import MaplibreWorker from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker'

import 'maplibre-gl/dist/maplibre-gl.css'
import { cn } from '@/lib/utils'

// Register worker class directly via type assertion
if (typeof window !== 'undefined' && maplibregl.config) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (maplibregl.config as any).WORKER_CLASS = MaplibreWorker
}

// Register PMTiles protocol handler
const protocol = new Protocol()
maplibregl.addProtocol('pmtiles', protocol.tile)

interface VectorMapProps {
    className?: string
    pmtilesUrl?: string
    presetTheme?: Flavor
    onClick?: (e: maplibregl.MapMouseEvent) => void
    children?: React.ReactNode
}

export function VectorMap({
    className,
    pmtilesUrl = 'https://fuksiseikkailu-maptiles.s3.fr-par.scw.cloud/helsinki.pmtiles',
    presetTheme = namedFlavor('light'),
    onClick,
    children,
}: VectorMapProps) {
    const { i18n } = useTranslation()

    const mapStyle = React.useMemo<maplibregl.StyleSpecification>(() => {
        const mapLanguage = (i18n.language ? i18n.language.slice(0, 2) : 'fi') as 'fi' | 'en' | 'sv'
        const baseLayers = layers('protomaps', presetTheme, { lang: mapLanguage })

        return {
            version: 8,
            glyphs: 'https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf',
            sprite: 'https://protomaps.github.io/basemaps-assets/sprites/v4/light',
            sources: {
                protomaps: {
                    type: 'vector',
                    url: `pmtiles://${pmtilesUrl}`,
                },
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            layers: baseLayers as any,
        }
    }, [pmtilesUrl, presetTheme, i18n.language])

    return (
        <div className={cn('relative h-full w-full overflow-hidden', className)}>
            <Map
                mapLib={maplibregl}
                onClick={onClick}
                initialViewState={{
                    longitude: 24.9384,
                    latitude: 60.1699,
                    zoom: 13,
                }}
                style={{ width: '100%', height: '100%' }}
                mapStyle={mapStyle}
            >
                <NavigationControl position="top-right" />
                {children}
            </Map>
        </div>
    )
}
