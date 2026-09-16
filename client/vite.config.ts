import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import tailwindcss from '@tailwindcss/vite'

const __dirname = import.meta.dirname ?? path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
    plugins: [
        TanStackRouterVite({ target: 'react', autoCodeSplitting: true }),
        react(),
        tailwindcss(),
        {
            name: 'copy-maplibre-shared-worker',
            closeBundle() {
                const src = path.resolve(__dirname, 'node_modules/maplibre-gl/dist/maplibre-gl-shared.mjs')
                const dest = path.resolve(__dirname, 'dist/assets/maplibre-gl-shared.mjs')
                if (fs.existsSync(src)) {
                    fs.copyFileSync(src, dest)
                    console.log('✓ Successfully copied maplibre-gl-shared.mjs directly to dist/assets/')
                }
            },
        },
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    optimizeDeps: {
        exclude: ['maplibre-gl'],
    },
})
