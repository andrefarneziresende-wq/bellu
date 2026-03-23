'use client';

import { Search, CalendarDays, Heart } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export function HowItWorks() {
  const { t } = useTranslation();

  const steps = [
    { icon: Search, title: t('website.home.step1Title'), description: t('website.home.step1Desc') },
    { icon: CalendarDays, title: t('website.home.step2Title'), description: t('website.home.step2Desc') },
    { icon: Heart, title: t('website.home.step3Title'), description: t('website.home.step3Desc') },
  ];

  return (
    <section className="bg-brand-cream py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-serif text-3xl font-bold text-brand-text sm:text-4xl">
            {t('website.home.howItWorksTitle')}
          </h2>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-3">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="group relative rounded-2xl bg-white p-8 text-center shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Step number */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-brand-rose text-sm font-bold text-white">
                {i + 1}
              </div>
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-rose/10 text-brand-rose transition-colors group-hover:bg-brand-rose group-hover:text-white">
                <step.icon className="h-7 w-7" />
              </div>
              <h3 className="mb-2 font-serif text-xl font-semibold text-brand-text">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-brand-text-secondary">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
