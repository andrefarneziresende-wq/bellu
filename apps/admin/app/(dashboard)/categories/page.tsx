'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Plus, Pencil, Trash2, GripVertical, Loader2, Grid3X3, Search, type LucideIcon } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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

interface CategoryTranslation {
  locale: string;
  name: string;
}

interface Category {
  id: string;
  slug: string;
  icon: string | null;
  order: number;
  translations: CategoryTranslation[];
}

interface CategoryFormData {
  slug: string;
  icon: string;
  order: number;
  namePtBR: string;
  nameEsES: string;
}

const emptyForm: CategoryFormData = {
  slug: '',
  icon: '',
  order: 0,
  namePtBR: '',
  nameEsES: '',
};

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Curated Lucide icon names organized by beauty/wellness categories
const ICON_OPTIONS: { group: string; icons: { name: string; label: string }[] }[] = [
  {
    group: 'Cabelo',
    icons: [
      { name: 'Scissors', label: 'Tesoura' },
      { name: 'Sparkles', label: 'Brilho' },
      { name: 'Wind', label: 'Secador' },
      { name: 'Brush', label: 'Escova' },
      { name: 'Paintbrush', label: 'Pincel' },
    ],
  },
  {
    group: 'Unhas & Mãos',
    icons: [
      { name: 'Hand', label: 'Mão' },
      { name: 'Gem', label: 'Gema' },
      { name: 'Diamond', label: 'Diamante' },
      { name: 'PaintBucket', label: 'Esmalte' },
      { name: 'Droplets', label: 'Gotas' },
    ],
  },
  {
    group: 'Rosto & Pele',
    icons: [
      { name: 'Droplet', label: 'Gota' },
      { name: 'Sun', label: 'Sol' },
      { name: 'Moon', label: 'Lua' },
      { name: 'ShieldCheck', label: 'Proteção' },
      { name: 'FlaskConical', label: 'Tratamento' },
    ],
  },
  {
    group: 'Olhos & Sobrancelhas',
    icons: [
      { name: 'Eye', label: 'Olho' },
      { name: 'EyeOff', label: 'Cílios' },
      { name: 'ScanEye', label: 'Design' },
      { name: 'Focus', label: 'Foco' },
    ],
  },
  {
    group: 'Maquiagem',
    icons: [
      { name: 'Palette', label: 'Paleta' },
      { name: 'Pipette', label: 'Conta-gotas' },
      { name: 'Flower2', label: 'Flor' },
      { name: 'Heart', label: 'Coração' },
      { name: 'Star', label: 'Estrela' },
    ],
  },
  {
    group: 'Corpo & Massagem',
    icons: [
      { name: 'Activity', label: 'Atividade' },
      { name: 'Flame', label: 'Calor' },
      { name: 'Leaf', label: 'Natural' },
      { name: 'TreePalm', label: 'Relaxamento' },
      { name: 'Waves', label: 'Ondas' },
      { name: 'Zap', label: 'Energia' },
    ],
  },
  {
    group: 'Barbearia',
    icons: [
      { name: 'CircleUserRound', label: 'Barbeiro' },
      { name: 'Crown', label: 'Coroa' },
      { name: 'BadgeCheck', label: 'Premium' },
      { name: 'Shirt', label: 'Camisa' },
    ],
  },
  {
    group: 'Geral',
    icons: [
      { name: 'Calendar', label: 'Agenda' },
      { name: 'Clock', label: 'Relógio' },
      { name: 'Gift', label: 'Presente' },
      { name: 'Award', label: 'Prêmio' },
      { name: 'Ribbon', label: 'Fita' },
      { name: 'Sparkle', label: 'Brilho' },
      { name: 'Wand2', label: 'Varinha' },
      { name: 'CircleDot', label: 'Alvo' },
    ],
  },
];

// Helper to get a Lucide icon component by name
function getLucideIcon(name: string): LucideIcon | null {
  const icons = LucideIcons as unknown as Record<string, LucideIcon>;
  return icons[name] || null;
}

