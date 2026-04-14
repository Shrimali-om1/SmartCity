import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

// Replace the IP below with your local machine's IP (e.g. 10.245.215.33)
// and ensure the backend is running on 8080.
const API = axios.create({
    baseURL: 'http://10.122.90.33:8080/api',
});

// ── Request interceptor: attach JWT token to every request ───────────────────
API.interceptors.request.use(
    async (config) => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error retrieving token from storage', error);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ── Response interceptor: auto-logout on 401 (expired / invalid token) ───────
API.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            try {
                await AsyncStorage.removeItem('token');
            } catch (_) {}
            // Navigate to login and replace history so back button doesn't return
            router.replace('/');
        }
        return Promise.reject(error);
    }
);

export default API;
