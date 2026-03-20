import type { FastifyRequest, FastifyReply } from 'fastify';
import { createCategorySchema } from '@beauty/shared-validators';
import * as categoryService from './category.service.js';

export async function listHandler(
  request: FastifyRequest<{ Querystring: { locale?: string } }>,
  reply: FastifyReply,
) {
  const { locale } = request.query;
  const categories = await categoryService.listCategories(locale);
  return reply.send({ success: true, data: categories });
}

export async function getByIdHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const category = await categoryService.getCategoryById(request.params.id);
  return reply.send({ success: true, data: category });
}

export async function createHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = createCategorySchema.parse(request.body);
  const category = await categoryService.createCategory(body);
  return reply.status(201).send({ success: true, data: category });
}

export async function updateHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const body = createCategorySchema.partial().parse(request.body);
  const category = await categoryService.updateCategory(request.params.id, body);
  return reply.send({ success: true, data: category });
}

export async function deleteHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  await categoryService.deleteCategory(request.params.id);
  return reply.send({ success: true, data: null });
}
