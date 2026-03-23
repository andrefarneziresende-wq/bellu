import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { ConflictError, UnauthorizedError } from '../../shared/errors.js';
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
