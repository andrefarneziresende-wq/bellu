'use client';

import { useEffect, useState } from 'react';
import {
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  UserCheck,
  Star,
  Loader2,
} from 'lucide-react';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { RecentBookingsTable } from '@/components/dashboard/recent-bookings-table';
import { apiFetch } from '@/lib/api';

interface DashboardData {
  totalUsers: number;
  totalProfessionals: number;
  totalBookings: number;
  totalReviews: number;
  totalPayments: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ data: DashboardData }>('/api/admin/dashboard')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 text-center text-sm text-brand-error">
        Erro ao carregar dashboard: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Visão geral da plataforma Beauty Marketplace
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          title="Usuários"
          value={data?.totalUsers?.toLocaleString('pt-BR') ?? '0'}
          icon={Users}
        />
        <KpiCard
          title="Profissionais"
          value={data?.totalProfessionals?.toLocaleString('pt-BR') ?? '0'}
          icon={UserCheck}
        />
        <KpiCard
          title="Agendamentos"
          value={data?.totalBookings?.toLocaleString('pt-BR') ?? '0'}
          icon={Calendar}
        />
        <KpiCard
          title="Avaliações"
          value={data?.totalReviews?.toLocaleString('pt-BR') ?? '0'}
          icon={Star}
        />
        <KpiCard
          title="Pagamentos"
          value={data?.totalPayments?.toLocaleString('pt-BR') ?? '0'}
          icon={DollarSign}
        />
      </div>

      {/* Charts & Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueChart />
        <RecentBookingsTable />
      </div>
    </div>
  );
}
