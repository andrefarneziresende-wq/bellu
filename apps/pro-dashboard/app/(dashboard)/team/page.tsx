'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Loader2, UserPlus, KeyRound } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { useTranslation } from '@/lib/i18n';
import { PhoneMaskedInput } from '@/components/ui/masked-input';

interface StaffRole {
  id: string;
  name: string;
  permissions: string;
}

interface Member {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  roleId?: string;
  staffRole?: StaffRole | null;
  userId?: string | null;
  specialties?: string;
  commissionPercent?: number;
  active: boolean;
}

const emptyForm = { name: '', email: '', phone: '', role: 'staff', roleId: '', specialties: '', commissionPercent: '' };

interface TeamFieldErrors {
  name?: string;
  email?: string;
  role?: string;
  commissionPercent?: string;
}

function validateTeamForm(
  form: typeof emptyForm,
  t: (key: string, params?: Record<string, string>) => string,
): TeamFieldErrors {
  const errors: TeamFieldErrors = {};
  if (!form.name.trim()) errors.name = t('validation.required');
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = t('validation.invalidEmail');
  }
  if (!form.role) errors.role = t('validation.required');
  if (form.commissionPercent) {
    const val = parseFloat(form.commissionPercent);
    if (isNaN(val) || val < 0 || val > 100) {
      errors.commissionPercent = t('validation.maxPercent');
    }
  }
  return errors;
}

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkMember, setLinkMember] = useState<Member | null>(null);
  const [linkEmail, setLinkEmail] = useState('');
  const [linkPassword, setLinkPassword] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [staffRoles, setStaffRoles] = useState<StaffRole[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<TeamFieldErrors>({});
  const toast = useToast();
  const { t } = useTranslation();

  const clearFieldError = (field: keyof TeamFieldErrors) => {
    setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  };

  const fetchRoles = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: StaffRole[] }>('/api/roles');
      setStaffRoles(res.data || []);
    } catch {
      setStaffRoles([]);
    }
  }, []);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: Member[] }>('/api/members');
      setMembers(res.data || []);
    } catch {
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMembers(); fetchRoles(); }, [fetchMembers, fetchRoles]);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setFieldErrors({}); setFormOpen(true); };
  const openEdit = (m: Member) => {
    setEditingId(m.id);
    setForm({
      name: m.name,
      email: m.email || '',
      phone: m.phone || '',
      role: m.role,
      roleId: m.roleId || '',
      specialties: m.specialties || '',
      commissionPercent: m.commissionPercent ? String(m.commissionPercent) : '',
    });
    setFieldErrors({});
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    const errors = validateTeamForm(form, t);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setSubmitting(true);
    try {
      const body = {
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        role: form.role,
        roleId: form.roleId || null,
        specialties: form.specialties || null,
        commissionPercent: form.commissionPercent ? parseFloat(form.commissionPercent) : null,
      };
      if (editingId) {
        await apiFetch(`/api/members/${editingId}`, { method: 'PATCH', body: JSON.stringify(body) });
        toast.success(t('proDashboard.team.memberUpdated'));
      } else {
        await apiFetch('/api/members', { method: 'POST', body: JSON.stringify(body) });
        toast.success(t('proDashboard.team.memberAdded'));
      }
      setFormOpen(false);
      fetchMembers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('proDashboard.team.saveError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLinkAccount = async () => {
    if (!linkMember || !linkEmail || !linkPassword) return;
    setSubmitting(true);
    try {
      await apiFetch(`/api/members/${linkMember.id}/link-account`, {
        method: 'POST',
        body: JSON.stringify({ email: linkEmail, tempPassword: linkPassword }),
      });
      toast.success(t('proDashboard.team.loginCreated'));
      setLinkOpen(false);
      fetchMembers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingMember) return;
    setSubmitting(true);
    try {
      await apiFetch(`/api/members/${deletingMember.id}`, { method: 'DELETE' });
      toast.success(t('proDashboard.team.memberRemoved'));
      setDeleteOpen(false);
      fetchMembers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('proDashboard.team.removeError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">{t('proDashboard.team.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('proDashboard.team.title')}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t('proDashboard.team.newMember')}
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>{t('proDashboard.team.title')} ({members.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <UserPlus className="h-12 w-12" />
              <p className="mt-4 text-sm">{t('proDashboard.team.noMembers')}</p>
              <Button className="mt-4" onClick={openCreate}><Plus className="mr-2 h-4 w-4" />{t('proDashboard.team.addMember')}</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('proDashboard.team.name')}</TableHead>
                  <TableHead>{t('proDashboard.team.email')}</TableHead>
                  <TableHead>{t('proDashboard.team.phone')}</TableHead>
                  <TableHead>{t('proDashboard.team.role')}</TableHead>
                  <TableHead>{t('proDashboard.team.commission')}</TableHead>
                  <TableHead>{t('proDashboard.team.status')}</TableHead>
                  <TableHead className="w-[100px]">{t('common.edit')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell>{m.email || '—'}</TableCell>
                    <TableCell>{m.phone || '—'}</TableCell>
                    <TableCell><Badge variant={m.staffRole ? 'default' : 'secondary'}>{m.staffRole?.name || (m.role === 'owner' ? t('proDashboard.team.owner') : t('proDashboard.team.staff'))}</Badge></TableCell>
                    <TableCell>{m.commissionPercent ? `${m.commissionPercent}%` : '—'}</TableCell>
                    <TableCell><Badge variant={m.active ? 'default' : 'secondary'}>{m.active ? t('proDashboard.team.active') : t('proDashboard.team.inactive')}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {!m.userId && (
                          <Button variant="ghost" size="icon" title={t('proDashboard.team.createLogin')} onClick={() => { setLinkMember(m); setLinkEmail(m.email || ''); setLinkPassword(''); setLinkOpen(true); }}>
                            <KeyRound className="h-4 w-4 text-brand-rose" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => openEdit(m)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { setDeletingMember(m); setDeleteOpen(true); }}>
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

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? t('proDashboard.team.editMember') : t('proDashboard.team.newMember')}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} noValidate className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('proDashboard.team.name')} *</Label>
              <Input value={form.name} onChange={(e) => { setForm((p) => ({ ...p, name: e.target.value })); clearFieldError('name'); }} className={fieldErrors.name ? 'border-brand-error' : ''} />
              {fieldErrors.name && <p className="text-xs text-brand-error">{fieldErrors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label>{t('proDashboard.team.email')}</Label>
              <Input type="email" value={form.email} onChange={(e) => { setForm((p) => ({ ...p, email: e.target.value })); clearFieldError('email'); }} className={fieldErrors.email ? 'border-brand-error' : ''} />
              {fieldErrors.email && <p className="text-xs text-brand-error">{fieldErrors.email}</p>}
            </div>
            <div className="space-y-2"><Label>{t('proDashboard.team.phone')}</Label><PhoneMaskedInput value={form.phone} onChange={(v) => setForm((p) => ({ ...p, phone: v }))} placeholder="(11) 99999-9999" /></div>
            <div className="space-y-2">
              <Label>{t('proDashboard.team.role')} *</Label>
              <Select value={form.roleId} onValueChange={(v) => { setForm((p) => ({ ...p, roleId: v })); clearFieldError('role'); }}>
                <SelectTrigger className={fieldErrors.role ? 'border-brand-error' : ''}><SelectValue placeholder={t('validation.selectOption')} /></SelectTrigger>
                <SelectContent>
                  {staffRoles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.role && <p className="text-xs text-brand-error">{fieldErrors.role}</p>}
            </div>
            <div className="space-y-2"><Label>{t('proDashboard.team.specialties')}</Label><Input value={form.specialties} onChange={(e) => setForm((p) => ({ ...p, specialties: e.target.value }))} placeholder={t('proDashboard.team.specialties')} /></div>
            <div className="space-y-2">
              <Label>{t('proDashboard.team.commission')} (%)</Label>
              <Input type="number" value={form.commissionPercent} onChange={(e) => { setForm((p) => ({ ...p, commissionPercent: e.target.value })); clearFieldError('commissionPercent'); }} placeholder={t('proDashboard.team.commissionPlaceholder')} className={fieldErrors.commissionPercent ? 'border-brand-error' : ''} />
              {fieldErrors.commissionPercent && <p className="text-xs text-brand-error">{fieldErrors.commissionPercent}</p>}
            </div>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSubmit} disabled={submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingId ? t('common.save') : t('proDashboard.team.addMember')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('proDashboard.team.removeMember')}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{t('proDashboard.team.confirmRemove', { name: deletingMember?.name || '' })}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t('common.delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('proDashboard.team.loginDialogTitle')}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{t('proDashboard.team.loginDialogDescription', { name: linkMember?.name || '' })}</p>
          <form onSubmit={(e) => { e.preventDefault(); handleLinkAccount(); }} noValidate className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('proDashboard.team.loginEmail')} *</Label>
              <Input type="email" value={linkEmail} onChange={(e) => setLinkEmail(e.target.value)} placeholder="email@exemplo.com" />
            </div>
            <div className="space-y-2">
              <Label>{t('proDashboard.team.loginPassword')} *</Label>
              <Input type="password" value={linkPassword} onChange={(e) => setLinkPassword(e.target.value)} placeholder="********" />
            </div>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleLinkAccount} disabled={submitting || !linkEmail || !linkPassword}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t('proDashboard.team.createLogin')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
