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
            error.response?.status === 401 &&
            error.response?.data?.detail === "Not authenticated"
        ) {
            const currentPath = window.location.pathname + window.location.search;
            localStorage.setItem("postLoginRedirect", currentPath);

            authStore.setToken(null);
            navigate("/login");
        }
        return Promise.reject(error);
    }
);

export const customInstance = <T>(config: AxiosRequestConfig) => {
    return axiosInstance.request<T>(config);
}
