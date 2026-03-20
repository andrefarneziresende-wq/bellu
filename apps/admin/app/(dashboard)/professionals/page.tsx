'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, CheckCircle, XCircle, Eye, Loader2, UserCheck } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/toast';

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' }> = {
  APPROVED: { label: 'Aprovado', variant: 'success' },
  PENDING: { label: 'Pendente', variant: 'warning' },
  SUSPENDED: { label: 'Suspenso', variant: 'destructive' },
  BANNED: { label: 'Banido', variant: 'destructive' },
};

interface Professional {
  id: string;
  businessName: string;
  taxId: string | null;
  rating: number;
  totalReviews: number;
  status: string;
  active: boolean;
  createdAt: string;
  user: { name: string; email: string } | null;
}

interface ProfessionalDetail {
  id: string;
  businessName: string;
  taxId: string | null;
  rating: number;
  totalReviews: number;
  status: string;
  active: boolean;
  createdAt: string;
  user: { name: string; email: string; phone: string } | null;
  services: { id: string; name: string; price: number; currency: string }[];
  country: { id: string; name: string; code: string } | null;
}

interface Meta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export default function ProfessionalsPage() {
  const [search, setSearch] = useState('');
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Detail dialog state
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<ProfessionalDetail | null>(null);

  const toast = useToast();

  const fetchData = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ data: Professional[]; meta: Meta }>(
        `/api/admin/professionals?page=${p}&perPage=20`
      );
      setProfessionals(res.data);
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

  const handleStatusChange = async (id: string, status: 'APPROVED' | 'SUSPENDED' | 'BANNED' | 'PENDING') => {
    setActionLoading(id);
    try {
      await apiFetch(`/api/admin/professionals/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      toast.success('Status do profissional atualizado');
      await fetchData(page);
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDetail = async (id: string) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await apiFetch<{ data: ProfessionalDetail }>(
        `/api/admin/professionals/${id}`
      );
      setDetail(res.data);
    } catch (err: any) {
      toast.error(`Erro ao carregar detalhes: ${err.message}`);
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const filtered = professionals.filter(
    (p) =>
      (p.businessName?.toLowerCase() ?? '').includes(search.toLowerCase()) ||
      (p.user?.name?.toLowerCase() ?? '').includes(search.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (price: number, currency: string) => {
    try {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency,
      }).format(price);
    } catch {
      return `${currency} ${price.toFixed(2)}`;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">Profissionais</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os profissionais e clínicas cadastrados na plataforma
          </p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou razão social..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Lista de profissionais ({meta?.total ?? filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="py-10 text-center text-sm text-brand-error">
              Erro ao carregar profissionais: {error}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <UserCheck className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">
                Nenhum profissional cadastrado
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estabelecimento</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>CPF/CNPJ</TableHead>
                    <TableHead>Avaliação</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((prof) => {
                    const status = statusConfig[prof.status] ?? {
                      label: prof.status,
                      variant: 'warning' as const,
                    };
                    const isActioning = actionLoading === prof.id;
                    return (
                      <TableRow key={prof.id}>
                        <TableCell className="font-medium">
                          {prof.businessName ?? '—'}
                        </TableCell>
                        <TableCell>{prof.user?.name ?? '—'}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {prof.taxId ?? '—'}
                        </TableCell>
                        <TableCell>
                          {prof.rating > 0 ? (
                            <span className="flex items-center gap-1">
                              <span className="text-brand-gold">★</span>
                              {prof.rating.toFixed(1)}
                              <span className="text-xs text-muted-foreground">
                                ({prof.totalReviews})
                              </span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(prof.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Visualizar"
                              onClick={() => handleViewDetail(prof.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {prof.status === 'PENDING' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Aprovar"
                                  disabled={isActioning}
                                  onClick={() => handleStatusChange(prof.id, 'APPROVED')}
                                >
                                  {isActioning ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4 text-brand-success" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Recusar"
                                  disabled={isActioning}
                                  onClick={() => handleStatusChange(prof.id, 'SUSPENDED')}
                                >
                                  <XCircle className="h-4 w-4 text-brand-error" />
                                </Button>
                              </>
                            )}
                            {prof.status === 'APPROVED' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Suspender"
                                disabled={isActioning}
                                onClick={() => handleStatusChange(prof.id, 'SUSPENDED')}
                              >
                                {isActioning ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-brand-error" />
                                )}
                              </Button>
                            )}
                            {(prof.status === 'SUSPENDED' || prof.status === 'BANNED') && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Aprovar"
                                disabled={isActioning}
                                onClick={() => handleStatusChange(prof.id, 'APPROVED')}
                              >
                                {isActioning ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-4 w-4 text-brand-success" />
                                )}
                              </Button>
                            )}
                          </div>
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

      {/* Professional Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Profissional</DialogTitle>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : detail ? (
            <div className="space-y-5">
              {/* Status badge */}
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    (statusConfig[detail.status]?.variant ?? 'warning') as
                      | 'success'
                      | 'warning'
                      | 'destructive'
                  }
                >
                  {statusConfig[detail.status]?.label ?? detail.status}
                </Badge>
              </div>

              {/* Business info */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Razão Social
                  </p>
                  <p className="mt-0.5 font-medium">{detail.businessName ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    CPF/CNPJ
                  </p>
                  <p className="mt-0.5 font-medium">{detail.taxId ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Responsável
                  </p>
                  <p className="mt-0.5 font-medium">{detail.user?.name ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    E-mail
                  </p>
                  <p className="mt-0.5 font-medium">{detail.user?.email ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Telefone
                  </p>
                  <p className="mt-0.5 font-medium">{detail.user?.phone ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    País
                  </p>
                  <p className="mt-0.5 font-medium">{detail.country?.name ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Avaliação
                  </p>
                  <p className="mt-0.5 font-medium">
                    {detail.rating > 0 ? (
                      <>
                        <span className="text-brand-gold">★</span> {detail.rating.toFixed(1)}{' '}
                        <span className="text-xs text-muted-foreground">
                          ({detail.totalReviews} avaliações)
                        </span>
                      </>
                    ) : (
                      '—'
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Cadastro
                  </p>
                  <p className="mt-0.5 font-medium">{formatDate(detail.createdAt)}</p>
                </div>
              </div>

              {/* Services */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Serviços
                </p>
                {detail.services && detail.services.length > 0 ? (
                  <div className="overflow-hidden rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Nome</TableHead>
                          <TableHead className="text-right text-xs">Preço</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detail.services.map((service) => (
                          <TableRow key={service.id}>
                            <TableCell className="text-sm">{service.name}</TableCell>
                            <TableCell className="text-right text-sm font-medium">
                              {formatCurrency(service.price, service.currency)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum serviço cadastrado</p>
                )}
              </div>

              {/* Close button */}
              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={() => setDetailOpen(false)}>Fechar</Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
