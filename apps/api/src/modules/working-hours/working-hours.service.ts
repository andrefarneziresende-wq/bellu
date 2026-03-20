import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { NotFoundError, ForbiddenError } from '../../shared/errors.js';

interface WorkingHoursInput {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isOff: boolean;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export async function getByProfessional(professionalId: string) {
  const hours = await prisma.workingHours.findMany({
    where: { professionalId },
    orderBy: { dayOfWeek: 'asc' },
  });

  return hours;
}

export async function setHours(
  professionalId: string,
  userId: string,
  hours: WorkingHoursInput[],
) {
  const professional = await prisma.professional.findUnique({
    where: { id: professionalId },
  });

  if (!professional) {
    throw new NotFoundError('Professional');
  }

  if (professional.userId !== userId) {
    throw new ForbiddenError('You do not own this professional profile');
  }

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.workingHours.deleteMany({
      where: { professionalId },
    });

    const created = await tx.workingHours.createMany({
      data: hours.map((h) => ({
        professionalId,
        dayOfWeek: h.dayOfWeek,
        startTime: h.startTime,
        endTime: h.endTime,
        isOff: h.isOff,
      })),
    });

    return created;
  });

  const updated = await prisma.workingHours.findMany({
    where: { professionalId },
    orderBy: { dayOfWeek: 'asc' },
  });

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

  const existingBookings = await prisma.booking.findMany({
    where: {
      professionalId,
      date: targetDate,
      status: { in: ['CONFIRMED', 'PENDING'] },
    },
    orderBy: { startTime: 'asc' },
  });

  const startMinutes = timeToMinutes(workingHours.startTime);
  const endMinutes = timeToMinutes(workingHours.endTime);
  const slotInterval = 30;

  const slots: { time: string; available: boolean }[] = [];

  for (let m = startMinutes; m < endMinutes; m += slotInterval) {
    const slotTime = minutesToTime(m);

    const isOccupied = existingBookings.some((booking: { startTime: string; endTime: string }) => {
      const bookingStart = timeToMinutes(booking.startTime);
      const bookingEnd = timeToMinutes(booking.endTime);
      return m >= bookingStart && m < bookingEnd;
    });

    slots.push({ time: slotTime, available: !isOccupied });
  }

  return slots;
}
