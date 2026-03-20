import { prisma } from '../../config/prisma.js';
import { NotFoundError, BadRequestError } from '../../shared/errors.js';
import { getGatewayForMethod } from './payment-gateway.factory.js';

type PaymentMethod = 'pix' | 'card' | 'boleto' | 'sepa' | 'bizum' | 'apple_pay' | 'google_pay';

function gatewayName(method: PaymentMethod, countryCode: string): string {
  if (method === 'apple_pay' || method === 'google_pay') return 'stripe';
  return countryCode === 'BR' ? 'mercadopago' : 'stripe';
}

export async function createPayment(bookingId: string, userId: string, method: PaymentMethod) {
  // 1. Fetch booking with user + professional + country
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      user: {
        include: { country: true },
      },
      professional: {
        include: { country: true },
      },
      payment: true,
    },
  });

  if (!booking) {
    throw new NotFoundError('Booking');
  }

  if (booking.userId !== userId) {
    throw new BadRequestError('You can only pay for your own bookings');
  }

  if (booking.payment) {
    throw new BadRequestError('Payment already exists for this booking');
  }

  if (booking.status !== 'PENDING' && booking.status !== 'CONFIRMED') {
    throw new BadRequestError('Booking is not in a payable state');
  }

  // 2. Determine gateway using professional's country
  const countryCode = booking.professional.country.code;
  const gateway = getGatewayForMethod(countryCode, method);

  // 3. Create payment intent via gateway
  const amount = Number(booking.totalPrice);
  const currency = booking.currency;

  const intent = await gateway.createPaymentIntent({
    amount,
    currency,
    method,
    metadata: {
      bookingId: booking.id,
      userId,
    },
  });

  // 4. Save Payment record in DB
  const payment = await prisma.payment.create({
    data: {
      bookingId: booking.id,
      amount: booking.totalPrice,
      currency,
      method,
      gateway: gatewayName(method, countryCode),
      externalId: intent.externalId,
      status: 'PENDING',
    },
  });

  // 5. Return payment with clientSecret for frontend
  return {
    payment,
    clientSecret: intent.clientSecret,
  };
}

export async function confirmPayment(paymentId: string, token?: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      booking: {
        include: {
          professional: { include: { country: true } },
        },
      },
    },
  });

  if (!payment) {
    throw new NotFoundError('Payment');
  }

  if (payment.status !== 'PENDING') {
    throw new BadRequestError('Payment is not in a confirmable state');
  }

  if (!payment.externalId) {
    throw new BadRequestError('Payment has no external reference');
  }

  const countryCode = payment.booking.professional.country.code;
  const gateway = getGatewayForMethod(countryCode, payment.method);

  const intent = await gateway.confirmPayment(payment.externalId, token);

  const newStatus = intent.status === 'succeeded' ? 'PAID' : 'PENDING';

  const updated = await prisma.payment.update({
    where: { id: paymentId },
    data: { status: newStatus as 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED' },
  });

  // Update booking payment status if paid
  if (newStatus === 'PAID') {
    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: { paymentStatus: 'PAID' },
    });
  }

  return updated;
}

export async function refundPayment(paymentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      booking: {
        include: {
          professional: { include: { country: true } },
        },
      },
    },
  });

  if (!payment) {
    throw new NotFoundError('Payment');
  }

  if (payment.status !== 'PAID') {
    throw new BadRequestError('Only paid payments can be refunded');
  }

  if (!payment.externalId) {
    throw new BadRequestError('Payment has no external reference');
  }

  const countryCode = payment.booking.professional.country.code;
  const gateway = getGatewayForMethod(countryCode, payment.method);

  await gateway.refundPayment(payment.externalId, Number(payment.amount));

  const updated = await prisma.payment.update({
    where: { id: paymentId },
    data: { status: 'REFUNDED' },
  });

  await prisma.booking.update({
    where: { id: payment.bookingId },
    data: { paymentStatus: 'REFUNDED' },
  });

  return updated;
}

export async function getPaymentByBooking(bookingId: string) {
  const payment = await prisma.payment.findUnique({
    where: { bookingId },
  });

  if (!payment) {
    throw new NotFoundError('Payment');
  }

  return payment;
}

export async function getPaymentById(id: string) {
  const payment = await prisma.payment.findUnique({
    where: { id },
  });

  if (!payment) {
    throw new NotFoundError('Payment');
  }

  return payment;
}
