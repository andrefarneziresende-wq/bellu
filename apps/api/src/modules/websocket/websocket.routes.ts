import type { FastifyInstance } from 'fastify';
import { addConnection } from './websocket.service.js';

export async function websocketRoutes(app: FastifyInstance) {
  app.get('/connect', { websocket: true }, async (socket, request) => {
    // Authenticate via query param token
    const token = (request.query as Record<string, string>).token;
    if (!token) {
      socket.close(4001, 'Missing token');
      return;
    }

    try {
      const payload = app.jwt.verify<{ userId: string }>(token);
      const userId = payload.userId;

      addConnection(userId, socket);
      console.log(`[WS] User ${userId} connected`);

      // Keep-alive ping every 30s
      const pingInterval = setInterval(() => {
        if (socket.readyState === socket.OPEN) {
          socket.ping();
        }
      }, 30_000);

      socket.on('close', () => {
        clearInterval(pingInterval);
        console.log(`[WS] User ${userId} disconnected`);
      });

      socket.on('message', (raw: Buffer) => {
        // Handle client messages (e.g., typing indicators in the future)
        try {
          const msg = JSON.parse(raw.toString());
          if (msg.type === 'ping') {
            socket.send(JSON.stringify({ type: 'pong' }));
          }
        } catch {
          // ignore malformed messages
        }
      });
    } catch {
      socket.close(4002, 'Invalid token');
    }
  });
}
