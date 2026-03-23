'use client';

import { useEffect, useState, useRef } from 'react';
import { useTranslation } from '@/lib/i18n';

function useCountUp(target: number, inView: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let frame: number;
    const duration = 2000;
    const start = performance.now();

    function animate(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) frame = requestAnimationFrame(animate);
    }
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [target, inView]);

  return count;
}

function StatCard({ label, target, suffix, inView, locale }: { label: string; target: number; suffix: string; inView: boolean; locale: string }) {
  const count = useCountUp(target, inView);
  return (
    <div className="text-center">
      <p className="font-serif text-4xl font-bold text-brand-rose sm:text-5xl">
        {count.toLocaleString(locale)}{suffix}
      </p>
      <p className="mt-2 text-sm font-medium text-brand-text-secondary">{label}</p>
    </div>
  );
}

export function Numbers() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const { t, locale } = useTranslation();

  const stats = [
    { label: t('website.home.statProfessionals'), target: 500, suffix: '+' },
    { label: t('website.home.statBookings'), target: 10000, suffix: '+' },
    { label: t('website.home.statCities'), target: 50, suffix: '+' },
    { label: t('website.home.statReviews'), target: 8000, suffix: '+' },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-serif text-3xl font-bold text-brand-text sm:text-4xl">
            {t('website.home.numbersTitle')}
          </h2>
        </div>
        <div className="mt-14 grid grid-cols-2 gap-8 sm:grid-cols-4">
          {stats.map((s) => (
            <StatCard key={s.label} {...s} inView={inView} locale={locale} />
          ))}
        </div>
      </div>
    </section>
  );
}
