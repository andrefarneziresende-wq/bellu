import { Platform } from 'react-native';
import { useAuthStore } from '../stores/authStore';

const DEFAULT_API_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? `http://${DEFAULT_API_HOST}:3333/api`;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: Record<string, unknown> | unknown[];
  headers?: Record<string, string>;
}

class ApiService {
  private getHeaders(hasBody: boolean, custom?: Record<string, string>): Record<string, string> {
    const token = useAuthStore.getState().token;
    return {
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...custom,
    };
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers } = options;

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: this.getHeaders(!!body, headers),
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (!response.ok) {
      if (response.status === 401) {
        useAuthStore.getState().logout();
      }
      const error = await response.json().catch(() => ({}));
      throw new ApiError(response.status, error.message || 'Request failed');
    }

    return response.json();
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, body: Record<string, unknown> | unknown[]) {
    return this.request<T>(endpoint, { method: 'POST', body });
  }

  put<T>(endpoint: string, body: Record<string, unknown> | unknown[]) {
    return this.request<T>(endpoint, { method: 'PUT', body });
  }

  patch<T>(endpoint: string, body: Record<string, unknown>) {
    return this.request<T>(endpoint, { method: 'PATCH', body });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export const api = new ApiService();

// ─── Type Interfaces ─────────────────────────────────────────────────────────

export interface Booking {
  id: string;
  clientName: string;
  clientAvatar?: string;
  service: string;
  date: string;
  time: string;
  startTime?: string;
  endTime?: string;
  duration: number;
  price: number;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  notes?: string;
  client?: {
    id: string;
    name: string;
    phone?: string;
    avatar?: string;
  };
  serviceDetails?: {
    id: string;
    name: string;
    price: number;
    duration: number;
  };
}

export interface DashboardStats {
  todayBookings: number;
  weekRevenue: number;
  monthRevenue: number;
  rating: number;
  completedToday: number;
  pendingReviews: number;
  totalClients?: number;
  occupancyRate?: number;
}

export interface PortfolioItem {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
  service: string;
  likes: number;
  createdAt: string;
}

export interface FinanceSummary {
  availableBalance: number;
  pendingBalance: number;
  monthEarnings: number;
  weekEarnings: number;
  transactions: Transaction[];
}

export interface Transaction {
  id: string;
  type: 'earning' | 'withdrawal' | 'refund' | 'income' | 'fee';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface WorkingHour {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isOff: boolean;
}

// ─── Conversations (Direct Messaging) ────────────────────────────────────────

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
    api.get<{ data: ConversationData[] }>('/conversations'),

  getMessages: (conversationId: string, page = 1) =>
    api.get<{
      data: {
        messages: ConversationMessageData[];
        conversation: {
          id: string;
          client: { id: string; name: string; avatar: string | null };
          professional: { id: string; businessName: string; avatarPhoto: string | null; userId: string };
        };
        pagination: { total: number; page: number; perPage: number; totalPages: number };
      };
    }>(`/conversations/${conversationId}/messages?page=${page}`),

  sendMessage: (conversationId: string, data: { message?: string; imageUrl?: string }) =>
    api.post<{ data: ConversationMessageData }>(`/conversations/${conversationId}/messages`, data as Record<string, unknown>),

  markRead: (conversationId: string) =>
    api.patch<{ data: { markedAsRead: number } }>(`/conversations/${conversationId}/read`, {}),

  unreadCount: () =>
    api.get<{ data: { unreadCount: number } }>('/conversations/unread-count'),
};

// ─── Upload ──────────────────────────────────────────────────────────────────

export const uploadImage = async (uri: string, folder = 'uploads') => {
  const token = useAuthStore.getState().token;
  const formData = new FormData();

  const normalizedUri = Platform.OS === 'android' ? uri : uri.replace('file://', '');
  const rawName = uri.split('/').pop() || '';
  const hasExt = /\.\w+$/.test(rawName);
  const filename = hasExt ? rawName : `photo_${Date.now()}.jpg`;
  const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
  const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  formData.append('file', {
    uri: Platform.OS === 'android' ? uri : normalizedUri,
    name: filename,
    type: mimeType,
  } as unknown as Blob);

  const response = await fetch(`${API_BASE_URL.replace('/api', '')}/api/upload?folder=${folder}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    let message = 'Upload failed';
    try { message = JSON.parse(text).message || message; } catch {}
    throw new Error(message);
  }

  return response.json() as Promise<{ data: { url: string } }>;
};
