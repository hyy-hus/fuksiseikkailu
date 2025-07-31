import axios from 'axios';

import { currentToken, setCurrentToken } from "../contexts/";
import { navigate } from '../router/navigate';

const axiosInstance = axios.create({
    baseURL: '/api',
})

axiosInstance.interceptors.request.use((config) => {
    if (currentToken) {
        config.headers = config.headers ?? {}
        config.headers.Authorization = `Bearer ${currentToken}`
    }

    return config
})

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        console.log("Error:", error);
        if (error.response?.status === 401 && error.response?.data?.detail === "Not authenticated") {
            const currentPath = window.location.pathname + window.location.search;
            localStorage.setItem("postLoginRedirect", currentPath);

            setCurrentToken(null);
            navigate("/login");
        }

        return Promise.reject(error);
    }
);

export const customInstance = <T>(config: any) => {
    return axiosInstance.request<T>(config);
}
