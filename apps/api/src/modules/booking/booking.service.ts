import { prisma } from '../../config/prisma.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../shared/errors.js';
import { onSessionCompleted } from '../client-package/client-package.service.js';
import { onBookingCreated, onBookingConfirmed, onBookingCancelled, onBookingCompleted, onNewBookingForPro } from '../notification/push-triggers.js';

interface CreateBookingInput {
  professionalId?: string;
  serviceId: string;
  date: string;
  startTime: string;
  endTime?: string;
  memberId?: string;
  userId?: string;
  clientName?: string;
  clientPhone?: string;
  notes?: string;
  source?: 'APP' | 'MANUAL' | 'WALKIN';
  totalPrice?: number;
  currency?: string;
}

interface UpdateBookingStatusInput {
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
}

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const totalMinutes = h * 60 + m + minutes;
  const newH = Math.floor(totalMinutes / 60) % 24;
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export async function createBooking(userId: string, data: CreateBookingInput) {
  // Block bookings in the past
  const bookingDateTime = new Date(`${data.date}T${data.startTime}:00`);
  const now = new Date();
  if (bookingDateTime < now) {
    throw new BadRequestError('Cannot create a booking in the past');
  }

  const service = await prisma.service.findUnique({
    where: { id: data.serviceId },
  });

  if (!service) {
    throw new NotFoundError('Service');
  }

  // Resolve professionalId: from body or from the service's professional
  const professionalId = data.professionalId || service.professionalId;

  // If professionalId was provided, verify the service belongs to that professional
  if (data.professionalId && service.professionalId !== data.professionalId) {
    throw new BadRequestError('Service does not belong to this professional');
  }

  const endTime = data.endTime || addMinutesToTime(data.startTime, service.durationMinutes);

  // Check for overlapping confirmed/pending bookings
  const bookingDate = new Date(data.date);
  const overlapping = await prisma.booking.findFirst({
    where: {
      professionalId,
      date: bookingDate,
      status: { in: ['CONFIRMED', 'PENDING'] },
      AND: [
        { startTime: { lt: endTime } },
        { endTime: { gt: data.startTime } },
      ],
    },
  });

  if (overlapping) {
    throw new BadRequestError('This time slot is not available');
  }

  // Determine if this is a professional creating a manual booking
  const professional = await prisma.professional.findFirst({
    where: { userId, id: professionalId },
  });
  const isProManual = !!professional;

  // Resolve memberId: use provided, or randomly assign an active member
  let memberId = data.memberId || null;
  if (!memberId) {
    const activeMembers = await prisma.professionalMember.findMany({
      where: { professionalId, active: true },
      select: { id: true },
    });
    if (activeMembers.length > 0) {
      const randomIndex = Math.floor(Math.random() * activeMembers.length);
      memberId = activeMembers[randomIndex].id;
    }
  }

  const booking = await prisma.booking.create({
    data: {
      userId: isProManual ? (data.userId || null) : userId,
      professionalId,
      memberId,
      serviceId: data.serviceId,
      date: bookingDate,
      startTime: data.startTime,
      endTime,
      totalPrice: data.totalPrice ?? service.price,
      currency: data.currency || service.currency,
      source: data.source || 'APP',
      clientName: data.clientName || null,
      clientPhone: data.clientPhone || null,
      notes: data.notes || null,
      status: isProManual ? 'CONFIRMED' : 'PENDING',
    },
    include: {
      service: true,
      professional: { select: { id: true, businessName: true, userId: true } },
      member: { select: { id: true, name: true, avatar: true } },
      user: { select: { id: true, name: true } },
    },
  });

  // Push notifications (fire-and-forget)
  onBookingCreated(booking).catch(() => {});
  onNewBookingForPro(booking).catch(() => {});

  return booking;
}

export async function getBookingById(id: string) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
      professional: { select: { id: true, businessName: true, userId: true } },
      service: true,
    },
  });

  if (!booking) {
    throw new NotFoundError('Booking');
  }

  return booking;
}

export async function listUserBookings(
  userId: string,
  status?: string,
  page = 1,
  perPage = 20,
) {
  const where: Record<string, unknown> = { userId };

  if (status) {
    where.status = status.toUpperCase();
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        service: true,
        professional: { select: { id: true, businessName: true, avatarPhoto: true } },
      },
      orderBy: { date: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.booking.count({ where }),
  ]);

  return {
    bookings,
    pagination: {
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    },
  };
}

