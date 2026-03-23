'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Loader2, FileText } from 'lucide-react';
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

interface LegalDocument {
  id: string;
  type: string;
  locale: string;
  title: string;
  content: string;
  version: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface LegalFormData {
  type: string;
  locale: string;
  title: string;
  content: string;
  version: string;
  active: boolean;
}

const emptyForm: LegalFormData = {
  type: 'terms_of_use',
  locale: 'pt-BR',
  title: '',
  content: '',
  version: '1.0',
  active: true,
};

export default function LegalPage() {
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState<LegalFormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingDocument, setDeletingDocument] = useState<LegalDocument | null>(null);
  const [deleting, setDeleting] = useState(false);

  const toast = useToast();
  const { t, locale } = useTranslation();

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ data: LegalDocument[]; pagination: unknown }>('/api/legal/admin/all?page=1&perPage=100');
      setDocuments(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(locale);
    } catch {
      return dateStr;
    }
  };

  const getTypeLabel = (type: string) => {
    if (type === 'terms_of_use') return t('adminPanel.legal.termsOfUse');
    if (type === 'privacy_policy') return t('adminPanel.legal.privacyPolicy');
    return type;
  };

  // ---- Validation ----

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = t('validation.required');
    }

    if (!formData.content.trim()) {
      errors.content = t('validation.required');
    }

    if (!formData.version.trim()) {
      errors.version = t('validation.required');
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

  const openEditDialog = (doc: LegalDocument) => {
    setEditingId(doc.id);
    setFormData({
      type: doc.type,
      locale: doc.locale,
      title: doc.title,
      content: doc.content,
      version: doc.version,
      active: doc.active,
    });
    setFormErrors({});
    setFormOpen(true);
  };

  const handleFormSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const body = {
        type: formData.type,
        locale: formData.locale,
        title: formData.title,
        content: formData.content,
        version: formData.version,
        active: formData.active,
      };

      if (editingId) {
        await apiFetch(`/api/legal/admin/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
        toast.success(t('adminPanel.legal.saveSuccess'));
      } else {
        await apiFetch('/api/legal/admin', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        toast.success(t('adminPanel.legal.saveSuccess'));
      }

      setFormOpen(false);
      await fetchDocuments();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('adminPanel.legal.saveError'));
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Delete handlers ----

  const openDeleteDialog = (doc: LegalDocument) => {
    setDeletingDocument(doc);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingDocument) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/legal/admin/${deletingDocument.id}`, {
        method: 'DELETE',
      });
      setDeleteOpen(false);
      setDeletingDocument(null);
      toast.success(t('adminPanel.legal.deleteSuccess'));
      await fetchDocuments();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('adminPanel.legal.deleteError'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">{t('adminPanel.legal.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('adminPanel.legal.subtitle')}
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          {t('adminPanel.legal.newDocument')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('adminPanel.legal.title')} ({documents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="py-10 text-center text-sm text-brand-error">
              {t('adminPanel.legal.loadError')}{error}
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">
                {t('adminPanel.legal.noDocuments')}
              </p>
              <Button className="mt-4" onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                {t('adminPanel.legal.newDocument')}
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('adminPanel.legal.type')}</TableHead>
                  <TableHead>{t('adminPanel.legal.locale')}</TableHead>
                  <TableHead>{t('adminPanel.legal.title_field')}</TableHead>
                  <TableHead>{t('adminPanel.legal.version')}</TableHead>
                  <TableHead>{t('adminPanel.legal.active')}</TableHead>
                  <TableHead>{t('adminPanel.banners.startDate')}</TableHead>
                  <TableHead className="w-[100px]">{t('adminPanel.banners.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>{getTypeLabel(doc.type)}</TableCell>
                    <TableCell>{doc.locale}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {doc.title}
                    </TableCell>
                    <TableCell>{doc.version}</TableCell>
                    <TableCell>
                      <Badge variant={doc.active ? 'success' : 'secondary'}>
                        {doc.active ? t('adminPanel.legal.active') : t('adminPanel.banners.inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(doc.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title={t('common.edit')}
                          onClick={() => openEditDialog(doc)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title={t('common.delete')}
                          onClick={() => openDeleteDialog(doc)}
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
              {editingId ? t('adminPanel.legal.editDocument') : t('adminPanel.legal.newDocument')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">{t('adminPanel.legal.type')}</Label>
                <Select
                  id="type"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, type: e.target.value }))
                  }
                >
                  <option value="terms_of_use">{t('adminPanel.legal.termsOfUse')}</option>
                  <option value="privacy_policy">{t('adminPanel.legal.privacyPolicy')}</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="locale">{t('adminPanel.legal.locale')}</Label>
                <Select
                  id="locale"
                  value={formData.locale}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, locale: e.target.value }))
                  }
                >
                  <option value="pt-BR">pt-BR</option>
                  <option value="es-ES">es-ES</option>
                  <option value="en">en</option>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">{t('adminPanel.legal.title_field')}</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, title: e.target.value }));
                  clearFieldError('title');
                }}
                placeholder={t('adminPanel.legal.title_field')}
                className={formErrors.title ? 'border-brand-error' : ''}
              />
              {formErrors.title && (
                <p className="text-xs text-brand-error mt-1">{formErrors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">{t('adminPanel.legal.content')}</Label>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, content: e.target.value }));
                  clearFieldError('content');
                }}
                placeholder={t('adminPanel.legal.content')}
                rows={10}
                className={`flex w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y ${formErrors.content ? 'border-brand-error' : 'border-input'}`}
              />
              {formErrors.content && (
                <p className="text-xs text-brand-error mt-1">{formErrors.content}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="version">{t('adminPanel.legal.version')}</Label>
                <Input
                  id="version"
                  value={formData.version}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, version: e.target.value }));
                    clearFieldError('version');
                  }}
                  placeholder="1.0"
                  className={formErrors.version ? 'border-brand-error' : ''}
                />
                {formErrors.version && (
                  <p className="text-xs text-brand-error mt-1">{formErrors.version}</p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-7">
                <Label htmlFor="active">{t('adminPanel.legal.active')}</Label>
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
            <DialogTitle>{t('adminPanel.legal.deleteDocument')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t('adminPanel.legal.deleteConfirm')}
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
