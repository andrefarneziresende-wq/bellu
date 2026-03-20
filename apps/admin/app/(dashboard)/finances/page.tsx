'use client';

import { useState, useEffect, useCallback } from 'react';
import { DollarSign, CreditCard, Loader2 } from 'lucide-react';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { apiFetch } from '@/lib/api';

interface Payment {
  id: string;
  amount: number;
  method: string | null;
  status: string;
  gateway: string | null;
  createdAt: string;
  booking: { id: string } | null;
}

interface Meta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'secondary' | 'destructive' }> = {
  PAID: { label: 'Pago', variant: 'success' },
  paid: { label: 'Pago', variant: 'success' },
  PENDING: { label: 'Pendente', variant: 'warning' },
  pending: { label: 'Pendente', variant: 'warning' },
  REFUNDED: { label: 'Reembolsado', variant: 'secondary' },
  refunded: { label: 'Reembolsado', variant: 'secondary' },
  FAILED: { label: 'Falhou', variant: 'destructive' },
  failed: { label: 'Falhou', variant: 'destructive' },
};

export default function FinancesPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ data: Payment[]; meta: Meta }>(
        `/api/admin/payments?page=${p}&perPage=20`
      );
      setPayments(res.data);
      setMeta(res.meta);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(page);
  }, [page, fetchData]);

  const formatCurrency = (value: number | null | undefined) => {
    if (value == null) return '—';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  const totalAmount = payments.reduce((sum, p) => sum + (p.amount ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">Financeiro</h1>
        <p className="text-sm text-muted-foreground">
          Transações, comissões e repasses da plataforma
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          title="Total da página"
          value={formatCurrency(totalAmount)}
          icon={DollarSign}
        />
        <KpiCard
          title="Transações"
          value={meta?.total?.toLocaleString('pt-BR') ?? '0'}
          icon={CreditCard}
        />
        <KpiCard
          title="Página atual"
          value={meta ? `${meta.page} de ${meta.totalPages}` : '—'}
          icon={CreditCard}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transações ({meta?.total ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="py-10 text-center text-sm text-brand-error">
              Erro ao carregar pagamentos: {error}
            </div>
          ) : payments.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Nenhum registro encontrado
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Agendamento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Gateway</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => {
                    const status = statusConfig[payment.status] ?? {
                      label: payment.status,
                      variant: 'secondary' as const,
                    };
                    return (
                      <TableRow key={payment.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {payment.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          {payment.booking?.id
                            ? `#${payment.booking.id.slice(0, 8)}`
                            : '—'}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell>{payment.method ?? '—'}</TableCell>
                        <TableCell>{payment.gateway ?? '—'}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(payment.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {meta && meta.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {meta.page} de {meta.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= meta.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
