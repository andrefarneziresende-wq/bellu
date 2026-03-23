'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
  Clock,
  List,
  LayoutGrid,
  Search,
  UserPlus,
  Check,
  X,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { useTranslation } from '@/lib/i18n';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { PhoneMaskedInput } from '@/components/ui/masked-input';

interface Booking {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  clientName?: string;
  clientPhone?: string;
  notes?: string;
  source: string;
  totalPrice: number;
  currency: string;
  user?: { name: string; phone?: string };
  service?: { id: string; name: string; durationMinutes: number };
  member?: { name: string };
}

interface Service {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  currency: string;
}

interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

interface BookingFieldErrors {
  client?: string;
  serviceId?: string;
  date?: string;
  startTime?: string;
  clientPhone?: string;
  newClientName?: string;
  newClientEmail?: string;
  newClientPhone?: string;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-300',
  COMPLETED: 'bg-gray-100 text-gray-700 border-gray-300',
  CANCELLED: 'bg-red-50 text-red-700 border-red-300',
  NO_SHOW: 'bg-orange-50 text-orange-700 border-orange-300',
};

const statusBg: Record<string, string> = {
  PENDING: 'bg-yellow-400',
  CONFIRMED: 'bg-emerald-500',
  COMPLETED: 'bg-gray-400',
  CANCELLED: 'bg-red-400',
  NO_SHOW: 'bg-orange-400',
};

const statusLabelKeys: Record<string, string> = {
  PENDING: 'booking.pending',
  CONFIRMED: 'booking.confirmed',
  COMPLETED: 'booking.completed',
  CANCELLED: 'booking.cancelled',
  NO_SHOW: 'booking.noShow',
};

function formatDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function timeToMinutes(time: string) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

const TIMELINE_START = 0; // 0:00
const TIMELINE_END = 24; // 24:00
const TIMELINE_HOURS = Array.from({ length: TIMELINE_END - TIMELINE_START }, (_, i) => TIMELINE_START + i);
const HOUR_HEIGHT = 80; // px per hour

type ViewMode = 'list' | 'calendar' | 'week' | 'month';

