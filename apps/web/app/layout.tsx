import type { Metadata } from 'next';
import { DM_Sans, Playfair_Display } from 'next/font/google';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Providers } from './providers';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Bellu — Beleza & Estética',
  description: 'Encontre os melhores profissionais de beleza perto de você. Agende serviços de salão, estética e bem-estar em segundos.',
  keywords: ['beleza', 'estética', 'agendamento', 'salão', 'profissionais', 'bellu', 'manicure', 'cabelo', 'maquiagem'],
  openGraph: {
    title: 'Bellu — Beleza & Estética',
    description: 'Encontre os melhores profissionais de beleza perto de você. Agende serviços de salão, estética e bem-estar em segundos.',
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Bellu',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bellu — Beleza & Estética',
    description: 'Encontre os melhores profissionais de beleza perto de você.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${dmSans.variable} ${playfair.variable}`}>
      <body>
        <Providers>
          <Header />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
