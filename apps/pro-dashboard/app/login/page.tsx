'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/lib/i18n';
import { Loader2, AlertCircle } from 'lucide-react';
import { ApiError } from '@/lib/api';

interface FieldErrors {
  email?: string;
  password?: string;
}

function validateForm(email: string, password: string, t: (key: string, params?: Record<string, string>) => string): FieldErrors {
  const errors: FieldErrors = {};

  if (!email.trim()) {
    errors.email = t('validation.required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = t('validation.invalidEmail');
  }

  if (!password) {
    errors.password = t('validation.required');
  } else if (password.length < 4) {
    errors.password = t('validation.minLength', { min: '4' });
  }

  return errors;
}

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  function clearFieldError(field: keyof FieldErrors) {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setApiError('');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');

    const fieldErrors = validateForm(email, password, t);
    setErrors(fieldErrors);

    if (Object.keys(fieldErrors).length > 0) return;

    setLoading(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        switch (err.code) {
          case 'UNAUTHORIZED':
            setApiError(t('errors.invalidCredentials'));
            break;
          case 'NETWORK_ERROR':
            setApiError(t('errors.network'));
            break;
          case 'VALIDATION_ERROR':
            setApiError(t('errors.validationError'));
            break;
          default:
            setApiError(err.status >= 500 ? t('errors.serverError') : t('errors.generic'));
        }
      } else {
        setApiError(t('errors.generic'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left — Branding */}
      <div className="hidden w-1/2 items-center justify-center bg-gradient-to-br from-brand-rose to-brand-rose-dark lg:flex">
        <div className="text-center text-white">
          <img src="/logo.png" alt="Bellu" className="mx-auto mb-4 h-20 w-auto" />
          <h1 className="font-serif text-4xl font-bold">Bellu Pro</h1>
          <p className="mt-2 text-lg opacity-90">{t('auth.loginSubtitle')}</p>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex w-full items-center justify-center px-8 lg:w-1/2">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <div className="mb-6 flex items-center justify-center gap-2 lg:justify-start">
              <img src="/logo.png" alt="Bellu" className="h-10 w-auto" />
              <span className="font-serif text-2xl font-bold text-brand-text">Pro</span>
            </div>
            <h2 className="text-2xl font-bold text-brand-text">{t('auth.loginTitle')}</h2>
            <p className="mt-1 text-sm text-brand-text-secondary">
              {t('auth.loginSubtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* API Error */}
            {apiError && (
              <div className="flex items-start gap-2 rounded-lg border border-brand-error/30 bg-brand-error/10 px-4 py-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-error" />
                <p className="text-sm text-brand-error">{apiError}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-brand-text" htmlFor="email">
                {t('auth.emailPlaceholder')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearFieldError('email');
                }}
                className={`w-full rounded-xl border bg-background px-4 py-3 text-sm transition-colors focus:border-brand-rose focus:outline-none focus:ring-2 focus:ring-brand-rose/20 ${errors.email ? 'border-brand-error focus:border-brand-error focus:ring-brand-error/20' : 'border-border'}`}
                placeholder={t('auth.emailPlaceholder')}
                disabled={loading}
                autoComplete="email"
                autoFocus
              />
              {errors.email && (
                <p className="text-xs text-brand-error">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-brand-text" htmlFor="password">
                {t('auth.passwordPlaceholder')}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearFieldError('password');
                }}
                className={`w-full rounded-xl border bg-background px-4 py-3 text-sm transition-colors focus:border-brand-rose focus:outline-none focus:ring-2 focus:ring-brand-rose/20 ${errors.password ? 'border-brand-error focus:border-brand-error focus:ring-brand-error/20' : 'border-border'}`}
                placeholder="••••••••"
                disabled={loading}
                autoComplete="current-password"
              />
              {errors.password && (
                <p className="text-xs text-brand-error">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-rose px-4 py-3 font-medium text-white transition-colors hover:bg-brand-rose-dark disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                t('auth.login')
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
