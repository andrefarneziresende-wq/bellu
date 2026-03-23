'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Loader2, Shield } from 'lucide-react';
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

interface AdminStaffRole {
  id: string;
  name: string;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  roleId: string | null;
  staffRole: AdminStaffRole | null;
  active: boolean;
  createdAt: string;
  country: Country | null;
  countryId: string | null;
}

interface AdminUserFormData {
  name: string;
  email: string;
  password: string;
  roleId: string;
  countryId: string;
}

const emptyForm: AdminUserFormData = {
  name: '',
  email: '',
  password: '',
  roleId: '',
  countryId: '',
};

export default function AdminUsersPage() {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [roles, setRoles] = useState<AdminStaffRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState<AdminUserFormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  const toast = useToast();
  const { t, locale } = useTranslation();

  const fetchAdminUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ data: AdminUser[] }>('/api/admin/admin-users');
      setAdminUsers(res.data);
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

  const fetchRoles = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: AdminStaffRole[] }>('/api/admin/admin-roles');
      setRoles(res.data || []);
    } catch {
      setRoles([]);
    }
  }, []);

  useEffect(() => {
    fetchAdminUsers();
    fetchCountries();
    fetchRoles();
  }, [fetchAdminUsers, fetchCountries, fetchRoles]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(locale);
    } catch {
      return dateStr;
    }
  };

  // ---- Validation ----

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = t('validation.required');
    } else if (formData.name.trim().length < 2) {
      errors.name = t('validation.minLength', { min: '2' });
    }

    if (!formData.email.trim()) {
      errors.email = t('validation.required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = t('validation.invalidEmail');
    }

    if (!editingId && !formData.password.trim()) {
      errors.password = t('validation.required');
    } else if (formData.password && formData.password.length < 4) {
      errors.password = t('validation.minLength', { min: '4' });
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

  const openEditDialog = (user: AdminUser) => {
    setEditingId(user.id);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      roleId: user.roleId ?? '',
      countryId: user.countryId ?? '',
    });
    setFormErrors({});
    setFormOpen(true);
  };

  const handleFormSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        name: formData.name,
        email: formData.email,
        roleId: formData.roleId || null,
        countryId: formData.countryId || null,
      };

      if (formData.password) {
        body.password = formData.password;
      }

      if (editingId) {
        await apiFetch(`/api/admin/admin-users/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
        toast.success(t('adminPanel.adminUsers.saveSuccess'));
      } else {
        await apiFetch('/api/admin/admin-users', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        toast.success(t('adminPanel.adminUsers.saveSuccess'));
      }

      setFormOpen(false);
      await fetchAdminUsers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('adminPanel.adminUsers.saveError'));
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Delete handlers ----

  const openDeleteDialog = (user: AdminUser) => {
    setDeletingUser(user);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/admin/admin-users/${deletingUser.id}`, {
        method: 'DELETE',
      });
      setDeleteOpen(false);
      setDeletingUser(null);
      toast.success(t('adminPanel.adminUsers.deleteSuccess'));
      await fetchAdminUsers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('adminPanel.adminUsers.deleteError'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">{t('adminPanel.adminUsers.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('adminPanel.adminUsers.subtitle')}
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          {t('adminPanel.adminUsers.newAdmin')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('adminPanel.adminUsers.title')} ({adminUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="py-10 text-center text-sm text-brand-error">
              {t('adminPanel.adminUsers.loadError')} {error}
            </div>
          ) : adminUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Shield className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">
                {t('adminPanel.adminUsers.noAdmins')}
              </p>
              <Button className="mt-4" onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                {t('adminPanel.adminUsers.createFirst')}
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('adminPanel.adminUsers.name')}</TableHead>
                  <TableHead>{t('adminPanel.adminUsers.email')}</TableHead>
                  <TableHead>{t('adminPanel.adminUsers.role')}</TableHead>
                  <TableHead>{t('adminPanel.adminUsers.country')}</TableHead>
                  <TableHead>{t('adminPanel.adminUsers.active')}</TableHead>
                  <TableHead>{t('adminPanel.adminUsers.registration')}</TableHead>
                  <TableHead className="w-[100px]">{t('adminPanel.adminUsers.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      {user.staffRole ? (
                        <Badge className="bg-brand-rose text-white border-transparent">
                          {user.staffRole.name}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">{t('adminPanel.adminUsers.noRole')}</Badge>
                      )}
                    </TableCell>
                    <TableCell>{user.country?.name ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={user.active ? 'success' : 'secondary'}>
                        {user.active ? t('adminPanel.adminUsers.active') : t('adminPanel.adminUsers.inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title={t('common.edit')}
                          onClick={() => openEditDialog(user)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title={t('common.delete')}
                          onClick={() => openDeleteDialog(user)}
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
              {editingId ? t('adminPanel.adminUsers.editAdmin') : t('adminPanel.adminUsers.newAdmin')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('adminPanel.adminUsers.name')}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, name: e.target.value }));
                  clearFieldError('name');
                }}
                placeholder={t('adminPanel.adminUsers.fullName')}
                className={formErrors.name ? 'border-brand-error' : ''}
              />
              {formErrors.name && (
                <p className="text-xs text-brand-error mt-1">{formErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('adminPanel.adminUsers.email')}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, email: e.target.value }));
                  clearFieldError('email');
                }}
                placeholder="admin@bellu.com"
                className={formErrors.email ? 'border-brand-error' : ''}
              />
              {formErrors.email && (
                <p className="text-xs text-brand-error mt-1">{formErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                {t('adminPanel.adminUsers.password')}{editingId ? ` (${t('adminPanel.adminUsers.passwordKeep')})` : ''}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, password: e.target.value }));
                  clearFieldError('password');
                }}
                placeholder={editingId ? '••••••••' : t('adminPanel.adminUsers.password')}
                className={formErrors.password ? 'border-brand-error' : ''}
              />
              {formErrors.password && (
                <p className="text-xs text-brand-error mt-1">{formErrors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="roleId">{t('adminPanel.adminUsers.role')}</Label>
              <Select
                id="roleId"
                value={formData.roleId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, roleId: e.target.value }))
                }
              >
                <option value="">{t('adminPanel.adminUsers.noRole')}</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="countryId">{t('adminPanel.adminUsers.countryOptional')}</Label>
              <Select
                id="countryId"
                value={formData.countryId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, countryId: e.target.value }))
                }
              >
                <option value="">{t('adminPanel.adminUsers.noCountry')}</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.name}
                  </option>
                ))}
              </Select>
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
            <DialogTitle>{t('adminPanel.adminUsers.deleteAdmin')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t('adminPanel.adminUsers.deleteConfirm', { name: deletingUser?.name ?? '' })}
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
