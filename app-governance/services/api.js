import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Platform } from 'react-native';

function getBaseURL() {
    if (process.env.EXPO_PUBLIC_API_URL) {
        return process.env.EXPO_PUBLIC_API_URL;
    }

    // Reuse the same LAN host Expo uses for Metro (works on physical devices).
    const hostUri =
        Constants.expoConfig?.hostUri ??
        Constants.expoGoConfig?.debuggerHost ??
        Constants.manifest?.debuggerHost;

    if (hostUri) {
        const host = hostUri.split(':')[0];
        return `http://${host}:8080/api`;
    }

    // Android emulator maps 10.0.2.2 to the dev machine.
    if (Platform.OS === 'android') {
        return 'http://10.0.2.2:8080/api';
    }

    return 'http://localhost:8080/api';
}

const API = axios.create({
    baseURL: getBaseURL(),
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
