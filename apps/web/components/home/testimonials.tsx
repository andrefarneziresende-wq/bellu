'use client';

import { Star } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export function Testimonials() {
  const { t } = useTranslation();

  const testimonials = [
    { name: t('website.home.testimonial1Name'), role: t('website.home.testimonial1Role'), rating: 5, text: t('website.home.testimonial1Text') },
    { name: t('website.home.testimonial2Name'), role: t('website.home.testimonial2Role'), rating: 5, text: t('website.home.testimonial2Text') },
    { name: t('website.home.testimonial3Name'), role: t('website.home.testimonial3Role'), rating: 5, text: t('website.home.testimonial3Text') },
  ];

  return (
    <section className="bg-brand-cream py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-serif text-3xl font-bold text-brand-text sm:text-4xl">
            {t('website.home.testimonialsTitle')}
          </h2>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {testimonials.map((item) => (
            <div
              key={item.name}
              className="rounded-2xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-4 flex gap-0.5">
                {Array.from({ length: item.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-brand-gold text-brand-gold" />
                ))}
              </div>
              <p className="mb-6 text-sm leading-relaxed text-brand-text-secondary">
                &ldquo;{item.text}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-rose/10 text-sm font-bold text-brand-rose">
                  {item.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-brand-text">{item.name}</p>
                  <p className="text-xs text-brand-text-secondary">{item.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
