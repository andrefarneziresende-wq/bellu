'use client';

import { useTranslation } from '@/lib/i18n';

export default function PrivacidadePage() {
  const { t } = useTranslation();

  return (
    <div className="pt-20">
      <section className="bg-brand-cream py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h1 className="font-serif text-4xl font-bold text-brand-text sm:text-5xl">
            {t('website.privacy.title')}
          </h1>
          <p className="mt-4 text-brand-text-secondary">Última atualização: 20 de março de 2026</p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="prose prose-brand mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="font-serif text-xl font-bold text-brand-text">1. Dados que Coletamos</h2>
          <p className="text-brand-text-secondary leading-relaxed">
            Coletamos dados necessários para o funcionamento da plataforma: nome, email, telefone,
            localização (com sua permissão), dados de agendamento e histórico de uso.
          </p>

          <h2 className="mt-8 font-serif text-xl font-bold text-brand-text">2. Como Usamos seus Dados</h2>
          <p className="text-brand-text-secondary leading-relaxed">
            Utilizamos seus dados para: realizar agendamentos, mostrar profissionais relevantes na sua
            região, processar pagamentos, enviar notificações sobre seus agendamentos e melhorar a
            experiência da plataforma.
          </p>

          <h2 className="mt-8 font-serif text-xl font-bold text-brand-text">3. Compartilhamento</h2>
          <p className="text-brand-text-secondary leading-relaxed">
            Compartilhamos dados apenas com: profissionais (para realizar o atendimento),
            gateways de pagamento (Mercado Pago/Stripe) e serviços essenciais (Firebase, provedores
            de email). Nunca vendemos seus dados a terceiros.
          </p>

          <h2 className="mt-8 font-serif text-xl font-bold text-brand-text">4. Armazenamento e Segurança</h2>
          <p className="text-brand-text-secondary leading-relaxed">
            Seus dados são armazenados em servidores seguros com criptografia. Utilizamos as melhores
            práticas de segurança, incluindo HTTPS, hashing de senhas e tokens de acesso temporários.
          </p>

          <h2 className="mt-8 font-serif text-xl font-bold text-brand-text">5. Seus Direitos (LGPD & GDPR)</h2>
          <p className="text-brand-text-secondary leading-relaxed">
            Você tem direito a: acessar seus dados, solicitar correção, pedir exclusão, exportar seus
            dados e revogar consentimento a qualquer momento. Para exercer esses direitos, entre em
            contato pelo email privacidade@bellu.com.br.
          </p>

          <h2 className="mt-8 font-serif text-xl font-bold text-brand-text">6. Cookies</h2>
          <p className="text-brand-text-secondary leading-relaxed">
            Utilizamos cookies essenciais para o funcionamento do site e cookies analíticos para
            melhorar a experiência. Você pode desabilitar cookies nas configurações do seu navegador.
          </p>

          <h2 className="mt-8 font-serif text-xl font-bold text-brand-text">7. Retenção de Dados</h2>
          <p className="text-brand-text-secondary leading-relaxed">
            Mantemos seus dados enquanto sua conta estiver ativa. Após exclusão da conta, dados
            pessoais são removidos em até 30 dias, exceto quando exigido por lei.
          </p>

          <h2 className="mt-8 font-serif text-xl font-bold text-brand-text">8. Menores de Idade</h2>
          <p className="text-brand-text-secondary leading-relaxed">
            O Bellu não é destinado a menores de 18 anos. Não coletamos conscientemente
            dados de menores de idade.
          </p>

          <h2 className="mt-8 font-serif text-xl font-bold text-brand-text">9. Contato</h2>
          <p className="text-brand-text-secondary leading-relaxed">
            Para questões sobre privacidade, entre em contato: privacidade@bellu.com.br
          </p>
        </div>
      </section>
    </div>
  );
}
