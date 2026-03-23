import { prisma } from '../../config/prisma.js';
import { NotFoundError, ForbiddenError } from '../../shared/errors.js';

/**
 * Verify that a user is a participant in a booking (client or professional/staff).
 */
async function verifyParticipant(bookingId: string, userId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      userId: true,
      professionalId: true,
      status: true,
      professional: { select: { userId: true } },
      member: { select: { userId: true } },
    },
  });

  if (!booking) throw new NotFoundError('Booking');

  const isProfessionalOwner = booking.professional.userId === userId;
  const isClient = booking.userId === userId;
  const isStaffMember = booking.member?.userId === userId;

  if (!isProfessionalOwner && !isClient && !isStaffMember) {
    throw new ForbiddenError('You are not a participant in this booking');
  }

  return booking;
}

/**
 * Upload a photo to a booking.
 * Security: only allowed when booking is COMPLETED.
 * Only professional/staff can upload (not the client).
 */
export async function addPhoto(
  bookingId: string,
  userId: string,
  imageUrl: string,
  description?: string,
) {
  const booking = await verifyParticipant(bookingId, userId);

  // Only allow photo upload on completed bookings
  if (booking.status !== 'COMPLETED') {
    throw new ForbiddenError('Photos can only be added to completed bookings');
  }

  // Only professional owner or staff member can upload photos
  const isProfessionalOwner = booking.professional.userId === userId;
  const isStaffMember = booking.member?.userId === userId;

  if (!isProfessionalOwner && !isStaffMember) {
    throw new ForbiddenError('Only the professional or assigned staff can upload photos');
  }

  return prisma.bookingPhoto.create({
    data: {
      bookingId,
      imageUrl,
      description: description || null,
      uploadedById: userId,
    },
    select: {
      id: true,
      imageUrl: true,
      description: true,
      createdAt: true,
      uploadedBy: { select: { id: true, name: true } },
    },
  });
}

/**
 * List photos for a booking.
 * Security: only participants can view.
 */
export async function listByBooking(bookingId: string, userId: string) {
  await verifyParticipant(bookingId, userId);

  return prisma.bookingPhoto.findMany({
    where: { bookingId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      imageUrl: true,
      description: true,
      createdAt: true,
      uploadedBy: { select: { id: true, name: true } },
    },
  });
}

/**
 * List all photos across a client package's sessions (evolution timeline).
 * Security: only client or professional can view.
 */
export async function listByClientPackage(clientPackageId: string, userId: string) {
  const clientPackage = await prisma.clientPackage.findUnique({
    where: { id: clientPackageId },
    select: {
      userId: true,
      professional: { select: { userId: true } },
    },
  });

  if (!clientPackage) throw new NotFoundError('Client package');

  const isClient = clientPackage.userId === userId;
  const isProfessional = clientPackage.professional.userId === userId;

  if (!isClient && !isProfessional) {
    throw new ForbiddenError('Access denied');
  }

  // Get all photos from all bookings in this package, ordered by session
  return prisma.bookingPhoto.findMany({
    where: {
      booking: { clientPackageId },
    },
    orderBy: [
      { booking: { sessionNumber: 'asc' } },
      { createdAt: 'asc' },
    ],
    select: {
      id: true,
      imageUrl: true,
      description: true,
      createdAt: true,
      booking: {
        select: {
          id: true,
          sessionNumber: true,
          date: true,
          service: { select: { name: true } },
        },
      },
    },
  });
}

/**
 * Delete a photo.
 * Security: only the uploader or professional owner can delete.
 */
export async function deletePhoto(photoId: string, userId: string) {
  const photo = await prisma.bookingPhoto.findUnique({
    where: { id: photoId },
    include: {
      booking: {
        select: {
          professional: { select: { userId: true } },
        },
      },
    },
  });

  if (!photo) throw new NotFoundError('Photo');

  const isUploader = photo.uploadedById === userId;
  const isProfessionalOwner = photo.booking.professional.userId === userId;

  if (!isUploader && !isProfessionalOwner) {
    throw new ForbiddenError('You cannot delete this photo');
  }

  await prisma.bookingPhoto.delete({ where: { id: photoId } });
}
