'use client';

import { useState } from 'react';
import { Loader2, Mail, Lock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/lib/i18n';

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useTranslation();

  function clearFieldError(field: keyof FieldErrors) {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setApiError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError('');

    const fieldErrors = validateForm(email, password, t);
    setErrors(fieldErrors);

    if (Object.keys(fieldErrors).length > 0) return;

    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('errors.generic');
      if (message.includes('Unauthorized') || message.includes('Invalid credentials') || message.includes('credentials')) {
        setApiError(t('errors.invalidCredentials'));
      } else if (message.includes('Failed to fetch') || message.includes('fetch')) {
        setApiError(t('errors.network'));
      } else {
        setApiError(message);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-cream p-4">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-brand-rose/10 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-brand-gold/10 blur-3xl" />
      </div>

      <Card className="relative w-full max-w-[420px] border-brand-rose/20 shadow-lg">
        <CardHeader className="pb-2 pt-8 text-center">
          {/* Logo */}
          <img src="/logo.png" alt="Bellu" className="mx-auto mb-5 h-14 w-auto" />

          <h1 className="font-serif text-2xl font-bold text-brand-text">
            Bellu Admin
          </h1>
          <p className="mt-1 text-sm text-brand-text-secondary">
            {t('adminPanel.adminUsers.subtitle')}
          </p>
        </CardHeader>

        <CardContent className="px-8 pb-8 pt-4">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* API Error */}
            {apiError && (
              <div className="flex items-start gap-2 rounded-lg border border-brand-error/30 bg-brand-error/5 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-error" />
                <p className="text-sm text-brand-error">{apiError}</p>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">{t('auth.emailPlaceholder')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearFieldError('email');
                  }}
                  className={`pl-10 ${errors.email ? 'border-brand-error focus-visible:ring-brand-error' : ''}`}
                  disabled={isLoading}
                  autoComplete="email"
                  autoFocus
                />
              </div>
              {errors.email && (
                <p className="text-xs text-brand-error">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password">{t('auth.passwordPlaceholder')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearFieldError('password');
                  }}
                  className={`pl-10 ${errors.password ? 'border-brand-error focus-visible:ring-brand-error' : ''}`}
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>
              {errors.password && (
                <p className="text-xs text-brand-error">{errors.password}</p>
              )}
            </div>

            {/* Submit */}
            <Button
              className="w-full bg-gradient-to-r from-brand-rose to-brand-rose-dark text-white shadow-md hover:shadow-lg transition-shadow"
              type="submit"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                t('auth.login')
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            {t('adminPanel.adminUsers.subtitle')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
