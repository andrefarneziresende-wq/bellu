'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, Users } from 'lucide-react';
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
import { useToast } from '@/components/ui/toast';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  active: boolean;
  locale: string | null;
  createdAt: string;
}

interface Meta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const toast = useToast();

  const fetchData = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ data: User[]; meta: Meta }>(
        `/api/admin/users?page=${p}&perPage=20`
      );
      setUsers(res.data);
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

  const handleToggleActive = async (id: string) => {
    setActionLoading(id);
    try {
      await apiFetch(`/api/admin/users/${id}/toggle-active`, {
        method: 'PATCH',
      });
      await fetchData(page);
      toast.success('Status do cliente atualizado');
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = users.filter(
    (c) =>
      (c.name?.toLowerCase() ?? '').includes(search.toLowerCase()) ||
      (c.email?.toLowerCase() ?? '').includes(search.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">Clientes</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie as consumidoras cadastradas na plataforma
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de clientes ({meta?.total ?? filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="py-10 text-center text-sm text-brand-error">
              Erro ao carregar clientes: {error}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Users className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">
                Nenhum cliente cadastrado
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((customer) => {
                    const isActioning = actionLoading === customer.id;
                    return (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">
                          {customer.name ?? '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {customer.email ?? '—'}
                        </TableCell>
                        <TableCell>{customer.phone ?? '—'}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(customer.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={customer.active ? 'success' : 'destructive'}>
                            {customer.active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isActioning}
                            onClick={() => handleToggleActive(customer.id)}
                          >
                            {isActioning ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : customer.active ? (
                              'Desativar'
                            ) : (
                              'Ativar'
                            )}
                          </Button>
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
