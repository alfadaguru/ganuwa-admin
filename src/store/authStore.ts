import { create } from 'zustand';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';

interface User {
  _id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User, token: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),

  login: async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      const { user, accessToken } = response.data.data;

      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(user));

      set({
        user: {
          _id: user._id,
          email: user.email,
          name: user.fullName || `${user.firstName} ${user.lastName}`,
          role: user.role,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        token: accessToken,
        isAuthenticated: true,
      });

      toast.success(`Welcome back, ${user.fullName || user.firstName}!`);
    } catch (error: any) {
      const message = error.response?.data?.error?.message || error.response?.data?.message || 'Login failed';
      toast.error(message);
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });

    toast.info('You have been logged out.');
  },

  setUser: (user: User, token: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    set({
      user,
      token,
      isAuthenticated: true,
    });
  },
}));