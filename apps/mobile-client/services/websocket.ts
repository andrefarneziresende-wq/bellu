import { Platform } from 'react-native';
import { useAuthStore } from '../stores/authStore';

const DEFAULT_API_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? `http://${DEFAULT_API_HOST}:3333/api`;

// Derive WS URL from the API URL
function getWsUrl(): string {
  const base = API_BASE_URL.replace('/api', '');
  const wsBase = base.replace(/^http/, 'ws');
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
    const token = useAuthStore.getState().tokens?.accessToken;
    if (!token || this.isConnecting) return;

    this.shouldReconnect = true;
    this.isConnecting = true;

    try {
      const url = `${getWsUrl()}?token=${token}`;
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('[WS] Connected');
        this.isConnecting = false;
        this.reconnectDelay = 2000; // reset delay on success
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.emit(msg.type, msg.data);
        } catch {
          // ignore malformed messages
        }
      };

      this.ws.onclose = (event) => {
        console.log(`[WS] Closed: ${event.code}`);
        this.isConnecting = false;
        this.ws = null;

        // Don't reconnect on auth errors
        if (event.code === 4001 || event.code === 4002) {
          this.shouldReconnect = false;
          return;
        }

        if (this.shouldReconnect) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = () => {
        this.isConnecting = false;
        // onclose will fire after this
      };
    } catch {
      this.isConnecting = false;
      if (this.shouldReconnect) {
        this.scheduleReconnect();
      }
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

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    console.log(`[WS] Reconnecting in ${this.reconnectDelay}ms...`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.reconnectDelay);
    // Exponential backoff
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
        try {
          handler(data);
        } catch (err) {
          console.error('[WS] Handler error:', err);
        }
      }
    }
  }
}

export const wsManager = new WebSocketManager();
