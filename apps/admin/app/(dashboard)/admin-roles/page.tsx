'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Loader2, Shield, ShieldCheck, Users, ChevronDown, ChevronRight } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { useTranslation } from '@/lib/i18n';

interface AdminStaffRole {
  id: string;
  name: string;
  description?: string;
  permissions: string;
  isDefault: boolean;
  _count?: { admins: number };
}

const PERMISSION_LABEL_KEYS: Record<string, string> = {
  'dashboard.view': 'adminPanel.roles.permDashboardView',
  'users.view': 'adminPanel.roles.permUsersView',
  'users.edit': 'adminPanel.roles.permUsersEdit',
  'users.delete': 'adminPanel.roles.permUsersDelete',
  'professionals.view': 'adminPanel.roles.permProfessionalsView',
  'professionals.approve': 'adminPanel.roles.permProfessionalsApprove',
  'professionals.edit': 'adminPanel.roles.permProfessionalsEdit',
  'professionals.delete': 'adminPanel.roles.permProfessionalsDelete',
  'categories.view': 'adminPanel.roles.permCategoriesView',
  'categories.create': 'adminPanel.roles.permCategoriesCreate',
  'categories.edit': 'adminPanel.roles.permCategoriesEdit',
  'categories.delete': 'adminPanel.roles.permCategoriesDelete',
  'services.view': 'adminPanel.roles.permServicesView',
  'services.edit': 'adminPanel.roles.permServicesEdit',
  'services.delete': 'adminPanel.roles.permServicesDelete',
  'bookings.view': 'adminPanel.roles.permBookingsView',
  'bookings.edit': 'adminPanel.roles.permBookingsEdit',
  'bookings.cancel': 'adminPanel.roles.permBookingsCancel',
  'reviews.view': 'adminPanel.roles.permReviewsView',
  'reviews.edit': 'adminPanel.roles.permReviewsEdit',
  'reviews.delete': 'adminPanel.roles.permReviewsDelete',
  'promotions.view': 'adminPanel.roles.permPromotionsView',
  'promotions.create': 'adminPanel.roles.permPromotionsCreate',
  'promotions.edit': 'adminPanel.roles.permPromotionsEdit',
  'promotions.delete': 'adminPanel.roles.permPromotionsDelete',
  'banners.view': 'adminPanel.roles.permBannersView',
  'banners.create': 'adminPanel.roles.permBannersCreate',
  'banners.edit': 'adminPanel.roles.permBannersEdit',
  'banners.delete': 'adminPanel.roles.permBannersDelete',
  'finances.view': 'adminPanel.roles.permFinancesView',
  'finances.export': 'adminPanel.roles.permFinancesExport',
  'notifications.view': 'adminPanel.roles.permNotificationsView',
  'notifications.send': 'adminPanel.roles.permNotificationsSend',
  'admins.view': 'adminPanel.roles.permAdminsView',
  'admins.create': 'adminPanel.roles.permAdminsCreate',
  'admins.edit': 'adminPanel.roles.permAdminsEdit',
  'admins.delete': 'adminPanel.roles.permAdminsDelete',
  'roles.view': 'adminPanel.roles.permRolesView',
  'roles.manage': 'adminPanel.roles.permRolesManage',
  'settings.view': 'adminPanel.roles.permSettingsView',
  'settings.edit': 'adminPanel.roles.permSettingsEdit',
};

interface PermissionGroupDef {
  key: string;
  labelKey: string;
  permissions: string[];
}

