'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send, Loader2, ImageIcon, ArrowLeft } from 'lucide-react';
import { apiFetch, apiUpload } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { wsManager } from '@/lib/websocket';

interface Conversation {
  id: string;
  professionalId: string;
  otherParty: { id: string; name: string; avatar: string | null };
  lastMessage: string | null;
  lastMessageAt: string;
  unreadCount: number;
}

interface Message {
  id: string;
  senderId: string;
  message: string | null;
  imageUrl: string | null;
  readAt: string | null;
  createdAt: string;
  sender: { id: string; name: string; avatar: string | null };
}

export default function ConversationsPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [chatName, setChatName] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadConversations = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: Conversation[] }>('/api/conversations');
      setConversations(res.data || []);
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const loadMessages = useCallback(async (convId: string) => {
    try {
      const res = await apiFetch<{
        data: {
          messages: Message[];
          conversation: {
            client: { id: string; name: string };
            professional: { businessName: string; userId: string };
          };
        };
      }>(`/api/conversations/${convId}/messages`);
      setMessages(res.data.messages || []);

      const conv = res.data.conversation;
      const isProUser = conv.professional.userId === user?.id;
      setChatName(isProUser ? conv.client.name : conv.professional.businessName);

      // Mark as read
      apiFetch(`/api/conversations/${convId}/read`, { method: 'PATCH' }).catch(() => {});
    } catch {}
  }, [user?.id]);

  const selectConversation = (convId: string) => {
    setSelectedId(convId);
    setLoadingMessages(true);
    loadMessages(convId).finally(() => setLoadingMessages(false));

    // Start polling
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(() => loadMessages(convId), 5000);
  };

  // WebSocket real-time listeners
  useEffect(() => {
    const unsubMsg = wsManager.on('new_message', (data: any) => {
      if (data?.conversationId === selectedId && data?.message) {
        if (data.message.senderId === user?.id) return;
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
        apiFetch(`/api/conversations/${selectedId}/read`, { method: 'PATCH' }).catch(() => {});
      }
      // Refresh conversation list for updated lastMessage
      loadConversations();
    });

    const unsubTyping = wsManager.on('typing', (data: any) => {
      if (data?.conversationId === selectedId && data?.userId !== user?.id) {
        setIsTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
      }
    });

    const unsubRead = wsManager.on('messages_read', (data: any) => {
      if (data?.conversationId === selectedId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.sender.id === user?.id && !m.readAt
              ? { ...m, readAt: new Date().toISOString() }
              : m,
          ),
        );
      }
    });

    return () => {
      unsubMsg();
      unsubTyping();
      unsubRead();
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [selectedId, user?.id, loadConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || sending || !selectedId) return;
    const text = inputText.trim();
    setInputText('');
    setSending(true);
    try {
      const res = await apiFetch<{ data: Message }>(`/api/conversations/${selectedId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message: text }),
      });
      setMessages((prev) => [...prev, res.data]);
    } catch {}
    setSending(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedId) return;
    setSending(true);
    try {
      const imageUrl = await apiUpload(file, 'chat');
      const res = await apiFetch<{ data: Message }>(`/api/conversations/${selectedId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ imageUrl }),
      });
      setMessages((prev) => [...prev, res.data]);
    } catch {}
    setSending(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return d.toLocaleDateString('pt-BR', { weekday: 'short' });
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-0 overflow-hidden">
      {/* Conversation List */}
      <div className={`w-full border-r md:w-80 md:block ${selectedId ? 'hidden md:block' : ''}`}>
        <div className="border-b p-4">
          <h1 className="font-serif text-lg font-bold">Conversas</h1>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <MessageSquare className="h-12 w-12" />
            <p className="mt-3 text-sm">Nenhuma conversa ainda</p>
          </div>
        ) : (
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 8rem)' }}>
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv.id)}
                className={`flex w-full items-center gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-muted/50 ${selectedId === conv.id ? 'bg-muted' : ''}`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {conv.otherParty.avatar ? (
                    <img src={conv.otherParty.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold">{conv.otherParty.name.charAt(0)}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-medium">{conv.otherParty.name}</p>
                    <span className="text-xs text-muted-foreground">{formatTime(conv.lastMessageAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="truncate text-xs text-muted-foreground">{conv.lastMessage || 'Sem mensagens'}</p>
                    {conv.unreadCount > 0 && (
                      <span className="ml-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className={`flex flex-1 flex-col ${!selectedId ? 'hidden md:flex' : 'flex'}`}>
        {!selectedId ? (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="mx-auto h-16 w-16" />
              <p className="mt-4 text-sm">Selecione uma conversa</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 border-b px-4 py-3">
              <button onClick={() => { setSelectedId(null); if (pollingRef.current) clearInterval(pollingRef.current); }} className="md:hidden">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <p className="font-medium">{chatName}</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMessages ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <p className="text-sm">Nenhuma mensagem ainda</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.sender.id === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${isMine ? 'bg-primary text-white rounded-br-sm' : 'bg-muted rounded-bl-sm'}`}>
                        {msg.imageUrl && (
                          <img src={msg.imageUrl} alt="" className="mb-1.5 max-w-[240px] rounded-lg" />
                        )}
                        {msg.message && (
                          <p className="text-sm leading-relaxed">{msg.message}</p>
                        )}
                        <p className={`mt-1 text-right text-[10px] ${isMine ? 'text-white/70' : 'text-muted-foreground'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          {isMine && (
                            <span className="ml-1">{msg.readAt ? '✓✓' : '✓'}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Typing indicator */}
            {isTyping && (
              <div className="px-4 py-1">
                <p className="text-xs italic text-muted-foreground">digitando...</p>
              </div>
            )}

            {/* Input */}
            <div className="flex items-end gap-2 border-t p-3">
              <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
              <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={sending}>
                <ImageIcon className="h-5 w-5" />
              </Button>
              <Input
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  const now = Date.now();
                  if (now - lastTypingSentRef.current > 2000 && selectedId) {
                    lastTypingSentRef.current = now;
                    wsManager.send({ type: 'typing', conversationId: selectedId });
                  }
                }}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Digite sua mensagem..."
                className="flex-1"
              />
              <Button onClick={handleSend} disabled={!inputText.trim() || sending} size="icon">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
