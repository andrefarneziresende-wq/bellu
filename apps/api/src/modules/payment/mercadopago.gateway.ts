import type { PaymentGatewayInterface, PaymentIntent } from './payment-gateway.interface.js';

const SUPPORTED_METHODS = ['pix', 'card', 'boleto'];

const MP_METHOD_MAP: Record<string, string> = {
  pix: 'pix',
  card: 'credit_card',
  boleto: 'bolbradesco',
};

export class MercadoPagoGateway implements PaymentGatewayInterface {
  private accessToken: string;

  constructor() {
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!token) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN environment variable is not set');
    }
    this.accessToken = token;
  }

  async createPaymentIntent(params: {
    amount: number;
    currency: string;
    method: string;
    metadata?: Record<string, string>;
  }): Promise<PaymentIntent> {
    if (!SUPPORTED_METHODS.includes(params.method)) {
      throw new Error(`Unsupported payment method for Mercado Pago: ${params.method}`);
    }

    const paymentMethodId = MP_METHOD_MAP[params.method];

    // TODO: Replace with actual Mercado Pago SDK / API call
    // const response = await fetch('https://api.mercadopago.com/v1/payments', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     Authorization: `Bearer ${this.accessToken}`,
    //   },
    //   body: JSON.stringify({
    //     transaction_amount: params.amount,
    //     payment_method_id: paymentMethodId,
    //     description: params.metadata?.description ?? 'Bellu payment',
    //     metadata: params.metadata ?? {},
    //   }),
    // });
    // const data = await response.json();

    void paymentMethodId;
    void this.accessToken;

    // Placeholder response — remove when SDK is integrated
    const mockId = `mp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    return {
      id: mockId,
      amount: params.amount,
      currency: params.currency,
      status: 'pending',
      externalId: mockId,
      metadata: params.metadata,
    };
  }

  async confirmPayment(externalId: string, _token?: string): Promise<PaymentIntent> {
    // TODO: Replace with actual Mercado Pago API call
    // const response = await fetch(`https://api.mercadopago.com/v1/payments/${externalId}`, {
    //   method: 'PUT',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     Authorization: `Bearer ${this.accessToken}`,
    //   },
    //   body: JSON.stringify({ status: 'approved' }),
    // });
    // const data = await response.json();

    return {
      id: externalId,
      amount: 0,
      currency: '',
      status: 'succeeded',
      externalId,
    };
  }

  async refundPayment(externalId: string, amount?: number): Promise<void> {
    // TODO: Replace with actual Mercado Pago API call
    // await fetch(`https://api.mercadopago.com/v1/payments/${externalId}/refunds`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     Authorization: `Bearer ${this.accessToken}`,
    //   },
    //   body: JSON.stringify(amount ? { amount } : {}),
    // });
    void externalId;
    void amount;
  }

  async getPaymentStatus(externalId: string): Promise<PaymentIntent> {
    // TODO: Replace with actual Mercado Pago API call
    // const response = await fetch(`https://api.mercadopago.com/v1/payments/${externalId}`, {
    //   headers: { Authorization: `Bearer ${this.accessToken}` },
    // });
    // const data = await response.json();
    // Map data.status: 'approved' → 'succeeded', 'rejected' → 'failed', etc.

    return {
      id: externalId,
      amount: 0,
      currency: '',
      status: 'pending',
      externalId,
    };
  }
}