// Render a Lucide icon from a stored name string
function IconPreview({ name, size = 20, className = '' }: { name: string; size?: number; className?: string }) {
  const Icon = getLucideIcon(name);
  if (!Icon) return <span className={className}>{name}</span>;
  return <Icon size={size} className={className} />;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState<CategoryFormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Drag & drop state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [reordering, setReordering] = useState(false);
  const dragNodeRef = useRef<HTMLTableRowElement | null>(null);

  const toast = useToast();
  const { t } = useTranslation();

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ data: Category[] }>('/api/categories');
      setCategories(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const getTranslation = (cat: Category, locale: string) => {
    const t = cat.translations?.find(
      (tr) => tr.locale === locale || tr.locale.startsWith(locale)
    );
    return t?.name ?? '—';
  };

  // ---- Drag & Drop handlers ----

  const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, index: number) => {
    setDragIndex(index);
    dragNodeRef.current = e.currentTarget;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    // Apply grabbing cursor via a slight delay so the drag image captures first
    requestAnimationFrame(() => {
      if (dragNodeRef.current) {
        dragNodeRef.current.style.opacity = '0.4';
      }
    });
  };

  const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragIndex === null || index === dragIndex) {
      if (index === dragIndex) setDragOverIndex(null);
      return;
    }
    setDragOverIndex(index);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLTableRowElement>) => {
    // Only clear if we actually left the row (not entering a child)
    const relatedTarget = e.relatedTarget as Node | null;
    if (!e.currentTarget.contains(relatedTarget)) {
      setDragOverIndex(null);
    }
  };

  const handleDragEnd = () => {
    if (dragNodeRef.current) {
      dragNodeRef.current.style.opacity = '1';
    }
    setDragIndex(null);
    setDragOverIndex(null);
    dragNodeRef.current = null;
  };

  const handleDrop = async (e: React.DragEvent<HTMLTableRowElement>, dropIndex: number) => {
    e.preventDefault();
    handleDragEnd();

    if (dragIndex === null || dragIndex === dropIndex) return;

    // Reorder the array
    const updated = [...categories];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(dropIndex, 0, moved);

    // Optimistically update UI
    setCategories(updated);

    // Persist new order to API
    setReordering(true);
    try {
      const promises = updated.map((cat, idx) => {
        if (cat.order !== idx) {
          return apiFetch(`/api/admin/categories/${cat.id}/reorder`, {
            method: 'PATCH',
            body: JSON.stringify({ order: idx }),
          });
        }
        return Promise.resolve();
      });
      await Promise.all(promises);
      toast.success('Ordem atualizada');
      await fetchCategories();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao reordenar categorias');
      // Rollback on failure
      await fetchCategories();
    } finally {
      setReordering(false);
    }
  };

  // ---- Validation ----

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.slug.trim()) {
      errors.slug = t('validation.required');
    } else if (!SLUG_REGEX.test(formData.slug)) {
      errors.slug = t('validation.invalidSlug');
    }

    if (!formData.icon.trim()) {
      errors.icon = t('validation.required');
    }

    if (!formData.namePtBR.trim()) {
      errors.namePtBR = t('validation.required');
    }

    if (!formData.nameEsES.trim()) {
      errors.nameEsES = t('validation.required');
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

  const openEditDialog = (cat: Category) => {
    setEditingId(cat.id);
    setFormData({
      slug: cat.slug,
      icon: cat.icon ?? '',
      order: cat.order,
      namePtBR: getTranslation(cat, 'pt'),
      nameEsES: getTranslation(cat, 'es'),
    });
    setFormErrors({});
    setFormOpen(true);
  };

  const handleFormSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const body = {
        slug: formData.slug,
        icon: formData.icon,
        order: formData.order,
        translations: [
          { locale: 'pt-BR', name: formData.namePtBR },
          { locale: 'es-ES', name: formData.nameEsES },
        ],
      };

      if (editingId) {
        await apiFetch(`/api/admin/categories/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
        toast.success('Categoria atualizada com sucesso');
      } else {
        await apiFetch('/api/admin/categories', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        toast.success('Categoria criada com sucesso');
      }

      setFormOpen(false);
      await fetchCategories();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar categoria');
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Delete handlers ----

  const openDeleteDialog = (cat: Category) => {
    setDeletingCategory(cat);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/admin/categories/${deletingCategory.id}`, {
        method: 'DELETE',
      });
      setDeleteOpen(false);
      setDeletingCategory(null);
      toast.success('Categoria excluída com sucesso');
      await fetchCategories();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao excluir categoria');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">Categorias</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie as categorias de serviços da plataforma
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Nova categoria
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Categorias ({categories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="py-10 text-center text-sm text-brand-error">
              Erro ao carregar categorias: {error}
            </div>
          ) : categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Grid3X3 className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">
                Nenhuma categoria cadastrada
              </p>
              <Button className="mt-4" onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Criar primeira categoria
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead className="w-[50px]">Ícone</TableHead>
                  <TableHead>Nome (pt-BR)</TableHead>
                  <TableHead>Nome (es-ES)</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Ordem</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((cat, index) => (
                  <TableRow
                    key={cat.id}
                    draggable={!reordering}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDragEnd={handleDragEnd}
                    onDrop={(e) => handleDrop(e, index)}
                    className={
                      dragOverIndex === index && dragIndex !== index
                        ? 'border-t-2 border-brand-rose'
                        : ''
                    }
                    style={{
                      opacity: dragIndex === index ? 0.4 : 1,
                    }}
                  >
                    <TableCell>
                      <GripVertical
                        className={`h-4 w-4 text-muted-foreground ${
                          dragIndex !== null ? 'cursor-grabbing' : 'cursor-grab'
                        }`}
                      />
                    </TableCell>
                    <TableCell className="text-xl">
                      {cat.icon ? <IconPreview name={cat.icon} size={24} /> : '—'}
                    </TableCell>
                    <TableCell className="font-medium">
                      {getTranslation(cat, 'pt')}
                    </TableCell>
                    <TableCell>{getTranslation(cat, 'es')}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{cat.slug}</Badge>
                    </TableCell>
                    <TableCell>{cat.order}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Editar"
                          onClick={() => openEditDialog(cat)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Excluir"
                          onClick={() => openDeleteDialog(cat)}
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
              {editingId ? 'Editar categoria' : 'Nova categoria'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, slug: e.target.value }));
                  clearFieldError('slug');
                }}
                placeholder="ex: beleza"
                className={formErrors.slug ? 'border-brand-error' : ''}
              />
              {formErrors.slug && (
                <p className="text-xs text-brand-error mt-1">{formErrors.slug}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Ícone</Label>
              {formData.icon && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-rose/10">
                    <IconPreview name={formData.icon} size={24} className="text-brand-rose" />
                  </div>
                  <span className="text-sm text-muted-foreground">{formData.icon}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormData((prev) => ({ ...prev, icon: '' }))}
                  >
                    Limpar
                  </Button>
                </div>
              )}
              <div className="max-h-52 overflow-y-auto rounded-lg border p-2">
                {ICON_OPTIONS.map((group) => (
                  <div key={group.group} className="mb-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">{group.group}</p>
                    <div className="flex flex-wrap gap-1">
                      {group.icons.map((icon) => {
                        const IconComp = getLucideIcon(icon.name);
                        if (!IconComp) return null;
                        return (
                          <button
                            key={icon.name}
                            type="button"
                            title={`${icon.label} (${icon.name})`}
                            className={`flex h-10 w-10 items-center justify-center rounded-md transition-colors hover:bg-muted ${
                              formData.icon === icon.name ? 'bg-brand-rose/20 ring-2 ring-brand-rose' : ''
                            }`}
                            onClick={() => {
                              setFormData((prev) => ({ ...prev, icon: icon.name }));
                              clearFieldError('icon');
                            }}
                          >
                            <IconComp size={20} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  value={formData.icon}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, icon: e.target.value }));
                    clearFieldError('icon');
                  }}
                  placeholder="Ou digite o nome do ícone Lucide..."
                  className={`flex-1 ${formErrors.icon ? 'border-brand-error' : ''}`}
                />
              </div>
              {formErrors.icon && (
                <p className="text-xs text-brand-error mt-1">{formErrors.icon}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="order">Ordem</Label>
              <Input
                id="order"
                type="number"
                value={formData.order}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    order: parseInt(e.target.value, 10) || 0,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="namePtBR">Nome (pt-BR)</Label>
              <Input
                id="namePtBR"
                value={formData.namePtBR}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, namePtBR: e.target.value }));
                  clearFieldError('namePtBR');
                }}
                placeholder="Nome em português"
                className={formErrors.namePtBR ? 'border-brand-error' : ''}
              />
              {formErrors.namePtBR && (
                <p className="text-xs text-brand-error mt-1">{formErrors.namePtBR}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nameEsES">Nome (es-ES)</Label>
              <Input
                id="nameEsES"
                value={formData.nameEsES}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, nameEsES: e.target.value }));
                  clearFieldError('nameEsES');
                }}
                placeholder="Nombre en español"
                className={formErrors.nameEsES ? 'border-brand-error' : ''}
              />
              {formErrors.nameEsES && (
                <p className="text-xs text-brand-error mt-1">{formErrors.nameEsES}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFormOpen(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button onClick={handleFormSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir categoria</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir a categoria{' '}
            <strong>
              {deletingCategory
                ? getTranslation(deletingCategory, 'pt')
                : ''}
            </strong>
            ? Essa ação não pode ser desfeita.
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
