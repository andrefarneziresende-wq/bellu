'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Eye, Loader2, Megaphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect as Select } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { useTranslation } from '@/lib/i18n';

interface Banner {
  id: string;
  imageUrl: string;
  targetUrl: string | null;
  active: boolean;
  order: number;
  startDate: string | null;
  endDate: string | null;
  countryId: string | null;
  country: { id: string; name: string; code: string } | null;
}

interface Meta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

interface BannerFormData {
  imageUrl: string;
  targetUrl: string;
  active: boolean;
  order: number;
  startDate: string;
  endDate: string;
  countryCode: string;
}

const COUNTRY_OPTIONS = [
  { value: '', label: 'Global' },
  { value: 'BR', label: 'Brasil' },
  { value: 'ES', label: 'Espanha' },
];

function getCountryLabel(code: string | null | undefined): string {
  if (!code) return 'Global';
  const found = COUNTRY_OPTIONS.find((c) => c.value === code);
  return found ? found.label : code;
}

function toDateInputValue(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toISOString().split('T')[0];
  } catch {
    return '';
  }
}

function emptyForm(): BannerFormData {
  return {
    imageUrl: '',
    targetUrl: '',
    active: true,
    order: 0,
    startDate: '',
    endDate: '',
    countryCode: '',
  };
}

