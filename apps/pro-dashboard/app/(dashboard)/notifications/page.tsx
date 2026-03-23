'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Bell, Mail, MessageSquare, Phone, Loader2, Send, CheckCircle, XCircle, Info } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { useTranslation } from '@/lib/i18n';

interface BroadcastFieldErrors {
  title?: string;
  body?: string;
  form?: string;
}

interface NotificationStatus {
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
}

interface ReminderSummary {
  total: number;
  emailsSent: number;
  smsSent: number;
  whatsappSent: number;
}

export default function NotificationsPage() {
  const [status, setStatus] = useState<NotificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<ReminderSummary | null>(null);
  const [broadcastForm, setBroadcastForm] = useState({ title: '', body: '' });
  const [broadcastErrors, setBroadcastErrors] = useState<BroadcastFieldErrors>({});
  const [broadcastSubmitting, setBroadcastSubmitting] = useState(false);
  const toast = useToast();
  const { t } = useTranslation();

  const clearBroadcastError = (field: keyof BroadcastFieldErrors) => {
    setBroadcastErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: BroadcastFieldErrors = {};
    if (!broadcastForm.title.trim()) errors.title = t('validation.required');
    if (!broadcastForm.body.trim()) errors.body = t('validation.required');
    setBroadcastErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setBroadcastSubmitting(true);
    try {
      await apiFetch('/api/notifications/pro/broadcast', {
        method: 'POST',
        body: JSON.stringify({ title: broadcastForm.title.trim(), body: broadcastForm.body.trim() }),
      });
      toast.success(t('proDashboard.notifications.sendSuccess'));
      setBroadcastForm({ title: '', body: '' });
      setBroadcastErrors({});
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('proDashboard.notifications.sendError');
      setBroadcastErrors({ form: msg });
      toast.error(t('proDashboard.notifications.sendError'));
    } finally {
      setBroadcastSubmitting(false);
    }
  };

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: NotificationStatus }>('/api/notifications/status');
      setStatus(res.data);
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const sendReminders = async () => {
    setSending(true);
    try {
      const res = await apiFetch<{ data: ReminderSummary }>('/api/notifications/reminders/send', { method: 'POST' });
      setLastResult(res.data);
      toast.success(t('proDashboard.notifications.remindersSent', { total: String(res.data.total) }));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('proDashboard.notifications.sendError'));
    } finally {
      setSending(false);
    }
  };

  const channels = [
    {
      key: 'email',
      label: t('proDashboard.notifications.channelEmail'),
      description: t('proDashboard.notifications.channelEmail'),
      icon: Mail,
      active: status?.email,
      setup: t('proDashboard.notifications.setupEmail'),
    },
    {
      key: 'sms',
      label: t('proDashboard.notifications.channelSms'),
      description: t('proDashboard.notifications.channelSms'),
      icon: Phone,
      active: status?.sms,
      setup: t('proDashboard.notifications.setupSms'),
    },
    {
      key: 'whatsapp',
      label: t('proDashboard.notifications.channelWhatsapp'),
      description: t('proDashboard.notifications.channelWhatsapp'),
      icon: MessageSquare,
      active: status?.whatsapp,
      setup: t('proDashboard.notifications.setupWhatsapp'),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">{t('proDashboard.notifications.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('proDashboard.notifications.subtitle')}</p>
        </div>
        <Button onClick={sendReminders} disabled={sending}>
          {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          {t('proDashboard.notifications.sendReminders')}
        </Button>
      </div>

      {/* Broadcast to all clients */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-brand-rose" />
            {t('proDashboard.notifications.broadcast')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            {t('proDashboard.notifications.broadcastSubtitle')}
          </p>
          <form onSubmit={handleBroadcast} noValidate className="space-y-4">
            <div className="space-y-2">
              <Label>{t('proDashboard.notifications.notificationTitle')} *</Label>
              <Input
                value={broadcastForm.title}
                onChange={(e) => { setBroadcastForm((p) => ({ ...p, title: e.target.value })); clearBroadcastError('title'); }}
                placeholder={t('proDashboard.notifications.notificationTitlePlaceholder')}
                className={broadcastErrors.title ? 'border-brand-error' : ''}
              />
              {broadcastErrors.title && <p className="text-xs text-brand-error">{broadcastErrors.title}</p>}
            </div>
            <div className="space-y-2">
              <Label>{t('proDashboard.notifications.notificationBody')} *</Label>
              <Textarea
                value={broadcastForm.body}
                onChange={(e) => { setBroadcastForm((p) => ({ ...p, body: e.target.value })); clearBroadcastError('body'); }}
                placeholder={t('proDashboard.notifications.notificationBodyPlaceholder')}
                className={broadcastErrors.body ? 'border-brand-error' : ''}
                rows={5}
              />
              {broadcastErrors.body && <p className="text-xs text-brand-error">{broadcastErrors.body}</p>}
            </div>
            {broadcastErrors.form && (
              <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2">
                <p className="text-sm text-brand-error">{broadcastErrors.form}</p>
              </div>
            )}
            <Button type="submit" disabled={broadcastSubmitting}>
              {broadcastSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {t('proDashboard.notifications.send')}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {loading ? (
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
              <p className="text-sm text-muted-foreground">{ch.description}</p>
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

      {/* How it works */}
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

      {/* Last Result */}
      {lastResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('proDashboard.notifications.lastSend')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{lastResult.total}</p>
                <p className="text-xs text-muted-foreground">{t('proDashboard.notifications.bookings')}</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{lastResult.emailsSent}</p>
                <p className="text-xs text-muted-foreground">{t('proDashboard.notifications.emails')}</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{lastResult.smsSent}</p>
                <p className="text-xs text-muted-foreground">SMS</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{lastResult.whatsappSent}</p>
                <p className="text-xs text-muted-foreground">WhatsApp</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
