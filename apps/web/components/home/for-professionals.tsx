'use client';

import { Users, Calendar, DollarSign, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';

export function ForProfessionals() {
  const { t } = useTranslation();

  const benefits = [
    { icon: Users, title: t('website.home.forProsBenefit1Title'), description: t('website.home.forProsBenefit1Desc') },
    { icon: Calendar, title: t('website.home.forProsBenefit2Title'), description: t('website.home.forProsBenefit2Desc') },
    { icon: DollarSign, title: t('website.home.forProsBenefit3Title'), description: t('website.home.forProsBenefit3Desc') },
    { icon: Image, title: t('website.home.forProsBenefit4Title'), description: t('website.home.forProsBenefit4Desc') },
  ];

  return (
    <section className="bg-brand-cream py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-serif text-3xl font-bold text-brand-text sm:text-4xl">
            {t('website.home.forProsTitle')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-brand-text-secondary">
            {t('website.home.forProsSubtitle')}
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="rounded-2xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gold/10 text-brand-gold">
                <b.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 font-serif text-lg font-semibold text-brand-text">
                {b.title}
              </h3>
              <p className="text-sm leading-relaxed text-brand-text-secondary">
                {b.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/para-profissionais">
            <Button size="lg">{t('website.home.forProsCta')}</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
