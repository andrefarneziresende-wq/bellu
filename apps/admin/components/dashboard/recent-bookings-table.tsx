'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { apiFetch } from '@/lib/api';

const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'default' | 'destructive' }> = {
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
  status: string;
  user: { name: string } | null;
  professional: { businessName: string } | null;
  service: { name: string; price: number } | null;
}

export function RecentBookingsTable() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ data: Booking[] }>('/api/admin/bookings?page=1&perPage=5')
      .then((res) => setBookings(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agendamentos recentes</CardTitle>
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
        ) : bookings.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Nenhum dado
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Profissional</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => {
                const status = statusMap[booking.status] ?? {
                  label: booking.status,
                  variant: 'default' as const,
                };
                return (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">
                      {booking.user?.name ?? '—'}
                    </TableCell>
                    <TableCell>
                      {booking.professional?.businessName ?? '—'}
                    </TableCell>
                    <TableCell>
                      {booking.service?.name ?? '—'}
                    </TableCell>
                    <TableCell>{formatDate(booking.date)}</TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
