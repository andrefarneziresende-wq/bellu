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

import { Platform } from 'react-native';

const DEFAULT_API_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? `http://${DEFAULT_API_HOST}:3333/api`;

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const tokens = useAuthStore.getState().tokens;

  const headers: Record<string, string> = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
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

  googleSignIn: (data: { idToken: string; countryId: string; locale: string }) =>
    request<ApiResponse<{ user: User; tokens: AuthTokens }>>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  appleSignIn: (data: {
    identityToken: string;
    fullName?: { givenName?: string; familyName?: string };
    email?: string;
    countryId: string;
    locale: string;
  }) =>
    request<ApiResponse<{ user: User; tokens: AuthTokens }>>('/auth/apple', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  forgotPassword: (data: { email: string }) =>
    request<ApiResponse<null>>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  resetPassword: (data: { email: string; code: string; newPassword: string }) =>
    request<ApiResponse<null>>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// --- Professionals ---
export const professionalsApi = {
  list: (params?: { categoryId?: string; lat?: number; lng?: number; page?: number }) => {
    const query = new URLSearchParams();
    if (params?.categoryId) query.set('categoryId', params.categoryId);
    if (params?.lat) query.set('latitude', String(params.lat));
    if (params?.lng) query.set('longitude', String(params.lng));
    if (params?.page) query.set('page', String(params.page));
    return request<PaginatedResponse<Professional>>(`/professionals/search?${query}`);
  },

  getById: (id: string) =>
    request<ApiResponse<Professional>>(`/professionals/${id}`),

  getFeatured: (countryId: string) =>
    request<ApiResponse<Professional[]>>(`/professionals/featured?countryId=${encodeURIComponent(countryId)}`),

  search: (query: string) =>
    request<PaginatedResponse<Professional>>(`/professionals/search?query=${encodeURIComponent(query)}`),
};

// --- Services ---
export const servicesApi = {
  getByProfessional: (professionalId: string) =>
    request<ApiResponse<Service[]>>(`/services/professional/${professionalId}`),
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

  create: (data: { professionalId: string; serviceId: string; date: string; startTime: string; memberId?: string }) =>
    request<ApiResponse<Booking>>('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  cancel: (id: string) =>
    request<ApiResponse<Booking>>(`/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'cancelled' }),
    }),

  availableSlots: (professionalId: string, date: string) =>
    request<ApiResponse<string[]>>(`/bookings/available-slots/${professionalId}?date=${date}`),
};

// --- Reviews ---
export const reviewsApi = {
  getByProfessional: (professionalId: string) =>
    request<PaginatedResponse<Review>>(`/reviews/professional/${professionalId}`),

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

// --- Members (Staff) ---
export const membersApi = {
  listByProfessional: (professionalId: string) =>
    request<ApiResponse<Array<{ id: string; name: string; avatar: string | null; specialties: string | null; role: string }>>>(`/members?professionalId=${professionalId}`),
};

// --- Banners ---
export const bannersApi = {
  list: () => request<ApiResponse<Banner[]>>('/banners'),
};

// --- Portfolio ---
export const portfolioApi = {
  getByProfessional: (professionalId: string) =>
    request<ApiResponse<PortfolioItem[]>>(`/portfolio?professionalId=${professionalId}`),
};

// --- Service Packages ---
export interface ServicePackageData {
  id: string;
  name: string;
  description: string | null;
  sessionsTotal: number;
  intervalDays: number | null;
  priceTotal: number;
  currency: string;
  service: { id: string; name: string; durationMinutes: number };
}

export const servicePackagesApi = {
  listByProfessional: (professionalId: string) =>
    request<ApiResponse<ServicePackageData[]>>(`/service-packages?professionalId=${professionalId}`),
};

// --- Client Packages ---
export interface ClientPackageData {
  id: string;
  totalSessions: number;
  sessionsUsed: number;
  status: string;
  servicePackage: ServicePackageData;
  professional: { id: string; businessName: string };
  bookings: Array<{
    id: string;
    date: string;
    startTime: string;
    status: string;
    sessionNumber: number | null;
    completedAt: string | null;
    _count: { photos: number };
  }>;
}

export const clientPackagesApi = {
  list: (status?: string) => {
    const query = status ? `?status=${status}` : '';
    return request<ApiResponse<ClientPackageData[]>>(`/client-packages/my${query}`);
  },

  getById: (id: string) =>
    request<ApiResponse<ClientPackageData>>(`/client-packages/${id}`),

  purchase: (data: { servicePackageId: string; sessions?: Array<{ date: string; startTime: string }> }) =>
    request<ApiResponse<ClientPackageData>>('/client-packages', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// --- Notifications ---
export interface NotificationData {
  id: string;
  title: string;
  body: string;
  type: string;
  data: string | null;
  read: boolean;
  createdAt: string;
}

export const notificationsApi = {
  list: (page = 1) =>
    request<{ success: boolean; data: NotificationData[]; pagination: { total: number; page: number; perPage: number; totalPages: number }; unreadCount: number }>(
      `/notifications/my?page=${page}`,
    ),

  markRead: (id: string) =>
    request<ApiResponse<null>>(`/notifications/${id}/read`, { method: 'PATCH' }),

  markAllRead: () =>
    request<ApiResponse<null>>('/notifications/read-all', { method: 'PATCH' }),

  unreadCount: () =>
    request<ApiResponse<{ count: number }>>('/notifications/unread-count'),
};

// --- Booking Photos ---
export interface BookingPhotoData {
  id: string;
  imageUrl: string;
  description: string | null;
  createdAt: string;
  uploadedBy?: { id: string; name: string };
  booking?: { id: string; sessionNumber: number | null; date: string; service: { name: string } };
}

export const bookingPhotosApi = {
  listByBooking: (bookingId: string) =>
    request<ApiResponse<BookingPhotoData[]>>(`/booking-photos/${bookingId}`),

  listByPackage: (clientPackageId: string) =>
    request<ApiResponse<BookingPhotoData[]>>(`/booking-photos/package/${clientPackageId}`),
};

// --- Conversations (Direct Messaging) ---
export interface ConversationData {
  id: string;
  professionalId: string;
  otherParty: { id: string; name: string; avatar: string | null };
  lastMessage: string | null;
  lastMessageAt: string;
  unreadCount: number;
}

export interface ConversationMessageData {
  id: string;
  conversationId: string;
  senderId: string;
  message: string | null;
  imageUrl: string | null;
  readAt: string | null;
  createdAt: string;
  sender: { id: string; name: string; avatar: string | null };
}

export const conversationsApi = {
  list: () =>
    request<ApiResponse<ConversationData[]>>('/conversations'),

  getOrCreate: (professionalId: string) =>
    request<ApiResponse<{ id: string }>>('/conversations', {
      method: 'POST',
      body: JSON.stringify({ professionalId }),
    }),

  getMessages: (conversationId: string, page = 1) =>
    request<ApiResponse<{
      messages: ConversationMessageData[];
      conversation: {
        id: string;
        client: { id: string; name: string; avatar: string | null };
        professional: { id: string; businessName: string; avatarPhoto: string | null; userId: string };
      };
      pagination: { total: number; page: number; perPage: number; totalPages: number };
    }>>(`/conversations/${conversationId}/messages?page=${page}`),

  sendMessage: (conversationId: string, data: { message?: string; imageUrl?: string }) =>
    request<ApiResponse<ConversationMessageData>>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  markRead: (conversationId: string) =>
    request<ApiResponse<{ markedAsRead: number }>>(`/conversations/${conversationId}/read`, {
      method: 'PATCH',
    }),

  unreadCount: () =>
    request<ApiResponse<{ unreadCount: number }>>('/conversations/unread-count'),
};

// --- Upload ---
export const uploadApi = {
  uploadImage: async (uri: string, folder = 'uploads') => {
    const tokens = useAuthStore.getState().tokens;
    const formData = new FormData();

    // Normalize URI for Android content:// and iOS ph:// schemes
    const normalizedUri = Platform.OS === 'android' ? uri : uri.replace('file://', '');
    const rawName = uri.split('/').pop() || '';
    // Ensure filename has an extension
    const hasExt = /\.\w+$/.test(rawName);
    const filename = hasExt ? rawName : `photo_${Date.now()}.jpg`;
    const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

    formData.append('file', {
      uri: Platform.OS === 'android' ? uri : normalizedUri,
      name: filename,
      type: mimeType,
    } as unknown as Blob);

    const response = await fetch(`${API_BASE_URL}/upload?folder=${folder}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokens?.accessToken}`,
        // Do NOT set Content-Type — fetch will set multipart boundary automatically
      },
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      let message = 'Upload failed';
      try { message = JSON.parse(text).message || JSON.parse(text).error || message; } catch {}
      throw new Error(message);
    }

    return response.json() as Promise<ApiResponse<{ url: string }>>;
  },
};

// --- Legal ---
export const legalApi = {
  getByType: (type: string, locale: string) =>
    request<ApiResponse<{ id: string; title: string; content: string; version: string }>>(`/legal/${type}?locale=${locale}`),
};
