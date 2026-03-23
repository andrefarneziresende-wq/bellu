import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { BadRequestError, ConflictError, UnauthorizedError } from '../../shared/errors.js';
import type { FastifyInstance } from 'fastify';
import type { JwtPayload } from '../../shared/auth-middleware.js';

interface RegisterInput {
  name: string;
  email?: string;
  phone?: string;
  password: string;
  countryId: string;
  locale: string;
}

interface LoginInput {
  email?: string;
  phone?: string;
  password: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export async function register(data: RegisterInput, app: FastifyInstance) {
  if (data.email) {
    const existingByEmail = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingByEmail) {
      throw new ConflictError('Email already registered');
    }
  }

  if (data.phone) {
    const existingByPhone = await prisma.user.findUnique({ where: { phone: data.phone } });
    if (existingByPhone) {
      throw new ConflictError('Phone already registered');
    }
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      passwordHash,
      countryId: data.countryId,
      locale: data.locale,
    },
  });

  const tokens = await generateTokens(user, app);

  const { passwordHash: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, tokens };
}

export async function login(data: LoginInput, app: FastifyInstance) {
  const user = await prisma.user.findFirst({
    where: data.email ? { email: data.email } : { phone: data.phone },
  });

  if (!user || !user.passwordHash) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const validPassword = await bcrypt.compare(data.password, user.passwordHash);

  if (!validPassword) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const tokens = await generateTokens(user, app);

  const { passwordHash: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, tokens };
}

export async function refreshToken(token: string, app: FastifyInstance) {
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!storedToken) {
    throw new UnauthorizedError('Invalid refresh token');
  }

  if (storedToken.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    throw new UnauthorizedError('Refresh token expired');
  }

  // Delete the used refresh token
  await prisma.refreshToken.delete({ where: { id: storedToken.id } });

  const tokens = await generateTokens(storedToken.user, app);

  return { tokens };
}

// --- Social Auth ---

interface GoogleTokenInfo {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
}

interface AppleTokenPayload {
  sub: string;
  email?: string;
}

interface SocialAuthResult {
  user: Record<string, unknown>;
  tokens: TokenPair;
}

