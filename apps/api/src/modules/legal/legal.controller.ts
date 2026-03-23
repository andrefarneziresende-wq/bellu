import type { FastifyRequest, FastifyReply } from 'fastify';
import * as legalService from './legal.service.js';

export async function getActiveByTypeHandler(
  request: FastifyRequest<{ Params: { type: string }; Querystring: { locale?: string } }>,
  reply: FastifyReply,
) {
  const { type } = request.params;
  const locale = request.query.locale ?? 'pt-BR';
  const document = await legalService.getActiveByType(type, locale);

  return reply.status(200).send({
    success: true,
    data: document,
  });
}

export async function listActiveHandler(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  const documents = await legalService.listActive();

  return reply.status(200).send({
    success: true,
    data: documents,
  });
}

export async function listAllHandler(
  request: FastifyRequest<{ Querystring: { page?: string; perPage?: string } }>,
  reply: FastifyReply,
) {
  const page = request.query.page ? parseInt(request.query.page, 10) : 1;
  const perPage = request.query.perPage ? parseInt(request.query.perPage, 10) : 20;
  const result = await legalService.listAll(page, perPage);

  return reply.status(200).send({
    success: true,
    data: result,
  });
}

export async function createHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = request.body as {
    type: string;
    locale: string;
    title: string;
    content: string;
    version: string;
    active?: boolean;
  };
  const document = await legalService.create(body);

  return reply.status(201).send({
    success: true,
    data: document,
  });
}

export async function updateHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const { id } = request.params;
  const document = await legalService.update(id, request.body as Record<string, unknown>);

  return reply.status(200).send({
    success: true,
    data: document,
  });
}

export async function deleteHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const { id } = request.params;
  await legalService.deleteDocument(id);

  return reply.status(204).send();
}
