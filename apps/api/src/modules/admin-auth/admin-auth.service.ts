import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import { UnauthorizedError } from '../../shared/errors.js';
import type { FastifyInstance } from 'fastify';
import type { JwtPayload } from '../../shared/auth-middleware.js';

export async function adminLogin(email: string, password: string, app: FastifyInstance) {
  const admin = await prisma.adminUser.findUnique({ where: { email } });

  if (!admin || !admin.active) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    throw new UnauthorizedError('Invalid credentials');
  }

  // Use the standard JwtPayload shape so jwt.verify works with the shared middleware
  const payload: JwtPayload = {
    userId: admin.id,
    email: admin.email,
    locale: 'pt-BR',
  };

  const accessToken = app.jwt.sign(payload, { expiresIn: '8h' });

  const { passwordHash: _, ...adminWithoutPassword } = admin;

  return { admin: adminWithoutPassword, accessToken };
}

export async function getAdminById(id: string) {
  const admin = await prisma.adminUser.findUnique({ where: { id } });
  if (!admin) throw new UnauthorizedError('Admin not found');
  const { passwordHash: _, ...adminWithoutPassword } = admin;
  return adminWithoutPassword;
}
