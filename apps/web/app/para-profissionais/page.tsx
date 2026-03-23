'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import {
  Users,
  Calendar,
  DollarSign,
  Image,
  Star,
  Megaphone,
  CheckCircle,
  ChevronRight,
  Loader2,
} from 'lucide-react';

interface FieldErrors {
  businessName?: string;
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
  category?: string;
}

export default function ParaProfissionaisPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ businessName: '', name: '', email: '', phone: '', city: '', category: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const benefits = [
    { icon: Users, title: t('website.forProfessionals.benefit1Title'), desc: t('website.forProfessionals.benefit1Desc') },
    { icon: Calendar, title: t('website.forProfessionals.benefit2Title'), desc: t('website.forProfessionals.benefit2Desc') },
    { icon: DollarSign, title: t('website.forProfessionals.benefit3Title'), desc: t('website.forProfessionals.benefit3Desc') },
    { icon: Image, title: t('website.forProfessionals.benefit4Title'), desc: t('website.forProfessionals.benefit4Desc') },
    { icon: Star, title: t('website.forProfessionals.benefit5Title'), desc: t('website.forProfessionals.benefit5Desc') },
    { icon: Megaphone, title: t('website.forProfessionals.benefit6Title'), desc: t('website.forProfessionals.benefit6Desc') },
  ];

  const comparisons = [
    { before: t('website.forProfessionals.before1'), after: t('website.forProfessionals.after1') },
    { before: t('website.forProfessionals.before2'), after: t('website.forProfessionals.after2') },
    { before: t('website.forProfessionals.before3'), after: t('website.forProfessionals.after3') },
    { before: t('website.forProfessionals.before4'), after: t('website.forProfessionals.after4') },
  ];

  const faqs = [
    { q: t('website.forProfessionals.faq1Q'), a: t('website.forProfessionals.faq1A') },
    { q: t('website.forProfessionals.faq2Q'), a: t('website.forProfessionals.faq2A') },
    { q: t('website.forProfessionals.faq3Q'), a: t('website.forProfessionals.faq3A') },
    { q: t('website.forProfessionals.faq4Q'), a: t('website.forProfessionals.faq4A') },
  ];

  const validateForm = (): boolean => {
    const errors: FieldErrors = {};
    if (!form.businessName.trim()) errors.businessName = t('validation.required');
    if (!form.name.trim()) errors.name = t('validation.required');
    if (!form.email.trim()) {
      errors.email = t('validation.required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = t('validation.invalidEmail');
    }
    if (!form.phone.trim()) {
      errors.phone = t('validation.required');
    } else if (!/^[\d\s()+-]{8,20}$/.test(form.phone.trim())) {
      errors.phone = t('validation.invalidPhone');
    }
    if (!form.city.trim()) errors.city = t('validation.required');
    if (!form.category) errors.category = t('validation.selectOption');
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
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          subject: `Cadastro profissional: ${form.businessName}`,
          message: `Telefone: ${form.phone}\nCidade: ${form.city}\nCategoria: ${form.category}\nNome do negócio: ${form.businessName}`,
          source: 'pro-signup',
        }),
      });
      if (!res.ok) {
        throw new Error(t('website.forProfessionals.error'));
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('website.forProfessionals.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-cream to-white py-20 md:py-28">
        <div className="pointer-events-none absolute -right-40 top-20 h-96 w-96 rounded-full bg-brand-rose/15 blur-3xl" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-serif text-4xl font-bold text-brand-text sm:text-5xl lg:text-6xl">
            {t('website.forProfessionals.heroTitle')} <span className="text-brand-rose">{t('website.forProfessionals.heroHighlight')}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-brand-text-secondary">
            {t('website.forProfessionals.heroSubtitle')}
          </p>
          <div className="mt-8">
            <a href="#cadastro">
              <Button size="lg">
                {t('website.forProfessionals.signupCta')}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center font-serif text-3xl font-bold text-brand-text sm:text-4xl">
            {t('website.forProfessionals.benefitsTitle')}
          </h2>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b) => (
              <div key={b.title} className="rounded-2xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-rose/10 text-brand-rose">
                  <b.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 font-serif text-lg font-semibold text-brand-text">{b.title}</h3>
                <p className="text-sm leading-relaxed text-brand-text-secondary">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Before vs After */}
      <section className="bg-brand-cream py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center font-serif text-3xl font-bold text-brand-text sm:text-4xl">
            {t('website.forProfessionals.beforeAfterTitle')}
          </h2>
          <div className="mt-14 grid gap-4 sm:grid-cols-2">
            {comparisons.map((c, i) => (
              <div key={i} className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm">
                <div className="flex-1">
                  <p className="text-sm text-brand-error line-through">{c.before}</p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-brand-rose" />
                <div className="flex-1">
                  <p className="flex items-center gap-2 text-sm font-medium text-brand-success">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    {c.after}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Signup Form */}
      <section id="cadastro" className="py-20 md:py-24">
        <div className="mx-auto max-w-xl px-4 sm:px-6">
          <h2 className="text-center font-serif text-3xl font-bold text-brand-text">
            {t('website.forProfessionals.signupTitle')}
          </h2>
          <p className="mt-3 text-center text-brand-text-secondary">
            {t('website.forProfessionals.signupSubtitle')}
          </p>

          {success ? (
            <div className="mt-8 rounded-2xl bg-brand-success/10 p-8 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-brand-success" />
              <h3 className="mt-4 text-lg font-semibold text-brand-text">{t('website.forProfessionals.successTitle')}</h3>
              <p className="mt-2 text-sm text-brand-text-secondary">
                {t('website.forProfessionals.successDescription')}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-4">
              {error && (
                <div className="rounded-xl bg-brand-error/10 p-4 text-center text-sm text-brand-error">
                  {error}
                </div>
              )}
              <div>
                <input
                  className={`w-full rounded-xl border ${fieldErrors.businessName ? 'border-brand-error' : 'border-border'} bg-white px-4 py-3 text-sm focus:border-brand-rose focus:outline-none focus:ring-2 focus:ring-brand-rose/20`}
                  placeholder={t('website.forProfessionals.businessNamePlaceholder')}
                  value={form.businessName}
                  onChange={(e) => { setForm((p) => ({ ...p, businessName: e.target.value })); setFieldErrors((p: FieldErrors) => ({ ...p, businessName: '' })); }}
                />
                {fieldErrors.businessName && <p className="mt-1 text-xs text-brand-error">{fieldErrors.businessName}</p>}
              </div>
              <div>
                <input
                  className={`w-full rounded-xl border ${fieldErrors.name ? 'border-brand-error' : 'border-border'} bg-white px-4 py-3 text-sm focus:border-brand-rose focus:outline-none focus:ring-2 focus:ring-brand-rose/20`}
                  placeholder={t('website.forProfessionals.namePlaceholder')}
                  value={form.name}
                  onChange={(e) => { setForm((p) => ({ ...p, name: e.target.value })); setFieldErrors((p: FieldErrors) => ({ ...p, name: '' })); }}
                />
                {fieldErrors.name && <p className="mt-1 text-xs text-brand-error">{fieldErrors.name}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="email"
                    className={`w-full rounded-xl border ${fieldErrors.email ? 'border-brand-error' : 'border-border'} bg-white px-4 py-3 text-sm focus:border-brand-rose focus:outline-none focus:ring-2 focus:ring-brand-rose/20`}
                    placeholder={t('website.forProfessionals.emailPlaceholder')}
                    value={form.email}
                    onChange={(e) => { setForm((p) => ({ ...p, email: e.target.value })); setFieldErrors((p: FieldErrors) => ({ ...p, email: '' })); }}
                  />
                  {fieldErrors.email && <p className="mt-1 text-xs text-brand-error">{fieldErrors.email}</p>}
                </div>
                <div>
                  <input
                    className={`w-full rounded-xl border ${fieldErrors.phone ? 'border-brand-error' : 'border-border'} bg-white px-4 py-3 text-sm focus:border-brand-rose focus:outline-none focus:ring-2 focus:ring-brand-rose/20`}
                    placeholder={t('website.forProfessionals.phonePlaceholder')}
                    value={form.phone}
                    onChange={(e) => { setForm((p) => ({ ...p, phone: e.target.value })); setFieldErrors((p: FieldErrors) => ({ ...p, phone: '' })); }}
                  />
                  {fieldErrors.phone && <p className="mt-1 text-xs text-brand-error">{fieldErrors.phone}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    className={`w-full rounded-xl border ${fieldErrors.city ? 'border-brand-error' : 'border-border'} bg-white px-4 py-3 text-sm focus:border-brand-rose focus:outline-none focus:ring-2 focus:ring-brand-rose/20`}
                    placeholder={t('website.forProfessionals.cityPlaceholder')}
                    value={form.city}
                    onChange={(e) => { setForm((p) => ({ ...p, city: e.target.value })); setFieldErrors((p: FieldErrors) => ({ ...p, city: '' })); }}
                  />
                  {fieldErrors.city && <p className="mt-1 text-xs text-brand-error">{fieldErrors.city}</p>}
                </div>
                <div>
                  <select
                    className={`w-full rounded-xl border ${fieldErrors.category ? 'border-brand-error' : 'border-border'} bg-white px-4 py-3 text-sm text-brand-text-secondary focus:border-brand-rose focus:outline-none focus:ring-2 focus:ring-brand-rose/20`}
                    value={form.category}
                    onChange={(e) => { setForm((p) => ({ ...p, category: e.target.value })); setFieldErrors((p: FieldErrors) => ({ ...p, category: '' })); }}
                  >
                  <option value="">{t('website.forProfessionals.category')}</option>
                  <option value="cabelo">{t('website.forProfessionals.catHair')}</option>
                  <option value="unhas">{t('website.forProfessionals.catNails')}</option>
                  <option value="estetica-facial">{t('website.forProfessionals.catFacial')}</option>
                  <option value="estetica-corporal">{t('website.forProfessionals.catBody')}</option>
                  <option value="sobrancelhas">{t('website.forProfessionals.catEyebrows')}</option>
                  <option value="depilacao">{t('website.forProfessionals.catWaxing')}</option>
                  <option value="barbearia">{t('website.forProfessionals.catBarber')}</option>
                  <option value="massagem">{t('website.forProfessionals.catMassage')}</option>
                  </select>
                  {fieldErrors.category && <p className="mt-1 text-xs text-brand-error">{fieldErrors.category}</p>}
                </div>
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('website.forProfessionals.register')}
              </Button>
            </form>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-brand-cream py-20 md:py-24">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <h2 className="text-center font-serif text-3xl font-bold text-brand-text">
            {t('website.forProfessionals.faqTitle')}
          </h2>
          <div className="mt-10 space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl bg-white shadow-sm">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between p-5 text-left"
                >
                  <span className="font-medium text-brand-text">{faq.q}</span>
                  <ChevronRight className={`h-5 w-5 text-brand-text-secondary transition-transform ${openFaq === i ? 'rotate-90' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="border-t border-border px-5 pb-5 pt-3">
                    <p className="text-sm leading-relaxed text-brand-text-secondary">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