export async function listProfessionalBookings(
  professionalId: string,
  date?: string,
  status?: string,
  page = 1,
  perPage = 20,
) {
  const where: Record<string, unknown> = { professionalId };

  if (date) {
    where.date = new Date(date);
  }

  if (status) {
    where.status = status.toUpperCase();
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        service: true,
        user: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.booking.count({ where }),
  ]);

  return {
    bookings,
    pagination: {
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    },
  };
}

export async function updateBookingStatus(
  id: string,
  userId: string,
  data: UpdateBookingStatusInput,
) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      professional: { select: { userId: true } },
    },
  });

  if (!booking) {
    throw new NotFoundError('Booking');
  }

  const isProfessional = booking.professional.userId === userId;
  const isConsumer = booking.userId === userId;

  if (!isProfessional && !isConsumer) {
    throw new ForbiddenError('You are not a participant of this booking');
  }

  const newStatus = data.status.toUpperCase() as
    'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

  // Validation rules
  if (newStatus === 'CONFIRMED' && !isProfessional) {
    throw new ForbiddenError('Only the professional can confirm a booking');
  }

  if (newStatus === 'COMPLETED' && !isProfessional) {
    throw new ForbiddenError('Only the professional can mark a booking as completed');
  }

  if (newStatus === 'NO_SHOW' && !isProfessional) {
    throw new ForbiddenError('Only the professional can mark a booking as no-show');
  }

  if (newStatus === 'CANCELLED') {
    if (isConsumer) {
      // Consumer can only cancel if more than 2 hours before start
      const bookingDateTime = new Date(booking.date);
      const [hours, minutes] = booking.startTime.split(':').map(Number);
      bookingDateTime.setHours(hours, minutes, 0, 0);

      const now = new Date();
      const twoHoursBefore = new Date(bookingDateTime.getTime() - 2 * 60 * 60 * 1000);

      if (now > twoHoursBefore) {
        throw new BadRequestError('Cannot cancel a booking less than 2 hours before the start time');
      }
    }
  }

  const updateData: Record<string, unknown> = { status: newStatus };

  if (newStatus === 'CANCELLED') {
    updateData.cancelledAt = new Date();
  }

  if (newStatus === 'COMPLETED') {
    updateData.completedAt = new Date();
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: updateData,
    include: {
      service: true,
      professional: { select: { id: true, businessName: true, userId: true } },
      user: { select: { id: true, name: true } },
    },
  });

  // Push notifications (fire-and-forget)
  if (newStatus === 'CONFIRMED') {
    onBookingConfirmed(updated).catch(() => {});
  } else if (newStatus === 'CANCELLED') {
    onBookingCancelled(updated, isProfessional).catch(() => {});
  } else if (newStatus === 'COMPLETED') {
    onBookingCompleted(updated).catch(() => {});
  }

  // If this booking belongs to a client package, update session counter
  if (newStatus === 'COMPLETED') {
    await onSessionCompleted(id).catch(() => {});
  }

  return updated;
}

export async function getAvailableSlots(professionalId: string, date: string) {
  const targetDate = new Date(date);
  const dayOfWeek = targetDate.getUTCDay();

  const workingHours = await prisma.workingHours.findUnique({
    where: {
      professionalId_dayOfWeek: {
        professionalId,
        dayOfWeek,
      },
    },
  });

  if (!workingHours || workingHours.isOff) {
    return [];
  }

  // Get existing bookings for this date
  const existingBookings = await prisma.booking.findMany({
    where: {
      professionalId,
      date: targetDate,
      status: { in: ['CONFIRMED', 'PENDING'] },
    },
    orderBy: { startTime: 'asc' },
  });

  // Generate 30-minute slots within working hours
  const slots: string[] = [];
  const startMinutes = timeToMinutes(workingHours.startTime);
  const endMinutes = timeToMinutes(workingHours.endTime);
  const slotInterval = 30;

  for (let m = startMinutes; m < endMinutes; m += slotInterval) {
    const slotTime = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

    // Check if this slot overlaps with any existing booking
    const isOccupied = existingBookings.some((booking: { startTime: string; endTime: string }) => {
      const bookingStart = timeToMinutes(booking.startTime);
      const bookingEnd = timeToMinutes(booking.endTime);
      return m >= bookingStart && m < bookingEnd;
    });

    if (!isOccupied) {
      slots.push(slotTime);
    }
  }

  return slots;
}
