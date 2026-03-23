'use client';

import { useState } from 'react';
import { CheckCircle, Loader2, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface FieldErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

export default function ContatoPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const validateForm = (): boolean => {
    const errors: FieldErrors = {};
    if (!form.name.trim()) errors.name = t('validation.required');
    if (!form.email.trim()) {
      errors.email = t('validation.required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = t('validation.invalidEmail');
    }
    if (!form.subject.trim()) errors.subject = t('validation.required');
    if (!form.message.trim()) {
      errors.message = t('validation.required');
    } else if (form.message.trim().length < 10) {
      errors.message = t('validation.minLength', { min: '10' });
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      const res = await fetch(`${API_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, source: 'website' }),
      });
      if (!res.ok) {
        throw new Error(t('website.contact.error'));
      }
      setSuccess(true);
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('website.contact.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-20">
      <section className="bg-brand-cream py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h1 className="font-serif text-4xl font-bold text-brand-text sm:text-5xl">{t('website.contact.title')}</h1>
          <p className="mt-4 text-lg text-brand-text-secondary">
            {t('website.contact.heroSubtitle')}
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Info */}
            <div className="space-y-8">
              <div>
                <h2 className="font-serif text-2xl font-bold text-brand-text">{t('website.contact.subtitle')}</h2>
                <p className="mt-2 text-brand-text-secondary">
                  {t('website.contact.infoText')}
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="mt-1 h-5 w-5 text-brand-rose" />
                  <div>
                    <p className="font-medium text-brand-text">{t('website.contact.emailLabel')}</p>
                    <p className="text-sm text-brand-text-secondary">contato@bellu.com.br</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="mt-1 h-5 w-5 text-brand-rose" />
                  <div>
                    <p className="font-medium text-brand-text">{t('website.contact.location')}</p>
                    <p className="text-sm text-brand-text-secondary">{t('website.contact.locationValue')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div>
              {success ? (
                <div className="rounded-2xl bg-brand-success/10 p-8 text-center">
                  <CheckCircle className="mx-auto h-12 w-12 text-brand-success" />
                  <h3 className="mt-4 text-lg font-semibold text-brand-text">{t('website.contact.success')}</h3>
                  <p className="mt-2 text-sm text-brand-text-secondary">
                    {t('website.contact.successDescription')}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  {error && (
                    <div className="rounded-xl bg-brand-error/10 p-4 text-center text-sm text-brand-error">
                      {error}
                    </div>
                  )}
                  <div>
                    <input
                      className={`w-full rounded-xl border ${fieldErrors.name ? 'border-brand-error' : 'border-border'} bg-white px-4 py-3 text-sm focus:border-brand-rose focus:outline-none focus:ring-2 focus:ring-brand-rose/20`}
                      placeholder={t('website.contact.namePlaceholder')}
                      value={form.name}
                      onChange={(e) => { setForm((p) => ({ ...p, name: e.target.value })); setFieldErrors((p: FieldErrors) => ({ ...p, name: '' })); }}
                    />
                    {fieldErrors.name && <p className="mt-1 text-xs text-brand-error">{fieldErrors.name}</p>}
                  </div>
                  <div>
                    <input
                      type="email"
                      className={`w-full rounded-xl border ${fieldErrors.email ? 'border-brand-error' : 'border-border'} bg-white px-4 py-3 text-sm focus:border-brand-rose focus:outline-none focus:ring-2 focus:ring-brand-rose/20`}
                      placeholder={t('website.contact.emailPlaceholder')}
                      value={form.email}
                      onChange={(e) => { setForm((p) => ({ ...p, email: e.target.value })); setFieldErrors((p: FieldErrors) => ({ ...p, email: '' })); }}
                    />
                    {fieldErrors.email && <p className="mt-1 text-xs text-brand-error">{fieldErrors.email}</p>}
                  </div>
                  <div>
                    <input
                      className={`w-full rounded-xl border ${fieldErrors.subject ? 'border-brand-error' : 'border-border'} bg-white px-4 py-3 text-sm focus:border-brand-rose focus:outline-none focus:ring-2 focus:ring-brand-rose/20`}
                      placeholder={t('website.contact.subjectPlaceholder')}
                      value={form.subject}
                      onChange={(e) => { setForm((p) => ({ ...p, subject: e.target.value })); setFieldErrors((p: FieldErrors) => ({ ...p, subject: '' })); }}
                    />
                    {fieldErrors.subject && <p className="mt-1 text-xs text-brand-error">{fieldErrors.subject}</p>}
                  </div>
                  <div>
                    <textarea
                      rows={5}
                      className={`w-full rounded-xl border ${fieldErrors.message ? 'border-brand-error' : 'border-border'} bg-white px-4 py-3 text-sm focus:border-brand-rose focus:outline-none focus:ring-2 focus:ring-brand-rose/20`}
                      placeholder={t('website.contact.messagePlaceholder')}
                      value={form.message}
                      onChange={(e) => { setForm((p) => ({ ...p, message: e.target.value })); setFieldErrors((p: FieldErrors) => ({ ...p, message: '' })); }}
                    />
                    {fieldErrors.message && <p className="mt-1 text-xs text-brand-error">{fieldErrors.message}</p>}
                  </div>
                  <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('website.contact.send')}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
