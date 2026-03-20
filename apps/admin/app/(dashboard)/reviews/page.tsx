'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Eye, Trash2, Star, Loader2, Calendar } from 'lucide-react';
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
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/toast';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { name: string } | null;
  professional: { businessName: string } | null;
}

interface Meta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'h-6 w-6' : 'h-4 w-4';
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${sizeClass} ${i < rating ? 'fill-brand-gold text-brand-gold' : 'text-muted'}`}
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [search, setSearch] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [viewReview, setViewReview] = useState<Review | null>(null);
  const [deleteReview, setDeleteReview] = useState<Review | null>(null);
  const [deleting, setDeleting] = useState(false);

  const toast = useToast();

  const fetchData = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ data: Review[]; meta: Meta }>(
        `/api/admin/reviews?page=${p}&perPage=20`
      );
      setReviews(res.data);
      setMeta(res.meta);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(page);
  }, [page, fetchData]);

  const handleDelete = async () => {
    if (!deleteReview) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/admin/reviews/${deleteReview.id}`, {
        method: 'DELETE',
      });
      setDeleteReview(null);
      toast.success('Avaliação removida com sucesso');
      fetchData(page);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = reviews.filter(
    (r) =>
      (r.user?.name?.toLowerCase() ?? '').includes(search.toLowerCase()) ||
      (r.professional?.businessName?.toLowerCase() ?? '').includes(search.toLowerCase()) ||
      (r.comment?.toLowerCase() ?? '').includes(search.toLowerCase())
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
        <h1 className="font-serif text-2xl font-bold">Avaliações</h1>
        <p className="text-sm text-muted-foreground">
          Moderação de avaliações e denúncias
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente, profissional ou comentário..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Avaliações ({meta?.total ?? filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="py-10 text-center text-sm text-brand-error">
              Erro ao carregar avaliações: {error}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Star className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-sm font-medium text-muted-foreground">
                Nenhuma avaliação encontrada
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Profissional</TableHead>
                    <TableHead>Nota</TableHead>
                    <TableHead className="max-w-[300px]">Comentário</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell className="font-medium">
                        {review.user?.name ?? '—'}
                      </TableCell>
                      <TableCell>
                        {review.professional?.businessName ?? '—'}
                      </TableCell>
                      <TableCell>
                        <StarRating rating={review.rating} />
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {review.comment ?? '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(review.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Visualizar"
                            onClick={() => setViewReview(review)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Remover"
                            onClick={() => setDeleteReview(review)}
                          >
                            <Trash2 className="h-4 w-4 text-brand-error" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
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

      {/* View Review Dialog */}
      <Dialog open={!!viewReview} onOpenChange={(open) => !open && setViewReview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da Avaliação</DialogTitle>
          </DialogHeader>
          {viewReview && (
            <div className="space-y-5">
              {/* Rating prominently at top */}
              <div className="flex flex-col items-center gap-2 py-2">
                <StarRating rating={viewReview.rating} size="lg" />
                <span className="text-lg font-semibold">
                  {viewReview.rating} de 5
                </span>
              </div>

              {/* Client and Professional grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Cliente
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {viewReview.user?.name ?? '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Profissional
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {viewReview.professional?.businessName ?? '—'}
                  </p>
                </div>
              </div>

              {/* Comment in styled box */}
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Comentário
                </p>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm italic whitespace-pre-wrap">
                    {viewReview.comment ?? 'Sem comentário'}
                  </p>
                </div>
              </div>

              {/* Date at the bottom */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(viewReview.createdAt)}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewReview(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteReview} onOpenChange={(open) => !open && setDeleteReview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover Avaliação</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover esta avaliação?
            </DialogDescription>
          </DialogHeader>
          {deleteReview && (
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {deleteReview.user?.name ?? 'Cliente desconhecido'}
                </span>
                <StarRating rating={deleteReview.rating} />
              </div>
              {deleteReview.comment && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {deleteReview.comment}
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteReview(null)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removendo...
                </>
              ) : (
                'Remover'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
