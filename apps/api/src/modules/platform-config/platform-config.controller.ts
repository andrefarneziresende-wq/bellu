import type { FastifyRequest, FastifyReply } from 'fastify';
import * as platformConfigService from './platform-config.service.js';

export async function getAllHandler(
  request: FastifyRequest<{ Querystring: { countryId?: string } }>,
  reply: FastifyReply,
) {
  const { countryId } = request.query;
  const configs = await platformConfigService.getAll(countryId);

  return reply.status(200).send({ success: true, data: configs });
}

export async function getHandler(
  request: FastifyRequest<{ Params: { key: string }; Querystring: { countryId?: string } }>,
  reply: FastifyReply,
) {
  const { key } = request.params;
  const { countryId } = request.query;
  const config = await platformConfigService.get(key, countryId);

  return reply.status(200).send({ success: true, data: config });
}

export async function setHandler(
  request: FastifyRequest<{ Params: { key: string } }>,
  reply: FastifyReply,
) {
  const { key } = request.params;
  const body = request.body as { value: string; countryId?: string };

  const config = await platformConfigService.set(key, body.value, body.countryId);

  return reply.status(200).send({ success: true, data: config });
}

export async function deleteHandler(
  request: FastifyRequest<{ Params: { key: string }; Querystring: { countryId?: string } }>,
  reply: FastifyReply,
) {
  const { key } = request.params;
  const { countryId } = request.query;

  await platformConfigService.remove(key, countryId);

  return reply.status(200).send({ success: true, data: null });
}
