import BannerWarning from '@/components/banner-warning';
import PricingCard from '@/components/pricing-card';

export default async function MySubscription() {
  return (
    <>
      <h1 className="text-3xl font-bold mb-6">Minha Assinatura</h1>
      <BannerWarning text="Você precisa de uma assinatura ativa. Que tal assinar agora?" />
      <PricingCard />
    </>
  );
}
