'use client';

import * as React from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimePickerProps {
  value?: string; // HH:mm
  onChange: (time: string) => void;
  minTime?: string; // HH:mm — slots before this are disabled
  interval?: number; // minutes between slots (default 30)
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  error?: boolean;
}

function generateTimeSlots(interval: number): string[] {
  const slots: string[] = [];
  for (let m = 0; m < 24 * 60; m += interval) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
  }
  return slots;
}

export function TimePicker({
  value,
  onChange,
  minTime,
  interval = 30,
  disabled,
  placeholder = 'Selecionar hora',
  className,
  error,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const slots = React.useMemo(() => generateTimeSlots(interval), [interval]);

  // Close on click outside
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Scroll to selected/current time when opening
  React.useEffect(() => {
    if (open && listRef.current) {
      const target = value || `${String(new Date().getHours()).padStart(2, '0')}:00`;
      const idx = slots.findIndex((s) => s >= target);
      if (idx > 0) {
        const itemHeight = 36;
        listRef.current.scrollTop = Math.max(0, (idx - 2) * itemHeight);
      }
    }
  }, [open, value, slots]);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={cn(
          'flex h-10 w-full items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm transition-colors hover:border-brand-rose/50',
          error ? 'border-brand-error' : 'border-input',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
        {value ? (
          <span>{value}</span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border bg-popover shadow-lg animate-in fade-in-0 zoom-in-95">
          <div ref={listRef} className="max-h-[240px] overflow-y-auto p-1">
            {slots.map((slot) => {
              const isDisabled = minTime ? slot < minTime : false;
              const isSelected = value === slot;

              return (
                <button
                  key={slot}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => {
                    onChange(slot);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center justify-center rounded-lg py-2 text-sm transition-colors',
                    isDisabled && 'text-muted-foreground/30 cursor-not-allowed',
                    !isDisabled && !isSelected && 'hover:bg-brand-rose/10',
                    isSelected && 'bg-brand-rose text-white font-semibold',
                  )}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
