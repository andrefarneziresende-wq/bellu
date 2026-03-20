import type { PaymentGatewayInterface } from './payment-gateway.interface.js';
import { StripeGateway } from './stripe.gateway.js';
import { MercadoPagoGateway } from './mercadopago.gateway.js';

export function createPaymentGateway(countryCode: string): PaymentGatewayInterface {
  switch (countryCode) {
    case 'BR':
      return new MercadoPagoGateway(); // Pix, boleto, card
    case 'ES':
      return new StripeGateway(); // Card, SEPA, Bizum, Apple/Google Pay
    default:
      return new StripeGateway();
  }
}

// For Apple Pay / Google Pay in Brazil, we use Stripe even though the country is BR
export function createMobilePaymentGateway(): PaymentGatewayInterface {
  return new StripeGateway();
}

export function getGatewayForMethod(
  countryCode: string,
  method: string,
): PaymentGatewayInterface {
  // Apple Pay and Google Pay always go through Stripe regardless of country
  if (method === 'apple_pay' || method === 'google_pay') {
    return new StripeGateway();
  }
  return createPaymentGateway(countryCode);
}
