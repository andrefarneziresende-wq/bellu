import { prisma } from '../../config/prisma.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../shared/errors.js';

export async function getMessagesByBooking(
  bookingId: string,
  userId: string,
  page = 1,
  perPage = 50,
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      professional: { select: { userId: true } },
    },
  });

  if (!booking) {
    throw new NotFoundError('Booking');
  }

  const isConsumer = booking.userId === userId;
  const isProfessional = booking.professional.userId === userId;

  if (!isConsumer && !isProfessional) {
    throw new ForbiddenError('You are not a participant of this booking');
  }

  const [messages, total] = await Promise.all([
    prisma.chatMessage.findMany({
      where: { bookingId },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'asc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.chatMessage.count({ where: { bookingId } }),
  ]);

  return {
    messages,
    pagination: {
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    },
  };
}

export async function sendMessage(
  bookingId: string,
  senderId: string,
  receiverId: string,
  message: string,
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      professional: { select: { userId: true } },
    },
  });

  if (!booking) {
    throw new NotFoundError('Booking');
  }

  if (booking.status === 'CANCELLED') {
    throw new BadRequestError('Cannot send messages in a cancelled booking');
  }

  const consumerUserId = booking.userId;
  const professionalUserId = booking.professional.userId;

  const senderIsConsumer = senderId === consumerUserId;
  const senderIsProfessional = senderId === professionalUserId;

  if (!senderIsConsumer && !senderIsProfessional) {
    throw new ForbiddenError('You are not a participant of this booking');
  }

  const receiverIsConsumer = receiverId === consumerUserId;
  const receiverIsProfessional = receiverId === professionalUserId;

  if (!receiverIsConsumer && !receiverIsProfessional) {
    throw new BadRequestError('Receiver is not a participant of this booking');
  }

  const chatMessage = await prisma.chatMessage.create({
    data: {
      bookingId,
      senderId,
      receiverId,
      message,
    },
    include: {
      sender: { select: { id: true, name: true, avatar: true } },
    },
  });

  return chatMessage;
}

export async function markAsRead(bookingId: string, userId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      professional: { select: { userId: true } },
    },
  });

  if (!booking) {
    throw new NotFoundError('Booking');
  }

  const isConsumer = booking.userId === userId;
  const isProfessional = booking.professional.userId === userId;

  if (!isConsumer && !isProfessional) {
    throw new ForbiddenError('You are not a participant of this booking');
  }

  const result = await prisma.chatMessage.updateMany({
    where: {
      bookingId,
      receiverId: userId,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });

  return { markedAsRead: result.count };
}

export async function getUnreadCount(userId: string) {
  const count = await prisma.chatMessage.count({
    where: {
      receiverId: userId,
      readAt: null,
    },
  });

  return { unreadCount: count };
}
