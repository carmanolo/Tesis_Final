import axios from 'axios';
import cookies from 'js-cookie';
import { API_URL } from '../config/env.config.js';

if (!API_URL) {
    throw Error("Error al cargar variables de entorno");
}

const instance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

instance.interceptors.request.use(
    (config) => {
        const token = cookies.get('jwt-auth', { path: "/" });
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default instance;