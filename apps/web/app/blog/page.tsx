'use client';

import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

const posts = [
  {
    slug: 'tendencias-beleza-2025',
    title: 'Tendências de beleza para 2025',
    excerpt: 'Descubra os tratamentos e estilos que estão dominando o mercado de beleza neste ano.',
    date: '2025-01-15',
    category: 'Tendências',
    image: null,
  },
  {
    slug: 'como-escolher-profissional',
    title: 'Como escolher o profissional de beleza ideal',
    excerpt: 'Dicas práticas para avaliar portfólios, avaliações e encontrar o match perfeito.',
    date: '2025-01-10',
    category: 'Dicas',
    image: null,
  },
  {
    slug: 'dicas-profissionais-aumentar-clientes',
    title: '5 dicas para profissionais aumentarem sua clientela',
    excerpt: 'Estratégias comprovadas para atrair novos clientes e fidelizar os existentes.',
    date: '2025-01-05',
    category: 'Para Profissionais',
    image: null,
  },
  {
    slug: 'cuidados-cabelo-verao',
    title: 'Cuidados com o cabelo no verão',
    excerpt: 'Sol, piscina e mar podem danificar seus fios. Veja como protegê-los.',
    date: '2024-12-20',
    category: 'Cuidados',
    image: null,
  },
];

export default function BlogPage() {
  const { t, locale } = useTranslation();

  return (
    <div className="pt-20">
      <section className="bg-brand-cream py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h1 className="font-serif text-4xl font-bold text-brand-text sm:text-5xl">{t('website.blog.title')}</h1>
          <p className="mt-4 text-lg text-brand-text-secondary">
            {t('website.blog.subtitle')}
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="aspect-[16/9] bg-gradient-to-br from-brand-rose/10 to-brand-gold/10" />
                <div className="p-5">
                  <span className="text-xs font-medium text-brand-rose">{post.category}</span>
                  <h3 className="mt-2 font-serif text-lg font-semibold text-brand-text transition-colors group-hover:text-brand-rose">
                    {post.title}
                  </h3>
                  <p className="mt-2 text-sm text-brand-text-secondary line-clamp-2">{post.excerpt}</p>
                  <div className="mt-4 flex items-center gap-1.5 text-xs text-brand-text-secondary">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(post.date).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
