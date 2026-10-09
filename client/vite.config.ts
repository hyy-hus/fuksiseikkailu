// client/vite.config.ts
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
            name: 'copy-maplibre-workers',
            closeBundle() {
                const srcDir = path.resolve(__dirname, 'node_modules/maplibre-gl/dist')
                const destDir = path.resolve(__dirname, 'dist/assets')
                const workerFiles: string[] = ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']

                workerFiles.forEach((file: string) => {
                    const src = path.join(srcDir, file)
                    const dest = path.join(destDir, file)
                    if (fs.existsSync(src)) {
                        fs.copyFileSync(src, dest)
                        console.log(`✓ Successfully copied ${file} directly to dist/assets/`)
                    }
                })
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
