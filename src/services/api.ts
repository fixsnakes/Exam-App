import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

declare const process:
  | { env?: Record<string, string | undefined> }
  | undefined;

const envBaseUrl =
  process?.env?.EXPO_PUBLIC_API_BASE_URL ||
  process?.env?.API_BASE_URL ||
  '';

const API_BASE_URL = envBaseUrl || 'http://127.0.0.1:5005';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

console.log('[API] Base URL', API_BASE_URL);

api.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const buildQueryString = (params: Record<string, string | number | undefined>) => {
  const parts: string[] = [];
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  });
  return parts.join('&');
};

