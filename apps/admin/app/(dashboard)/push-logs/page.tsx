'use client';

import { useState, useEffect } from 'react';
import { Radio, CheckCircle, XCircle, AlertTriangle, WifiOff, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';

interface PushLogEntry {
  id: string;
  userId: string;
  title: string;
  type: string;
  status: string;
  error: string | null;
  tokenCount: number;
  sentCount: number;
  createdAt: string;
  user: { id: string; name: string; email: string } | null;
}

interface Stats {
  totalSent: number;
  totalFailed: number;
  totalNoToken: number;
  totalNotConfigured: number;
}

const STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle; color: string; bg: string }> = {
  sent: { label: 'Enviado', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
  failed: { label: 'Falhou', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  no_token: { label: 'Sem token', icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  not_configured: { label: 'Push nao config.', icon: WifiOff, color: 'text-gray-600', bg: 'bg-gray-50' },
};

export default function PushLogsPage() {
  const [logs, setLogs] = useState<PushLogEntry[]>([]);
  const [stats, setStats] = useState<Stats>({ totalSent: 0, totalFailed: 0, totalNoToken: 0, totalNotConfigured: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadLogs = async (p = 1, status = '') => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ page: String(p) });
      if (status) query.set('status', status);

      const res = await apiFetch<{
        data: PushLogEntry[];
        stats: Stats;
        pagination: { total: number; page: number; perPage: number; totalPages: number };
      }>(`/api/notifications/admin/push-logs?${query}`);

      setLogs(res.data);
      setStats(res.stats);
      setTotalPages(res.pagination.totalPages);
      setPage(res.pagination.page);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(1, filterStatus);
  }, [filterStatus]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Push Notification Logs</h1>
          <p className="text-muted-foreground">Historico de envio de notificacoes push</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => loadLogs(page, filterStatus)}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:ring-2 ring-green-300" onClick={() => setFilterStatus(filterStatus === 'sent' ? '' : 'sent')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-50 p-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalSent}</p>
                <p className="text-xs text-muted-foreground">Enviados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:ring-2 ring-red-300" onClick={() => setFilterStatus(filterStatus === 'failed' ? '' : 'failed')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-50 p-2">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalFailed}</p>
                <p className="text-xs text-muted-foreground">Falharam</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:ring-2 ring-yellow-300" onClick={() => setFilterStatus(filterStatus === 'no_token' ? '' : 'no_token')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-yellow-50 p-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalNoToken}</p>
                <p className="text-xs text-muted-foreground">Sem token</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:ring-2 ring-gray-300" onClick={() => setFilterStatus(filterStatus === 'not_configured' ? '' : 'not_configured')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-gray-50 p-2">
                <WifiOff className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalNotConfigured}</p>
                <p className="text-xs text-muted-foreground">Push nao config.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {filterStatus && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtro:</span>
          <span className={`text-sm font-medium px-2 py-1 rounded ${STATUS_CONFIG[filterStatus]?.bg || ''} ${STATUS_CONFIG[filterStatus]?.color || ''}`}>
            {STATUS_CONFIG[filterStatus]?.label || filterStatus}
          </span>
          <Button variant="ghost" size="sm" onClick={() => setFilterStatus('')}>Limpar</Button>
        </div>
      )}

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Logs recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Radio className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Nenhum log encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 pr-4">Data</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Usuario</th>
                    <th className="pb-3 pr-4">Titulo</th>
                    <th className="pb-3 pr-4">Tipo</th>
                    <th className="pb-3 pr-4">Tokens</th>
                    <th className="pb-3">Erro</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const cfg = STATUS_CONFIG[log.status] || STATUS_CONFIG.failed;
                    const Icon = cfg.icon;
                    const isExpanded = expandedId === log.id;
                    return (
                      <tr
                        key={log.id}
                        className="border-b last:border-0 hover:bg-muted/50 cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                      >
                        <td className="py-3 pr-4 whitespace-nowrap text-xs text-muted-foreground">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                            <Icon className="h-3 w-3" />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="max-w-[150px]">
                            <span className="font-medium truncate block">{log.user?.name || '—'}</span>
                            <span className="text-xs text-muted-foreground truncate block">{log.user?.email || log.userId}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 max-w-[200px] truncate">{log.title}</td>
                        <td className="py-3 pr-4">
                          <span className="px-2 py-0.5 rounded bg-muted text-xs">{log.type}</span>
                        </td>
                        <td className="py-3 pr-4 text-center">
                          <span className="font-medium">{log.sentCount}</span>
                          <span className="text-muted-foreground">/{log.tokenCount}</span>
                        </td>
                        <td className="py-3" style={{ maxWidth: isExpanded ? 'none' : 200 }}>
                          {log.error ? (
                            <span className={`text-xs text-red-500 ${isExpanded ? 'whitespace-pre-wrap break-all' : 'truncate block'}`}>
                              {log.error}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t mt-4">
              <p className="text-sm text-muted-foreground">
                Pagina {page} de {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => loadLogs(page - 1, filterStatus)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => loadLogs(page + 1, filterStatus)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
