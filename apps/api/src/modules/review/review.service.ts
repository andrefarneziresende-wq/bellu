import { prisma } from '../../config/prisma.js';
import { NotFoundError, BadRequestError, ConflictError } from '../../shared/errors.js';
import { onReviewReceived } from '../notification/push-triggers.js';

interface CreateReviewInput {
  bookingId: string;
  rating: number;
  comment?: string;
  photoUrl?: string;
}

export async function createReview(userId: string, data: CreateReviewInput) {
  const booking = await prisma.booking.findUnique({
    where: { id: data.bookingId },
    include: { review: true },
  });

  if (!booking) {
    throw new NotFoundError('Booking');
  }

  if (booking.userId !== userId) {
    throw new BadRequestError('This booking does not belong to you');
  }

  if (booking.status !== 'COMPLETED') {
    throw new BadRequestError('You can only review completed bookings');
  }

  if (booking.review) {
    throw new ConflictError('A review already exists for this booking');
  }

  const review = await prisma.review.create({
    data: {
      bookingId: data.bookingId,
      userId,
      professionalId: booking.professionalId,
      rating: data.rating,
      comment: data.comment,
      photoUrl: data.photoUrl,
    },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
    },
  });

  // Update professional rating and totalReviews
  const aggregation = await prisma.review.aggregate({
    where: { professionalId: booking.professionalId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  const professional = await prisma.professional.update({
    where: { id: booking.professionalId },
    data: {
      rating: aggregation._avg.rating ?? 0,
      totalReviews: aggregation._count.rating,
    },
  });

  // Push notification to professional
  onReviewReceived({
    ...review,
    professional: { id: professional.id, userId: professional.userId },
  }).catch(() => {});

  return review;
}

export async function getReviewsByProfessional(
  professionalId: string,
  page = 1,
  perPage = 20,
) {
  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { professionalId },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.review.count({ where: { professionalId } }),
  ]);

  return {
    reviews,
    pagination: {
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    },
  };
}

export async function getReviewByBooking(bookingId: string) {
  const review = await prisma.review.findUnique({
    where: { bookingId },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
    },
  });

  if (!review) {
    throw new NotFoundError('Review');
  }

  return review;
}
