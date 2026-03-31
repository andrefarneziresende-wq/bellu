'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Layers,
  Loader2,
  ChevronRight,
  Calendar,
  Clock,
  X,
  Plus,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { useTranslation } from '@/lib/i18n';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';

interface SessionGroupBooking {
  id: string;
  date: string;
  startTime: string;
  status: string;
  sessionNumber: number;
  notes?: string;
  completedAt?: string;
  endTime?: string;
}

interface SessionGroup {
  id: string;
  serviceId?: string;
  customServiceName?: string;
  clientName?: string;
  clientPhone?: string;
  totalSessions: number;
  priceType: string;
  totalPrice: number;
  sessionPrice: number;
  currency: string;
  notes?: string;
  status: string;
  createdAt: string;
  service?: { id: string; name: string; durationMinutes: number; price?: number };
  user?: { id: string; name: string; phone?: string };
  bookings: SessionGroupBooking[];
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-300',
  COMPLETED: 'bg-gray-100 text-gray-700 border-gray-300',
  CANCELLED: 'bg-red-50 text-red-700 border-red-300',
};

const bookingStatusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-emerald-50 text-emerald-700',
  COMPLETED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-red-50 text-red-700',
  NO_SHOW: 'bg-orange-50 text-orange-700',
};

export default function SessionGroupsPage() {
  const [groups, setGroups] = useState<SessionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<SessionGroup | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ date: '', startTime: '', notes: '' });
  const [scheduling, setScheduling] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const toast = useToast();
  const { t, locale } = useTranslation();

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: SessionGroup[] }>('/api/session-groups');
      setGroups(res.data || []);
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const openDetail = async (group: SessionGroup) => {
    try {
      const res = await apiFetch<{ data: SessionGroup }>(`/api/session-groups/${group.id}`);
      setSelectedGroup(res.data);
    } catch {
      setSelectedGroup(group);
    }
    setDetailOpen(true);
  };

  const handleScheduleSession = async () => {
    if (!selectedGroup || !scheduleForm.date || !scheduleForm.startTime) return;
    setScheduling(true);
    try {
      await apiFetch(`/api/session-groups/${selectedGroup.id}/schedule`, {
        method: 'POST',
        body: JSON.stringify({
          date: scheduleForm.date,
          startTime: scheduleForm.startTime,
          notes: scheduleForm.notes || undefined,
        }),
      });
      toast.success(t('proDashboard.agenda.scheduleSession'));
      setScheduleOpen(false);
      setScheduleForm({ date: '', startTime: '', notes: '' });
      // Refresh detail
      const res = await apiFetch<{ data: SessionGroup }>(`/api/session-groups/${selectedGroup.id}`);
      setSelectedGroup(res.data);
      fetchGroups();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setScheduling(false);
    }
  };

  const handleCancelGroup = async () => {
    if (!selectedGroup) return;
    setCancelling(true);
    try {
      await apiFetch(`/api/session-groups/${selectedGroup.id}/cancel`, { method: 'PATCH' });
      toast.success(t('proDashboard.agenda.groupCancelled'));
      setDetailOpen(false);
      fetchGroups();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setCancelling(false);
    }
  };

  const scheduledCount = (g: SessionGroup) => g.bookings.filter(b => b.date).length;
  const pendingCount = (g: SessionGroup) => g.totalSessions - scheduledCount(g);
  const completedCount = (g: SessionGroup) => g.bookings.filter(b => b.status === 'COMPLETED').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">{t('proDashboard.agenda.allGroups')}</h1>
        <p className="text-sm text-muted-foreground">{t('proDashboard.agenda.sessionGroupDesc')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-brand-rose" />
            {t('proDashboard.agenda.allGroups')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Layers className="h-12 w-12" />
              <p className="mt-4 text-sm">{t('proDashboard.agenda.noGroups')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => openDetail(g)}
                  className="w-full text-left rounded-xl border p-4 transition-colors hover:bg-brand-rose/5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold truncate">
                          {g.user?.name || g.clientName || '—'}
                        </p>
                        <Badge className={statusColors[g.status] || ''}>
                          {t(`proDashboard.agenda.${g.status.toLowerCase()}`)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {g.service?.name || g.customServiceName || '—'}
                        {' • '}
                        {g.totalSessions} {t('proDashboard.agenda.session')}s
                        {' • '}
                        {g.priceType === 'PER_SESSION'
                          ? `R$ ${Number(g.sessionPrice).toFixed(2)}/${t('proDashboard.agenda.session').toLowerCase()}`
                          : `R$ ${Number(g.totalPrice).toFixed(2)} ${t('proDashboard.agenda.customTotal').toLowerCase()}`
                        }
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs">
                        <span className="text-emerald-600">
                          {completedCount(g)}/{g.totalSessions} {t('proDashboard.agenda.completed')}
                        </span>
                        {pendingCount(g) > 0 && (
                          <span className="text-yellow-600">
                            {pendingCount(g)} {t('proDashboard.agenda.sessionsPending', { count: '' }).trim()}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Group Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-brand-rose" />
              {t('proDashboard.agenda.sessionGroup')}
            </DialogTitle>
          </DialogHeader>
          {selectedGroup && (
            <div className="space-y-4 py-2">
              {/* Group info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">{t('proDashboard.agenda.client')}</p>
                  <p className="font-medium">{selectedGroup.user?.name || selectedGroup.clientName || '—'}</p>
                  {(selectedGroup.user?.phone || selectedGroup.clientPhone) && (
                    <p className="text-xs text-muted-foreground">{selectedGroup.user?.phone || selectedGroup.clientPhone}</p>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground">{t('proDashboard.agenda.service')}</p>
                  <p className="font-medium">{selectedGroup.service?.name || selectedGroup.customServiceName || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('proDashboard.agenda.totalSessions')}</p>
                  <p className="font-medium">{selectedGroup.totalSessions}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('proDashboard.agenda.priceType')}</p>
                  <p className="font-medium">
                    {selectedGroup.priceType === 'PER_SESSION'
                      ? `R$ ${Number(selectedGroup.sessionPrice).toFixed(2)} / ${t('proDashboard.agenda.session').toLowerCase()}`
                      : `R$ ${Number(selectedGroup.totalPrice).toFixed(2)} (${t('proDashboard.agenda.customTotal').toLowerCase()})`
                    }
                  </p>
                </div>
              </div>

              {selectedGroup.notes && (
                <div className="text-sm">
                  <p className="text-muted-foreground">{t('proDashboard.agenda.notes')}</p>
                  <p>{selectedGroup.notes}</p>
                </div>
              )}

              {/* Sessions list */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{t('proDashboard.agenda.session')}s</p>
                  {selectedGroup.status === 'ACTIVE' && pendingCount(selectedGroup) > 0 && (
                    <Button size="sm" variant="outline" onClick={() => { setScheduleForm({ date: '', startTime: '', notes: '' }); setScheduleOpen(true); }}>
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      {t('proDashboard.agenda.scheduleSession')}
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  {/* Scheduled sessions */}
                  {selectedGroup.bookings.map((b) => (
                    <div key={b.id} className="flex items-center gap-3 rounded-lg border p-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-rose/10 text-sm font-bold text-brand-rose">
                        {b.sessionNumber}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm">
                            {new Date(b.date).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </span>
                          <Clock className="h-3.5 w-3.5 text-muted-foreground ml-1" />
                          <span className="text-sm">{b.startTime}{b.endTime ? `–${b.endTime}` : ''}</span>
                        </div>
                        {b.notes && <p className="text-xs text-muted-foreground mt-0.5 truncate">{b.notes}</p>}
                      </div>
                      <Badge className={bookingStatusColors[b.status] || ''}>
                        {b.status}
                      </Badge>
                    </div>
                  ))}
                  {/* Unscheduled sessions placeholders */}
                  {Array.from({ length: pendingCount(selectedGroup) }, (_, i) => (
                    <div key={`pending-${i}`} className="flex items-center gap-3 rounded-lg border border-dashed p-3 opacity-50">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
                        {scheduledCount(selectedGroup) + i + 1}
                      </div>
                      <span className="text-sm text-muted-foreground italic">{t('proDashboard.agenda.scheduleLater')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              {selectedGroup.status === 'ACTIVE' && (
                <div className="flex justify-end border-t pt-4">
                  <Button variant="outline" size="sm" onClick={handleCancelGroup} disabled={cancelling} className="text-red-600 border-red-200 hover:bg-red-50">
                    {cancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
                    {t('proDashboard.agenda.cancelGroup')}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Schedule Session Dialog */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('proDashboard.agenda.scheduleSession')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('proDashboard.agenda.sessionDate')} *</Label>
                <DatePicker
                  value={scheduleForm.date}
                  onChange={(v) => setScheduleForm((p) => ({ ...p, date: v }))}
                  minDate={new Date()}
                  locale={locale}
                  placeholder={t('proDashboard.agenda.sessionDate')}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('proDashboard.agenda.sessionTime')} *</Label>
                <TimePicker
                  value={scheduleForm.startTime}
                  onChange={(v) => setScheduleForm((p) => ({ ...p, startTime: v }))}
                  placeholder={t('proDashboard.agenda.sessionTime')}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('proDashboard.agenda.sessionNotes')}</Label>
              <Input
                value={scheduleForm.notes}
                onChange={(e) => setScheduleForm((p) => ({ ...p, notes: e.target.value }))}
                placeholder={t('proDashboard.agenda.sessionNotes')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleScheduleSession} disabled={scheduling || !scheduleForm.date || !scheduleForm.startTime}>
              {scheduling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
