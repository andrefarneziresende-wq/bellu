import { prisma } from '../../config/prisma.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../shared/errors.js';

interface PurchasePackageData {
  userId: string;
  servicePackageId: string;
}

/**
 * Purchase a service package for a client.
 * Creates a ClientPackage and optionally books all sessions at once.
 */
export async function purchase(data: PurchasePackageData) {
  const pkg = await prisma.servicePackage.findUnique({
    where: { id: data.servicePackageId },
    include: { service: true },
  });

  if (!pkg || !pkg.active) {
    throw new NotFoundError('Service package');
  }

  const clientPackage = await prisma.clientPackage.create({
    data: {
      userId: data.userId,
      servicePackageId: pkg.id,
      professionalId: pkg.professionalId,
      totalSessions: pkg.sessionsTotal,
      sessionsUsed: 0,
      status: 'ACTIVE',
      expiryDate: null, // No expiry for now; can be extended later
    },
    include: {
      servicePackage: { include: { service: true } },
      professional: { select: { id: true, businessName: true } },
    },
  });

  return clientPackage;
}

/**
 * Purchase a package AND book multiple sessions at specified dates.
 */
export async function purchaseWithSessions(
  userId: string,
  servicePackageId: string,
  sessions: Array<{ date: string; startTime: string }>,
) {
  const pkg = await prisma.servicePackage.findUnique({
    where: { id: servicePackageId },
    include: { service: true },
  });

  if (!pkg || !pkg.active) {
    throw new NotFoundError('Service package');
  }

  if (sessions.length > pkg.sessionsTotal) {
    throw new ForbiddenError(`Cannot book more than ${pkg.sessionsTotal} sessions`);
  }

  // Block sessions in the past
  const now = new Date();
  for (const session of sessions) {
    const sessionDateTime = new Date(`${session.date}T${session.startTime}:00`);
    if (sessionDateTime < now) {
      throw new BadRequestError('Cannot book a session in the past');
    }
  }

  // Calculate price per session
  const pricePerSession = Number(pkg.priceTotal) / pkg.sessionsTotal;

  // Create client package + all bookings in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const clientPackage = await tx.clientPackage.create({
      data: {
        userId,
        servicePackageId: pkg.id,
        professionalId: pkg.professionalId,
        totalSessions: pkg.sessionsTotal,
        sessionsUsed: sessions.length,
        status: sessions.length >= pkg.sessionsTotal ? 'ACTIVE' : 'ACTIVE',
      },
    });

    // Create a booking for each session date
    const bookings = [];
    for (let i = 0; i < sessions.length; i++) {
      const session = sessions[i];
      const endMinutes =
        timeToMinutes(session.startTime) + pkg.service.durationMinutes;
      const endTime = minutesToTime(endMinutes);

      const booking = await tx.booking.create({
        data: {
          userId,
          professionalId: pkg.professionalId,
          serviceId: pkg.serviceId,
          date: new Date(session.date),
          startTime: session.startTime,
          endTime,
          status: 'CONFIRMED',
          totalPrice: pricePerSession,
          currency: pkg.currency,
          source: 'APP',
          clientPackageId: clientPackage.id,
          sessionNumber: i + 1,
        },
      });
      bookings.push(booking);
    }

    return { clientPackage, bookings };
  });

  // Return full data
  return prisma.clientPackage.findUnique({
    where: { id: result.clientPackage.id },
    include: {
      servicePackage: { include: { service: true } },
      professional: { select: { id: true, businessName: true } },
      bookings: {
        orderBy: { date: 'asc' },
        include: { service: true },
      },
    },
  });
}

/**
 * List client packages for a user.
 */
export async function listByUser(userId: string, status?: string) {
  return prisma.clientPackage.findMany({
    where: {
      userId,
      ...(status ? { status: status as any } : {}),
    },
    include: {
      servicePackage: { include: { service: true } },
      professional: { select: { id: true, businessName: true } },
      bookings: {
        orderBy: { date: 'asc' },
        select: {
          id: true,
          date: true,
          startTime: true,
          status: true,
          sessionNumber: true,
          completedAt: true,
          _count: { select: { photos: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * List client packages for a professional (clinic view).
 */
export async function listByProfessional(professionalId: string, status?: string) {
  return prisma.clientPackage.findMany({
    where: {
      professionalId,
      ...(status ? { status: status as any } : {}),
    },
    include: {
      servicePackage: { include: { service: true } },
      user: { select: { id: true, name: true, avatar: true } },
      bookings: {
        orderBy: { date: 'asc' },
        select: {
          id: true,
          date: true,
          startTime: true,
          status: true,
          sessionNumber: true,
          completedAt: true,
          _count: { select: { photos: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get a single client package with full details.
 */
export async function getById(id: string) {
  const pkg = await prisma.clientPackage.findUnique({
    where: { id },
    include: {
      servicePackage: { include: { service: true } },
      professional: { select: { id: true, businessName: true } },
      user: { select: { id: true, name: true, avatar: true } },
      bookings: {
        orderBy: { date: 'asc' },
        include: {
          service: true,
          member: { select: { id: true, name: true } },
          photos: {
            orderBy: { createdAt: 'asc' },
            select: { id: true, imageUrl: true, description: true, createdAt: true },
          },
        },
      },
    },
  });

  if (!pkg) throw new NotFoundError('Client package');
  return pkg;
}

/**
 * When a booking linked to a package is completed, update sessionsUsed.
 */
export async function onSessionCompleted(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { clientPackageId: true },
  });

  if (!booking?.clientPackageId) return;

  const clientPackage = await prisma.clientPackage.findUnique({
    where: { id: booking.clientPackageId },
  });

  if (!clientPackage) return;

  const completedCount = await prisma.booking.count({
    where: {
      clientPackageId: clientPackage.id,
      status: 'COMPLETED',
    },
  });

  await prisma.clientPackage.update({
    where: { id: clientPackage.id },
    data: {
      sessionsUsed: completedCount,
      status: completedCount >= clientPackage.totalSessions ? 'COMPLETED' : 'ACTIVE',
    },
  });
}

// ─── Helpers ──────────────────────────────────────────────────

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
