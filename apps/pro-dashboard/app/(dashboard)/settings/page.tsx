'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, Settings, MapPin } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { useTranslation } from '@/lib/i18n';
import { TimePicker } from '@/components/ui/time-picker';

interface AddressSuggestion {
  displayName: string;
  latitude: number;
  longitude: number;
}

interface WorkingHour {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isOff: boolean;
}

const DAY_KEYS = [
  'proDashboard.settings.sunday',
  'proDashboard.settings.monday',
  'proDashboard.settings.tuesday',
  'proDashboard.settings.wednesday',
  'proDashboard.settings.thursday',
  'proDashboard.settings.friday',
  'proDashboard.settings.saturday',
];

interface ProfileFieldErrors {
  businessName?: string;
  address?: string;
  taxId?: string;
}

interface HoursFieldErrors {
  [dayOfWeek: number]: { startTime?: string; endTime?: string };
}

function validateProfileForm(
  profile: { businessName: string; address: string; taxId: string },
  t: (key: string) => string,
): ProfileFieldErrors {
  const errors: ProfileFieldErrors = {};
  if (!profile.businessName.trim()) errors.businessName = t('validation.required');
  if (!profile.address.trim()) errors.address = t('validation.required');
  if (!profile.taxId.trim()) errors.taxId = t('validation.required');
  return errors;
}

