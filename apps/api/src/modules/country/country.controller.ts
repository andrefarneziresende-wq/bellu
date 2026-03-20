import { FastifyRequest, FastifyReply } from 'fastify';
import { listCountries, getCountryById, getCountryByCode } from './country.service.js';

export async function listHandler(_request: FastifyRequest, reply: FastifyReply) {
  const countries = await listCountries();
  return reply.send({ success: true, data: countries });
}

export async function getByIdHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const country = await getCountryById(request.params.id);
  return reply.send({ success: true, data: country });
}

export async function getByCodeHandler(
  request: FastifyRequest<{ Params: { code: string } }>,
  reply: FastifyReply,
) {
  const country = await getCountryByCode(request.params.code);
  return reply.send({ success: true, data: country });
}
