import type { WebSocket } from 'ws';

/**
 * In-memory map of userId → Set of active WebSocket connections.
 * A single user can have multiple devices connected simultaneously.
 */
const connections = new Map<string, Set<WebSocket>>();

export function addConnection(userId: string, ws: WebSocket) {
  if (!connections.has(userId)) {
    connections.set(userId, new Set());
  }
  connections.get(userId)!.add(ws);

  ws.on('close', () => {
    const userConns = connections.get(userId);
    if (userConns) {
      userConns.delete(ws);
      if (userConns.size === 0) connections.delete(userId);
    }
  });
}

/** Send a JSON event to all connections of a given user. */
export function sendToUser(userId: string, event: { type: string; data: unknown }) {
  const userConns = connections.get(userId);
  if (!userConns) return;

  const payload = JSON.stringify(event);
  for (const ws of userConns) {
    if (ws.readyState === ws.OPEN) {
      ws.send(payload);
    }
  }
}

/** Check if a user has any active connections. */
export function isUserOnline(userId: string): boolean {
  const userConns = connections.get(userId);
  return !!userConns && userConns.size > 0;
}

/** Get total connected users (for debugging). */
export function getStats() {
  let totalConnections = 0;
  for (const conns of connections.values()) {
    totalConnections += conns.size;
  }
  return { users: connections.size, connections: totalConnections };
}
