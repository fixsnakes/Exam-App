import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

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


