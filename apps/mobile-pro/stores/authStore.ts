import { create } from 'zustand';
import { api } from '../services/api';

export interface Professional {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  specialties: string[];
  rating: number;
  reviewCount: number;
  salonName?: string;
  isVerified: boolean;
}

export interface ProContext {
  type: 'owner' | 'staff';
  professionalId: string;
  businessName: string;
  memberId: string | null;
  roleName: string;
  permissions: string[];
}

interface AuthState {
  professional: Professional | null;
  token: string | null;
  proContext: ProContext | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  fetchProfile: () => Promise<void>;
  fetchProContext: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  specialties: string[];
  businessName?: string;
  taxId?: string;
  address?: string;
  city?: string;
  state?: string;
  timezone?: string;
  countryId?: string;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  professional: null,
  token: null,
  proContext: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await api.post<{
        data: {
          user: Record<string, unknown>;
          tokens: { accessToken: string; refreshToken: string };
        };
      }>('/auth/login', { email, password });

      const { tokens } = response.data;
      set({ token: tokens.accessToken });

      // Fetch pro context (determines owner vs staff + permissions)
      await get().fetchProContext();

      // Fetch professional profile
      await get().fetchProfile();

      set({ isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (data: RegisterData) => {
    set({ isLoading: true });
    try {
      // Step 1: Create user account
      const response = await api.post<{
        data: {
          user: { id: string; name: string; email: string };
          tokens: { accessToken: string; refreshToken: string };
        };
      }>('/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
        countryId: data.countryId,
        locale: 'pt-BR',
        role: 'professional',
      });

      const { tokens } = response.data;
      set({ token: tokens.accessToken });

      // Step 2: Create professional profile
      await api.post('/professionals', {
        specialties: data.specialties,
        businessName: data.businessName || '',
        taxId: data.taxId || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        timezone: data.timezone || '',
        countryId: data.countryId || '',
      });

      // Step 3: Fetch pro context and profile
      await get().fetchProContext();
      await get().fetchProfile();

      set({ isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false, token: null });
      throw error;
    }
  },

  fetchProfile: async () => {
    try {
      const response = await api.get<{
        data: Professional;
      }>('/professionals/me');
      set({ professional: response.data });
    } catch {
      // Profile may not exist yet for fresh registrations
    }
  },

  fetchProContext: async () => {
    try {
      const response = await api.get<{
        data: ProContext;
      }>('/pro/me');
      set({ proContext: response.data });
    } catch {
      // User might not have a pro profile yet
      set({ proContext: null });
    }
  },

  hasPermission: (permission: string) => {
    const ctx = get().proContext;
    if (!ctx) return false;
    if (ctx.permissions.includes('*')) return true;
    return ctx.permissions.includes(permission);
  },

  hasAnyPermission: (permissions: string[]) => {
    const ctx = get().proContext;
    if (!ctx) return false;
    if (ctx.permissions.includes('*')) return true;
    return permissions.some((p) => ctx.permissions.includes(p));
  },

  logout: () => {
    set({
      professional: null,
      token: null,
      proContext: null,
      isAuthenticated: false,
    });
  },

  setLoading: (loading: boolean) => set({ isLoading: loading }),
}));