function validateHoursForm(
  hours: WorkingHour[],
  t: (key: string) => string,
): HoursFieldErrors {
  const errors: HoursFieldErrors = {};
  hours.forEach((h) => {
    if (!h.isOff) {
      const dayErrors: { startTime?: string; endTime?: string } = {};
      if (!h.startTime) dayErrors.startTime = t('validation.required');
      if (!h.endTime) dayErrors.endTime = t('validation.required');
      if (h.startTime && h.endTime && h.startTime >= h.endTime) {
        dayErrors.endTime = t('validation.dateEndAfterStart');
      }
      if (Object.keys(dayErrors).length > 0) errors[h.dayOfWeek] = dayErrors;
    }
  });
  return errors;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileErrors, setProfileErrors] = useState<ProfileFieldErrors>({});
  const [hoursErrors, setHoursErrors] = useState<HoursFieldErrors>({});
  const toast = useToast();
  const { t } = useTranslation();

  const clearProfileError = (field: keyof ProfileFieldErrors) => {
    setProfileErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  };

  const clearHourError = (dayOfWeek: number) => {
    setHoursErrors((prev) => { const next = { ...prev }; delete next[dayOfWeek]; return next; });
  };

  const [profile, setProfile] = useState({
    businessName: '',
    description: '',
    address: '',
    taxId: '',
  });
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const addressTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [hours, setHours] = useState<WorkingHour[]>(
    DAY_KEYS.map((_, i) => ({
      dayOfWeek: i,
      startTime: i === 0 ? '' : '09:00',
      endTime: i === 0 ? '' : '18:00',
      isOff: i === 0,
    }))
  );

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    let professionalId: string | null = null;
    try {
      const res = await apiFetch<{ data: { id: string; businessName: string; description?: string; address: string; taxId: string } }>('/api/professionals/me');
      const p = res.data;
      if (p) {
        professionalId = p.id;
        setProfile({
          businessName: p.businessName || '',
          description: p.description || '',
          address: p.address || '',
          taxId: p.taxId || '',
        });
      }
    } catch {
      // ignore
    }

    if (professionalId) {
      try {
        const res = await apiFetch<{ data: WorkingHour[] }>(`/api/working-hours?professionalId=${professionalId}`);
        if (res.data?.length) {
          const merged = DAY_KEYS.map((_, i) => {
            const existing = res.data.find((h: WorkingHour) => h.dayOfWeek === i);
            return existing || { dayOfWeek: i, startTime: '', endTime: '', isOff: true };
          });
          setHours(merged);
        }
      } catch {
        // ignore
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleAddressChange = (value: string) => {
    setProfile((p) => ({ ...p, address: value }));
    clearProfileError('address');
    setSelectedCoords(null);
    if (addressTimeoutRef.current) clearTimeout(addressTimeoutRef.current);
    if (value.length < 3) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    addressTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await apiFetch<{ data: AddressSuggestion[] }>(`/api/geocoding/search?q=${encodeURIComponent(value)}`);
        setAddressSuggestions(res.data || []);
        setShowSuggestions(true);
      } catch {
        setAddressSuggestions([]);
      }
    }, 500);
  };

  const handleSelectAddress = (suggestion: AddressSuggestion) => {
    setProfile((p) => ({ ...p, address: suggestion.displayName }));
    setSelectedCoords({ lat: suggestion.latitude, lng: suggestion.longitude });
    setShowSuggestions(false);
    setAddressSuggestions([]);
    clearProfileError('address');
  };

  const handleSaveProfile = async () => {
    const errors = validateProfileForm(profile, t);
    setProfileErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setSaving(true);
    try {
      await apiFetch('/api/professionals/me', {
        method: 'PATCH',
        body: JSON.stringify(profile),
      });
      toast.success(t('proDashboard.settings.saveProfile'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHours = async () => {
    const errors = validateHoursForm(hours, t);
    setHoursErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setSaving(true);
    try {
      await apiFetch('/api/working-hours', {
        method: 'PUT',
        body: JSON.stringify({ hours }),
      });
      toast.success(t('proDashboard.settings.saveHours'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const updateHour = (dayOfWeek: number, field: keyof WorkingHour, value: string | boolean) => {
    setHours((prev) =>
      prev.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h))
    );
    clearHourError(dayOfWeek);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">{t('proDashboard.settings.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('proDashboard.settings.businessProfile')}</p>
      </div>

      {/* Business Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-brand-rose" />
            {t('proDashboard.settings.businessProfile')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }} noValidate className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('proDashboard.settings.businessName')} *</Label>
                <Input value={profile.businessName} onChange={(e) => { setProfile((p) => ({ ...p, businessName: e.target.value })); clearProfileError('businessName'); }} className={profileErrors.businessName ? 'border-brand-error' : ''} />
                {profileErrors.businessName && <p className="text-xs text-brand-error">{profileErrors.businessName}</p>}
              </div>
              <div className="space-y-2">
                <Label>{t('proDashboard.settings.taxId')} *</Label>
                <Input value={profile.taxId} onChange={(e) => { setProfile((p) => ({ ...p, taxId: e.target.value })); clearProfileError('taxId'); }} className={profileErrors.taxId ? 'border-brand-error' : ''} />
                {profileErrors.taxId && <p className="text-xs text-brand-error">{profileErrors.taxId}</p>}
              </div>
            </div>
            <div className="space-y-2 relative">
              <Label className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {t('proDashboard.settings.address')} *
              </Label>
              <Input
                value={profile.address}
                onChange={(e) => handleAddressChange(e.target.value)}
                onFocus={() => addressSuggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder={t('proDashboard.settings.addressPlaceholder') || 'Digite o endereço...'}
                className={profileErrors.address ? 'border-brand-error' : ''}
              />
              {showSuggestions && addressSuggestions.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {addressSuggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      className="w-full text-left px-4 py-3 text-sm hover:bg-brand-cream/50 border-b last:border-b-0 flex items-start gap-2"
                      onMouseDown={() => handleSelectAddress(s)}
                    >
                      <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-brand-rose" />
                      <span>{s.displayName}</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedCoords && (
                <p className="text-xs text-muted-foreground">
                  📍 {selectedCoords.lat.toFixed(6)}, {selectedCoords.lng.toFixed(6)}
                </p>
              )}
              {profileErrors.address && <p className="text-xs text-brand-error">{profileErrors.address}</p>}
            </div>
            <div className="space-y-2">
              <Label>{t('proDashboard.settings.description')}</Label>
              <Textarea value={profile.description} onChange={(e) => setProfile((p) => ({ ...p, description: e.target.value }))} rows={4} placeholder={t('proDashboard.settings.description')} />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {t('proDashboard.settings.saveProfile')}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Working Hours */}
      <Card>
        <CardHeader>
          <CardTitle>{t('proDashboard.settings.workingHours')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form onSubmit={(e) => { e.preventDefault(); handleSaveHours(); }} noValidate className="space-y-3">
            {hours.map((h) => (
              <div key={h.dayOfWeek}>
                <div className="flex items-center gap-4">
                  <span className="w-24 text-sm font-medium">{t(DAY_KEYS[h.dayOfWeek])}</span>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={h.isOff}
                      onChange={(e) => updateHour(h.dayOfWeek, 'isOff', e.target.checked)}
                    />
                    <span className="text-sm text-muted-foreground">{t('proDashboard.settings.dayOff')}</span>
                  </label>
                  {!h.isOff && (
                    <>
                      <div className="space-y-1">
                        <TimePicker
                          value={h.startTime}
                          onChange={(v) => updateHour(h.dayOfWeek, 'startTime', v)}
                          interval={30}
                          error={!!hoursErrors[h.dayOfWeek]?.startTime}
                          className="w-36"
                        />
                        {hoursErrors[h.dayOfWeek]?.startTime && <p className="text-xs text-brand-error">{hoursErrors[h.dayOfWeek].startTime}</p>}
                      </div>
                      <span className="text-muted-foreground">—</span>
                      <div className="space-y-1">
                        <TimePicker
                          value={h.endTime}
                          onChange={(v) => updateHour(h.dayOfWeek, 'endTime', v)}
                          interval={30}
                          minTime={h.startTime}
                          error={!!hoursErrors[h.dayOfWeek]?.endTime}
                          className="w-36"
                        />
                        {hoursErrors[h.dayOfWeek]?.endTime && <p className="text-xs text-brand-error">{hoursErrors[h.dayOfWeek].endTime}</p>}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
            <Button type="submit" disabled={saving} className="mt-4">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {t('proDashboard.settings.saveHours')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
