import { create } from 'zustand';
import { conversationsApi } from '../services/api';

interface UnreadState {
  count: number;
  refresh: () => void;
}

export const useUnreadMessages = create<UnreadState>((set) => ({
  count: 0,
  refresh: () => {
    conversationsApi
      .unreadCount()
      .then((res) => set({ count: res.data?.unreadCount ?? 0 }))
      .catch(() => {});
  },
}));
