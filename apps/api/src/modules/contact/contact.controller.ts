import type { FastifyRequest, FastifyReply } from 'fastify';
import { createContactSchema } from '@beauty/shared-validators';
import * as contactService from './contact.service.js';

export async function createHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = createContactSchema.parse(request.body);

  const contact = await contactService.create(body);

  return reply.status(201).send({ success: true, data: contact });
}

export async function listHandler(
  request: FastifyRequest<{ Querystring: { resolved?: string } }>,
  reply: FastifyReply,
) {
  const { resolved } = request.query;

  const contacts = await contactService.list({
    resolved: resolved !== undefined ? resolved === 'true' : undefined,
  });

  return reply.status(200).send({ success: true, data: contacts });
}

export async function resolveHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const { id } = request.params;
  const contact = await contactService.resolve(id);

  return reply.status(200).send({ success: true, data: contact });
}
