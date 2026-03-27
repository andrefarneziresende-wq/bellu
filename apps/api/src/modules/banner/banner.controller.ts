import type { FastifyRequest, FastifyReply } from 'fastify';
import { createBannerSchema, paginationSchema } from '@beauty/shared-validators';
import * as bannerService from './banner.service.js';

export async function listActiveHandler(
  request: FastifyRequest<{ Querystring: { countryId?: string } }>,
  reply: FastifyReply,
) {
  const { countryId } = request.query;
  const banners = await bannerService.listActive(countryId);

  return reply.status(200).send({
    success: true,
    data: banners,
  });
}

export async function getByIdHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const { id } = request.params;
  const banner = await bannerService.getById(id);
  if (!banner) {
    return reply.status(404).send({ success: false, message: 'Banner not found' });
  }
  return reply.status(200).send({ success: true, data: banner });
}

export async function listAllHandler(
  request: FastifyRequest<{ Querystring: { page?: string; perPage?: string } }>,
  reply: FastifyReply,
) {
  const { page, perPage } = paginationSchema.parse(request.query);
  const result = await bannerService.listAll(page, perPage);

  return reply.status(200).send({
    success: true,
    data: result,
  });
}

export async function createHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = createBannerSchema.parse(request.body);
  const banner = await bannerService.create(body);

  return reply.status(201).send({
    success: true,
    data: banner,
  });
}

export async function updateHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const { id } = request.params;
  const banner = await bannerService.update(id, request.body as Record<string, unknown>);

  return reply.status(200).send({
    success: true,
    data: banner,
  });
}

export async function deleteHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const { id } = request.params;
  await bannerService.deleteBanner(id);

  return reply.status(204).send();
}
