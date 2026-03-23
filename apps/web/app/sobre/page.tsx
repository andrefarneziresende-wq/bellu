'use client';

import { Heart, Shield, Sparkles } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function SobrePage() {
  const { t } = useTranslation();

  const values = [
    { icon: Heart, title: t('website.about.value1Title'), desc: t('website.about.value1Desc') },
    { icon: Shield, title: t('website.about.value2Title'), desc: t('website.about.value2Desc') },
    { icon: Sparkles, title: t('website.about.value3Title'), desc: t('website.about.value3Desc') },
  ];

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="bg-brand-cream py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h1 className="font-serif text-4xl font-bold text-brand-text sm:text-5xl">
            {t('website.about.title')}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-brand-text-secondary">
            {t('website.about.description')}
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="font-serif text-3xl font-bold text-brand-text">{t('website.about.missionTitle')}</h2>
              <p className="mt-4 text-brand-text-secondary leading-relaxed">
                {t('website.about.missionP1')}
              </p>
              <p className="mt-4 text-brand-text-secondary leading-relaxed">
                {t('website.about.missionP2')}
              </p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-brand-rose/10 to-brand-gold/10 p-12 text-center">
              <Sparkles className="mx-auto h-16 w-16 text-brand-rose" />
              <p className="mt-6 font-serif text-2xl font-bold text-brand-text">
                &ldquo;{t('website.about.quote')}&rdquo;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-brand-cream py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center font-serif text-3xl font-bold text-brand-text">
            {t('website.about.valuesTitle')}
          </h2>
          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {values.map((v) => (
              <div key={v.title} className="rounded-2xl bg-white p-8 text-center shadow-sm">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-rose/10 text-brand-rose">
                  <v.icon className="h-7 w-7" />
                </div>
                <h3 className="mb-2 font-serif text-xl font-semibold text-brand-text">{v.title}</h3>
                <p className="text-sm leading-relaxed text-brand-text-secondary">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
