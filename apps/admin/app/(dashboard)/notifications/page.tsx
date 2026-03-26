'use client';

import { useState, useEffect } from 'react';
import { Send, Loader2, Clock, Trash2, CheckCircle, XCircle, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { apiFetch } from '@/lib/api';

interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  target: string;
  countryId: string | null;
  scheduledAt: string;
  sentAt: string | null;
  status: string;
  createdAt: string;
}

export default function NotificationsPage() {
  const toast = useToast();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState('client');
  const [country, setCountry] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [sendMode, setSendMode] = useState<'now' | 'scheduled'>('now');
  const [sendInDays, setSendInDays] = useState(1);
  const [sending, setSending] = useState(false);
  const [scheduled, setScheduled] = useState<ScheduledNotification[]>([]);
  const [loadingScheduled, setLoadingScheduled] = useState(true);

  // Load scheduled notifications
  useEffect(() => {
    loadScheduled();
  }, []);

  const loadScheduled = async () => {
    setLoadingScheduled(true);
    try {
      const res = await apiFetch<{ data: ScheduledNotification[] }>('/api/notifications/admin/scheduled');
      setScheduled(res.data || []);
    } catch {
      setScheduled([]);
    } finally {
      setLoadingScheduled(false);
    }
  };

  const insertTag = (tag: string) => {
    setBody((prev) => prev + tag);
  };

  const handleSend = async () => {
    if (!title.trim()) {
      toast.error('O titulo e obrigatorio');
      return;
    }
    if (!body.trim()) {
      toast.error('A mensagem e obrigatoria');
      return;
    }

    setSending(true);
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        body: body.trim(),
        target,
      };
      if (country) payload.countryId = country;
      if (filterState) payload.state = filterState;
      if (filterCity) payload.city = filterCity.trim();
      if (sendMode === 'scheduled') payload.sendInDays = sendInDays;

      await apiFetch('/api/notifications/admin/schedule', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      toast.success(
        sendMode === 'now'
          ? 'Notificacao enviada com sucesso!'
          : `Notificacao agendada para daqui a ${sendInDays} dia(s)`,
      );
      setTitle('');
      setBody('');
      setCountry('');
      setFilterState('');
      setFilterCity('');
      setSendMode('now');
      loadScheduled();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao enviar';
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await apiFetch(`/api/notifications/admin/scheduled/${id}`, {
        method: 'DELETE',
      });
      toast.success('Notificacao cancelada');
      loadScheduled();
    } catch {
      toast.error('Erro ao cancelar');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const targetLabel = (t: string) => {
    if (t === 'client') return 'Clientes';
    if (t === 'professional') return 'Profissionais';
    return 'Todos';
  };

  const statusIcon = (status: string) => {
    if (status === 'sent') return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status === 'cancelled') return <XCircle className="h-4 w-4 text-red-500" />;
    return <Clock className="h-4 w-4 text-amber-500" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">Notificacoes</h1>
        <p className="text-sm text-muted-foreground">
          Envie notificacoes para usuarios do aplicativo
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Send Form */}
        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Nova notificacao
            </CardTitle>
            <CardDescription>
              Use <code className="rounded bg-muted px-1 py-0.5 text-xs">{'{{name}}'}</code> para
              inserir o nome do usuario automaticamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="notification-title">Titulo</Label>
              <Input
                id="notification-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Novidade para voce, {{name}}!"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="notification-body">Mensagem</Label>
              <Textarea
                id="notification-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Ola {{name}}, temos uma novidade especial..."
                rows={4}
                className="mt-1"
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => insertTag('{{name}}')}
                  className="rounded-md border border-input bg-background px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  + Nome do usuario
                </button>
              </div>
            </div>

            <div>
              <Label>Destinatarios</Label>
              <div className="mt-1 flex gap-2">
                {(['client', 'professional', 'all'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTarget(t)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      target === t
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-input bg-background text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    {targetLabel(t)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Filtros de localidade (opcional)</Label>
              <div className="mt-1 grid grid-cols-3 gap-2">
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Todos os paises</option>
                  <option value="BR">Brasil</option>
                  <option value="ES">Espanha</option>
                </select>
                <select
                  value={filterState}
                  onChange={(e) => setFilterState(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Todos os estados</option>
                  {['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'].map((uf) => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
                <Input
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  placeholder="Cidade"
                  className="h-10"
                />
              </div>
            </div>

            <div>
              <Label>Quando enviar</Label>
              <div className="mt-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSendMode('now')}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    sendMode === 'now'
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-input bg-background text-muted-foreground hover:bg-accent'
                  }`}
                >
                  <Send className="h-3 w-3" /> Agora
                </button>
                <button
                  type="button"
                  onClick={() => setSendMode('scheduled')}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    sendMode === 'scheduled'
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-input bg-background text-muted-foreground hover:bg-accent'
                  }`}
                >
                  <Clock className="h-3 w-3" /> Agendar
                </button>
              </div>

              {sendMode === 'scheduled' && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Enviar daqui a</span>
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={sendInDays}
                    onChange={(e) => setSendInDays(parseInt(e.target.value) || 1)}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">dia(s) as 10:00</span>
                </div>
              )}
            </div>

            {/* Preview */}
            {(title || body) && (
              <div className="rounded-lg border border-dashed border-muted-foreground/30 p-3">
                <p className="mb-1 text-xs font-medium text-muted-foreground">Pre-visualizacao:</p>
                <p className="text-sm font-semibold">{title.replace(/\{\{name\}\}/gi, 'Maria')}</p>
                <p className="text-sm text-muted-foreground">
                  {body.replace(/\{\{name\}\}/gi, 'Maria')}
                </p>
              </div>
            )}

            <Button onClick={handleSend} disabled={sending} className="w-full">
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : sendMode === 'now' ? (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar agora
                </>
              ) : (
                <>
                  <Clock className="mr-2 h-4 w-4" />
                  Agendar notificacao
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Scheduled List */}
        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Historico
            </CardTitle>
            <CardDescription>Notificacoes enviadas e agendadas</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingScheduled ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : scheduled.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nenhuma notificacao ainda
              </p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {scheduled.map((n) => (
                  <div
                    key={n.id}
                    className="flex items-start gap-3 rounded-lg border p-3"
                  >
                    <div className="mt-0.5">{statusIcon(n.status)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{n.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>{targetLabel(n.target)}</span>
                        <span>·</span>
                        {n.status === 'sent' && n.sentAt ? (
                          <span>Enviada em {formatDate(n.sentAt)}</span>
                        ) : n.status === 'pending' ? (
                          <span>Agendada para {formatDate(n.scheduledAt)}</span>
                        ) : (
                          <span>Cancelada</span>
                        )}
                      </div>
                    </div>
                    {n.status === 'pending' && (
                      <button
                        onClick={() => handleCancel(n.id)}
                        className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        title="Cancelar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
