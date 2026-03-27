'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Loader2, Scissors } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { useTranslation } from '@/lib/i18n';

interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  durationMinutes: number;
  active: boolean;
  categoryId: string;
  serviceTemplateId?: string;
  category?: { id: string; translations: { locale: string; name: string }[] };
  serviceTemplate?: { id: string; name: string };
}

interface ServiceTemplate {
  id: string;
  name: string;
  categoryId: string;
  category?: { id: string; translations: { locale: string; name: string }[] };
}

interface ServiceFieldErrors {
  serviceTemplateId?: string;
  price?: string;
  durationMinutes?: string;
}

const emptyForm = {
  serviceTemplateId: '',
  description: '',
  price: '',
  durationMinutes: '',
  active: true,
};

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [templates, setTemplates] = useState<ServiceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingService, setDeletingService] = useState<Service | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<ServiceFieldErrors>({});
  const toast = useToast();
  const { t, locale } = useTranslation();

  const clearFieldError = (field: keyof ServiceFieldErrors) => {
    setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  };

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: Service[] }>('/api/services');
      setServices(res.data || []);
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: ServiceTemplate[] }>('/api/services/templates');
      setTemplates(res.data || []);
    } catch {
      setTemplates([]);
    }
  }, []);

  useEffect(() => { fetchServices(); fetchTemplates(); }, [fetchServices, fetchTemplates]);

  const getCatName = (cat?: { translations: { locale: string; name: string }[] }) => {
    if (!cat) return '—';
    const tr = cat.translations?.find((t) => t.locale === locale) || cat.translations?.find((t) => t.locale === 'pt-BR') || cat.translations?.[0];
    return tr?.name || '—';
  };

  // Filter out templates already added by this professional
  const availableTemplates = templates.filter(
    (tmpl) => !services.some((svc) => svc.serviceTemplateId === tmpl.id)
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFieldErrors({});
    setFormOpen(true);
  };

  const openEdit = (svc: Service) => {
    setEditingId(svc.id);
    setForm({
      serviceTemplateId: svc.serviceTemplateId || '',
      description: svc.description || '',
      price: String(svc.price),
      durationMinutes: String(svc.durationMinutes),
      active: svc.active,
    });
    setFieldErrors({});
    setFormOpen(true);
  };

  const validateForm = (): ServiceFieldErrors => {
    const errors: ServiceFieldErrors = {};
    if (!editingId && !form.serviceTemplateId) errors.serviceTemplateId = t('validation.required');
    if (!form.price || isNaN(parseFloat(form.price)) || parseFloat(form.price) <= 0) {
      errors.price = t('validation.positiveNumber');
    }
    if (!form.durationMinutes || isNaN(parseInt(form.durationMinutes)) || parseInt(form.durationMinutes) < 5) {
      errors.durationMinutes = t('validation.minValue', { min: '5' });
    } else if (parseInt(form.durationMinutes) > 480) {
      errors.durationMinutes = t('validation.maxValue', { max: '480' });
    }
    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateForm();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setSubmitting(true);
    try {
      if (editingId) {
        await apiFetch(`/api/services/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            description: form.description,
            price: parseFloat(form.price),
            durationMinutes: parseInt(form.durationMinutes),
            active: form.active,
          }),
        });
        toast.success(t('proDashboard.services.editService'));
      } else {
        const template = templates.find(t => t.id === form.serviceTemplateId);
        await apiFetch('/api/services', {
          method: 'POST',
          body: JSON.stringify({
            serviceTemplateId: form.serviceTemplateId,
            categoryId: template?.categoryId || '',
            name: template?.name || '',
            description: form.description,
            price: parseFloat(form.price),
            durationMinutes: parseInt(form.durationMinutes),
            currency: 'BRL',
          }),
        });
        toast.success(t('proDashboard.services.newService'));
      }
      setFormOpen(false);
      fetchServices();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingService) return;
    setSubmitting(true);
    try {
      await apiFetch(`/api/services/${deletingService.id}`, { method: 'DELETE' });
      toast.success(t('proDashboard.services.deleteService'));
      setDeleteOpen(false);
      fetchServices();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTemplate = templates.find(t => t.id === form.serviceTemplateId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">{t('proDashboard.services.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('proDashboard.services.subtitle')}
          </p>
        </div>
        <Button onClick={openCreate} disabled={availableTemplates.length === 0}>
          <Plus className="mr-2 h-4 w-4" />
          {t('proDashboard.services.newService')}
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>{t('proDashboard.services.title')} ({services.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : services.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Scissors className="h-12 w-12" />
              <p className="mt-4 text-sm">{t('proDashboard.services.noServices')}</p>
              <Button className="mt-4" onClick={openCreate}><Plus className="mr-2 h-4 w-4" />{t('proDashboard.services.newService')}</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('proDashboard.services.name')}</TableHead>
                  <TableHead>{t('proDashboard.services.category')}</TableHead>
                  <TableHead>{t('proDashboard.services.duration')}</TableHead>
                  <TableHead>{t('proDashboard.services.price')}</TableHead>
                  <TableHead>{t('booking.status')}</TableHead>
                  <TableHead className="w-[100px]">{t('common.edit')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((svc) => (
                  <TableRow key={svc.id}>
                    <TableCell className="font-medium">{svc.name}</TableCell>
                    <TableCell>{getCatName(svc.category)}</TableCell>
                    <TableCell>{svc.durationMinutes} min</TableCell>
                    <TableCell>R$ {Number(svc.price).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={svc.active ? 'default' : 'secondary'}>
                        {svc.active ? t('proDashboard.services.active') : t('proDashboard.services.inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(svc)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { setDeletingService(svc); setDeleteOpen(true); }}>
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

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? t('proDashboard.services.editService') : t('proDashboard.services.newService')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} noValidate className="space-y-4 py-4">
            {!editingId ? (
              <div className="space-y-2">
                <Label>{t('proDashboard.services.name')} *</Label>
                <Select
                  value={form.serviceTemplateId}
                  onValueChange={(v) => { setForm(p => ({ ...p, serviceTemplateId: v })); clearFieldError('serviceTemplateId'); }}
                >
                  <SelectTrigger className={fieldErrors.serviceTemplateId ? 'border-brand-error' : ''}>
                    <SelectValue placeholder={t('proDashboard.services.selectFromCatalog')} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTemplates.map(tmpl => (
                      <SelectItem key={tmpl.id} value={tmpl.id}>
                        {tmpl.name} — {getCatName(tmpl.category)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.serviceTemplateId && <p className="text-xs text-brand-error">{fieldErrors.serviceTemplateId}</p>}
                {selectedTemplate && (
                  <p className="text-xs text-muted-foreground">
                    {t('proDashboard.services.category')}: {getCatName(selectedTemplate.category)}
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm font-medium">{services.find(s => s.id === editingId)?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {getCatName(services.find(s => s.id === editingId)?.category)}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label>{t('proDashboard.services.description')}</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder={t('proDashboard.services.description')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('proDashboard.services.price')} (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => { setForm(p => ({ ...p, price: e.target.value })); clearFieldError('price'); }}
                  className={fieldErrors.price ? 'border-brand-error' : ''}
                />
                {fieldErrors.price && <p className="text-xs text-brand-error">{fieldErrors.price}</p>}
              </div>
              <div className="space-y-2">
                <Label>{t('proDashboard.services.duration')} (min) *</Label>
                <Input
                  type="number"
                  value={form.durationMinutes}
                  onChange={(e) => { setForm(p => ({ ...p, durationMinutes: e.target.value })); clearFieldError('durationMinutes'); }}
                  className={fieldErrors.durationMinutes ? 'border-brand-error' : ''}
                />
                {fieldErrors.durationMinutes && <p className="text-xs text-brand-error">{fieldErrors.durationMinutes}</p>}
              </div>
            </div>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? t('common.save') : t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('proDashboard.services.deleteService')}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t('proDashboard.services.confirmDelete')} <strong>{deletingService?.name}</strong>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
