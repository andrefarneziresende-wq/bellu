import { prisma } from '../../config/prisma.js';
import { NotFoundError, ForbiddenError } from '../../shared/errors.js';
import { sendPushToUser } from '../notification/push.service.js';

/**
 * Get or create a conversation between a client and a professional.
 */
export async function getOrCreateConversation(clientId: string, professionalId: string) {
  let conversation = await prisma.conversation.findUnique({
    where: { clientId_professionalId: { clientId, professionalId } },
  });

  if (!conversation) {
    // Verify the professional exists
    const pro = await prisma.professional.findUnique({ where: { id: professionalId } });
    if (!pro) throw new NotFoundError('Professional');

    conversation = await prisma.conversation.create({
      data: { clientId, professionalId },
    });
  }

  return conversation;
}

/**
 * List conversations for a user (as client or as professional).
 */
export async function listConversations(userId: string) {
  // Find the user's professional profile (owner or staff)
  let pro = await prisma.professional.findUnique({ where: { userId } });
  if (!pro) {
    // Check if user is a staff member
    const member = await prisma.professionalMember.findFirst({
      where: { userId, active: true },
      select: { professionalId: true },
    });
    if (member) {
      pro = await prisma.professional.findUnique({ where: { id: member.professionalId } });
    }
  }

  const conversations = await prisma.conversation.findMany({
    where: pro
      ? { OR: [{ clientId: userId }, { professionalId: pro.id }] }
      : { clientId: userId },
    include: {
      client: { select: { id: true, name: true, avatar: true } },
      professional: {
        select: {
          id: true,
          businessName: true,
          avatarPhoto: true,
          user: { select: { id: true, name: true } },
        },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { message: true, imageUrl: true, senderId: true, createdAt: true, readAt: true },
      },
    },
    orderBy: { lastMessageAt: { sort: 'desc', nulls: 'last' } },
  });

  // Calculate unread count per conversation
  const result = await Promise.all(
    conversations.map(async (conv) => {
      // Unread = messages NOT sent by this user that haven't been read
      const unreadCount = await prisma.conversationMessage.count({
        where: {
          conversationId: conv.id,
          senderId: { not: userId },
          readAt: null,
        },
      });

      const lastMsg = conv.messages[0] ?? null;
      const isUserThePro = pro && conv.professionalId === pro.id;
      const otherParty = isUserThePro
        ? { id: conv.client.id, name: conv.client.name, avatar: conv.client.avatar }
        : {
            id: conv.professional.id,
            name: conv.professional.businessName,
            avatar: conv.professional.avatarPhoto,
          };

      return {
        id: conv.id,
        professionalId: conv.professional.id,
        otherParty,
        lastMessage: lastMsg?.imageUrl ? '📷 Foto' : (lastMsg?.message ?? null),
        lastMessageAt: lastMsg?.createdAt ?? conv.createdAt,
        unreadCount,
      };
    }),
  );

  return result;
}

/**
 * Get messages for a conversation with access control.
 */
export async function getMessages(
  conversationId: string,
  userId: string,
  page = 1,
  perPage = 50,
) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      professional: { select: { userId: true, businessName: true, avatarPhoto: true } },
      client: { select: { id: true, name: true, avatar: true } },
    },
  });

  if (!conversation) throw new NotFoundError('Conversation');

  // Access check: must be the client or the professional's user
  const isClient = conversation.clientId === userId;
  const isPro = conversation.professional.userId === userId;
  if (!isClient && !isPro) throw new ForbiddenError('Not a participant');

  const [messages, total] = await Promise.all([
    prisma.conversationMessage.findMany({
      where: { conversationId },
      include: { sender: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'asc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.conversationMessage.count({ where: { conversationId } }),
  ]);

  return {
    messages,
    conversation: {
      id: conversation.id,
      client: conversation.client,
      professional: {
        id: conversation.professionalId,
        businessName: conversation.professional.businessName,
        avatarPhoto: conversation.professional.avatarPhoto,
        userId: conversation.professional.userId,
      },
    },
    pagination: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
  };
}

/**
 * Send a message in a conversation.
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  text?: string,
  imageUrl?: string,
) {
  if (!text && !imageUrl) {
    throw new Error('Message text or image is required');
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      professional: { select: { userId: true, businessName: true } },
      client: { select: { id: true, name: true } },
    },
  });

  if (!conversation) throw new NotFoundError('Conversation');

  const isClient = conversation.clientId === senderId;
  const isPro = conversation.professional.userId === senderId;
  if (!isClient && !isPro) throw new ForbiddenError('Not a participant');

  const [message] = await Promise.all([
    prisma.conversationMessage.create({
      data: {
        conversationId,
        senderId,
        message: text || null,
        imageUrl: imageUrl || null,
      },
      include: { sender: { select: { id: true, name: true, avatar: true } } },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    }),
  ]);

  // Send push notification to the other participant
  const receiverUserId = isClient
    ? conversation.professional.userId
    : conversation.clientId;
  const senderName = isClient
    ? conversation.client.name
    : conversation.professional.businessName;
  const notifBody = imageUrl ? '📷 Enviou uma foto' : (text || '');

  sendPushToUser(receiverUserId, {
    title: senderName,
    body: notifBody,
    type: 'chat_message',
    data: { conversationId, senderId },
  }).catch(() => {}); // fire-and-forget, don't block the response

  return message;
}

/**
 * Mark all messages from the other party as read.
 */
export async function markAsRead(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { professional: { select: { userId: true } } },
  });

  if (!conversation) throw new NotFoundError('Conversation');

  const isClient = conversation.clientId === userId;
  const isPro = conversation.professional.userId === userId;
  if (!isClient && !isPro) throw new ForbiddenError('Not a participant');

  const result = await prisma.conversationMessage.updateMany({
    where: {
      conversationId,
      senderId: { not: userId },
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return { markedAsRead: result.count };
}

/**
 * Get total unread conversation messages for a user.
 */
export async function getUnreadCount(userId: string) {
  let pro = await prisma.professional.findUnique({ where: { userId } });
  if (!pro) {
    const member = await prisma.professionalMember.findFirst({
      where: { userId, active: true },
      select: { professionalId: true },
    });
    if (member) {
      pro = await prisma.professional.findUnique({ where: { id: member.professionalId } });
    }
  }

  const where: Record<string, unknown> = {
    senderId: { not: userId },
    readAt: null,
  };

  if (pro) {
    // Count unread in conversations where user is client OR professional
    where.conversation = {
      OR: [{ clientId: userId }, { professionalId: pro.id }],
    };
  } else {
    where.conversation = { clientId: userId };
  }

  const count = await prisma.conversationMessage.count({ where });
  return { unreadCount: count };
}
