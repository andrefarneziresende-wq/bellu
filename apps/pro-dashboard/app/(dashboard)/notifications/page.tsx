'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Mail,
  MessageSquare,
  Phone,
  Loader2,
  Send,
  CheckCircle,
  XCircle,
  Info,
  Check,
  Calendar,
  User,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { useTranslation } from '@/lib/i18n';

interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  data: Record<string, unknown> | null;
  createdAt: string;
}

interface NotificationStatus {
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
}

type TabType = 'inbox' | 'send' | 'channels';

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('inbox');
  const toast = useToast();
  const { t } = useTranslation();

  // ── Inbox state ────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // ── Send state ─────────────────────────────────────────────────────
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  // ── Channels state ─────────────────────────────────────────────────
  const [status, setStatus] = useState<NotificationStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // ── Inbox logic ────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    setLoadingNotifications(true);
    try {
      const res = await apiFetch<{ data: AppNotification[]; unreadCount: number }>('/api/notifications/my');
      setNotifications(res.data || []);
      setUnreadCount(res.unreadCount ?? 0);
    } catch {
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await apiFetch('/api/notifications/read-all', { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking_created':
      case 'booking_confirmed':
      case 'booking_cancelled':
        return <Calendar className="h-4 w-4" />;
      case 'new_message':
        return <MessageSquare className="h-4 w-4" />;
      case 'new_client':
        return <User className="h-4 w-4" />;
      case 'pro_message':
      case 'admin_broadcast':
        return <Send className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'agora';
    if (diffMin < 60) return `${diffMin}min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD}d`;
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  // ── Send logic ─────────────────────────────────────────────────────
  const insertTag = (tag: string) => setBody((prev) => prev + tag);

  const handleSend = async () => {
    if (!title.trim()) { toast.error('O título é obrigatório'); return; }
    if (!body.trim()) { toast.error('A mensagem é obrigatória'); return; }

    setSending(true);
    try {
      await apiFetch('/api/notifications/pro/broadcast', {
        method: 'POST',
        body: JSON.stringify({ title: title.trim(), body: body.trim() }),
      });
      toast.success('Notificação enviada para seus clientes!');
      setTitle('');
      setBody('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar');
    } finally {
      setSending(false);
    }
  };

  // ── Channels logic ─────────────────────────────────────────────────
  const fetchStatus = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const res = await apiFetch<{ data: NotificationStatus }>('/api/notifications/status');
      setStatus(res.data);
    } catch {
      setStatus(null);
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const channels = [
    { key: 'email', label: t('proDashboard.notifications.channelEmail'), icon: Mail, active: status?.email, setup: t('proDashboard.notifications.setupEmail') },
    { key: 'sms', label: t('proDashboard.notifications.channelSms'), icon: Phone, active: status?.sms, setup: t('proDashboard.notifications.setupSms') },
    { key: 'whatsapp', label: t('proDashboard.notifications.channelWhatsapp'), icon: MessageSquare, active: status?.whatsapp, setup: t('proDashboard.notifications.setupWhatsapp') },
  ];

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">{t('proDashboard.notifications.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('proDashboard.notifications.subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        <button
          onClick={() => setActiveTab('inbox')}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'inbox' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
        >
          <Bell className="h-4 w-4" />
          Recebidas
          {unreadCount > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-rose px-1.5 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('send')}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'send' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
        >
          <Send className="h-4 w-4" />
          Enviar para clientes
        </button>
        <button
          onClick={() => setActiveTab('channels')}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'channels' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
        >
          <Info className="h-4 w-4" />
          Canais
        </button>
      </div>

      {/* ── Inbox Tab ───────────────────────────────────────────── */}
      {activeTab === 'inbox' && (
        <div className="space-y-3">
          {unreadCount > 0 && (
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={markAllRead}>
                <Check className="mr-1.5 h-3.5 w-3.5" />
                Marcar todas como lidas
              </Button>
            </div>
          )}

          {loadingNotifications ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Bell className="h-12 w-12" />
                <p className="mt-3 text-sm">Nenhuma notificação ainda</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => !notif.read && markAsRead(notif.id)}
                  className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors hover:bg-muted/50 ${!notif.read ? 'border-brand-rose/30 bg-brand-rose/5' : 'bg-white'}`}
                >
                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${!notif.read ? 'bg-brand-rose/15 text-brand-rose' : 'bg-muted text-muted-foreground'}`}>
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm ${!notif.read ? 'font-semibold' : 'font-medium'}`}>
                        {notif.title}
                      </p>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatTime(notif.createdAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                      {notif.body}
                    </p>
                  </div>
                  {!notif.read && (
                    <div className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-rose" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Send Tab ────────────────────────────────────────────── */}
      {activeTab === 'send' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-card/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-brand-rose" />
                Enviar notificação
              </CardTitle>
              <CardDescription>
                Envie uma notificação push para todos os seus clientes.
                Use <code className="rounded bg-muted px-1 py-0.5 text-xs">{'{{name}}'}</code> para
                inserir o nome do cliente automaticamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Novidade para você, {{name}}!"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Mensagem</Label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Olá {{name}}, temos uma novidade especial..."
                  rows={4}
                  className="mt-1"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => insertTag('{{name}}')}
                    className="rounded-md border border-input bg-background px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    + Nome do cliente
                  </button>
                </div>
              </div>

              {/* Preview */}
              {(title || body) && (
                <div className="rounded-lg border border-dashed border-muted-foreground/30 p-3">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Pré-visualização:</p>
                  <p className="text-sm font-semibold">{title.replace(/\{\{name\}\}/gi, 'Maria')}</p>
                  <p className="text-sm text-muted-foreground">
                    {body.replace(/\{\{name\}\}/gi, 'Maria')}
                  </p>
                </div>
              )}

              <Button onClick={handleSend} disabled={sending} className="w-full">
                {sending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</>
                ) : (
                  <><Send className="mr-2 h-4 w-4" /> Enviar para todos os clientes</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* How it works */}
          <Card className="bg-card/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-brand-rose" />
                Como funciona
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Ao enviar uma notificação, todos os clientes que já agendaram com você receberão uma notificação push no celular.</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>A notificação aparece como push no celular do cliente</li>
                <li>O cliente precisa ter o app instalado e notificações ativadas</li>
                <li>Use para divulgar promoções, horários disponíveis ou novidades</li>
                <li>Evite enviar muitas notificações para não incomodar seus clientes</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Channels Tab ────────────────────────────────────────── */}
      {activeTab === 'channels' && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {loadingStatus ? (
              <div className="col-span-full flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : channels.map((ch) => (
              <Card key={ch.key}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ch.icon className="h-5 w-5 text-brand-rose" />
                      <CardTitle className="text-base">{ch.label}</CardTitle>
                    </div>
                    <Badge variant={ch.active ? 'default' : 'secondary'}>
                      {ch.active ? (
                        <><CheckCircle className="mr-1 h-3 w-3" />{t('proDashboard.notifications.active')}</>
                      ) : (
                        <><XCircle className="mr-1 h-3 w-3" />{t('proDashboard.notifications.inactive')}</>
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{ch.label}</p>
                  {!ch.active && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg bg-muted p-3">
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-gold" />
                      <p className="text-xs text-muted-foreground">{ch.setup}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-brand-rose" />
                {t('proDashboard.notifications.howItWorks')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>{t('proDashboard.notifications.howItWorksDesc')}</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>{t('proDashboard.notifications.howItWorksItem1')}</li>
                <li>{t('proDashboard.notifications.howItWorksItem2')}</li>
                <li>{t('proDashboard.notifications.howItWorksItem3')}</li>
                <li>{t('proDashboard.notifications.howItWorksItem4')}</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
