import axios from 'axios';

import { currentToken } from "../contexts/";

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

export const customInstance = <T>(config: any) => {
    return axiosInstance.request<T>(config);
}
