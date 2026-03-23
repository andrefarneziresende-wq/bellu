import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { searchAddresses, geocodeAddress } from './geocoding.service.js';

export async function geocodingRoutes(app: FastifyInstance) {
  // Search addresses (for autocomplete)
  app.get<{ Querystring: { q: string; limit?: string } }>(
    '/search',
    async (request: FastifyRequest<{ Querystring: { q: string; limit?: string } }>, reply: FastifyReply) => {
      const { q, limit } = request.query;
      if (!q || q.length < 3) {
        return reply.send({ success: true, data: [] });
      }
      const results = await searchAddresses(q, limit ? parseInt(limit) : 5);
      return reply.send({ success: true, data: results });
    },
  );

  // Geocode a single address
  app.get<{ Querystring: { address: string } }>(
    '/geocode',
    async (request: FastifyRequest<{ Querystring: { address: string } }>, reply: FastifyReply) => {
      const { address } = request.query;
      if (!address) {
        return reply.status(400).send({ success: false, message: 'Address is required' });
      }
      const result = await geocodeAddress(address);
      if (!result) {
        return reply.status(404).send({ success: false, message: 'Address not found' });
      }
      return reply.send({ success: true, data: result });
    },
  );
}
