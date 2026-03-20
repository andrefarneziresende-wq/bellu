'use client';

import { useEffect, useState, useCallback } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { apiFetch } from '@/lib/api';

interface ConfigItem {
  id: string;
  key: string;
  value: string;
  countryId: string | null;
  country: unknown;
}

type SavingSection = 'rates' | 'cancel' | 'gateways' | 'notifications' | null;

interface FieldErrors {
  commissionBr?: string;
  commissionEs?: string;
  cancelHoursBr?: string;
  cancelHoursEs?: string;
}

export default function SettingsPage() {
  const toast = useToast();

  // Commission
  const [commissionBr, setCommissionBr] = useState('');
  const [commissionEs, setCommissionEs] = useState('');

  // Cancellation
  const [cancelHoursBr, setCancelHoursBr] = useState('');
  const [cancelHoursEs, setCancelHoursEs] = useState('');

  // Gateways
  const [gatewayMercadopago, setGatewayMercadopago] = useState('');
  const [gatewayStripe, setGatewayStripe] = useState('');

  // Notifications
  const [notification24h, setNotification24h] = useState(true);
  const [notification1h, setNotification1h] = useState(true);

  // UI state
  const [saving, setSaving] = useState<SavingSection>(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<FieldErrors>({});

  // Load configs on mount
  useEffect(() => {
    apiFetch<{ success: boolean; data: ConfigItem[] }>('/api/admin/config')
      .then((res) => {
        const configs = res.data;
        for (const cfg of configs) {
          switch (cfg.key) {
            case 'commission_br':
              setCommissionBr(cfg.value);
              break;
            case 'commission_es':
              setCommissionEs(cfg.value);
              break;
            case 'cancel_hours_br':
              setCancelHoursBr(cfg.value);
              break;
            case 'cancel_hours_es':
              setCancelHoursEs(cfg.value);
              break;
            case 'gateway_mercadopago':
              setGatewayMercadopago(cfg.value);
              break;
            case 'gateway_stripe':
              setGatewayStripe(cfg.value);
              break;
            case 'notification_24h':
              setNotification24h(cfg.value === 'true');
              break;
            case 'notification_1h':
              setNotification1h(cfg.value === 'true');
              break;
          }
        }
      })
      .catch(() => {
        toast.error('Erro ao carregar configurações');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveConfigs = useCallback(
    async (section: SavingSection, configs: { key: string; value: string; countryId: null }[]) => {
      setSaving(section);
      try {
        await apiFetch('/api/admin/config', {
          method: 'PUT',
          body: JSON.stringify({ configs }),
        });
        toast.success('Configurações salvas com sucesso');
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Erro ao salvar configurações';
        toast.error(message);
      } finally {
        setSaving(null);
      }
    },
    [toast],
  );

  const validateRange = (value: string, min: number, max: number): boolean => {
    const num = Number(value);
    return value !== '' && !isNaN(num) && num >= min && num <= max;
  };

  const handleSaveRates = () => {
    const newErrors: FieldErrors = {};
    if (!validateRange(commissionBr, 0, 100)) {
      newErrors.commissionBr = 'Valor deve ser entre 0 e 100';
    }
    if (!validateRange(commissionEs, 0, 100)) {
      newErrors.commissionEs = 'Valor deve ser entre 0 e 100';
    }
    setErrors((prev) => ({ ...prev, commissionBr: newErrors.commissionBr, commissionEs: newErrors.commissionEs }));
    if (newErrors.commissionBr || newErrors.commissionEs) return;

    saveConfigs('rates', [
      { key: 'commission_br', value: commissionBr, countryId: null },
      { key: 'commission_es', value: commissionEs, countryId: null },
    ]);
  };

  const handleSaveCancel = () => {
    const newErrors: FieldErrors = {};
    if (!validateRange(cancelHoursBr, 0, 48)) {
      newErrors.cancelHoursBr = 'Valor deve ser entre 0 e 48';
    }
    if (!validateRange(cancelHoursEs, 0, 48)) {
      newErrors.cancelHoursEs = 'Valor deve ser entre 0 e 48';
    }
    setErrors((prev) => ({ ...prev, cancelHoursBr: newErrors.cancelHoursBr, cancelHoursEs: newErrors.cancelHoursEs }));
    if (newErrors.cancelHoursBr || newErrors.cancelHoursEs) return;

    saveConfigs('cancel', [
      { key: 'cancel_hours_br', value: cancelHoursBr, countryId: null },
      { key: 'cancel_hours_es', value: cancelHoursEs, countryId: null },
    ]);
  };

  const handleSaveGateways = () => {
    saveConfigs('gateways', [
      { key: 'gateway_mercadopago', value: gatewayMercadopago, countryId: null },
      { key: 'gateway_stripe', value: gatewayStripe, countryId: null },
    ]);
  };

  const handleSaveNotifications = () => {
    saveConfigs('notifications', [
      { key: 'notification_24h', value: String(notification24h), countryId: null },
      { key: 'notification_1h', value: String(notification1h), countryId: null },
    ]);
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Configurações gerais da plataforma
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Commission Rates */}
        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle>Taxas da plataforma</CardTitle>
            <CardDescription>Porcentagem cobrada sobre cada transação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="commission-br">🇧🇷 Brasil — Comissão (%)</Label>
              <Input
                id="commission-br"
                type="number"
                value={commissionBr}
                onChange={(e) => {
                  setCommissionBr(e.target.value);
                  setErrors((prev) => ({ ...prev, commissionBr: undefined }));
                }}
                min="0"
                max="100"
                className="mt-1"
              />
              {errors.commissionBr && (
                <p className="mt-1 text-xs text-destructive">{errors.commissionBr}</p>
              )}
            </div>
            <div>
              <Label htmlFor="commission-es">🇪🇸 Espanha — Comissão (%)</Label>
              <Input
                id="commission-es"
                type="number"
                value={commissionEs}
                onChange={(e) => {
                  setCommissionEs(e.target.value);
                  setErrors((prev) => ({ ...prev, commissionEs: undefined }));
                }}
                min="0"
                max="100"
                className="mt-1"
              />
              {errors.commissionEs && (
                <p className="mt-1 text-xs text-destructive">{errors.commissionEs}</p>
              )}
            </div>
            <Button onClick={handleSaveRates} disabled={saving === 'rates'}>
              {saving === 'rates' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar taxas
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Cancellation Rules */}
        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle>Regras de cancelamento</CardTitle>
            <CardDescription>Tempo mínimo de antecedência para cancelamento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="cancel-hours-br">🇧🇷 Brasil — Antecedência mínima (horas)</Label>
              <Input
                id="cancel-hours-br"
                type="number"
                value={cancelHoursBr}
                onChange={(e) => {
                  setCancelHoursBr(e.target.value);
                  setErrors((prev) => ({ ...prev, cancelHoursBr: undefined }));
                }}
                min="0"
                max="48"
                className="mt-1"
              />
              {errors.cancelHoursBr && (
                <p className="mt-1 text-xs text-destructive">{errors.cancelHoursBr}</p>
              )}
            </div>
            <div>
              <Label htmlFor="cancel-hours-es">🇪🇸 Espanha — Antecedência mínima (horas)</Label>
              <Input
                id="cancel-hours-es"
                type="number"
                value={cancelHoursEs}
                onChange={(e) => {
                  setCancelHoursEs(e.target.value);
                  setErrors((prev) => ({ ...prev, cancelHoursEs: undefined }));
                }}
                min="0"
                max="48"
                className="mt-1"
              />
              {errors.cancelHoursEs && (
                <p className="mt-1 text-xs text-destructive">{errors.cancelHoursEs}</p>
              )}
            </div>
            <Button onClick={handleSaveCancel} disabled={saving === 'cancel'}>
              {saving === 'cancel' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar regras
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Payment Gateways */}
        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle>Gateways de pagamento</CardTitle>
            <CardDescription>Configuração dos gateways por país</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="gateway-mercadopago">🇧🇷 Mercado Pago — Access Token</Label>
              <Input
                id="gateway-mercadopago"
                type="password"
                value={gatewayMercadopago}
                onChange={(e) => setGatewayMercadopago(e.target.value)}
                placeholder="APP_USR-..."
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="gateway-stripe">🇪🇸 Stripe — Secret Key</Label>
              <Input
                id="gateway-stripe"
                type="password"
                value={gatewayStripe}
                onChange={(e) => setGatewayStripe(e.target.value)}
                placeholder="sk_live_..."
                className="mt-1"
              />
            </div>
            <Button onClick={handleSaveGateways} disabled={saving === 'gateways'}>
              {saving === 'gateways' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar gateways
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle>Notificações</CardTitle>
            <CardDescription>Configuração de lembretes automáticos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="notification-24h">Lembrete 24h antes</Label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  id="notification-24h"
                  type="checkbox"
                  className="h-4 w-4"
                  checked={notification24h}
                  onChange={(e) => setNotification24h(e.target.checked)}
                />
                <span className="text-sm text-muted-foreground">Enviar notificação push</span>
              </div>
            </div>
            <div>
              <Label htmlFor="notification-1h">Lembrete 1h antes</Label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  id="notification-1h"
                  type="checkbox"
                  className="h-4 w-4"
                  checked={notification1h}
                  onChange={(e) => setNotification1h(e.target.checked)}
                />
                <span className="text-sm text-muted-foreground">Enviar notificação push</span>
              </div>
            </div>
            <Button onClick={handleSaveNotifications} disabled={saving === 'notifications'}>
              {saving === 'notifications' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar notificações
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
