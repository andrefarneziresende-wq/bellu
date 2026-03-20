import type {
  ApiResponse,
  PaginatedResponse,
  Professional,
  Service,
  Booking,
  Review,
  Category,
  Banner,
  User,
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  PortfolioItem,
  Country,
} from '@beauty/shared-types';
import { useAuthStore } from '../stores/authStore';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3333/api';

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const tokens = useAuthStore.getState().tokens;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (tokens?.accessToken) {
    headers['Authorization'] = `Bearer ${tokens.accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      useAuthStore.getState().logout();
    }
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
}

// --- Auth ---
export const authApi = {
  login: (data: LoginRequest) =>
    request<ApiResponse<{ user: User; tokens: AuthTokens }>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  register: (data: RegisterRequest) =>
    request<ApiResponse<{ user: User; tokens: AuthTokens }>>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: () => request<ApiResponse<User>>('/auth/me'),
};

// --- Professionals ---
export const professionalsApi = {
  list: (params?: { categoryId?: string; lat?: number; lng?: number; page?: number }) => {
    const query = new URLSearchParams();
    if (params?.categoryId) query.set('categoryId', params.categoryId);
    if (params?.lat) query.set('lat', String(params.lat));
    if (params?.lng) query.set('lng', String(params.lng));
    if (params?.page) query.set('page', String(params.page));
    return request<PaginatedResponse<Professional>>(`/professionals?${query}`);
  },

  getById: (id: string) =>
    request<ApiResponse<Professional>>(`/professionals/${id}`),

  getFeatured: () =>
    request<ApiResponse<Professional[]>>('/professionals/featured'),

  search: (query: string) =>
    request<PaginatedResponse<Professional>>(`/professionals/search?q=${encodeURIComponent(query)}`),
};

// --- Services ---
export const servicesApi = {
  getByProfessional: (professionalId: string) =>
    request<ApiResponse<Service[]>>(`/professionals/${professionalId}/services`),
};

// --- Categories ---
export const categoriesApi = {
  list: () => request<ApiResponse<Category[]>>('/categories'),
};

// --- Countries ---
export const countriesApi = {
  list: () => request<ApiResponse<Country[]>>('/countries'),
};

// --- Bookings ---
export const bookingsApi = {
  list: (status?: string) => {
    const query = status ? `?status=${status}` : '';
    return request<PaginatedResponse<Booking>>(`/bookings/my${query}`);
  },

  getById: (id: string) =>
    request<ApiResponse<Booking>>(`/bookings/${id}`),

  create: (data: { professionalId: string; serviceId: string; date: string; startTime: string }) =>
    request<ApiResponse<Booking>>('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  cancel: (id: string) =>
    request<ApiResponse<Booking>>(`/bookings/${id}/cancel`, {
      method: 'PATCH',
    }),

  availableSlots: (professionalId: string, date: string) =>
    request<ApiResponse<string[]>>(`/bookings/available-slots/${professionalId}?date=${date}`),
};

// --- Reviews ---
export const reviewsApi = {
  getByProfessional: (professionalId: string) =>
    request<PaginatedResponse<Review>>(`/professionals/${professionalId}/reviews`),

  create: (data: { bookingId: string; rating: number; comment?: string }) =>
    request<ApiResponse<Review>>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// --- Favorites ---
export const favoritesApi = {
  list: () => request<ApiResponse<Professional[]>>('/favorites'),

  add: (professionalId: string) =>
    request<ApiResponse<void>>('/favorites', {
      method: 'POST',
      body: JSON.stringify({ professionalId }),
    }),

  remove: (professionalId: string) =>
    request<ApiResponse<void>>(`/favorites/${professionalId}`, {
      method: 'DELETE',
    }),
};

// --- Banners ---
export const bannersApi = {
  list: () => request<ApiResponse<Banner[]>>('/banners'),
};

// --- Portfolio ---
export const portfolioApi = {
  getByProfessional: (professionalId: string) =>
    request<ApiResponse<PortfolioItem[]>>(`/professionals/${professionalId}/portfolio`),
};