function bannerToForm(banner: Banner): BannerFormData {
  return {
    imageUrl: banner.imageUrl ?? '',
    targetUrl: banner.targetUrl ?? '',
    active: banner.active,
    order: banner.order,
    startDate: toDateInputValue(banner.startDate),
    endDate: toDateInputValue(banner.endDate),
    countryCode: banner.country?.code ?? '',
  };
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export default function PromotionsPage() {
  const toast = useToast();
  const { t } = useTranslation();

  const [banners, setBanners] = useState<Banner[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState<BannerFormData>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const isEditing = selectedBanner !== null && formOpen;

  const fetchData = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ data: Banner[]; meta: Meta }>(
        `/api/admin/banners?page=${p}&perPage=20`
      );
      setBanners(res.data);
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

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  // --- Handlers ---

  const handleNewBanner = () => {
    setSelectedBanner(null);
    setFormData(emptyForm());
    setFormErrors({});
    setFormOpen(true);
  };

  const handleEdit = (banner: Banner) => {
    setSelectedBanner(banner);
    setFormData(bannerToForm(banner));
    setFormErrors({});
    setFormOpen(true);
  };

  const handleView = (banner: Banner) => {
    setSelectedBanner(banner);
    setViewOpen(true);
  };

  const handleDeleteClick = (banner: Banner) => {
    setSelectedBanner(banner);
    setDeleteOpen(true);
  };

  const handleFormChange = (
    field: keyof BannerFormData,
    value: string | boolean | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const buildBody = (data: BannerFormData) => {
    const countryCodeToId: Record<string, string> = {
      BR: 'BR',
      ES: 'ES',
    };
    return {
      imageUrl: data.imageUrl,
      targetUrl: data.targetUrl || null,
      active: data.active,
      order: Number(data.order),
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      countryId: data.countryCode ? (countryCodeToId[data.countryCode] ?? data.countryCode) : null,
    };
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.imageUrl.trim()) {
      errors.imageUrl = t('validation.required');
    } else if (!isValidUrl(formData.imageUrl.trim())) {
      errors.imageUrl = t('validation.invalidUrl');
    }

    if (formData.order < 0) {
      errors.order = t('validation.positiveNumber');
    }

    if (!formData.startDate) {
      errors.startDate = t('validation.required');
    }

    if (!formData.endDate) {
      errors.endDate = t('validation.required');
    } else if (formData.startDate && formData.endDate < formData.startDate) {
      errors.endDate = t('validation.dateEndAfterStart');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const body = buildBody(formData);
      if (isEditing && selectedBanner) {
        await apiFetch(`/api/admin/banners/${selectedBanner.id}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
        toast.success('Banner atualizado com sucesso');
      } else {
        await apiFetch('/api/admin/banners', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        toast.success('Banner criado com sucesso');
      }
      setFormOpen(false);
      setSelectedBanner(null);
      fetchData(page);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar banner.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedBanner) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/admin/banners/${selectedBanner.id}`, {
        method: 'DELETE',
      });
      setDeleteOpen(false);
      setSelectedBanner(null);
      toast.success('Banner excluído com sucesso');
      fetchData(page);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir banner.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">Promoções & Banners</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie banners e promoções da home do app
          </p>
        </div>
        <Button onClick={handleNewBanner}>
          <Plus className="mr-2 h-4 w-4" />
          Novo banner
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Banners ({meta?.total ?? banners.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="py-10 text-center text-sm text-brand-error">
              Erro ao carregar banners: {error}
            </div>
          ) : banners.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Megaphone className="h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Nenhum banner cadastrado
              </p>
              <Button onClick={handleNewBanner}>
                <Plus className="mr-2 h-4 w-4" />
                Criar primeiro banner
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Imagem</TableHead>
                    <TableHead>País</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Fim</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ordem</TableHead>
                    <TableHead className="w-[120px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {banners.map((banner) => (
                    <TableRow key={banner.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {banner.imageUrl ?? '—'}
                      </TableCell>
                      <TableCell>
                        {banner.country?.code === 'BR' && (
                          <Badge variant="secondary">Brasil</Badge>
                        )}
                        {banner.country?.code === 'ES' && (
                          <Badge variant="secondary">Espanha</Badge>
                        )}
                        {!banner.country && (
                          <Badge variant="outline">Global</Badge>
                        )}
                        {banner.country &&
                          banner.country.code !== 'BR' &&
                          banner.country.code !== 'ES' && (
                            <Badge variant="secondary">{banner.country.code}</Badge>
                          )}
                      </TableCell>
                      <TableCell>{formatDate(banner.startDate)}</TableCell>
                      <TableCell>{formatDate(banner.endDate)}</TableCell>
                      <TableCell>
                        <Badge variant={banner.active ? 'success' : 'secondary'}>
                          {banner.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>{banner.order}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Visualizar"
                            onClick={() => handleView(banner)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Editar"
                            onClick={() => handleEdit(banner)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Excluir"
                            onClick={() => handleDeleteClick(banner)}
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

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Editar banner' : 'Novo banner'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL *</Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => handleFormChange('imageUrl', e.target.value)}
                placeholder="https://..."
                className={formErrors.imageUrl ? 'border-brand-error' : ''}
              />
              {formErrors.imageUrl && (
                <p className="text-xs text-brand-error mt-1">{formErrors.imageUrl}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetUrl">Target URL</Label>
              <Input
                id="targetUrl"
                value={formData.targetUrl}
                onChange={(e) => handleFormChange('targetUrl', e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="order">Ordem</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) =>
                    handleFormChange('order', parseInt(e.target.value, 10) || 0)
                  }
                  className={formErrors.order ? 'border-brand-error' : ''}
                />
                {formErrors.order && (
                  <p className="text-xs text-brand-error mt-1">{formErrors.order}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="countryCode">País</Label>
                <Select
                  id="countryCode"
                  value={formData.countryCode}
                  onChange={(e) =>
                    handleFormChange('countryCode', e.target.value)
                  }
                >
                  {COUNTRY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data início *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    handleFormChange('startDate', e.target.value)
                  }
                  className={formErrors.startDate ? 'border-brand-error' : ''}
                />
                {formErrors.startDate && (
                  <p className="text-xs text-brand-error mt-1">{formErrors.startDate}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Data fim *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleFormChange('endDate', e.target.value)}
                  className={formErrors.endDate ? 'border-brand-error' : ''}
                />
                {formErrors.endDate && (
                  <p className="text-xs text-brand-error mt-1">{formErrors.endDate}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="active"
                type="checkbox"
                checked={formData.active}
                onChange={(e) => handleFormChange('active', e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="active">Ativo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFormOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={handleFormSubmit} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do banner</DialogTitle>
          </DialogHeader>

          {selectedBanner && (
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium">ID:</span>{' '}
                <span className="text-muted-foreground">{selectedBanner.id}</span>
              </div>
              <div>
                <span className="font-medium">Image URL:</span>{' '}
                <span className="text-muted-foreground break-all">
                  {selectedBanner.imageUrl}
                </span>
              </div>
              <div>
                <span className="font-medium">Target URL:</span>{' '}
                <span className="text-muted-foreground break-all">
                  {selectedBanner.targetUrl ?? '—'}
                </span>
              </div>
              <div>
                <span className="font-medium">Status:</span>{' '}
                <Badge variant={selectedBanner.active ? 'success' : 'secondary'}>
                  {selectedBanner.active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Ordem:</span>{' '}
                <span className="text-muted-foreground">
                  {selectedBanner.order}
                </span>
              </div>
              <div>
                <span className="font-medium">País:</span>{' '}
                <span className="text-muted-foreground">
                  {getCountryLabel(selectedBanner.country?.code)}
                </span>
              </div>
              <div>
                <span className="font-medium">Data início:</span>{' '}
                <span className="text-muted-foreground">
                  {formatDate(selectedBanner.startDate)}
                </span>
              </div>
              <div>
                <span className="font-medium">Data fim:</span>{' '}
                <span className="text-muted-foreground">
                  {formatDate(selectedBanner.endDate)}
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir banner</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir este banner? Esta ação não pode ser
            desfeita.
          </p>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
