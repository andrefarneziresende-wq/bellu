'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Calendar } from 'lucide-react';

const posts: Record<string, { title: string; date: string; category: string; content: string }> = {
  'tendencias-beleza-2025': {
    title: 'Tendências de beleza para 2025',
    date: '2025-01-15',
    category: 'Tendências',
    content: `O mundo da beleza está em constante evolução, e 2025 traz algumas tendências incríveis que vão transformar a forma como cuidamos da nossa aparência.

## Naturalidade em Alta

A tendência "clean girl" continua forte, com foco em pele saudável e maquiagem minimalista. Procedimentos que realçam a beleza natural, como harmonização facial sutil e tratamentos de pele, estão cada vez mais populares.

## Cabelos Saudáveis

Tratamentos capilares focados na saúde dos fios ganham destaque. Cronogramas capilares personalizados e tratamentos com ativos naturais são a preferência.

## Sustentabilidade

Produtos e serviços sustentáveis continuam ganhando espaço. Profissionais que adotam práticas eco-friendly conquistam cada vez mais clientes conscientes.

## Tecnologia e Beleza

O uso de tecnologia para personalizar tratamentos é uma tendência crescente. Apps como o Bellu facilitam o agendamento e a descoberta de novos profissionais.`,
  },
  'como-escolher-profissional': {
    title: 'Como escolher o profissional de beleza ideal',
    date: '2025-01-10',
    category: 'Dicas',
    content: `Escolher o profissional de beleza certo pode parecer desafiador, mas com algumas dicas simples, você encontra o match perfeito.

## Confira o Portfólio

Antes de agendar, analise o portfólio do profissional. Fotos de antes e depois são essenciais para entender o estilo e a qualidade do trabalho.

## Leia as Avaliações

As avaliações de outros clientes são um termômetro importante. Procure comentários detalhados sobre a experiência, pontualidade e resultado.

## Verifique a Especialização

Cada profissional tem suas especialidades. Certifique-se de que o profissional escolhido tem experiência no serviço que você deseja.

## Agende pelo Bellu

No Bellu, você encontra portfólios completos, avaliações verificadas e pode agendar em segundos, sem precisar ligar ou esperar.`,
  },
  'dicas-profissionais-aumentar-clientes': {
    title: '5 dicas para profissionais aumentarem sua clientela',
    date: '2025-01-05',
    category: 'Para Profissionais',
    content: `Se você é profissional de beleza e quer expandir sua base de clientes, confira estas estratégias comprovadas.

## 1. Mantenha seu Perfil Atualizado

Um perfil completo com fotos recentes, descrição detalhada dos serviços e preços atualizados transmite profissionalismo.

## 2. Peça Avaliações

Após cada atendimento, incentive seus clientes a deixarem uma avaliação. Avaliações positivas atraem novos clientes.

## 3. Ofereça Promoções Estratégicas

Promoções para novos clientes ou pacotes de serviços são ótimas formas de atrair e fidelizar.

## 4. Responda Rápido

Clientes valorizam respostas rápidas. Use o chat do Bellu para responder dúvidas e confirmar agendamentos com agilidade.

## 5. Invista em Fotos de Qualidade

Portfólios com fotos bem feitas fazem toda a diferença. Invista em boa iluminação e ângulos que valorizem seu trabalho.`,
  },
};

export default function BlogPostPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const post = posts[slug];

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Post não encontrado</h1>
          <Link href="/blog" className="text-rose-400 hover:underline">
            Voltar ao blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F5]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/blog" className="inline-flex items-center gap-2 text-rose-400 hover:underline mb-8">
          <ArrowLeft size={16} />
          Voltar ao blog
        </Link>

        <span className="inline-block bg-rose-50 text-rose-400 text-sm font-medium px-3 py-1 rounded-full mb-4">
          {post.category}
        </span>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4 font-serif">
          {post.title}
        </h1>

        <div className="flex items-center gap-2 text-gray-500 text-sm mb-8">
          <Calendar size={14} />
          {new Date(post.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
        </div>

        <div className="prose prose-lg max-w-none">
          {post.content.split('\n\n').map((paragraph, i) => {
            if (paragraph.startsWith('## ')) {
              return <h2 key={i} className="text-xl font-bold text-gray-800 mt-8 mb-4">{paragraph.replace('## ', '')}</h2>;
            }
            return <p key={i} className="text-gray-600 leading-relaxed mb-4">{paragraph}</p>;
          })}
        </div>
      </div>
    </div>
  );
}
