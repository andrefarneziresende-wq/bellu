import { Hero } from '@/components/home/hero';
import { HowItWorks } from '@/components/home/how-it-works';
import { Categories } from '@/components/home/categories';
import { ForProfessionals } from '@/components/home/for-professionals';
import { Numbers } from '@/components/home/numbers';
import { Testimonials } from '@/components/home/testimonials';

export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <Categories />
      <Numbers />
      <Testimonials />
      <ForProfessionals />
    </>
  );
}
