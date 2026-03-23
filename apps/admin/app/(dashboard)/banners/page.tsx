'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Loader2, ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { NativeSelect as Select } from '@/components/ui/select';
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
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { useTranslation } from '@/lib/i18n';

interface Country {
  id: string;
  name: string;
  code: string;
}

interface Banner {
  id: string;
  imageUrl: string;
  targetUrl: string;
  order: number;
  active: boolean;
  startDate: string | null;
  endDate: string | null;
  country: Country | null;
  countryId: string | null;
}

interface BannerFormData {
  imageUrl: string;
  targetUrl: string;
  countryId: string;
  order: number;
  active: boolean;
  startDate: string;
  endDate: string;
}

const emptyForm: BannerFormData = {
  imageUrl: '',
  targetUrl: '',
  countryId: '',
  order: 0,
  active: true,
  startDate: '',
  endDate: '',
};

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState<BannerFormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingBanner, setDeletingBanner] = useState<Banner | null>(null);
  const [deleting, setDeleting] = useState(false);

  const toast = useToast();
  const { t, locale } = useTranslation();

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ data: Banner[] }>('/api/banners');
      setBanners(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCountries = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: Country[] }>('/api/countries');
      setCountries(res.data);
    } catch {
      // silently fail — countries are optional
    }
  }, []);

  useEffect(() => {
    fetchBanners();
    fetchCountries();
  }, [fetchBanners, fetchCountries]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString(locale);
    } catch {
      return dateStr;
    }
  };

  const toInputDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  // ---- Validation ----

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.imageUrl.trim()) {
      errors.imageUrl = t('validation.required');
    } else if (!isValidUrl(formData.imageUrl.trim())) {
      errors.imageUrl = t('validation.invalidUrl');
    }

    if (formData.targetUrl.trim() && !isValidUrl(formData.targetUrl.trim())) {
      errors.targetUrl = t('validation.invalidUrl');
    }

    if (formData.order < 0) {
      errors.order = t('validation.positiveNumber');
    }

    if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
      errors.endDate = t('validation.dateEndAfterStart');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const clearFieldError = (field: string) => {
    setFormErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // ---- Create / Edit handlers ----

  const openCreateDialog = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setFormErrors({});
    setFormOpen(true);
  };

  const openEditDialog = (banner: Banner) => {
    setEditingId(banner.id);
    setFormData({
      imageUrl: banner.imageUrl,
      targetUrl: banner.targetUrl,
      countryId: banner.countryId ?? '',
      order: banner.order,
      active: banner.active,
      startDate: toInputDate(banner.startDate),
      endDate: toInputDate(banner.endDate),
    });
    setFormErrors({});
    setFormOpen(true);
  };

  const handleFormSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const body = {
        imageUrl: formData.imageUrl,
        targetUrl: formData.targetUrl,
        countryId: formData.countryId || null,
        order: formData.order,
        active: formData.active,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
      };

      if (editingId) {
        await apiFetch(`/api/banners/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
        toast.success(t('adminPanel.banners.saveSuccess'));
      } else {
        await apiFetch('/api/banners', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        toast.success(t('adminPanel.banners.saveSuccess'));
      }

      setFormOpen(false);
      await fetchBanners();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('adminPanel.banners.saveError'));
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Delete handlers ----

  const openDeleteDialog = (banner: Banner) => {
    setDeletingBanner(banner);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingBanner) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/banners/${deletingBanner.id}`, {
        method: 'DELETE',
      });
      setDeleteOpen(false);
      setDeletingBanner(null);
      toast.success(t('adminPanel.banners.deleteSuccess'));
      await fetchBanners();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('adminPanel.banners.deleteError'));
    } finally {
      setDeleting(false);
    }
  };

  const getCountryName = (banner: Banner) => {
    return banner.country?.name ?? '—';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">{t('adminPanel.banners.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('adminPanel.banners.subtitle')}
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          {t('adminPanel.banners.newBanner')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('adminPanel.banners.title')} ({banners.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="py-10 text-center text-sm text-brand-error">
              {t('adminPanel.banners.loadError')}{error}
            </div>
          ) : banners.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">
                {t('adminPanel.banners.noBanners')}
              </p>
              <Button className="mt-4" onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                {t('adminPanel.banners.createFirst')}
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">{t('adminPanel.banners.image')}</TableHead>
                  <TableHead>{t('adminPanel.banners.targetUrl')}</TableHead>
                  <TableHead>{t('adminPanel.banners.country')}</TableHead>
                  <TableHead>{t('adminPanel.banners.order')}</TableHead>
                  <TableHead>{t('adminPanel.banners.active')}</TableHead>
                  <TableHead>{t('adminPanel.banners.startDate')}</TableHead>
                  <TableHead>{t('adminPanel.banners.endDate')}</TableHead>
                  <TableHead className="w-[100px]">{t('adminPanel.banners.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {banners.map((banner) => (
                  <TableRow key={banner.id}>
                    <TableCell>
                      {banner.imageUrl ? (
                        <img
                          src={banner.imageUrl}
                          alt="Banner"
                          className="h-10 w-16 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-16 items-center justify-center rounded bg-muted">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {banner.targetUrl}
                    </TableCell>
                    <TableCell>{getCountryName(banner)}</TableCell>
                    <TableCell>{banner.order}</TableCell>
                    <TableCell>
                      <Badge variant={banner.active ? 'success' : 'secondary'}>
                        {banner.active ? t('adminPanel.banners.active') : t('adminPanel.banners.inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(banner.startDate)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(banner.endDate)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title={t('common.edit')}
                          onClick={() => openEditDialog(banner)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title={t('common.delete')}
                          onClick={() => openDeleteDialog(banner)}
                        >
                          <Trash2 className="h-4 w-4 text-brand-error" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? t('adminPanel.banners.editBanner') : t('adminPanel.banners.newBanner')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="imageUrl">{t('adminPanel.banners.imageUrl')}</Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, imageUrl: e.target.value }));
                  clearFieldError('imageUrl');
                }}
                placeholder="https://exemplo.com/banner.jpg"
                className={formErrors.imageUrl ? 'border-brand-error' : ''}
              />
              {formErrors.imageUrl && (
                <p className="text-xs text-brand-error mt-1">{formErrors.imageUrl}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetUrl">{t('adminPanel.banners.targetUrl')}</Label>
              <Input
                id="targetUrl"
                value={formData.targetUrl}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, targetUrl: e.target.value }));
                  clearFieldError('targetUrl');
                }}
                placeholder="https://exemplo.com/promo"
                className={formErrors.targetUrl ? 'border-brand-error' : ''}
              />
              {formErrors.targetUrl && (
                <p className="text-xs text-brand-error mt-1">{formErrors.targetUrl}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="countryId">{t('adminPanel.banners.country')}</Label>
              <Select
                id="countryId"
                value={formData.countryId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, countryId: e.target.value }))
                }
              >
                <option value="">{t('adminPanel.banners.allCountries')}</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="order">{t('adminPanel.banners.order')}</Label>
              <Input
                id="order"
                type="number"
                min="0"
                value={formData.order}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    order: parseInt(e.target.value, 10) || 0,
                  }));
                  clearFieldError('order');
                }}
                className={formErrors.order ? 'border-brand-error' : ''}
              />
              {formErrors.order && (
                <p className="text-xs text-brand-error mt-1">{formErrors.order}</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Label htmlFor="active">{t('adminPanel.banners.active')}</Label>
              <input
                id="active"
                type="checkbox"
                checked={formData.active}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, active: e.target.checked }))
                }
                className="h-4 w-4 rounded border-input accent-brand-rose"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">{t('adminPanel.banners.startDate')}</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, startDate: e.target.value }));
                    clearFieldError('endDate');
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">{t('adminPanel.banners.endDate')}</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, endDate: e.target.value }));
                    clearFieldError('endDate');
                  }}
                  className={formErrors.endDate ? 'border-brand-error' : ''}
                />
                {formErrors.endDate && (
                  <p className="text-xs text-brand-error mt-1">{formErrors.endDate}</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFormOpen(false)}
              disabled={submitting}
            >
              {t('common.cancel')}
            </Button>
            <Button onClick={handleFormSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('adminPanel.banners.deleteBanner')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t('adminPanel.banners.deleteConfirm')}
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
