import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const baseURL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

const client = axios.create({
  baseURL,
  timeout: 30000,
});

client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('gm_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (r) => r,
  (err) => {
    const msg = err?.response?.data?.error || err?.message || 'Request failed';
    err.userMessage = msg;
    return Promise.reject(err);
  }
);

export default client;
