'use client';

import * as React from 'react';
import { format, isBefore, startOfDay, type Locale } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

const localeMap: Record<string, Locale> = {
  'pt-BR': ptBR,
  en: enUS,
  'es-ES': es,
};

interface DatePickerProps {
  value?: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  minDate?: Date;
  disabled?: boolean;
  placeholder?: string;
  locale?: string;
  className?: string;
  error?: boolean;
}

export function DatePicker({
  value,
  onChange,
  minDate,
  disabled,
  placeholder = 'Selecionar data',
  locale = 'pt-BR',
  className,
  error,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const dateFnsLocale = localeMap[locale] || ptBR;

  const selectedDate = value ? new Date(value + 'T00:00:00') : null;
  const [viewMonth, setViewMonth] = React.useState(
    selectedDate || new Date()
  );

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

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const mondayStart = startDow === 0 ? 6 : startDow - 1;
  const cells: (number | null)[] = [];
  for (let i = 0; i < mondayStart; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  const handleSelect = (day: number) => {
    const d = new Date(year, month, day);
    if (minDate && isBefore(d, startOfDay(minDate))) return;
    onChange(format(d, 'yyyy-MM-dd'));
    setOpen(false);
  };

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
        <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
        {selectedDate ? (
          <span>{format(selectedDate, 'dd/MM/yyyy')}</span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-[300px] rounded-xl border bg-popover p-3 shadow-lg animate-in fade-in-0 zoom-in-95">
          {/* Month/year header */}
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMonth(new Date(year, month - 1, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold capitalize">
              {format(viewMonth, 'MMMM yyyy', { locale: dateFnsLocale })}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMonth(new Date(year, month + 1, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {weekDays.map((wd) => (
              <div key={wd} className="text-center text-[11px] font-medium text-muted-foreground py-1">
                {wd}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {cells.map((day, idx) => {
              if (day === null) {
                return <div key={`e-${idx}`} className="h-9" />;
              }

              const cellDate = new Date(year, month, day);
              const dateStr = format(cellDate, 'yyyy-MM-dd');
              const isToday = dateStr === todayStr;
              const isSelected = value === dateStr;
              const isPast = minDate && isBefore(cellDate, startOfDay(minDate));

              return (
                <button
                  key={dateStr}
                  type="button"
                  disabled={!!isPast}
                  onClick={() => handleSelect(day)}
                  className={cn(
                    'h-9 w-full rounded-lg text-sm transition-colors',
                    isPast && 'text-muted-foreground/30 cursor-not-allowed',
                    !isPast && !isSelected && 'hover:bg-brand-rose/10',
                    isToday && !isSelected && 'font-bold text-brand-rose',
                    isSelected && 'bg-brand-rose text-white font-semibold',
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