export default function AgendaPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [weekBookings, setWeekBookings] = useState<Record<string, Booking[]>>({});
  const [monthBookings, setMonthBookings] = useState<Record<string, Booking[]>>({});
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [newClientMode, setNewClientMode] = useState(false);
  const [newClientForm, setNewClientForm] = useState({ name: '', phone: '', email: '' });
  const [savingClient, setSavingClient] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<BookingFieldErrors>({});
  const toast = useToast();
  const { t, locale } = useTranslation();

  const timelineScrollRef = useRef<HTMLDivElement>(null);

  const clearFieldError = (field: keyof BookingFieldErrors) => {
    setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  };

  // Auto-scroll to current hour on mount and view change
  useEffect(() => {
    if (timelineScrollRef.current && (viewMode === 'calendar' || viewMode === 'week')) {
      const now = new Date();
      const scrollTo = Math.max(0, (now.getHours() - 1) * HOUR_HEIGHT);
      timelineScrollRef.current.scrollTop = scrollTo;
    }
  }, [viewMode, loading]);

  const statusLabels = (status: string) => t(statusLabelKeys[status] || 'booking.pending');

  const [form, setForm] = useState({
    clientName: '',
    clientPhone: '',
    serviceId: '',
    date: '',
    startTime: '',
    notes: '',
  });

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      if (viewMode === 'month') {
        // Fetch entire month
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const totalDays = lastDay.getDate();
        const results: Record<string, Booking[]> = {};
        // Batch fetch in groups of 7 to avoid too many parallel requests
        for (let i = 0; i < totalDays; i += 7) {
          const batch = Array.from({ length: Math.min(7, totalDays - i) }, (_, j) => {
            const d = new Date(year, month, i + j + 1);
            const dateStr = formatDate(d);
            return apiFetch<{ data: { bookings: Booking[] } }>(`/api/bookings/professional?date=${dateStr}`)
              .then((res) => { results[dateStr] = res.data?.bookings || []; })
              .catch(() => { results[dateStr] = []; });
          });
          await Promise.all(batch);
        }
        setMonthBookings(results);
        setBookings(results[formatDate(selectedDate)] || []);
      } else if (viewMode === 'week') {
        // Fetch entire week
        const start = getWeekStart(selectedDate);
        const results: Record<string, Booking[]> = {};
        const promises = Array.from({ length: 7 }, (_, i) => {
          const d = addDays(start, i);
          const dateStr = formatDate(d);
          return apiFetch<{ data: { bookings: Booking[] } }>(`/api/bookings/professional?date=${dateStr}`)
            .then((res) => { results[dateStr] = res.data?.bookings || []; })
            .catch(() => { results[dateStr] = []; });
        });
        await Promise.all(promises);
        setWeekBookings(results);
        // Also set day bookings for the selected date
        setBookings(results[formatDate(selectedDate)] || []);
      } else {
        const dateStr = formatDate(selectedDate);
        const res = await apiFetch<{ data: { bookings: Booking[] } }>(`/api/bookings/professional?date=${dateStr}`);
        setBookings(res.data?.bookings || []);
      }
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, viewMode]);

  const fetchServices = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: Service[] }>('/api/services');
      setServices(res.data || []);
    } catch {
      setServices([]);
    }
  }, []);

  const fetchClients = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: Client[] }>('/api/users?role=customer');
      setClients(res.data || []);
    } catch {
      setClients([]);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);
  useEffect(() => { fetchServices(); fetchClients(); }, [fetchServices, fetchClients]);

  function getWeekStart(date: Date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    d.setDate(diff);
    return d;
  }

  const openCreate = () => {
    setForm({
      clientName: '',
      clientPhone: '',
      serviceId: '',
      date: formatDate(selectedDate),
      startTime: '',
      notes: '',
    });
    setSelectedClient(null);
    setClientSearch('');
    setShowClientDropdown(false);
    setNewClientMode(false);
    setNewClientForm({ name: '', phone: '', email: '' });
    setFieldErrors({});
    setCreateOpen(true);
  };

  const selectClient = (client: Client) => {
    setSelectedClient(client);
    setForm((p) => ({ ...p, clientName: client.name, clientPhone: client.phone || '' }));
    setClientSearch('');
    setShowClientDropdown(false);
  };

  const clearClient = () => {
    setSelectedClient(null);
    setForm((p) => ({ ...p, clientName: '', clientPhone: '' }));
    setClientSearch('');
  };

  const handleSaveNewClient = async () => {
    const errors: BookingFieldErrors = {};
    if (!newClientForm.name.trim()) errors.newClientName = t('validation.required');
    if (newClientForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newClientForm.email)) errors.newClientEmail = t('validation.invalidEmail');
    if (newClientForm.phone && !/^\+?\d{8,15}$/.test(newClientForm.phone.replace(/[\s()-]/g, ''))) errors.newClientPhone = t('validation.invalidPhone');
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setSavingClient(true);
    try {
      const res = await apiFetch<{ data: Client }>('/api/users', {
        method: 'POST',
        body: JSON.stringify({ ...newClientForm, role: 'customer' }),
      });
      const newClient = res.data;
      setClients((prev) => [newClient, ...prev]);
      selectClient(newClient);
      setNewClientMode(false);
      setNewClientForm({ name: '', phone: '', email: '' });
      toast.success(t('proDashboard.clients.title'));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('errors.generic');
      if (msg.includes('Email')) {
        setFieldErrors((prev) => ({ ...prev, newClientEmail: t('validation.emailAlreadyRegistered') }));
      } else if (msg.includes('Phone')) {
        setFieldErrors((prev) => ({ ...prev, newClientPhone: t('validation.phoneAlreadyRegistered') }));
      } else {
        toast.error(msg);
      }
    } finally {
      setSavingClient(false);
    }
  };

  const filteredClients = clientSearch.trim()
    ? clients.filter(
        (c) =>
          c.name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
          c.phone?.includes(clientSearch) ||
          c.email?.toLowerCase().includes(clientSearch.toLowerCase()),
      )
    : clients;

  const openDetail = (booking: Booking) => {
    setSelectedBooking(booking);
    setDetailOpen(true);
  };

  const handleCreate = async () => {
    const errors: BookingFieldErrors = {};
    if (!form.clientName.trim()) errors.client = t('validation.required');
    if (!form.serviceId) errors.serviceId = t('validation.required');
    if (!form.date) errors.date = t('validation.required');
    if (!form.startTime) errors.startTime = t('validation.required');
    if (form.clientPhone && !/^\+?\d{8,15}$/.test(form.clientPhone.replace(/[\s()-]/g, ''))) {
      errors.clientPhone = t('validation.invalidPhone');
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setSubmitting(true);
    try {
      const svc = services.find((s) => s.id === form.serviceId);
      const endMinutes =
        parseInt(form.startTime.split(':')[0]) * 60 +
        parseInt(form.startTime.split(':')[1]) +
        (svc?.durationMinutes || 60);
      const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;

      await apiFetch('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          clientName: form.clientName,
          clientPhone: form.clientPhone,
          serviceId: form.serviceId,
          date: form.date,
          startTime: form.startTime,
          endTime,
          source: 'MANUAL',
          notes: form.notes,
          totalPrice: Number(svc?.price) || 0,
          currency: svc?.currency || 'BRL',
        }),
      });
      toast.success(t('proDashboard.agenda.createBooking'));
      setCreateOpen(false);
      fetchBookings();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await apiFetch(`/api/bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: status.toLowerCase() }),
      });
      toast.success(statusLabels(status));
      setDetailOpen(false);
      fetchBookings();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('errors.generic'));
    }
  };

  const dayLabel = viewMode === 'month'
    ? selectedDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
    : selectedDate.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // ====== Calendar Day View ======
  function CalendarDayView() {
    return (
      <div className="relative" style={{ height: TIMELINE_HOURS.length * HOUR_HEIGHT }}>
        {/* Hour lines */}
        {TIMELINE_HOURS.map((hour) => (
          <div
            key={hour}
            className="absolute left-0 right-0 border-t border-border/40"
            style={{ top: (hour - TIMELINE_START) * HOUR_HEIGHT }}
          >
            <span className="absolute -top-3 left-0 w-12 text-right text-xs text-muted-foreground pr-2">
              {String(hour).padStart(2, '0')}:00
            </span>
          </div>
        ))}
        {/* Half-hour lines */}
        {TIMELINE_HOURS.map((hour) => (
          <div
            key={`${hour}-30`}
            className="absolute left-14 right-0 border-t border-border/20 border-dashed"
            style={{ top: (hour - TIMELINE_START) * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
          />
        ))}

        {/* Current time indicator */}
        {isToday(selectedDate) && (
          <div
            className="absolute left-12 right-0 z-20 flex items-center"
            style={{ top: getCurrentTimeOffset() }}
          >
            <div className="h-3 w-3 rounded-full bg-brand-error" />
            <div className="h-0.5 flex-1 bg-brand-error" />
          </div>
        )}

        {/* Booking blocks */}
        <div className="absolute left-14 right-2 top-0 bottom-0">
          {bookings.map((b) => {
              const startMin = timeToMinutes(b.startTime);
              const endMin = timeToMinutes(b.endTime);
              const top = ((startMin - TIMELINE_START * 60) / 60) * HOUR_HEIGHT;
              const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 32);
              const isCancelled = b.status === 'CANCELLED';

              return (
                <button
                  key={b.id}
                  onClick={() => openDetail(b)}
                  className={`absolute left-1 right-1 rounded-lg border-l-4 px-3 py-1.5 text-left transition-all hover:shadow-md hover:z-10 overflow-hidden ${statusColors[b.status] || 'bg-gray-50 border-gray-300'} ${isCancelled ? 'opacity-50' : ''}`}
                  style={{ top, height, minHeight: 32 }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className={`truncate text-sm font-semibold ${isCancelled ? 'line-through' : ''}`}>
                      {b.user?.name || b.clientName || t('proDashboard.agenda.clientDefault')}
                    </p>
                    <span className="shrink-0 text-[10px] font-medium opacity-70">
                      {b.startTime}–{b.endTime}
                    </span>
                  </div>
                  {height > 40 && (
                    <p className={`truncate text-xs opacity-70 mt-0.5 ${isCancelled ? 'line-through' : ''}`}>
                      {b.service?.name || t('proDashboard.agenda.serviceDefault')}
                      {b.member ? ` • ${b.member.name}` : ''}
                    </p>
                  )}
                  {height > 60 && (
                    <p className={`text-xs font-medium mt-1 ${isCancelled ? 'line-through' : ''}`}>
                      R$ {Number(b.totalPrice).toFixed(2)}
                    </p>
                  )}
                </button>
              );
            })}
        </div>
      </div>
    );
  }

  // ====== Calendar Week View ======
  function CalendarWeekView() {
    const weekStart = getWeekStart(selectedDate);
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Day headers */}
          <div className="grid grid-cols-[50px_repeat(7,1fr)] border-b border-border sticky top-0 bg-background z-10">
            <div />
            {days.map((d) => {
              const dateStr = formatDate(d);
              const isSelected = dateStr === formatDate(selectedDate);
              const today = dateStr === formatDate(new Date());
              return (
                <button
                  key={dateStr}
                  onClick={() => { setSelectedDate(d); setViewMode('calendar'); }}
                  className={`py-3 text-center transition-colors ${isSelected ? 'bg-brand-rose/5' : 'hover:bg-muted/50'}`}
                >
                  <p className="text-xs text-muted-foreground">
                    {d.toLocaleDateString(locale, { weekday: 'short' })}
                  </p>
                  <p className={`text-lg font-bold mt-0.5 ${today ? 'text-brand-rose' : ''}`}>
                    {d.getDate()}
                  </p>
                  {(weekBookings[dateStr]?.length || 0) > 0 && (
                    <div className="mx-auto mt-1 flex items-center justify-center gap-0.5">
                      {weekBookings[dateStr].slice(0, 3).map((b) => (
                        <div key={b.id} className={`h-1.5 w-1.5 rounded-full ${statusBg[b.status] || 'bg-gray-400'}`} />
                      ))}
                      {(weekBookings[dateStr]?.length || 0) > 3 && (
                        <span className="text-[9px] text-muted-foreground ml-0.5">+{weekBookings[dateStr].length - 3}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Timeline grid */}
          <div className="relative" style={{ height: TIMELINE_HOURS.length * HOUR_HEIGHT }}>
            {/* Hour lines */}
            {TIMELINE_HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute left-0 right-0 border-t border-border/30"
                style={{ top: (hour - TIMELINE_START) * HOUR_HEIGHT }}
              >
                <span className="absolute -top-3 left-0 w-12 text-right text-xs text-muted-foreground pr-2">
                  {String(hour).padStart(2, '0')}:00
                </span>
              </div>
            ))}

            {/* Columns for each day */}
            <div className="absolute left-[50px] right-0 top-0 bottom-0 grid grid-cols-7">
              {days.map((d) => {
                const dateStr = formatDate(d);
                const dayBookings = weekBookings[dateStr] || [];

                return (
                  <div key={dateStr} className="relative border-l border-border/20">
                    {dayBookings.map((b) => {
                      const startMin = timeToMinutes(b.startTime);
                      const endMin = timeToMinutes(b.endTime);
                      const top = ((startMin - TIMELINE_START * 60) / 60) * HOUR_HEIGHT;
                      const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 24);
                      const isCancelled = b.status === 'CANCELLED';

                      return (
                        <button
                          key={b.id}
                          onClick={() => openDetail(b)}
                          className={`absolute left-0.5 right-0.5 rounded border-l-2 px-1 py-0.5 text-left text-[10px] leading-tight overflow-hidden transition-all hover:shadow hover:z-10 ${statusColors[b.status]} ${isCancelled ? 'opacity-50' : ''}`}
                          style={{ top, height, minHeight: 20 }}
                        >
                          <span className={`font-semibold truncate block ${isCancelled ? 'line-through' : ''}`}>
                            {b.user?.name || b.clientName || t('proDashboard.agenda.clientDefault')}
                          </span>
                          {height > 28 && (
                            <span className="opacity-70 truncate block">{b.startTime}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ====== Calendar Month View ======
  function CalendarMonthView() {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDow = firstDay.getDay(); // 0=Sun
    const totalDays = lastDay.getDate();

    // Build grid: fill leading blanks (Mon start), then days, then trailing blanks
    const mondayStart = startDow === 0 ? 6 : startDow - 1;
    const cells: (number | null)[] = [];
    for (let i = 0; i < mondayStart; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    const todayStr = formatDate(new Date());
    const selectedStr = formatDate(selectedDate);

    const weekDayLabels = [
      t('proDashboard.agenda.mon'), t('proDashboard.agenda.tue'), t('proDashboard.agenda.wed'),
      t('proDashboard.agenda.thu'), t('proDashboard.agenda.fri'), t('proDashboard.agenda.sat'),
      t('proDashboard.agenda.sun'),
    ];

    return (
      <div>
        {/* Week day headers */}
        <div className="grid grid-cols-7 border-b border-border mb-1">
          {weekDayLabels.map((wd) => (
            <div key={wd} className="py-2 text-center text-xs font-medium text-muted-foreground">
              {wd}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="min-h-[100px] border border-border/20 bg-muted/20" />;
            }

            const cellDate = new Date(year, month, day);
            const dateStr = formatDate(cellDate);
            const isToday2 = dateStr === todayStr;
            const isSelected2 = dateStr === selectedStr;
            const dayBookings = monthBookings[dateStr] || [];
            const confirmed = dayBookings.filter((b) => b.status === 'CONFIRMED').length;
            const pending = dayBookings.filter((b) => b.status === 'PENDING').length;
            const completed = dayBookings.filter((b) => b.status === 'COMPLETED').length;
            const cancelled = dayBookings.filter((b) => b.status === 'CANCELLED').length;

            return (
              <button
                key={dateStr}
                onClick={() => {
                  setSelectedDate(cellDate);
                  setViewMode('calendar');
                }}
                className={`min-h-[100px] border border-border/20 p-1.5 text-left transition-colors hover:bg-brand-rose/5 ${
                  isSelected2 ? 'bg-brand-rose/10 ring-1 ring-brand-rose' : ''
                } ${isToday2 ? 'bg-brand-gold/5' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                      isToday2
                        ? 'bg-brand-rose text-white'
                        : 'text-foreground'
                    }`}
                  >
                    {day}
                  </span>
                  {dayBookings.length > 0 && (
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      {dayBookings.length}
                    </span>
                  )}
                </div>

                {/* Booking indicators */}
                <div className="space-y-0.5">
                  {dayBookings.slice(0, 3).map((b) => (
                    <div
                      key={b.id}
                      className={`truncate rounded px-1 py-0.5 text-[10px] leading-tight ${
                        statusColors[b.status] || 'bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span className="font-medium">{b.startTime}</span>{' '}
                      {b.user?.name || b.clientName || t('proDashboard.agenda.clientDefault')}
                    </div>
                  ))}
                  {dayBookings.length > 3 && (
                    <p className="text-[10px] text-muted-foreground pl-1">
                      {t('proDashboard.agenda.more', { count: dayBookings.length - 3 })}
                    </p>
                  )}
                </div>

                {/* Status summary dots */}
                {dayBookings.length > 0 && (
                  <div className="mt-auto flex items-center gap-1 pt-1">
                    {confirmed > 0 && (
                      <span className="flex items-center gap-0.5 text-[9px] text-emerald-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {confirmed}
                      </span>
                    )}
                    {pending > 0 && (
                      <span className="flex items-center gap-0.5 text-[9px] text-yellow-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
                        {pending}
                      </span>
                    )}
                    {completed > 0 && (
                      <span className="flex items-center gap-0.5 text-[9px] text-gray-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                        {completed}
                      </span>
                    )}
                    {cancelled > 0 && (
                      <span className="flex items-center gap-0.5 text-[9px] text-red-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                        {cancelled}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ====== List View ======
  function ListView() {
    const HOURS_LIST = Array.from({ length: TIMELINE_END - TIMELINE_START }, (_, i) => `${String(i + TIMELINE_START).padStart(2, '0')}:00`);

    return (
      <>
        {bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <Clock className="h-12 w-12" />
            <p className="mt-4 text-sm">{t('proDashboard.agenda.noBookings')}</p>
            <Button className="mt-4" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {t('proDashboard.agenda.createBooking')}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {HOURS_LIST.map((hour) => {
              const hourBookings = bookings.filter((b) => b.startTime?.startsWith(hour.split(':')[0]));
              return (
                <div key={hour} className="flex gap-4 border-b border-border/50 py-2">
                  <span className="w-14 shrink-0 text-sm font-medium text-muted-foreground">
                    {hour}
                  </span>
                  <div className="flex flex-1 flex-col gap-1">
                    {hourBookings.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => openDetail(b)}
                        className="flex items-center justify-between rounded-lg bg-brand-rose/5 px-4 py-2 text-left transition-colors hover:bg-brand-rose/10"
                      >
                        <div>
                          <p className="font-medium text-sm">
                            {b.user?.name || b.clientName || t('proDashboard.agenda.clientDefault')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {b.service?.name || t('proDashboard.agenda.serviceDefault')} &bull; {b.startTime} - {b.endTime}
                          </p>
                        </div>
                        <Badge className={statusColors[b.status] || ''}>
                          {statusLabels(b.status)}
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </>
    );
  }

  function isToday(date: Date) {
    const today = new Date();
    return formatDate(date) === formatDate(today);
  }

  function getCurrentTimeOffset() {
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const offset = ((minutes - TIMELINE_START * 60) / 60) * HOUR_HEIGHT;
    return Math.max(0, Math.min(offset, (TIMELINE_END - TIMELINE_START) * HOUR_HEIGHT));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">{t('proDashboard.agenda.title')}</h1>
          <p className="text-sm text-muted-foreground capitalize">{dayLabel}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t('proDashboard.agenda.newBooking')}
        </Button>
      </div>

      {/* Navigation + View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (viewMode === 'month') {
                const d = new Date(selectedDate);
                d.setMonth(d.getMonth() - 1);
                setSelectedDate(d);
              } else {
                setSelectedDate(addDays(selectedDate, viewMode === 'week' ? -7 : -1));
              }
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setSelectedDate(new Date())}>
            {t('proDashboard.agenda.today')}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (viewMode === 'month') {
                const d = new Date(selectedDate);
                d.setMonth(d.getMonth() + 1);
                setSelectedDate(d);
              } else {
                setSelectedDate(addDays(selectedDate, viewMode === 'week' ? 7 : 1));
              }
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* View mode toggle */}
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${viewMode === 'list' ? 'bg-brand-rose text-white' : 'hover:bg-muted'}`}
          >
            <List className="h-4 w-4" />
            {t('proDashboard.agenda.list')}
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors border-r border-border ${viewMode === 'calendar' ? 'bg-brand-rose text-white' : 'hover:bg-muted'}`}
          >
            <Calendar className="h-4 w-4" />
            {t('proDashboard.agenda.day')}
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors border-r border-border ${viewMode === 'week' ? 'bg-brand-rose text-white' : 'hover:bg-muted'}`}
          >
            <LayoutGrid className="h-4 w-4" />
            {t('proDashboard.agenda.week')}
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${viewMode === 'month' ? 'bg-brand-rose text-white' : 'hover:bg-muted'}`}
          >
            <CalendarDays className="h-4 w-4" />
            {t('proDashboard.agenda.month')}
          </button>
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-brand-rose" />
            {viewMode === 'month'
              ? t('proDashboard.agenda.monthlyCalendar')
              : viewMode === 'week'
                ? t('proDashboard.agenda.week')
                : (
                  <span>
                    {t('proDashboard.agenda.appointments')} ({bookings.length})
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      — {selectedDate.toLocaleDateString(locale, { weekday: 'short', day: '2-digit', month: '2-digit' })}
                    </span>
                  </span>
                )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : viewMode === 'list' ? (
            <ListView />
          ) : viewMode === 'calendar' ? (
            <div ref={timelineScrollRef} className="overflow-y-auto max-h-[70vh]">
              <CalendarDayView />
            </div>
          ) : viewMode === 'month' ? (
            <CalendarMonthView />
          ) : (
            <div ref={timelineScrollRef} className="overflow-y-auto max-h-[70vh]">
              <CalendarWeekView />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Booking Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('proDashboard.agenda.newBooking')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }} noValidate className="space-y-4 py-4">
            {/* Client selector */}
            <div className="space-y-2">
              <Label>{t('proDashboard.agenda.client')} *</Label>
              {fieldErrors.client && !selectedClient && !newClientMode && <p className="text-xs text-brand-error">{fieldErrors.client}</p>}
              {selectedClient ? (
                <div className="flex items-center justify-between rounded-xl border border-input bg-background px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{selectedClient.name}</p>
                    {selectedClient.phone && (
                      <p className="text-xs text-muted-foreground">{selectedClient.phone}</p>
                    )}
                  </div>
                  <button onClick={clearClient} className="rounded-full p-1 hover:bg-muted">
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              ) : newClientMode ? (
                <div className="space-y-3 rounded-xl border border-input p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t('proDashboard.agenda.newClient')}</span>
                    <button onClick={() => setNewClientMode(false)} className="rounded-full p-1 hover:bg-muted">
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                  <div>
                    <Input
                      value={newClientForm.name}
                      onChange={(e) => { setNewClientForm((p) => ({ ...p, name: e.target.value })); clearFieldError('newClientName'); }}
                      placeholder={t('proDashboard.agenda.namePlaceholder')}
                      autoFocus
                      className={fieldErrors.newClientName ? 'border-brand-error' : ''}
                    />
                    {fieldErrors.newClientName && <p className="text-xs text-brand-error mt-1">{fieldErrors.newClientName}</p>}
                  </div>
                  <div>
                    <PhoneMaskedInput
                      value={newClientForm.phone}
                      onChange={(v) => { setNewClientForm((p) => ({ ...p, phone: v })); clearFieldError('newClientPhone'); }}
                      placeholder={t('proDashboard.agenda.phonePlaceholder')}
                      error={!!fieldErrors.newClientPhone}
                    />
                    {fieldErrors.newClientPhone && <p className="text-xs text-brand-error mt-1">{fieldErrors.newClientPhone}</p>}
                  </div>
                  <div>
                    <Input
                      value={newClientForm.email}
                      onChange={(e) => { setNewClientForm((p) => ({ ...p, email: e.target.value })); clearFieldError('newClientEmail'); }}
                      placeholder="Email"
                      className={fieldErrors.newClientEmail ? 'border-brand-error' : ''}
                    />
                    {fieldErrors.newClientEmail && <p className="text-xs text-brand-error mt-1">{fieldErrors.newClientEmail}</p>}
                  </div>
                  <Button size="sm" onClick={handleSaveNewClient} disabled={savingClient} className="w-full">
                    {savingClient ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                    {t('proDashboard.agenda.registerAndSelect')}
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={clientSearch}
                      onChange={(e) => { setClientSearch(e.target.value); setShowClientDropdown(true); }}
                      onFocus={() => setShowClientDropdown(true)}
                      placeholder={t('proDashboard.agenda.searchClient')}
                      className="pl-9"
                    />
                  </div>
                  {showClientDropdown && (
                    <div className="absolute z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border bg-popover shadow-md">
                      {/* New client option */}
                      <button
                        onClick={() => { setShowClientDropdown(false); setNewClientMode(true); }}
                        className="flex w-full items-center gap-2 border-b px-3 py-2.5 text-sm text-brand-rose hover:bg-muted transition-colors"
                      >
                        <UserPlus className="h-4 w-4" />
                        {t('proDashboard.agenda.newClient')}
                      </button>
                      {filteredClients.length === 0 ? (
                        <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                          {t('common.noResults')}
                        </div>
                      ) : (
                        filteredClients.slice(0, 20).map((c) => (
                          <button
                            key={c.id}
                            onClick={() => selectClient(c)}
                            className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                          >
                            <div>
                              <p className="font-medium">{c.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {[c.phone, c.email].filter(Boolean).join(' • ') || t('proDashboard.clients.noContact')}
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>{t('proDashboard.agenda.service')} *</Label>
              <Select value={form.serviceId} onValueChange={(v) => { setForm((p) => ({ ...p, serviceId: v })); clearFieldError('serviceId'); }}>
                <SelectTrigger className={fieldErrors.serviceId ? 'border-brand-error' : ''}><SelectValue placeholder={t('proDashboard.agenda.selectService')} /></SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name} — R$ {s.price}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.serviceId && <p className="text-xs text-brand-error">{fieldErrors.serviceId}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('proDashboard.agenda.date')} *</Label>
                <DatePicker
                  value={form.date}
                  onChange={(v) => { setForm((p) => ({ ...p, date: v })); clearFieldError('date'); }}
                  minDate={new Date()}
                  locale={locale}
                  placeholder={t('proDashboard.agenda.date')}
                  error={!!fieldErrors.date}
                />
                {fieldErrors.date && <p className="text-xs text-brand-error">{fieldErrors.date}</p>}
              </div>
              <div className="space-y-2">
                <Label>{t('proDashboard.agenda.time')} *</Label>
                <TimePicker
                  value={form.startTime}
                  onChange={(v) => { setForm((p) => ({ ...p, startTime: v })); clearFieldError('startTime'); }}
                  minTime={form.date === formatDate(new Date()) ? `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}` : undefined}
                  placeholder={t('proDashboard.agenda.time')}
                  error={!!fieldErrors.startTime}
                />
                {fieldErrors.startTime && <p className="text-xs text-brand-error">{fieldErrors.startTime}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('proDashboard.agenda.notes')}</Label>
              <Textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder={t('proDashboard.agenda.notes')} />
            </div>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Booking Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('proDashboard.agenda.bookingDetails')}</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">{t('proDashboard.agenda.client')}</p>
                  <p className="font-medium">{selectedBooking.user?.name || selectedBooking.clientName || '—'}</p>
                  {(selectedBooking.user?.phone || selectedBooking.clientPhone) && (
                    <p className="text-xs text-muted-foreground">{selectedBooking.user?.phone || selectedBooking.clientPhone}</p>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground">{t('proDashboard.agenda.service')}</p>
                  <p className="font-medium">{selectedBooking.service?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('proDashboard.agenda.time')}</p>
                  <p className="font-medium">{selectedBooking.startTime} - {selectedBooking.endTime}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('booking.price')}</p>
                  <p className="font-medium">R$ {Number(selectedBooking.totalPrice).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('booking.status')}</p>
                  <Badge className={statusColors[selectedBooking.status] || ''}>
                    {statusLabels(selectedBooking.status)}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('booking.source')}</p>
                  <p className="font-medium">{selectedBooking.source === 'APP' ? t('booking.sourceApp') : selectedBooking.source === 'MANUAL' ? t('booking.sourceManual') : selectedBooking.source === 'WALK_IN' ? t('booking.sourceWalkIn') : selectedBooking.source}</p>
                </div>
              </div>
              {selectedBooking.notes && (
                <div className="text-sm">
                  <p className="text-muted-foreground">{t('proDashboard.agenda.notes')}</p>
                  <p>{selectedBooking.notes}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-2 border-t pt-4">
                {selectedBooking.status === 'PENDING' && (
                  <Button size="sm" onClick={() => updateStatus(selectedBooking.id, 'CONFIRMED')}>{t('booking.confirmed')}</Button>
                )}
                {(selectedBooking.status === 'PENDING' || selectedBooking.status === 'CONFIRMED') && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => updateStatus(selectedBooking.id, 'COMPLETED')}>{t('booking.completed')}</Button>
                    <Button size="sm" variant="outline" onClick={() => updateStatus(selectedBooking.id, 'CANCELLED')}>{t('booking.cancelled')}</Button>
                    <Button size="sm" variant="outline" onClick={() => updateStatus(selectedBooking.id, 'NO_SHOW')}>{t('booking.noShow')}</Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
