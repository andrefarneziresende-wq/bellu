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
  private getHeaders(custom?: Record<string, string>): Record<string, string> {
    const token = useAuthStore.getState().token;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...custom,
    };
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers } = options;

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: this.getHeaders(headers),
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