export async function googleSignIn(
  data: { idToken: string; countryId: string; locale: string },
  app: FastifyInstance,
): Promise<SocialAuthResult> {
  // Verify the Google ID token via Google's tokeninfo endpoint
  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(data.idToken)}`,
  );

  if (!response.ok) {
    throw new UnauthorizedError('Invalid Google ID token');
  }

  const googleData = (await response.json()) as GoogleTokenInfo;

  if (!googleData.email || !googleData.sub) {
    throw new UnauthorizedError('Google token missing required fields');
  }

  // Try to find existing user by email
  let user = await prisma.user.findUnique({ where: { email: googleData.email } });

  if (user) {
    // Link Google provider if not already linked
    if (user.authProvider !== 'google') {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          authProvider: 'google',
          authProviderId: googleData.sub,
          avatar: user.avatar ?? googleData.picture ?? null,
        },
      });
    }
  } else {
    // Create new user
    user = await prisma.user.create({
      data: {
        name: googleData.name ?? googleData.email.split('@')[0],
        email: googleData.email,
        passwordHash: null,
        authProvider: 'google',
        authProviderId: googleData.sub,
        avatar: googleData.picture ?? null,
        countryId: data.countryId,
        locale: data.locale,
      },
    });
  }

  const tokens = await generateTokens(user, app);
  const { passwordHash: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, tokens };
}

export async function appleSignIn(
  data: {
    identityToken: string;
    fullName?: { givenName?: string; familyName?: string };
    email?: string;
    countryId: string;
    locale: string;
  },
  app: FastifyInstance,
): Promise<SocialAuthResult> {
  // Decode the Apple identity token JWT (base64 decode payload)
  const parts = data.identityToken.split('.');
  if (parts.length !== 3) {
    throw new UnauthorizedError('Invalid Apple identity token format');
  }

  let payload: AppleTokenPayload;
  try {
    const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf-8');
    payload = JSON.parse(payloadJson) as AppleTokenPayload;
  } catch {
    throw new UnauthorizedError('Failed to decode Apple identity token');
  }

  if (!payload.sub) {
    throw new UnauthorizedError('Apple token missing subject');
  }

  const email = payload.email ?? data.email;

  // Try to find existing user by authProviderId (apple sub) or by email
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { authProvider: 'apple', authProviderId: payload.sub },
        ...(email ? [{ email }] : []),
      ],
    },
  });

  if (user) {
    // Link Apple provider if not already linked
    if (user.authProvider !== 'apple') {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          authProvider: 'apple',
          authProviderId: payload.sub,
        },
      });
    }
  } else {
    // Build name from fullName (Apple only sends this on first sign-in)
    const nameParts = [data.fullName?.givenName, data.fullName?.familyName].filter(Boolean);
    const name = nameParts.length > 0 ? nameParts.join(' ') : (email?.split('@')[0] ?? 'Apple User');

    user = await prisma.user.create({
      data: {
        name,
        email: email ?? null,
        passwordHash: null,
        authProvider: 'apple',
        authProviderId: payload.sub,
        countryId: data.countryId,
        locale: data.locale,
      },
    });
  }

  const tokens = await generateTokens(user, app);
  const { passwordHash: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, tokens };
}

export async function forgotPassword(email: string) {
  // We don't reveal whether the email exists or not
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Return silently to avoid email enumeration
    return { message: 'If that email is registered, a reset code has been sent.' };
  }

  // Invalidate any previous unused tokens for this email
  await prisma.passwordResetToken.updateMany({
    where: { email, used: false },
    data: { used: true },
  });

  // Generate a 6-digit code
  const code = String(Math.floor(100000 + Math.random() * 900000));

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15);

  await prisma.passwordResetToken.create({
    data: { email, code, expiresAt },
  });

  // Send email via Resend or log to console in dev
  if (env.RESEND_API_KEY) {
    const { Resend } = await import('resend');
    const resend = new Resend(env.RESEND_API_KEY);

    await resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to: email,
      subject: 'Your password reset code',
      html: `<p>Your password reset code is: <strong>${code}</strong></p><p>This code expires in 15 minutes.</p>`,
    });
  } else {
    console.log(`[DEV] Password reset code for ${email}: ${code}`);
  }

  return { message: 'If that email is registered, a reset code has been sent.' };
}

export async function resetPassword(email: string, code: string, newPassword: string) {
  const token = await prisma.passwordResetToken.findFirst({
    where: { email, code, used: false },
    orderBy: { createdAt: 'desc' },
  });

  if (!token) {
    throw new BadRequestError('Invalid or expired reset code');
  }

  if (token.expiresAt < new Date()) {
    await prisma.passwordResetToken.update({
      where: { id: token.id },
      data: { used: true },
    });
    throw new BadRequestError('Reset code has expired');
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.passwordResetToken.update({
      where: { id: token.id },
      data: { used: true },
    }),
    prisma.user.update({
      where: { email },
      data: { passwordHash },
    }),
  ]);

  return { message: 'Password has been reset successfully' };
}

export async function generateTokens(
  user: { id: string; email: string | null; locale: string },
  app: FastifyInstance,
): Promise<TokenPair> {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    locale: user.locale,
  };

  const accessToken = app.jwt.sign(payload, { expiresIn: env.JWT_EXPIRES_IN });

  const refreshTokenValue = crypto.randomUUID();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + env.REFRESH_TOKEN_EXPIRES_IN_DAYS);

  await prisma.refreshToken.create({
    data: {
      token: refreshTokenValue,
      userId: user.id,
      expiresAt,
    },
  });

  return {
    accessToken,
    refreshToken: refreshTokenValue,
  };
}
