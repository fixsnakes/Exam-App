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

export interface SignInResponse {
  id: number;
  fullName: string;
  email: string;
  role: string;
  accessToken: string;
}

export interface SignUpResponse {
  message: string;
}

export const AuthService = {
  login: async (email: string, password: string) => {
    console.log('[AuthService.login] Sending request', {
      email,
      endpoint: '/api/auth/signin',
    });
    const { data } = await api.post<SignInResponse>('/api/auth/signin', {
      email,
      password,
    });
    console.log('[AuthService.login] Response', data);
    const token = data.accessToken;
    await AsyncStorage.multiSet([
      ['access_token', token],
      ['user_full_name', data.fullName || ''],
      ['user_role', data.role || 'student'],
    ]);
    return data;
  },
  register: async (
    fullName: string,
    email: string,
    password: string,
    role: 'student' | 'teacher',
    confirmPassword?: string,
  ) => {
    console.log('[AuthService.register] Sending request', {
      fullName,
      email,
      role,
      endpoint: '/api/auth/signup',
    });
    const { data } = await api.post<SignUpResponse>('/api/auth/signup', {
      fullName,
      email,
      password,
      role,
      confirmPassword: confirmPassword ?? password,
    });
    console.log('[AuthService.register] Response', data);
    return data;
  },
  logout: async () => {
    await AsyncStorage.removeItem('access_token');
  },
};

