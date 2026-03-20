export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed';
  clientSecret?: string; // For Stripe frontend confirmation
  externalId: string;
  metadata?: Record<string, string>;
}

export interface PaymentGatewayInterface {
  createPaymentIntent(params: {
    amount: number;
    currency: string;
    method: string;
    metadata?: Record<string, string>;
  }): Promise<PaymentIntent>;

  confirmPayment(externalId: string, token?: string): Promise<PaymentIntent>;
  refundPayment(externalId: string, amount?: number): Promise<void>;
  getPaymentStatus(externalId: string): Promise<PaymentIntent>;
}
