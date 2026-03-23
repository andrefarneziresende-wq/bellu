'use client';

import { useTranslation } from '@/lib/i18n';

export default function TermosPage() {
  const { t } = useTranslation();

  return (
    <div className="pt-20">
      <section className="bg-brand-cream py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h1 className="font-serif text-4xl font-bold text-brand-text sm:text-5xl">
            {t('website.terms.title')}
          </h1>
          <p className="mt-4 text-brand-text-secondary">Última atualização: 20 de março de 2026</p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="prose prose-brand mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="font-serif text-xl font-bold text-brand-text">1. Aceitação dos Termos</h2>
          <p className="text-brand-text-secondary leading-relaxed">
            Ao utilizar a plataforma Bellu (aplicativos móveis, site e painéis web), você concorda com estes
            Termos de Uso. Caso não concorde, não utilize nossos serviços.
          </p>

          <h2 className="mt-8 font-serif text-xl font-bold text-brand-text">2. Descrição do Serviço</h2>
          <p className="text-brand-text-secondary leading-relaxed">
            O Bellu é um marketplace que conecta consumidores a profissionais de beleza e estética.
            Não prestamos serviços de beleza diretamente — atuamos como intermediários facilitando
            o agendamento e a comunicação.
          </p>

          <h2 className="mt-8 font-serif text-xl font-bold text-brand-text">3. Cadastro</h2>
          <p className="text-brand-text-secondary leading-relaxed">
            Para utilizar a plataforma, é necessário criar uma conta com dados verdadeiros.
            Você é responsável pela segurança de suas credenciais de acesso.
          </p>

          <h2 className="mt-8 font-serif text-xl font-bold text-brand-text">4. Responsabilidades</h2>
          <p className="text-brand-text-secondary leading-relaxed">
            Os profissionais são responsáveis pela qualidade dos serviços prestados.
            O Bellu não se responsabiliza por danos decorrentes de atendimentos realizados
            por profissionais cadastrados na plataforma.
          </p>

          <h2 className="mt-8 font-serif text-xl font-bold text-brand-text">5. Pagamentos</h2>
          <p className="text-brand-text-secondary leading-relaxed">
            Pagamentos são processados por gateways terceirizados (Mercado Pago e Stripe).
            O Bellu pode cobrar uma comissão sobre transações realizadas pela plataforma.
          </p>

          <h2 className="mt-8 font-serif text-xl font-bold text-brand-text">6. Cancelamentos</h2>
          <p className="text-brand-text-secondary leading-relaxed">
            Cada profissional define sua política de cancelamento. Recomendamos verificar
            as condições antes de confirmar o agendamento.
          </p>

          <h2 className="mt-8 font-serif text-xl font-bold text-brand-text">7. Propriedade Intelectual</h2>
          <p className="text-brand-text-secondary leading-relaxed">
            Todo o conteúdo da plataforma (design, código, textos, marca) é propriedade do Bellu
            e protegido por leis de propriedade intelectual.
          </p>

          <h2 className="mt-8 font-serif text-xl font-bold text-brand-text">8. Alterações</h2>
          <p className="text-brand-text-secondary leading-relaxed">
            Podemos atualizar estes termos a qualquer momento. Notificaremos alterações
            significativas por email ou pelo app.
          </p>

          <h2 className="mt-8 font-serif text-xl font-bold text-brand-text">9. Contato</h2>
          <p className="text-brand-text-secondary leading-relaxed">
            Dúvidas sobre estes termos? Entre em contato pelo email contato@bellu.com.br.
          </p>
        </div>
      </section>
    </div>
  );
}
