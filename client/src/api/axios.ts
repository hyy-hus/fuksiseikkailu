import axios, { AxiosRequestConfig } from 'axios';

import { authStore } from "@auth";
import { navigate } from '../router/navigate';

const axiosInstance = axios.create({
    baseURL: '/api',
})

axiosInstance.interceptors.request.use((config) => {
    const token = authStore.getToken();

    if (token) {
        config.headers = config.headers ?? {}
        config.headers.Authorization = `Bearer ${token}`
    }

    return config
})

axiosInstance.interceptors.response.use(
    (res) => res,
    (error) => {
        if (
            error.response?.status === 401) {
            const currentPath = window.location.pathname + window.location.search;
            localStorage.setItem("postLoginRedirect", currentPath);

            authStore.setToken(null);

            if (window.location.pathname.includes("admin")) {
                navigate("/admin/login");
            } else {
                navigate("/")
            }
        }
        return Promise.reject(error);
    }
);

export const customInstance = <T>(config: AxiosRequestConfig) => {
    return axiosInstance.request<T>(config);
}
