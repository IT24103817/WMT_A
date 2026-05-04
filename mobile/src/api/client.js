/**
 * Single axios instance used by every screen.
 * ============================================
 *
 * Two interceptors do most of the work:
 *
 * 1. REQUEST interceptor — attaches `Authorization: Bearer <token>` to
 *    every outgoing call by reading the JWT from AsyncStorage. This means
 *    individual screens never have to think about auth headers.
 *
 * 2. RESPONSE interceptor — when the API returns an error like
 *    `{ error: "Email already registered" }` we copy that to
 *    `err.userMessage` so screens can show it directly:
 *      catch (e) { toast.error(e.userMessage); }
 *
 * baseURL comes from EXPO_PUBLIC_API_URL (set in mobile/.env). For dev
 * against localhost we fall back to http://localhost:5000.
 *
 * Important: do NOT manually set Content-Type on FormData calls anywhere.
 * React Native + axios will auto-compute the multipart boundary. Setting
 * "multipart/form-data" yourself silently drops file fields on iOS.
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const baseURL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

const client = axios.create({
  baseURL,
  timeout: 30000, // Render free tier cold-start can take ~25s
});

// REQUEST: stamp every call with the JWT (if logged in).
client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('gm_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// RESPONSE: normalise errors so screens have a clean string to show.
client.interceptors.response.use(
  (r) => r,
  (err) => {
    const msg = err?.response?.data?.error || err?.message || 'Request failed';
    err.userMessage = msg;
    return Promise.reject(err);
  }
);

export default client;
