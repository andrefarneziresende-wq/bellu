import { z } from 'zod';

// --- Enums ---
export const CountryCodeSchema = z.enum(['BR', 'ES']);
export const CurrencyCodeSchema = z.enum(['BRL', 'EUR']);
export const LocaleCodeSchema = z.enum(['pt-BR', 'es-ES', 'en']);
export const BookingStatusSchema = z.enum(['pending', 'confirmed', 'completed', 'cancelled', 'no_show']);
export const PaymentStatusSchema = z.enum(['pending', 'paid', 'refunded', 'failed']);
export const PaymentMethodSchema = z.enum(['pix', 'card', 'boleto', 'sepa', 'bizum', 'apple_pay', 'google_pay']);
export const PaymentGatewaySchema = z.enum(['mercadopago', 'stripe']);
export const ProfessionalStatusSchema = z.enum(['pending', 'approved', 'suspended', 'banned']);
export const AdminRoleSchema = z.enum(['superadmin', 'admin', 'moderator']);

// --- Auth ---
export const loginSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(8).optional(),
  password: z.string().min(6),
}).refine(data => data.email || data.phone, {
  message: 'Email or phone is required',
});

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().optional(),
  phone: z.string().min(8).optional(),
  password: z.string().min(6),
  countryId: z.string().uuid(),
  locale: LocaleCodeSchema,
}).refine(data => data.email || data.phone, {
  message: 'Email or phone is required',
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

// --- User ---
export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(8).optional(),
  avatar: z.string().url().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  locale: LocaleCodeSchema.optional(),
});

// --- Professional ---
export const createProfessionalSchema = z.object({
  businessName: z.string().min(2).max(150),
  description: z.string().max(1000).optional(),
  address: z.string().min(5),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  taxId: z.string().min(5).max(20),
  countryId: z.string().uuid(),
});

export const updateProfessionalSchema = z.object({
  businessName: z.string().min(2).max(150).optional(),
  description: z.string().max(1000).optional(),
  address: z.string().min(5).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  coverPhoto: z.string().url().optional(),
  avatarPhoto: z.string().url().optional(),
  taxId: z.string().min(5).max(20).optional(),
});

// --- Service ---
export const createServiceSchema = z.object({
  serviceTemplateId: z.string().uuid().optional(),
  categoryId: z.string().uuid(),
  name: z.string().min(2).max(150),
  description: z.string().max(500).optional(),
  price: z.coerce.number().positive(),
  currency: CurrencyCodeSchema,
  durationMinutes: z.coerce.number().int().min(5).max(480),
});

export const updateServiceSchema = z.object({
  categoryId: z.string().uuid().optional(),
  name: z.string().min(2).max(150).optional(),
  description: z.string().max(500).optional(),
  price: z.coerce.number().positive().optional(),
  durationMinutes: z.coerce.number().int().min(5).max(480).optional(),
  active: z.boolean().optional(),
});

// --- Booking ---
export const createBookingSchema = z.object({
  professionalId: z.string().uuid().optional(),
  serviceId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  memberId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  clientName: z.string().max(100).optional(),
  clientPhone: z.string().max(20).optional(),
  notes: z.string().max(1000).optional(),
  source: z.enum(['APP', 'MANUAL', 'WALKIN']).optional(),
  totalPrice: z.coerce.number().nonnegative().optional(),
  currency: z.string().max(3).optional(),
});

export const updateBookingStatusSchema = z.object({
  status: BookingStatusSchema,
});

// --- Review ---
export const createReviewSchema = z.object({
  bookingId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
  photoUrl: z.string().url().optional(),
});

// --- Working Hours ---
export const workingHoursSchema = z.object({
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  isOff: z.boolean(),
});

export const setWorkingHoursSchema = z.array(workingHoursSchema).min(1).max(7);

// --- Portfolio ---
export const createPortfolioItemSchema = z.object({
  serviceId: z.string().uuid().optional(),
  beforePhoto: z.string().url().optional(),
  afterPhoto: z.string().url(),
  description: z.string().max(500).optional(),
});

// --- Category (Admin) ---
export const createCategorySchema = z.object({
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  icon: z.string().min(1).max(50),
  order: z.coerce.number().int().min(0),
  translations: z.array(z.object({
    locale: LocaleCodeSchema,
    name: z.string().min(2).max(100),
  })).min(1),
});

// --- Banner (Admin) ---
export const createBannerSchema = z.object({
  imageUrl: z.string().url(),
  targetUrl: z.string().url().optional(),
  active: z.boolean().default(true),
  order: z.coerce.number().int().min(0),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  countryId: z.string().uuid().optional(),
});

// --- Expense ---
export const createExpenseSchema = z.object({
  description: z.string().min(1).max(200),
  amount: z.coerce.number().positive(),
  currency: z.string().max(3).default('BRL'),
  category: z.string().min(1).max(50),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  recurring: z.boolean().default(false),
});

export const updateExpenseSchema = z.object({
  description: z.string().min(1).max(200).optional(),
  amount: z.coerce.number().positive().optional(),
  currency: z.string().max(3).optional(),
  category: z.string().min(1).max(50).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  recurring: z.boolean().optional(),
});

// --- Promotion ---
export const createPromotionSchema = z.object({
  name: z.string().min(1).max(150),
  discountType: z.enum(['percent', 'fixed']),
  discountValue: z.coerce.number().positive(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  serviceIds: z.array(z.string().uuid()).optional(),
});

export const updatePromotionSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  discountType: z.enum(['percent', 'fixed']).optional(),
  discountValue: z.coerce.number().positive().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  active: z.boolean().optional(),
  serviceIds: z.array(z.string().uuid()).optional(),
});

// --- Member ---
export const createMemberSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().optional(),
  phone: z.string().min(8).max(20).optional(),
  avatar: z.string().url().optional(),
  role: z.string().min(1).max(50),
  roleId: z.string().uuid().optional(),
  specialties: z.string().max(500).optional(),
  commissionPercent: z.coerce.number().min(0).max(100).optional(),
});

export const updateMemberSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().min(8).max(20).nullable().optional(),
  avatar: z.string().url().optional(),
  role: z.string().min(1).max(50).optional(),
  roleId: z.string().uuid().nullable().optional(),
  specialties: z.string().max(500).nullable().optional(),
  commissionPercent: z.coerce.number().min(0).max(100).nullable().optional(),
  active: z.boolean().optional(),
});

// --- Role ---
export const createRoleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  permissions: z.array(z.string().min(1)).min(1),
});

export const updateRoleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  permissions: z.array(z.string().min(1)).optional(),
});

// --- User (Client) Creation ---
export const createClientSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().min(8).max(20).optional(),
  email: z.string().email().optional(),
  role: z.string().max(20).optional(),
});

// --- Contact ---
export const createContactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
});

// --- Payment ---
export const createPaymentSchema = z.object({
  bookingId: z.string().uuid(),
  method: PaymentMethodSchema,
});

export const processPaymentSchema = z.object({
  paymentIntentId: z.string().optional(),
  token: z.string().optional(),
});

// --- Favorite ---
export const toggleFavoriteSchema = z.object({
  professionalId: z.string().uuid(),
});

// --- Chat ---
export const sendMessageSchema = z.object({
  bookingId: z.string().uuid(),
  receiverId: z.string().uuid(),
  message: z.string().min(1).max(2000),
});

// --- Pagination ---
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

// --- Search ---
export const searchProfessionalsSchema = z.object({
  query: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().min(1).max(100).default(10),
  minRating: z.coerce.number().min(1).max(5).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  countryId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});
