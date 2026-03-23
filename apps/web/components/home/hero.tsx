'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';

export function Hero() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
      {/* Decorative blurred circles */}
      <div className="pointer-events-none absolute top-20 -left-32 h-96 w-96 rounded-full bg-brand-rose/20 blur-3xl" />
      <div className="pointer-events-none absolute top-40 -right-32 h-80 w-80 rounded-full bg-brand-gold/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-brand-rose-light/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Copy */}
          <div className="text-center lg:text-left">
            <h1 className="font-serif text-4xl font-bold leading-tight text-brand-text sm:text-5xl lg:text-6xl">
              {t('website.home.heroTitle')}{' '}
              <span className="text-brand-rose">{t('website.home.heroHighlight')}</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-brand-text-secondary sm:text-xl">
              {t('website.home.heroSubtitle')}
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row lg:justify-start">
              <Button size="lg">{t('website.nav.downloadApp')}</Button>
              <Link href="/para-profissionais">
                <Button variant="outline" size="lg">
                  {t('website.home.imProfessional')}
                </Button>
              </Link>
            </div>
          </div>

          {/* App mockup placeholder */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              <div className="h-[480px] w-[260px] rounded-[2.5rem] border-4 border-brand-rose/20 bg-gradient-to-br from-brand-cream to-white p-4 shadow-2xl sm:h-[540px] sm:w-[280px]">
                {/* Status bar placeholder */}
                <div className="mb-4 flex items-center justify-between px-2 pt-2">
                  <div className="h-2 w-10 rounded bg-brand-text/20" />
                  <div className="h-2 w-6 rounded bg-brand-text/20" />
                </div>
                {/* Content placeholders */}
                <div className="space-y-3 px-2">
                  <div className="h-4 w-3/4 rounded bg-brand-rose/20" />
                  <div className="h-3 w-1/2 rounded bg-brand-text/10" />
                  <div className="mt-4 h-24 w-full rounded-xl bg-brand-rose/10" />
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="h-16 rounded-lg bg-brand-gold/15" />
                    <div className="h-16 rounded-lg bg-brand-rose/15" />
                    <div className="h-16 rounded-lg bg-brand-gold/10" />
                  </div>
                  <div className="mt-2 space-y-2">
                    <div className="h-14 rounded-xl bg-brand-cream" />
                    <div className="h-14 rounded-xl bg-brand-cream" />
                    <div className="h-14 rounded-xl bg-brand-cream" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
