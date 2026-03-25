'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, DollarSign, Users, Clock, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

interface DashboardStats {
  todayBookings: number;
  monthBookings: number;
  monthRevenue: number;
  newClients: number;
  nextBooking: { clientName: string; serviceName: string; startTime: string } | null;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { t, locale } = useTranslation();

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return t('proDashboard.greeting.morning');
    if (h < 18) return t('proDashboard.greeting.afternoon');
    return t('proDashboard.greeting.evening');
  };

  const fetchStats = useCallback(async () => {
    setError(false);
    try {
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      // Fetch today's bookings, all professional bookings (for month stats), and clients
      const [bookingsRes, allBookingsRes, clientsRes] = await Promise.all([
        apiFetch<{ data: { bookings: Array<{ id: string; clientName?: string; service?: { name: string }; startTime: string; totalPrice: number; status: string; user?: { name: string } }> } }>(
          `/api/bookings/professional?date=${today}`
        ),
        apiFetch<{ data: { bookings: Array<{ id: string; totalPrice: number; status: string; date: string }> } }>(
          `/api/bookings/professional`
        ),
        apiFetch<{ data: Array<{ id: string }> }>(
          `/api/users`
        ),
      ]);

      const rawBookings = bookingsRes.data?.bookings || [];
      const allBookings = allBookingsRes.data?.bookings || [];
      const clients = clientsRes.data || [];

      // Filter out cancelled and no-show bookings
      const bookingsList = rawBookings.filter((b) => {
        const s = (b.status || '').toUpperCase();
        return s !== 'CANCELLED' && s !== 'NO_SHOW';
      });
      const todayBookings = bookingsList.length;

      // Calculate month stats from all bookings
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const monthBookingsList = allBookings.filter((b) => b.date >= monthStart);
      const monthRevenue = monthBookingsList
        .filter((b) => b.status === 'COMPLETED' || b.status === 'CONFIRMED')
        .reduce((sum, b) => sum + Number(b.totalPrice || 0), 0);

      const nextBooking = bookingsList[0]
        ? {
            clientName: bookingsList[0].user?.name || bookingsList[0].clientName || t('proDashboard.agenda.client'),
            serviceName: bookingsList[0].service?.name || t('proDashboard.agenda.service'),
            startTime: bookingsList[0].startTime || '',
          }
        : null;

      setStats({
        todayBookings,
        monthBookings: monthBookingsList.length,
        monthRevenue,
        newClients: clients.length,
        nextBooking,
      });
    } catch {
      setError(true);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const kpis = [
    {
      title: t('pro.dashboard.todayBookings'),
      value: stats?.todayBookings ?? 0,
      icon: Calendar,
      color: 'text-brand-rose',
      bg: 'bg-brand-rose/10',
    },
    {
      title: t('pro.dashboard.monthRevenue'),
      value: stats?.monthBookings ?? 0,
      icon: TrendingUp,
      color: 'text-brand-gold',
      bg: 'bg-brand-gold/10',
    },
    {
      title: t('pro.finances.balance'),
      value: `R$ ${(stats?.monthRevenue ?? 0).toLocaleString(locale, { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'text-brand-success',
      bg: 'bg-brand-success/10',
    },
    {
      title: t('pro.dashboard.totalClients'),
      value: stats?.newClients ?? 0,
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">{greeting()}!</h1>
        <p className="text-sm text-muted-foreground">
          {t('pro.dashboard.title')}
        </p>
      </div>

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-10">
            <AlertCircle className="h-10 w-10 text-brand-error" />
            <p className="text-sm text-muted-foreground">{t('errors.loadError')}</p>
            <Button variant="outline" size="sm" onClick={() => { setLoading(true); fetchStats(); }}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('common.tryAgain')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${kpi.bg}`}>
                <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{kpi.title}</p>
                <p className="text-2xl font-bold">
                  {loading ? '...' : kpi.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Next Booking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-brand-rose" />
            {t('booking.upcoming')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
          ) : stats?.nextBooking ? (
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-rose/10 text-lg font-bold text-brand-rose">
                {stats.nextBooking.startTime}
              </div>
              <div>
                <p className="font-medium">{stats.nextBooking.clientName}</p>
                <p className="text-sm text-muted-foreground">{stats.nextBooking.serviceName}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-muted-foreground">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">{t('proDashboard.agenda.noBookings')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
