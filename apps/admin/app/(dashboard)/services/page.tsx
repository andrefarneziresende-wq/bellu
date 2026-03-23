'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Loader2, Scissors } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { useTranslation } from '@/lib/i18n';

interface ServiceTemplate {
  id: string;
  name: string;
  categoryId: string;
  active: boolean;
  order: number;
  category?: { id: string; translations: { locale: string; name: string }[] };
  _count?: { services: number };
}

interface Category {
  id: string;
  slug: string;
  icon: string;
  translations: { locale: string; name: string }[];
}

const emptyForm = { name: '', categoryId: '', order: '0' };

export default function ServiceTemplatesPage() {
  const [templates, setTemplates] = useState<ServiceTemplate[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<ServiceTemplate | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();
  const { t, locale } = useTranslation();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tmplRes, catRes] = await Promise.all([
        apiFetch<{ data: ServiceTemplate[] }>('/api/admin/service-templates'),
        apiFetch<{ data: Category[] }>('/api/categories'),
      ]);
      setTemplates(tmplRes.data || []);
      setCategories(catRes.data || []);
    } catch {
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getCatName = (cat?: { translations: { locale: string; name: string }[] }) => {
    if (!cat) return '—';
    const tr = cat.translations?.find(t => t.locale === locale) || cat.translations?.find(t => t.locale === 'pt-BR') || cat.translations?.[0];
    return tr?.name || '—';
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (tmpl: ServiceTemplate) => {
    setEditingId(tmpl.id);
    setForm({ name: tmpl.name, categoryId: tmpl.categoryId, order: String(tmpl.order) });
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.categoryId) {
      toast.error(t('validation.required'));
      return;
    }
    setSubmitting(true);
    try {
      const body = { name: form.name, categoryId: form.categoryId, order: parseInt(form.order) || 0 };
      if (editingId) {
        await apiFetch(`/api/admin/service-templates/${editingId}`, { method: 'PATCH', body: JSON.stringify(body) });
        toast.success('Serviço atualizado');
      } else {
        await apiFetch('/api/admin/service-templates', { method: 'POST', body: JSON.stringify(body) });
        toast.success('Serviço criado');
      }
      setFormOpen(false);
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingTemplate) return;
    setSubmitting(true);
    try {
      await apiFetch(`/api/admin/service-templates/${deletingTemplate.id}`, { method: 'DELETE' });
      toast.success('Serviço removido');
      setDeleteOpen(false);
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (tmpl: ServiceTemplate) => {
    try {
      await apiFetch(`/api/admin/service-templates/${tmpl.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !tmpl.active }),
      });
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('errors.generic'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">Catálogo de Serviços</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os serviços disponíveis para os profissionais adicionarem
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Serviço
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Serviços ({templates.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Scissors className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">Nenhum serviço no catálogo</p>
              <Button className="mt-4" onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />Novo Serviço
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Profissionais usando</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[120px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((tmpl) => (
                  <TableRow key={tmpl.id}>
                    <TableCell className="font-medium">{tmpl.name}</TableCell>
                    <TableCell>{getCatName(tmpl.category)}</TableCell>
                    <TableCell>{tmpl._count?.services ?? 0}</TableCell>
                    <TableCell>
                      <Badge
                        variant={tmpl.active ? 'success' : 'secondary'}
                        className="cursor-pointer"
                        onClick={() => handleToggleActive(tmpl)}
                      >
                        {tmpl.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(tmpl)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setDeletingTemplate(tmpl); setDeleteOpen(true); }}
                          disabled={(tmpl._count?.services ?? 0) > 0}
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

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Serviço' : 'Novo Serviço'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Serviço *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Ex: Corte Feminino"
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Select value={form.categoryId} onValueChange={(v) => setForm(p => ({ ...p, categoryId: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione a categoria" /></SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon} {getCatName(cat)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ordem</Label>
              <Input
                type="number"
                value={form.order}
                onChange={(e) => setForm(p => ({ ...p, order: e.target.value }))}
              />
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
          <DialogHeader><DialogTitle>Excluir Serviço</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir <strong>{deletingTemplate?.name}</strong>?
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
