'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Calendar, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { apiFetch } from '@/lib/api';

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'default' | 'destructive' }> = {
  CONFIRMED: { label: 'Confirmado', variant: 'success' },
  PENDING: { label: 'Pendente', variant: 'warning' },
  COMPLETED: { label: 'Concluído', variant: 'default' },
  CANCELLED: { label: 'Cancelado', variant: 'destructive' },
  NO_SHOW: { label: 'No-show', variant: 'destructive' },
};

interface Booking {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  user: { name: string } | null;
  professional: { businessName: string } | null;
  service: { name: string; price: number } | null;
}

interface Meta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export default function BookingsPage() {
  const [search, setSearch] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ data: Booking[]; meta: Meta }>(
        `/api/admin/bookings?page=${p}&perPage=20`
      );
      setBookings(res.data);
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

  const filtered = bookings.filter(
    (b) =>
      (b.user?.name?.toLowerCase() ?? '').includes(search.toLowerCase()) ||
      (b.professional?.businessName?.toLowerCase() ?? '').includes(search.toLowerCase()) ||
      (b.service?.name?.toLowerCase() ?? '').includes(search.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value == null) return '\u2014';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">Agendamentos</h1>
          <p className="text-sm text-muted-foreground">
            Visão geral de todos os agendamentos da plataforma
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, profissional ou serviço..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agendamentos ({meta?.total ?? filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="py-10 text-center text-sm text-brand-error">
              Erro ao carregar agendamentos: {error}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Calendar className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">
                Nenhum agendamento encontrado
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Profissional</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((booking) => {
                    const status = statusConfig[booking.status] ?? {
                      label: booking.status,
                      variant: 'default' as const,
                    };
                    return (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">
                          {booking.user?.name ?? '\u2014'}
                        </TableCell>
                        <TableCell
                          className="max-w-[200px] truncate"
                          title={booking.professional?.businessName ?? undefined}
                        >
                          {booking.professional?.businessName ?? '\u2014'}
                        </TableCell>
                        <TableCell>{booking.service?.name ?? '\u2014'}</TableCell>
                        <TableCell>{formatDate(booking.date)}</TableCell>
                        <TableCell>{booking.startTime ?? '\u2014'}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(booking.service?.price)}
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
