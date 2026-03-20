import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from './errors.js';
import { env } from '../config/env.js';

export function errorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  // Zod validation errors
  if (error instanceof ZodError) {
    return reply.status(400).send({
      success: false,
      message: 'Validation error',
      errors: error.flatten().fieldErrors,
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

  // Fastify validation errors
  if ('validation' in error && error.validation) {
    return reply.status(400).send({
      success: false,
      message: 'Validation error',
      errors: error.validation,
    });
  }

  // Unexpected errors
  if (env.NODE_ENV === 'development') {
    console.error('Unhandled error:', error);
  }

  return reply.status(500).send({
    success: false,
    message: 'Internal server error',
  });
}
