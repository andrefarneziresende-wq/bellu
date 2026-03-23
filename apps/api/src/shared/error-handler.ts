import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from './errors.js';
import { env } from '../config/env.js';

// Prisma error codes
const PRISMA_UNIQUE_CONSTRAINT = 'P2002';
const PRISMA_NOT_FOUND = 'P2025';
const PRISMA_FOREIGN_KEY = 'P2003';

function isPrismaError(error: unknown): error is { code: string; meta?: { target?: string[]; cause?: string; modelName?: string; field_name?: string } } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string' &&
    (error as { code: string }).code.startsWith('P')
  );
}

export function errorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  // Zod validation errors
  if (error instanceof ZodError) {
    const fieldErrors = error.flatten().fieldErrors;
    const firstMessage = error.issues[0]?.message || 'Validation error';
    return reply.status(400).send({
      success: false,
      message: firstMessage,
      code: 'VALIDATION_ERROR',
      errors: fieldErrors,
    });
  }

  // App errors (our custom errors)
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      success: false,
      message: error.message,
      code: error.code,
    });
  }

  // Prisma errors
  if (isPrismaError(error)) {
    switch (error.code) {
      case PRISMA_UNIQUE_CONSTRAINT: {
        const fields = error.meta?.target || [];
        const field = fields[0] || 'field';
        const friendlyField = field.charAt(0).toUpperCase() + field.slice(1);
        return reply.status(409).send({
          success: false,
          message: `${friendlyField} already exists`,
          code: 'CONFLICT',
        });
      }
      case PRISMA_NOT_FOUND: {
        const model = error.meta?.modelName || error.meta?.cause || 'Record';
        return reply.status(404).send({
          success: false,
          message: `${model} not found`,
          code: 'NOT_FOUND',
        });
      }
      case PRISMA_FOREIGN_KEY: {
        const field = error.meta?.field_name || 'related record';
        return reply.status(400).send({
          success: false,
          message: `Referenced ${field} does not exist`,
          code: 'BAD_REQUEST',
        });
      }
      default: {
        request.log.error(error, 'Unhandled Prisma error');
        return reply.status(500).send({
          success: false,
          message: 'Database error',
          code: 'DATABASE_ERROR',
        });
      }
    }
  }

  // Fastify validation errors
  if ('validation' in error && error.validation) {
    return reply.status(400).send({
      success: false,
      message: 'Validation error',
      code: 'VALIDATION_ERROR',
      errors: error.validation,
    });
  }

  // Unexpected errors
  request.log.error(error, 'Unhandled error');

  return reply.status(500).send({
    success: false,
    message: env.NODE_ENV === 'development' ? (error.message || 'Internal server error') : 'Internal server error',
    code: 'INTERNAL_ERROR',
  });
}
