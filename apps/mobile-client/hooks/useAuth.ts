import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { authApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import type { LoginRequest, RegisterRequest } from '@beauty/shared-types';

export function useAuth() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, login, logout: storeLogout } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (response) => {
      login(response.data.user, response.data.tokens);
      router.replace('/(tabs)');
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: (response) => {
      login(response.data.user, response.data.tokens);
      router.replace('/(tabs)');
    },
  });

  const handleLogout = () => {
    storeLogout();
    router.replace('/(auth)/login');
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login: loginMutation.mutate,
    loginError: loginMutation.error,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutate,
    registerError: registerMutation.error,
    isRegistering: registerMutation.isPending,
    logout: handleLogout,
  };
}
