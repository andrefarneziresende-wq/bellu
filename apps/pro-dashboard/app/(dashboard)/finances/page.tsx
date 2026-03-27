'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, TrendingUp, TrendingDown, Plus, Loader2, Receipt, RefreshCw, AlertCircle, Pencil, Trash2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { useTranslation } from '@/lib/i18n';
import { DatePicker } from '@/components/ui/date-picker';

interface Transaction {
  id: string;
  date?: string;
  createdAt: string;
  clientName?: string;
  user?: { name: string };
  service?: { name: string };
  totalPrice?: number;
  amount?: number;
  currency: string;
  status: string;
  paymentStatus?: string;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  date: string;
  recurring: boolean;
}

interface ExpenseFieldErrors {
  description?: string;
  amount?: string;
  category?: string;
}

function validateExpenseForm(
  form: { description: string; amount: string; category: string },
  t: (key: string, params?: Record<string, string>) => string,
): ExpenseFieldErrors {
  const errors: ExpenseFieldErrors = {};
  if (!form.description.trim()) errors.description = t('validation.required');
  if (!form.amount || isNaN(parseFloat(form.amount)) || parseFloat(form.amount) <= 0) {
    errors.amount = t('validation.minValue', { min: '0' });
  }
  if (!form.category) errors.category = t('validation.required');
  return errors;
}

