'use client';

import { Scissors, Paintbrush, Sparkles, Dumbbell, Eye, Zap, CircleUser, Hand } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export function Categories() {
  const { t } = useTranslation();

  const categories = [
    { icon: Scissors, name: t('website.home.catHair'), color: 'bg-pink-50 text-pink-500' },
    { icon: Paintbrush, name: t('website.home.catNails'), color: 'bg-red-50 text-red-400' },
    { icon: Sparkles, name: t('website.home.catFace'), color: 'bg-amber-50 text-amber-500' },
    { icon: Dumbbell, name: t('website.home.catBody'), color: 'bg-emerald-50 text-emerald-500' },
    { icon: Eye, name: t('website.home.catBrows'), color: 'bg-violet-50 text-violet-500' },
    { icon: Zap, name: t('website.home.catWaxing'), color: 'bg-orange-50 text-orange-500' },
    { icon: CircleUser, name: t('website.home.catBarber'), color: 'bg-sky-50 text-sky-500' },
    { icon: Hand, name: t('website.home.catMassage'), color: 'bg-teal-50 text-teal-500' },
  ];

  return (
    <section className="py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-serif text-3xl font-bold text-brand-text sm:text-4xl">
            {t('website.home.categoriesTitle')}
          </h2>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-6">
          {categories.map((cat) => (
            <button
              key={cat.name}
              className="group flex flex-col items-center gap-3 rounded-2xl bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 cursor-pointer"
            >
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl ${cat.color} transition-transform group-hover:scale-110`}
              >
                <cat.icon className="h-7 w-7" />
              </div>
              <span className="text-sm font-medium text-brand-text">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
