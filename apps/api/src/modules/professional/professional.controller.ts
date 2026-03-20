import { FastifyRequest, FastifyReply } from 'fastify';
import {
  createProfessionalSchema,
  updateProfessionalSchema,
  searchProfessionalsSchema,
} from '@beauty/shared-validators';
import {
  createProfessional,
  getProfessionalById,
  getProfessionalByUserId,
  updateProfessional,
  searchProfessionals,
  listFeatured,
} from './professional.service.js';

export async function createHandler(request: FastifyRequest, reply: FastifyReply) {
  const data = createProfessionalSchema.parse(request.body);
  const professional = await createProfessional(request.user.userId, data);
  return reply.status(201).send({ success: true, data: professional });
}

export async function getByIdHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const professional = await getProfessionalById(request.params.id);
  return reply.send({ success: true, data: professional });
}

export async function getMyProfileHandler(request: FastifyRequest, reply: FastifyReply) {
  const professional = await getProfessionalByUserId(request.user.userId);
  return reply.send({ success: true, data: professional });
}

export async function updateHandler(request: FastifyRequest, reply: FastifyReply) {
  const data = updateProfessionalSchema.parse(request.body);
  const myProfile = await getProfessionalByUserId(request.user.userId);
  const professional = await updateProfessional(myProfile.id, request.user.userId, data);
  return reply.send({ success: true, data: professional });
}

export async function searchHandler(request: FastifyRequest, reply: FastifyReply) {
  const filters = searchProfessionalsSchema.parse(request.query);
  const result = await searchProfessionals(filters);
  return reply.send({ success: true, ...result });
}

export async function featuredHandler(
  request: FastifyRequest<{ Querystring: { countryId: string; limit?: string } }>,
  reply: FastifyReply,
) {
  const { countryId, limit } = request.query;
  const professionals = await listFeatured(countryId, limit ? parseInt(limit, 10) : undefined);
  return reply.send({ success: true, data: professionals });
}