const PERMISSION_GROUP_DEFS: PermissionGroupDef[] = [
  { key: 'dashboard', labelKey: 'adminPanel.roles.groupDashboard', permissions: ['dashboard.view'] },
  { key: 'users', labelKey: 'adminPanel.roles.groupUsers', permissions: ['users.view', 'users.edit', 'users.delete'] },
  { key: 'professionals', labelKey: 'adminPanel.roles.groupProfessionals', permissions: ['professionals.view', 'professionals.approve', 'professionals.edit', 'professionals.delete'] },
  { key: 'categories', labelKey: 'adminPanel.roles.groupCategories', permissions: ['categories.view', 'categories.create', 'categories.edit', 'categories.delete'] },
  { key: 'services', labelKey: 'adminPanel.roles.groupServices', permissions: ['services.view', 'services.edit', 'services.delete'] },
  { key: 'bookings', labelKey: 'adminPanel.roles.groupBookings', permissions: ['bookings.view', 'bookings.edit', 'bookings.cancel'] },
  { key: 'reviews', labelKey: 'adminPanel.roles.groupReviews', permissions: ['reviews.view', 'reviews.edit', 'reviews.delete'] },
  { key: 'promotions', labelKey: 'adminPanel.roles.groupPromotions', permissions: ['promotions.view', 'promotions.create', 'promotions.edit', 'promotions.delete'] },
  { key: 'banners', labelKey: 'adminPanel.roles.groupBanners', permissions: ['banners.view', 'banners.create', 'banners.edit', 'banners.delete'] },
  { key: 'finances', labelKey: 'adminPanel.roles.groupFinances', permissions: ['finances.view', 'finances.export'] },
  { key: 'notifications', labelKey: 'adminPanel.roles.groupNotifications', permissions: ['notifications.view', 'notifications.send'] },
  { key: 'admins', labelKey: 'adminPanel.roles.groupAdmins', permissions: ['admins.view', 'admins.create', 'admins.edit', 'admins.delete'] },
  { key: 'roles', labelKey: 'adminPanel.roles.groupRoles', permissions: ['roles.view', 'roles.manage'] },
  { key: 'settings', labelKey: 'adminPanel.roles.groupSettings', permissions: ['settings.view', 'settings.edit'] },
];