export default function FinancesPage() {
  const [bookings, setBookings] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<ExpenseFieldErrors>({});
  const toast = useToast();
  const { t, locale } = useTranslation();

  const clearFieldError = (field: keyof ExpenseFieldErrors) => {
    setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  };

  const todayStr = () => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
  };

  const [form, setForm] = useState({ description: '', amount: '', category: 'other', date: todayStr(), recurring: false });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [bRes, eRes] = await Promise.all([
        apiFetch<{ data: { bookings: Transaction[] } }>('/api/bookings/professional'),
        apiFetch<{ data: Expense[] }>('/api/expenses'),
      ]);
      setBookings(bRes.data?.bookings || []);
      setExpenses(eRes.data || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalRevenue = bookings
    .filter((b) => b.paymentStatus === 'PAID' || b.status === 'COMPLETED')
    .reduce((sum, b) => sum + Number(b.totalPrice || 0), 0);

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const profit = totalRevenue - totalExpenses;

  const handleCreateExpense = async () => {
    const errors = validateExpenseForm(form, t);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setSubmitting(true);
    try {
      await apiFetch('/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          description: form.description,
          amount: parseFloat(form.amount),
          category: form.category,
          date: form.date,
          recurring: form.recurring,
          currency: 'BRL',
        }),
      });
      toast.success(t('proDashboard.finances.newExpense'));
      setExpenseOpen(false);
      setForm({ description: '', amount: '', category: 'other', date: todayStr(), recurring: false });
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setForm({
      description: expense.description,
      amount: String(expense.amount),
      category: expense.category,
      date: expense.date.slice(0, 10),
      recurring: expense.recurring,
    });
    setExpenseOpen(true);
  };

  const handleUpdateExpense = async () => {
    if (!editingExpense) return;
    const errors = validateExpenseForm(form, t);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setSubmitting(true);
    try {
      await apiFetch(`/api/expenses/${editingExpense.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          description: form.description,
          amount: parseFloat(form.amount),
          category: form.category,
          date: form.date,
          recurring: form.recurring,
          currency: 'BRL',
        }),
      });
      toast.success(t('common.save'));
      setExpenseOpen(false);
      setEditingExpense(null);
      setForm({ description: '', amount: '', category: 'other', date: todayStr(), recurring: false });
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm(t('proDashboard.finances.deleteConfirm'))) return;
    try {
      await apiFetch(`/api/expenses/${id}`, { method: 'DELETE' });
      toast.success(t('common.delete'));
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.error'));
    }
  };

  const fmt = (v: number) => `R$ ${v.toLocaleString(locale, { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">{t('proDashboard.finances.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('proDashboard.finances.revenue')}, {t('proDashboard.finances.expenses')}, {t('proDashboard.finances.profit')}</p>
        </div>
        <Button onClick={() => { setFieldErrors({}); setForm({ description: '', amount: '', category: 'other', date: todayStr(), recurring: false }); setExpenseOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          {t('proDashboard.finances.newExpense')}
        </Button>
      </div>

      {error && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-10">
            <AlertCircle className="h-10 w-10 text-brand-error" />
            <p className="text-sm text-muted-foreground">{t('errors.loadError')}</p>
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('common.tryAgain')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-success/10">
              <TrendingUp className="h-6 w-6 text-brand-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('proDashboard.finances.revenue')}</p>
              <p className="text-2xl font-bold">{loading ? '...' : fmt(totalRevenue)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-error/10">
              <TrendingDown className="h-6 w-6 text-brand-error" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('proDashboard.finances.expenses')}</p>
              <p className="text-2xl font-bold">{loading ? '...' : fmt(totalExpenses)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gold/10">
              <DollarSign className="h-6 w-6 text-brand-gold" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('proDashboard.finances.profit')}</p>
              <p className={`text-2xl font-bold ${profit >= 0 ? 'text-brand-success' : 'text-brand-error'}`}>
                {loading ? '...' : fmt(profit)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader><CardTitle>{t('proDashboard.finances.title')}</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Receipt className="h-12 w-12" />
              <p className="mt-4 text-sm">{t('common.noResults')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('proDashboard.agenda.date')}</TableHead>
                  <TableHead>{t('proDashboard.agenda.client')}</TableHead>
                  <TableHead>{t('proDashboard.agenda.service')}</TableHead>
                  <TableHead>{t('proDashboard.finances.amount')}</TableHead>
                  <TableHead>{t('booking.status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.slice(0, 20).map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>{new Date(b.date || b.createdAt).toLocaleDateString(locale)}</TableCell>
                    <TableCell>{b.user?.name || b.clientName || '—'}</TableCell>
                    <TableCell>{b.service?.name || '—'}</TableCell>
                    <TableCell>R$ {Number(b.totalPrice || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={b.paymentStatus === 'PAID' ? 'default' : 'secondary'}>
                        {b.paymentStatus === 'PAID' ? t('booking.completed') : b.paymentStatus === 'PENDING' ? t('booking.pending') : b.paymentStatus || '—'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Expenses */}
      <Card>
        <CardHeader><CardTitle>{t('proDashboard.finances.expenses')} ({expenses.length})</CardTitle></CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{t('proDashboard.finances.noExpenses')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('proDashboard.agenda.date')}</TableHead>
                  <TableHead>{t('proDashboard.portfolio.description')}</TableHead>
                  <TableHead>{t('proDashboard.finances.expenseCategory')}</TableHead>
                  <TableHead>{t('proDashboard.finances.amount')}</TableHead>
                  <TableHead>{t('proDashboard.finances.recurring')}</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{new Date(e.date).toLocaleDateString(locale)}</TableCell>
                    <TableCell className="font-medium">{e.description}</TableCell>
                    <TableCell><Badge variant="secondary">{e.category}</Badge></TableCell>
                    <TableCell>R$ {Number(e.amount).toFixed(2)}</TableCell>
                    <TableCell>{e.recurring ? t('common.yes') : t('common.no')}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditExpense(e)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteExpense(e.id)}>
                          <Trash2 className="h-4 w-4" />
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

      {/* New Expense Dialog */}
      <Dialog open={expenseOpen} onOpenChange={(open) => { setExpenseOpen(open); if (!open) { setEditingExpense(null); setForm({ description: '', amount: '', category: 'other', date: todayStr(), recurring: false }); setFieldErrors({}); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingExpense ? t('common.edit') : t('proDashboard.finances.newExpense')}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('proDashboard.portfolio.description')} *</Label>
              <Input value={form.description} onChange={(e) => { setForm((p) => ({ ...p, description: e.target.value })); clearFieldError('description'); }} placeholder={t('proDashboard.finances.expensePlaceholder')} className={fieldErrors.description ? 'border-brand-error' : ''} />
              {fieldErrors.description && <p className="text-xs text-brand-error">{fieldErrors.description}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('proDashboard.finances.amount')} (R$) *</Label>
                <Input type="number" step="0.01" value={form.amount} onChange={(e) => { setForm((p) => ({ ...p, amount: e.target.value })); clearFieldError('amount'); }} className={fieldErrors.amount ? 'border-brand-error' : ''} />
                {fieldErrors.amount && <p className="text-xs text-brand-error">{fieldErrors.amount}</p>}
              </div>
              <div className="space-y-2">
                <Label>{t('proDashboard.agenda.date')}</Label>
                <DatePicker
                  value={form.date}
                  onChange={(v) => setForm((p) => ({ ...p, date: v }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('proDashboard.finances.expenseCategory')}</Label>
              <Select value={form.category} onValueChange={(v) => { setForm((p) => ({ ...p, category: v })); clearFieldError('category'); }}>
                <SelectTrigger className={fieldErrors.category ? 'border-brand-error' : ''}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rent">{t('proDashboard.finances.catRent')}</SelectItem>
                  <SelectItem value="product">{t('proDashboard.finances.catProduct')}</SelectItem>
                  <SelectItem value="equipment">{t('proDashboard.finances.catEquipment')}</SelectItem>
                  <SelectItem value="other">{t('proDashboard.finances.catOther')}</SelectItem>
                </SelectContent>
              </Select>
              {fieldErrors.category && <p className="text-xs text-brand-error">{fieldErrors.category}</p>}
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="recurring" checked={form.recurring} onChange={(e) => setForm((p) => ({ ...p, recurring: e.target.checked }))} />
              <Label htmlFor="recurring">{t('proDashboard.finances.recurring')}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpenseOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={editingExpense ? handleUpdateExpense : handleCreateExpense} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
