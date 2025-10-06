import api from './api';
import { AuthResponse, LoginCredentials, RegisterData } from '../types/auth';

export const authService = {
  // Register new user
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  // Login user
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Logout user
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Verify email
  verifyEmail: async (token: string): Promise<AuthResponse> => {
    const response = await api.get<AuthResponse>(`/auth/verify-email?token=${token}`);
    return response.data;
  },

  // Request password reset
  forgotPassword: async (email: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/forgot-password', { email });
    return response.data;
  },

  // Reset password
  resetPassword: async (token: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/reset-password', { token, password });
    return response.data;
  },
};
