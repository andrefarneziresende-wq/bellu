import type {
  ApiResponse,
  PaginatedResponse,
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  User,
  Professional,
  Service,
  Booking,
  Review,
  Payment,
  Category,
  Banner,
  Favorite,
  WorkingHours,
  PortfolioItem,
  ChatMessage,
} from '@beauty/shared-types';

// ============================================================
// API Client — Typed HTTP client for Beauty Marketplace
// ============================================================

export interface ApiClientConfig {
  baseUrl: string;
  getToken: () => string | null;
  onUnauthorized?: () => void;
}

export class ApiClient {
  private baseUrl: string;
  private getToken: () => string | null;
  private onUnauthorized?: () => void;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl;
    this.getToken = config.getToken;
    this.onUnauthorized = config.onUnauthorized;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers as Record<string, string>) },
    });

    if (res.status === 401) {
      this.onUnauthorized?.();
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${res.status}`);
    }

    return res.json();
  }

  // --- Auth ---
  auth = {
    login: (data: LoginRequest) =>
      this.request<ApiResponse<AuthTokens>>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    register: (data: RegisterRequest) =>
      this.request<ApiResponse<AuthTokens>>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    refresh: (refreshToken: string) =>
      this.request<ApiResponse<AuthTokens>>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      }),
    me: () => this.request<ApiResponse<User>>('/auth/me'),
  };

  // --- Users ---
  users = {
    getMe: () => this.request<ApiResponse<User>>('/users/me'),
    update: (data: Partial<User>) =>
      this.request<ApiResponse<User>>('/users/me', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  };

  // --- Professionals ---
  professionals = {
    search: (params: Record<string, string | number>) => {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      return this.request<PaginatedResponse<Professional>>(`/professionals/search?${query}`);
    },
    featured: (countryId?: string, limit = 10) => {
      const query = new URLSearchParams({ ...(countryId ? { countryId } : {}), limit: String(limit) }).toString();
      return this.request<ApiResponse<Professional[]>>(`/professionals/featured?${query}`);
    },
    getById: (id: string) =>
      this.request<ApiResponse<Professional & { services: Service[]; workingHours: WorkingHours[] }>>(`/professionals/${id}`),
    getMyProfile: () =>
      this.request<ApiResponse<Professional>>('/professionals/me'),
    create: (data: Record<string, unknown>) =>
      this.request<ApiResponse<Professional>>('/professionals', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (data: Record<string, unknown>) =>
      this.request<ApiResponse<Professional>>('/professionals/me', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  };

  // --- Services ---
  services = {
    getByProfessional: (professionalId: string) =>
      this.request<ApiResponse<Service[]>>(`/services?professionalId=${professionalId}`),
    create: (data: Record<string, unknown>) =>
      this.request<ApiResponse<Service>>('/services', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Record<string, unknown>) =>
      this.request<ApiResponse<Service>>(`/services/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<ApiResponse<void>>(`/services/${id}`, { method: 'DELETE' }),
  };

  // --- Bookings ---
  bookings = {
    create: (data: { professionalId: string; serviceId: string; date: string; startTime: string }) =>
      this.request<ApiResponse<Booking>>('/bookings', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getMyBookings: (params?: { page?: number; perPage?: number }) => {
      const query = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
      return this.request<PaginatedResponse<Booking>>(`/bookings/my?${query}`);
    },
    getById: (id: string) =>
      this.request<ApiResponse<Booking>>(`/bookings/${id}`),
    updateStatus: (id: string, status: string) =>
      this.request<ApiResponse<Booking>>(`/bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
  };

  // --- Reviews ---
  reviews = {
    create: (data: { bookingId: string; rating: number; comment?: string; photoUrl?: string }) =>
      this.request<ApiResponse<Review>>('/reviews', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getByProfessional: (professionalId: string, params?: { page?: number; perPage?: number }) => {
      const query = new URLSearchParams({ professionalId, ...(params as Record<string, string>) }).toString();
      return this.request<PaginatedResponse<Review>>(`/reviews?${query}`);
    },
  };

  // --- Payments ---
  payments = {
    create: (data: { bookingId: string; method: string }) =>
      this.request<ApiResponse<Payment & { clientSecret?: string }>>('/payments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    confirm: (id: string, data?: { paymentIntentId?: string; token?: string }) =>
      this.request<ApiResponse<Payment>>(`/payments/${id}/confirm`, {
        method: 'POST',
        body: JSON.stringify(data || {}),
      }),
    getByBooking: (bookingId: string) =>
      this.request<ApiResponse<Payment>>(`/payments/booking/${bookingId}`),
  };

  // --- Categories ---
  categories = {
    list: () => this.request<ApiResponse<Category[]>>('/categories'),
    create: (data: Record<string, unknown>) =>
      this.request<ApiResponse<Category>>('/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  };

  // --- Favorites ---
  favorites = {
    toggle: (professionalId: string) =>
      this.request<ApiResponse<{ favorited: boolean }>>('/favorites', {
        method: 'POST',
        body: JSON.stringify({ professionalId }),
      }),
    list: (params?: { page?: number; perPage?: number }) => {
      const query = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
      return this.request<PaginatedResponse<Favorite & { professional: Professional }>>(`/favorites?${query}`);
    },
    check: (professionalId: string) =>
      this.request<ApiResponse<{ favorited: boolean }>>(`/favorites/${professionalId}/check`),
  };

  // --- Portfolio ---
  portfolio = {
    getByProfessional: (professionalId: string, params?: { page?: number; perPage?: number }) => {
      const query = new URLSearchParams({ professionalId, ...(params as Record<string, string>) }).toString();
      return this.request<PaginatedResponse<PortfolioItem>>(`/portfolio?${query}`);
    },
    create: (data: Record<string, unknown>) =>
      this.request<ApiResponse<PortfolioItem>>('/portfolio', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<ApiResponse<void>>(`/portfolio/${id}`, { method: 'DELETE' }),
  };

  // --- Working Hours ---
  workingHours = {
    getByProfessional: (professionalId: string) =>
      this.request<ApiResponse<WorkingHours[]>>(`/working-hours?professionalId=${professionalId}`),
    set: (hours: Array<{ dayOfWeek: number; startTime: string; endTime: string; isOff: boolean }>) =>
      this.request<ApiResponse<WorkingHours[]>>('/working-hours', {
        method: 'PUT',
        body: JSON.stringify(hours),
      }),
    getSlots: (professionalId: string, date: string) =>
      this.request<ApiResponse<Array<{ time: string; available: boolean }>>>(`/working-hours/slots?professionalId=${professionalId}&date=${date}`),
  };

  // --- Banners ---
  banners = {
    listActive: (countryId?: string) => {
      const query = countryId ? `?countryId=${countryId}` : '';
      return this.request<ApiResponse<Banner[]>>(`/banners/active${query}`);
    },
  };

  // --- Chat ---
  chat = {
    getMessages: (bookingId: string, params?: { page?: number; perPage?: number }) => {
      const query = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
      return this.request<PaginatedResponse<ChatMessage>>(`/chat/booking/${bookingId}?${query}`);
    },
    send: (data: { bookingId: string; receiverId: string; message: string }) =>
      this.request<ApiResponse<ChatMessage>>('/chat', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    markRead: (bookingId: string) =>
      this.request<ApiResponse<void>>(`/chat/booking/${bookingId}/read`, { method: 'PATCH' }),
    unreadCount: () =>
      this.request<ApiResponse<{ count: number }>>('/chat/unread-count'),
  };

  // --- Countries ---
  countries = {
    list: () => this.request<ApiResponse<import('@beauty/shared-types').Country[]>>('/countries'),
  };
}
