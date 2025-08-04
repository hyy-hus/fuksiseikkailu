import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App, NavigatorRegistrar } from './App'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { BrowserRouter } from "react-router-dom";

import { AuthProvider } from "@auth";
import { AdventureProvider } from "@contexts";

import "./i18n";

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <AdventureProvider>
                    <BrowserRouter>
                        <NavigatorRegistrar />
                        <App />
                        <ReactQueryDevtools initialIsOpen={false} />
                    </BrowserRouter>
                </AdventureProvider>
            </AuthProvider>
        </QueryClientProvider>
    </StrictMode>,
)
