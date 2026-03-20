// TODO: import Stripe from 'stripe';
import type { PaymentGatewayInterface, PaymentIntent } from './payment-gateway.interface.js';

const STRIPE_METHOD_MAP: Record<string, string[]> = {
  card: ['card'],
  apple_pay: ['card'], // Apple Pay uses card rail via Stripe
  google_pay: ['card'], // Google Pay uses card rail via Stripe
  sepa: ['sepa_debit'],
  bizum: ['card'],
};

export class StripeGateway implements PaymentGatewayInterface {
  // TODO: private stripe: Stripe;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    // TODO: this.stripe = new Stripe(secretKey, { apiVersion: '2024-06-20' });
  }

  async createPaymentIntent(params: {
    amount: number;
    currency: string;
    method: string;
    metadata?: Record<string, string>;
  }): Promise<PaymentIntent> {
    const paymentMethodTypes = STRIPE_METHOD_MAP[params.method];

    if (!paymentMethodTypes) {
      throw new Error(`Unsupported payment method for Stripe: ${params.method}`);
    }

    const useAutomaticPaymentMethods =
      params.method === 'apple_pay' || params.method === 'google_pay';

    // TODO: Replace with actual Stripe SDK call
    // const intent = await this.stripe.paymentIntents.create({
    //   amount: Math.round(params.amount * 100), // Stripe uses cents
    //   currency: params.currency.toLowerCase(),
    //   ...(useAutomaticPaymentMethods
    //     ? { automatic_payment_methods: { enabled: true } }
    //     : { payment_method_types: paymentMethodTypes }),
    //   metadata: params.metadata ?? {},
    // });

    // Placeholder response — remove when SDK is integrated
    const mockId = `pi_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    return {
      id: mockId,
      amount: params.amount,
      currency: params.currency,
      status: 'pending',
      clientSecret: `${mockId}_secret_mock`,
      externalId: mockId,
      metadata: params.metadata,
    };
  }

  async confirmPayment(externalId: string, _token?: string): Promise<PaymentIntent> {
    // TODO: Replace with actual Stripe SDK call
    // const intent = await this.stripe.paymentIntents.confirm(externalId, {
    //   ...(token ? { payment_method: token } : {}),
    // });

    return {
      id: externalId,
      amount: 0,
      currency: '',
      status: 'succeeded',
      externalId,
    };
  }

  async refundPayment(externalId: string, amount?: number): Promise<void> {
    // TODO: Replace with actual Stripe SDK call
    // await this.stripe.refunds.create({
    //   payment_intent: externalId,
    //   ...(amount ? { amount: Math.round(amount * 100) } : {}),
    // });
    void externalId;
    void amount;
  }

  async getPaymentStatus(externalId: string): Promise<PaymentIntent> {
    // TODO: Replace with actual Stripe SDK call
    // const intent = await this.stripe.paymentIntents.retrieve(externalId);
    // return {
    //   id: intent.id,
    //   amount: intent.amount / 100,
    //   currency: intent.currency,
    //   status: intent.status === 'succeeded' ? 'succeeded' : intent.status === 'canceled' ? 'failed' : 'pending',
    //   clientSecret: intent.client_secret ?? undefined,
    //   externalId: intent.id,
    //   metadata: intent.metadata as Record<string, string>,
    // };

    return {
      id: externalId,
      amount: 0,
      currency: '',
      status: 'pending',
      externalId,
    };
  }
}