interface RoleFieldErrors {
  roleName?: string;
  permissions?: string;
}

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<AdminStaffRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingRole, setDeletingRole] = useState<AdminStaffRole | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPermissions, setFormPermissions] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(PERMISSION_GROUP_DEFS.map(g => g.key)));
  const [submitting, setSubmitting] = useState(false);
  const [viewingRole, setViewingRole] = useState<AdminStaffRole | null>(null);
  const [fieldErrors, setFieldErrors] = useState<RoleFieldErrors>({});
  const toast = useToast();
  const { t } = useTranslation();

  const clearFieldError = (field: keyof RoleFieldErrors) => {
    setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  };

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: AdminStaffRole[] }>('/api/admin/admin-roles');
      setRoles(res.data || []);
    } catch {
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  const openCreate = () => {
    setEditingId(null);
    setFormName('');
    setFormDescription('');
    setFormPermissions(new Set());
    setExpandedGroups(new Set(PERMISSION_GROUP_DEFS.map(g => g.key)));
    setFieldErrors({});
    setFormOpen(true);
  };

  const openEdit = (role: AdminStaffRole) => {
    setEditingId(role.id);
    setFormName(role.name);
    setFormDescription(role.description || '');
    const perms = parsePermissions(role.permissions);
    setFormPermissions(new Set(perms));
    setExpandedGroups(new Set(PERMISSION_GROUP_DEFS.map(g => g.key)));
    setFieldErrors({});
    setFormOpen(true);
  };

  const togglePermission = (perm: string) => {
    setFormPermissions(prev => {
      const next = new Set(prev);
      if (next.has(perm)) next.delete(perm);
      else next.add(perm);
      return next;
    });
  };

  const toggleGroupAll = (group: PermissionGroupDef) => {
    setFormPermissions(prev => {
      const next = new Set(prev);
      const allChecked = group.permissions.every(p => next.has(p));
      if (allChecked) {
        group.permissions.forEach(p => next.delete(p));
      } else {
        group.permissions.forEach(p => next.add(p));
      }
      return next;
    });
  };

  const toggleExpandGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectAllPermissions = () => {
    const all = PERMISSION_GROUP_DEFS.flatMap(g => g.permissions);
    setFormPermissions(new Set(all));
  };

  const clearAllPermissions = () => {
    setFormPermissions(new Set());
  };

  const handleSubmit = async () => {
    const errors: RoleFieldErrors = {};
    if (!formName.trim()) errors.roleName = t('validation.required');
    if (formPermissions.size === 0) errors.permissions = t('adminPanel.roles.selectAtLeastOne');
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const body = {
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        permissions: Array.from(formPermissions),
      };
      if (editingId) {
        await apiFetch(`/api/admin/admin-roles/${editingId}`, { method: 'PUT', body: JSON.stringify(body) });
        toast.success(t('adminPanel.roles.saveSuccess'));
      } else {
        await apiFetch('/api/admin/admin-roles', { method: 'POST', body: JSON.stringify(body) });
        toast.success(t('adminPanel.roles.saveSuccess'));
      }
      setFormOpen(false);
      fetchRoles();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('adminPanel.roles.saveError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingRole) return;
    setSubmitting(true);
    try {
      await apiFetch(`/api/admin/admin-roles/${deletingRole.id}`, { method: 'DELETE' });
      toast.success(t('adminPanel.roles.deleteSuccess'));
      setDeleteOpen(false);
      fetchRoles();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('adminPanel.roles.deleteError'));
    } finally {
      setSubmitting(false);
    }
  };

  const parsePermissions = (permsJson: string): string[] => {
    try { return JSON.parse(permsJson); }
    catch { return []; }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">{t('adminPanel.roles.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('adminPanel.roles.subtitle')}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t('adminPanel.roles.newRole')}
        </Button>
      </div>

      {/* Roles Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : roles.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-10 text-muted-foreground">
            <Shield className="h-12 w-12" />
            <p className="mt-4 text-sm">{t('adminPanel.roles.noRoles')}</p>
            <Button className="mt-4" onClick={openCreate}><Plus className="mr-2 h-4 w-4" />{t('adminPanel.roles.newRole')}</Button>
          </div>
        ) : roles.map((role) => {
          const perms = parsePermissions(role.permissions);
          const totalPerms = PERMISSION_GROUP_DEFS.flatMap(g => g.permissions).length;
          return (
            <Card key={role.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-brand-rose" />
                    <CardTitle className="text-base">{role.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    {role.isDefault && (
                      <Badge variant="secondary" className="text-xs">{t('adminPanel.roles.default')}</Badge>
                    )}
                  </div>
                </div>
                {role.description && (
                  <p className="text-xs text-muted-foreground">{role.description}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5" />
                    {perms.length}/{totalPerms} {t('adminPanel.roles.permissions')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {role._count?.admins || 0} {t('adminPanel.roles.members')}
                  </span>
                </div>

                {/* Permission summary */}
                <div className="flex flex-wrap gap-1">
                  {PERMISSION_GROUP_DEFS.map(group => {
                    const groupActive = group.permissions.some(p => perms.includes(p));
                    if (!groupActive) return null;
                    const allActive = group.permissions.every(p => perms.includes(p));
                    return (
                      <Badge key={group.key} variant={allActive ? 'default' : 'secondary'} className="text-xs">
                        {t(group.labelKey)}
                      </Badge>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setViewingRole(role)}>
                    {t('adminPanel.roles.viewDetails')}
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEdit(role)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  {!role.isDefault && (
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => { setDeletingRole(role); setDeleteOpen(true); }}>
                      <Trash2 className="h-3.5 w-3.5 text-brand-error" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* View Details Dialog */}
      <Dialog open={!!viewingRole} onOpenChange={() => setViewingRole(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-brand-rose" />
              {viewingRole?.name}
            </DialogTitle>
          </DialogHeader>
          {viewingRole && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {viewingRole.description && (
                <p className="text-sm text-muted-foreground">{viewingRole.description}</p>
              )}
              {PERMISSION_GROUP_DEFS.map(group => {
                const perms = parsePermissions(viewingRole.permissions);
                const activeInGroup = group.permissions.filter(p => perms.includes(p));
                if (activeInGroup.length === 0) return null;
                return (
                  <div key={group.key}>
                    <h4 className="text-sm font-semibold mb-1">{t(group.labelKey)}</h4>
                    <div className="flex flex-wrap gap-1">
                      {activeInGroup.map(p => (
                        <Badge key={p} variant="secondary" className="text-xs">
                          {t(PERMISSION_LABEL_KEYS[p]) || p}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingRole(null)}>{t('common.close')}</Button>
            <Button onClick={() => { if (viewingRole) { openEdit(viewingRole); setViewingRole(null); } }}>
              <Pencil className="mr-2 h-4 w-4" />{t('common.edit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? t('adminPanel.roles.editRole') : t('adminPanel.roles.newRole')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} noValidate className="space-y-6 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('adminPanel.roles.roleName')} *</Label>
                <Input
                  value={formName}
                  onChange={(e) => { setFormName(e.target.value); clearFieldError('roleName'); }}
                  placeholder={t('adminPanel.roles.roleNamePlaceholder')}
                  className={fieldErrors.roleName ? 'border-brand-error' : ''}
                />
                {fieldErrors.roleName && <p className="text-xs text-brand-error">{fieldErrors.roleName}</p>}
              </div>
              <div className="space-y-2">
                <Label>{t('adminPanel.roles.roleDescription')}</Label>
                <Input
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder={t('adminPanel.roles.descriptionPlaceholder')}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">{t('adminPanel.roles.permissions')} ({formPermissions.size})</Label>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={selectAllPermissions}>{t('adminPanel.roles.selectAll')}</Button>
                  <Button type="button" variant="outline" size="sm" onClick={clearAllPermissions}>{t('adminPanel.roles.clearAll')}</Button>
                </div>
              </div>

              <div className="space-y-2 rounded-xl border p-4">
                {PERMISSION_GROUP_DEFS.map((group) => {
                  const allChecked = group.permissions.every(p => formPermissions.has(p));
                  const someChecked = group.permissions.some(p => formPermissions.has(p));
                  const isExpanded = expandedGroups.has(group.key);

                  return (
                    <div key={group.key} className="border-b last:border-0 pb-2 last:pb-0">
                      <div className="flex items-center gap-2 py-1.5">
                        <button
                          type="button"
                          onClick={() => toggleExpandGroup(group.key)}
                          className="p-0.5 hover:bg-muted rounded"
                        >
                          {isExpanded
                            ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          }
                        </button>
                        <Checkbox
                          checked={allChecked}
                          onCheckedChange={() => toggleGroupAll(group)}
                        />
                        <button
                          type="button"
                          onClick={() => toggleGroupAll(group)}
                          className="text-sm font-medium hover:text-brand-rose transition-colors"
                        >
                          {t(group.labelKey)}
                        </button>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {group.permissions.filter(p => formPermissions.has(p)).length}/{group.permissions.length}
                        </span>
                        {someChecked && !allChecked && (
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        )}
                      </div>

                      {isExpanded && (
                        <div className="ml-10 grid gap-1 pb-2 md:grid-cols-2">
                          {group.permissions.map((perm) => (
                            <label
                              key={perm}
                              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-muted transition-colors"
                            >
                              <Checkbox
                                checked={formPermissions.has(perm)}
                                onCheckedChange={() => togglePermission(perm)}
                              />
                              <span className={formPermissions.has(perm) ? 'text-foreground' : 'text-muted-foreground'}>
                                {t(PERMISSION_LABEL_KEYS[perm]) || perm}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {fieldErrors.permissions && <p className="text-xs text-brand-error">{fieldErrors.permissions}</p>}
            </div>
          </form>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? t('common.save') : t('adminPanel.roles.newRole')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('common.delete')}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t('adminPanel.roles.confirmDelete', { name: deletingRole?.name || '' })}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
