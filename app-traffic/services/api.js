import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace the IP below with your local machine's IP (e.g. 10.245.215.33)
// and ensure the backend is running on 8080.
const API = axios.create({
    baseURL: 'http://10.42.96.103:8080/api',
});

// Interceptor to attach JWT token to every request
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
    (error) => {
        return Promise.reject(error);
    }
);

export default API;
