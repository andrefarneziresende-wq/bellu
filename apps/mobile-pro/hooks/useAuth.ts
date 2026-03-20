import { useCallback } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '../stores/authStore';

export function useAuth() {
  const {
    professional,
    isAuthenticated,
    isLoading,
    login: storeLogin,
    register: storeRegister,
    logout: storeLogout,
  } = useAuthStore();

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        await storeLogin(email, password);
        router.replace('/(tabs)');
      } catch (error) {
        throw error;
      }
    },
    [storeLogin]
  );

  const register = useCallback(
    async (data: {
      name: string;
      email: string;
      password: string;
      phone: string;
      specialties: string[];
    }) => {
      try {
        await storeRegister(data);
        router.replace('/(tabs)');
      } catch (error) {
        throw error;
      }
    },
    [storeRegister]
  );

  const logout = useCallback(() => {
    storeLogout();
    router.replace('/(auth)/login');
  }, [storeLogout]);

  return {
    professional,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
  };
}
