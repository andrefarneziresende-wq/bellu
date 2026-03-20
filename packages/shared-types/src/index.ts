// ============================================================
// Shared Types — Beauty Marketplace
// ============================================================

// --- Country ---
export interface Country {
  id: string;
  code: CountryCode;
  name: string;
  currency: CurrencyCode;
  currencySymbol: string;
  timezone: string;
  locale: LocaleCode;
  phonePrefix: string;
  active: boolean;
}

export type CountryCode = 'BR' | 'ES';
export type CurrencyCode = 'BRL' | 'EUR';
export type LocaleCode = 'pt-BR' | 'es-ES' | 'en';

// --- User ---
export interface User {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  latitude: number | null;
  longitude: number | null;
  countryId: string;
  locale: LocaleCode;
  createdAt: string;
}

// --- Professional ---
export type ProfessionalStatus = 'pending' | 'approved' | 'suspended' | 'banned';

export interface Professional {
  id: string;
  userId: string;
  businessName: string;
  description: string | null;
  address: string;
  latitude: number;
  longitude: number;
  coverPhoto: string | null;
  avatarPhoto: string | null;
  rating: number;
  totalReviews: number;
  verified: boolean;
  active: boolean;
  status: ProfessionalStatus;
  countryId: string;
  taxId: string;
  createdAt: string;
}

// --- Category ---
export interface Category {
  id: string;
  slug: string;
  icon: string;
  order: number;
  translations: CategoryTranslation[];
}

export interface CategoryTranslation {
  id: string;
  categoryId: string;
  locale: LocaleCode;
  name: string;
}

// --- Service ---
export interface Service {
  id: string;
  professionalId: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: number;
  currency: CurrencyCode;
  durationMinutes: number;
  active: boolean;
}

// --- Booking ---
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';

export interface Booking {
  id: string;
  userId: string;
  professionalId: string;
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  totalPrice: number;
  currency: CurrencyCode;
  paymentStatus: PaymentStatus;
  createdAt: string;
}

// --- Review ---
export interface Review {
  id: string;
  bookingId: string;
  userId: string;
  professionalId: string;
  rating: number;
  comment: string | null;
  photoUrl: string | null;
  createdAt: string;
}

// --- Payment ---
export type PaymentMethod = 'pix' | 'card' | 'boleto' | 'sepa' | 'bizum' | 'apple_pay' | 'google_pay';
export type PaymentGateway = 'mercadopago' | 'stripe';

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  currency: CurrencyCode;
  method: PaymentMethod;
  status: PaymentStatus;
  gateway: PaymentGateway;
  externalId: string | null;
  createdAt: string;
}

// --- Chat ---
export interface ChatMessage {
  id: string;
  bookingId: string;
  senderId: string;
  receiverId: string;
  message: string;
  readAt: string | null;
  createdAt: string;
}

// --- Portfolio ---
export interface PortfolioItem {
  id: string;
  professionalId: string;
  serviceId: string | null;
  beforePhoto: string | null;
  afterPhoto: string;
  description: string | null;
  createdAt: string;
}

// --- Working Hours ---
export interface WorkingHours {
  id: string;
  professionalId: string;
  dayOfWeek: number; // 0=Sunday, 6=Saturday
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  isOff: boolean;
}

// --- Favorite ---
export interface Favorite {
  id: string;
  userId: string;
  professionalId: string;
  createdAt: string;
}

// --- Banner ---
export interface Banner {
  id: string;
  imageUrl: string;
  targetUrl: string | null;
  active: boolean;
  order: number;
  startDate: string | null;
  endDate: string | null;
  countryId: string | null;
}

// --- Admin ---
export type AdminRole = 'superadmin' | 'admin' | 'moderator';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  countryId: string | null;
}

// --- API Response ---
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    lastPage: number;
  };
}

// --- Auth ---
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email?: string;
  phone?: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email?: string;
  phone?: string;
  password: string;
  countryId: string;
  locale: LocaleCode;
}
