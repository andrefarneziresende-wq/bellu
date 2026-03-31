import { prisma } from '../../config/prisma.js';
import { NotFoundError, ForbiddenError } from '../../shared/errors.js';

interface SessionInput {
  date?: string;       // YYYY-MM-DD or null (to schedule later)
  startTime?: string;  // HH:mm or null
  notes?: string;
}

interface CreateSessionGroupInput {
  professionalId: string;
  serviceId?: string;
  customServiceName?: string;
  clientName?: string;
  clientPhone?: string;
  userId?: string;
  totalSessions: number;
  priceType: 'PER_SESSION' | 'CUSTOM_TOTAL';
  totalPrice?: number;
  sessionPrice?: number;
  currency?: string;
  notes?: string;
  sessions: SessionInput[];
}

interface AddSessionInput {
  sessionGroupId: string;
  professionalId: string;
  date: string;
  startTime: string;
  notes?: string;
}

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const totalMinutes = h * 60 + m + minutes;
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
}

export async function createSessionGroup(input: CreateSessionGroupInput) {
  const {
    professionalId, serviceId, customServiceName,
    clientName, clientPhone, userId,
    totalSessions, priceType, totalPrice, sessionPrice,
    currency = 'BRL', notes, sessions,
  } = input;

  // Resolve service details for duration + price defaults
  let service: { id: string; price: any; currency: string; durationMinutes: number } | null = null;
  if (serviceId) {
    service = await prisma.service.findFirst({
      where: { id: serviceId, professionalId },
    });
    if (!service) throw new NotFoundError('Service not found');
  }

  const resolvedSessionPrice = sessionPrice ?? (service ? Number(service.price) : 0);
  const resolvedTotalPrice = priceType === 'CUSTOM_TOTAL'
    ? (totalPrice ?? 0)
    : resolvedSessionPrice * totalSessions;
  const durationMinutes = service?.durationMinutes ?? 60;

  // Create group
  const group = await prisma.sessionGroup.create({
    data: {
      professionalId,
      serviceId: serviceId || null,
      customServiceName: customServiceName || null,
      clientName: clientName || null,
      clientPhone: clientPhone || null,
      userId: userId || null,
      totalSessions,
      priceType,
      totalPrice: resolvedTotalPrice,
      sessionPrice: resolvedSessionPrice,
      currency,
      notes: notes || null,
    },
  });

  // Create bookings for sessions that have dates
  const bookings = [];
  for (let i = 0; i < sessions.length; i++) {
    const session = sessions[i];
    if (!session.date || !session.startTime) continue;

    const endTime = addMinutesToTime(session.startTime, durationMinutes);
    const booking = await prisma.booking.create({
      data: {
        professionalId,
        serviceId: serviceId ?? undefined,
        customServiceName: !serviceId ? (customServiceName ?? undefined) : undefined,
        date: new Date(session.date),
        startTime: session.startTime,
        endTime,
        status: 'CONFIRMED',
        totalPrice: resolvedSessionPrice,
        currency,
        source: 'MANUAL',
        clientName: clientName || null,
        clientPhone: clientPhone || null,
        userId: userId || null,
        sessionGroupId: group.id,
        sessionNumber: i + 1,
        notes: session.notes || null,
      },
    });
    bookings.push(booking);
  }

  return {
    ...group,
    bookings,
    scheduledCount: bookings.length,
    pendingCount: totalSessions - bookings.length,
  };
}

export async function listSessionGroups(professionalId: string) {
  return prisma.sessionGroup.findMany({
    where: { professionalId },
    include: {
      service: { select: { id: true, name: true, durationMinutes: true } },
      bookings: {
        select: {
          id: true,
          date: true,
          startTime: true,
          status: true,
          sessionNumber: true,
          notes: true,
        },
        orderBy: { sessionNumber: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getSessionGroupById(id: string, professionalId: string) {
  const group = await prisma.sessionGroup.findFirst({
    where: { id, professionalId },
    include: {
      service: { select: { id: true, name: true, durationMinutes: true, price: true } },
      user: { select: { id: true, name: true, phone: true } },
      bookings: {
        select: {
          id: true,
          date: true,
          startTime: true,
          endTime: true,
          status: true,
          sessionNumber: true,
          notes: true,
          completedAt: true,
        },
        orderBy: { sessionNumber: 'asc' },
      },
    },
  });

  if (!group) throw new NotFoundError('Session group not found');
  return group;
}

export async function scheduleSession(input: AddSessionInput) {
  const { sessionGroupId, professionalId, date, startTime, notes } = input;

  const group = await prisma.sessionGroup.findFirst({
    where: { id: sessionGroupId, professionalId },
    include: {
      service: { select: { durationMinutes: true } },
      bookings: { select: { id: true } },
    },
  });

  if (!group) throw new NotFoundError('Session group not found');
  if (group.bookings.length >= group.totalSessions) {
    throw new ForbiddenError('All sessions have already been scheduled');
  }

  const durationMinutes = group.service?.durationMinutes ?? 60;
  const endTime = addMinutesToTime(startTime, durationMinutes);
  const nextSessionNumber = group.bookings.length + 1;

  const booking = await prisma.booking.create({
    data: {
      professionalId,
      serviceId: group.serviceId ?? undefined,
      customServiceName: group.customServiceName ?? undefined,
      date: new Date(date),
      startTime,
      endTime,
      status: 'CONFIRMED',
      totalPrice: group.sessionPrice ?? 0,
      currency: group.currency,
      source: 'MANUAL',
      clientName: group.clientName,
      clientPhone: group.clientPhone,
      userId: group.userId,
      sessionGroupId,
      sessionNumber: nextSessionNumber,
      notes: notes || null,
    },
  });

  // Auto-complete group if all sessions scheduled and completed
  await updateGroupStatus(sessionGroupId);

  return booking;
}

export async function updateGroupStatus(groupId: string) {
  const group = await prisma.sessionGroup.findUnique({
    where: { id: groupId },
    include: { bookings: { select: { status: true } } },
  });

  if (!group) return;

  const completedCount = group.bookings.filter(b => b.status === 'COMPLETED').length;
  const allScheduled = group.bookings.length >= group.totalSessions;

  if (allScheduled && completedCount >= group.totalSessions) {
    await prisma.sessionGroup.update({
      where: { id: groupId },
      data: { status: 'COMPLETED' },
    });
  }
}

export async function cancelSessionGroup(id: string, professionalId: string) {
  const group = await prisma.sessionGroup.findFirst({
    where: { id, professionalId },
  });
  if (!group) throw new NotFoundError('Session group not found');

  // Cancel all pending/confirmed bookings in the group
  await prisma.booking.updateMany({
    where: {
      sessionGroupId: id,
      status: { in: ['PENDING', 'CONFIRMED'] },
    },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
  });

  await prisma.sessionGroup.update({
    where: { id },
    data: { status: 'CANCELLED' },
  });

  return { success: true };
}
