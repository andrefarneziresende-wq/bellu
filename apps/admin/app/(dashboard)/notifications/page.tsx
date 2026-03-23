'use client';

import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { apiFetch } from '@/lib/api';

export default function NotificationsPage() {
  const toast = useToast();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [country, setCountry] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!title.trim()) {
      toast.error('O titulo da notificacao e obrigatorio');
      return;
    }
    if (!body.trim()) {
      toast.error('O corpo da notificacao e obrigatorio');
      return;
    }

    setSending(true);
    try {
      const payload: { title: string; body: string; country?: string } = {
        title: title.trim(),
        body: body.trim(),
      };
      if (country) {
        payload.country = country;
      }

      await apiFetch('/api/notifications/admin/broadcast', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      toast.success('Notificacao enviada com sucesso');
      setTitle('');
      setBody('');
      setCountry('');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao enviar notificacao';
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">Notificacoes</h1>
        <p className="text-sm text-muted-foreground">
          Envie notificacoes push para todos os usuarios do aplicativo
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle>Enviar broadcast</CardTitle>
            <CardDescription>
              A notificacao sera enviada para todos os usuarios ativos
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
                placeholder="Ex: Nova promocao disponivel!"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="notification-body">Mensagem</Label>
              <Textarea
                id="notification-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Digite o corpo da notificacao..."
                rows={4}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="notification-country">
                Filtro por pais (opcional)
              </Label>
              <select
                id="notification-country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Todos os paises</option>
                <option value="BR">Brasil</option>
                <option value="ES">Espanha</option>
              </select>
            </div>
            <Button onClick={handleSend} disabled={sending}>
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar notificacao
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
