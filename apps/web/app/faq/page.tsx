'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function FaqPage() {
  const [open, setOpen] = useState<string | null>(null);
  const { t } = useTranslation();

  const sections = [
    {
      title: t('website.faq.forConsumers'),
      faqs: [
        { q: t('website.faq.consumer1Q'), a: t('website.faq.consumer1A') },
        { q: t('website.faq.consumer2Q'), a: t('website.faq.consumer2A') },
        { q: t('website.faq.consumer3Q'), a: t('website.faq.consumer3A') },
        { q: t('website.faq.consumer4Q'), a: t('website.faq.consumer4A') },
      ],
    },
    {
      title: t('website.faq.forProfessionals'),
      faqs: [
        { q: t('website.faq.pro1Q'), a: t('website.faq.pro1A') },
        { q: t('website.faq.pro2Q'), a: t('website.faq.pro2A') },
        { q: t('website.faq.pro3Q'), a: t('website.faq.pro3A') },
        { q: t('website.faq.pro4Q'), a: t('website.faq.pro4A') },
      ],
    },
    {
      title: t('website.faq.payments'),
      faqs: [
        { q: t('website.faq.pay1Q'), a: t('website.faq.pay1A') },
        { q: t('website.faq.pay2Q'), a: t('website.faq.pay2A') },
      ],
    },
    {
      title: t('website.faq.account'),
      faqs: [
        { q: t('website.faq.account1Q'), a: t('website.faq.account1A') },
        { q: t('website.faq.account2Q'), a: t('website.faq.account2A') },
      ],
    },
  ];

  return (
    <div className="pt-20">
      <section className="bg-brand-cream py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h1 className="font-serif text-4xl font-bold text-brand-text sm:text-5xl">
            {t('website.faq.title')}
          </h1>
          <p className="mt-4 text-lg text-brand-text-secondary">
            {t('website.faq.subtitle')}
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-2xl space-y-12 px-4 sm:px-6">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="mb-4 font-serif text-2xl font-bold text-brand-text">{section.title}</h2>
              <div className="space-y-3">
                {section.faqs.map((faq, i) => {
                  const key = `${section.title}-${i}`;
                  return (
                    <div key={key} className="rounded-xl bg-white shadow-sm">
                      <button
                        onClick={() => setOpen(open === key ? null : key)}
                        className="flex w-full items-center justify-between p-5 text-left"
                      >
                        <span className="font-medium text-brand-text">{faq.q}</span>
                        <ChevronRight className={`h-5 w-5 shrink-0 text-brand-text-secondary transition-transform ${open === key ? 'rotate-90' : ''}`} />
                      </button>
                      {open === key && (
                        <div className="border-t border-border px-5 pb-5 pt-3">
                          <p className="text-sm leading-relaxed text-brand-text-secondary">{faq.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
