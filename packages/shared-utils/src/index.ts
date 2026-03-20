import { format } from 'date-fns';
import { ptBR, es, enUS } from 'date-fns/locale';

// --- Currency formatting ---
const currencyConfig = {
  BRL: { locale: 'pt-BR', currency: 'BRL' },
  EUR: { locale: 'es-ES', currency: 'EUR' },
} as const;

export function formatCurrency(amount: number, currency: 'BRL' | 'EUR'): string {
  const config = currencyConfig[currency];
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currency,
  }).format(amount);
}

// --- Date formatting ---
const dateLocales = {
  'pt-BR': ptBR,
  'es-ES': es,
  'en': enUS,
} as const;

export function formatDate(date: Date | string, formatStr: string, locale: 'pt-BR' | 'es-ES' | 'en' = 'pt-BR'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, formatStr, { locale: dateLocales[locale] });
}

export function formatShortDate(date: Date | string, locale: 'pt-BR' | 'es-ES' | 'en' = 'pt-BR'): string {
  return formatDate(date, 'dd MMM yyyy', locale);
}

export function formatTime(time: string): string {
  return time.substring(0, 5); // HH:mm
}

// --- Phone formatting ---
export function formatPhone(phone: string, countryCode: 'BR' | 'ES'): string {
  const digits = phone.replace(/\D/g, '');
  if (countryCode === 'BR') {
    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    return phone;
  }
  if (countryCode === 'ES') {
    if (digits.length === 9) {
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    }
    return phone;
  }
  return phone;
}

// --- Tax ID formatting ---
export function formatTaxId(taxId: string, countryCode: 'BR' | 'ES'): string {
  const digits = taxId.replace(/\D/g, '');
  if (countryCode === 'BR') {
    if (digits.length === 11) {
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
    }
    if (digits.length === 14) {
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
    }
  }
  return taxId;
}

// --- Rating ---
export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

// --- Slug ---
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// --- Duration ---
export function formatDuration(minutes: number, locale: 'pt-BR' | 'es-ES' | 'en' = 'pt-BR'): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (locale === 'en') {
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// --- Distance ---
export function calculateDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}
