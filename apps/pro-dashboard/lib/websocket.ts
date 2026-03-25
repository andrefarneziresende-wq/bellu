const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

function getWsUrl(): string {
  const wsBase = API_URL.replace(/^http/, 'ws');
  return `${wsBase}/ws/connect`;
}

type EventHandler = (data: any) => void;

class WebSocketManager {
  private ws: WebSocket | null = null;
  private listeners = new Map<string, Set<EventHandler>>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 2000;
  private maxReconnectDelay = 30000;
  private isConnecting = false;
  private shouldReconnect = false;

  connect() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('pro_token') : null;
    if (!token || this.isConnecting) return;

    this.shouldReconnect = true;
    this.isConnecting = true;

    try {
      const url = `${getWsUrl()}?token=${token}`;
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.reconnectDelay = 2000;
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.emit(msg.type, msg.data);
        } catch {}
      };

      this.ws.onclose = (event) => {
        this.isConnecting = false;
        this.ws = null;
        if (event.code === 4001 || event.code === 4002) {
          this.shouldReconnect = false;
          return;
        }
        if (this.shouldReconnect) this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.isConnecting = false;
      };
    } catch {
      this.isConnecting = false;
      if (this.shouldReconnect) this.scheduleReconnect();
    }
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(data: { type: string; [key: string]: unknown }) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.reconnectDelay);
    this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, this.maxReconnectDelay);
  }

  on(type: string, handler: EventHandler) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(handler);
    return () => {
      this.listeners.get(type)?.delete(handler);
    };
  }

  private emit(type: string, data: unknown) {
    const handlers = this.listeners.get(type);
    if (handlers) {
      for (const handler of handlers) {
        try { handler(data); } catch {}
      }
    }
  }
}

export const wsManager = new WebSocketManager();
