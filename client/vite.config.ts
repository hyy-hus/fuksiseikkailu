import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa';

import react from '@vitejs/plugin-react'

import tailwindcss from '@tailwindcss/vite';

import path from 'path';

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        VitePWA({
            registerType: 'autoUpdate',
            manifest: {
                name: "Fuksiseikkailu 2025",
                short_name: "Fuksiseikkailu",
                description: "Kuvaus",
                theme_color: "#000000",
                icons: [
                    {
                        "src": "pwa-64x64.png",
                        "sizes": "64x64",
                        "type": "image/png"
                    },
                    {
                        "src": "pwa-192x192.png",
                        "sizes": "192x192",
                        "type": "image/png"
                    },
                    {
                        "src": "pwa-512x512.png",
                        "sizes": "512x512",
                        "type": "image/png"
                    },
                    {
                        "src": "maskable-icon-512x512.png",
                        "sizes": "512x512",
                        "type": "image/png",
                        "purpose": "maskable"
                    }
                ]
            },
            strategies: 'injectManifest',
            srcDir: 'src',
            filename: 'sw.ts',
        })
    ],
    server: {
        host: '0.0.0.0',
        port: 3000,
        proxy: {
            "/api": {
                target: "http://web-dev:8000",
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, ''),
            }
        },
        allowedHosts: ["lx4-fuxi061.lan"]
    },
    resolve: {
        alias: {
            "@api": path.resolve(__dirname, "src/api"),
            "@auth": path.resolve(__dirname, "src/auth"),
            "@components": path.resolve(__dirname, "src/components"),
            "@pages": path.resolve(__dirname, "src/pages"),
            "@hooks": path.resolve(__dirname, "src/hooks"),
            "@contexts": path.resolve(__dirname, "src/contexts"),
            "@utils": path.resolve(__dirname, "src/utils"),
        }
    },
})
