'use client';

import * as React from 'react';
import { useIMask } from 'react-imask';
import { cn } from '@/lib/utils';

interface MaskedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  mask: string;
  onChange: (value: string) => void;
  value: string;
  error?: boolean;
}

export function MaskedInput({
  mask,
  onChange,
  value,
  error,
  className,
  ...props
}: MaskedInputProps) {
  const { ref } = useIMask(
    { mask },
    {
      onAccept: (val) => onChange(val),
    },
  );

  // Sync external value
  React.useEffect(() => {
    const input = ref.current as HTMLInputElement | null;
    if (input && input.value !== value) {
      input.value = value;
    }
  }, [value, ref]);

  return (
    <input
      ref={ref as React.Ref<HTMLInputElement>}
      defaultValue={value}
      className={cn(
        'flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        error ? 'border-brand-error' : 'border-input',
        className,
      )}
      {...props}
    />
  );
}

// Pre-configured phone mask for Brazilian numbers
export function PhoneMaskedInput({
  onChange,
  value,
  error,
  className,
  ...props
}: Omit<MaskedInputProps, 'mask'>) {
  const { ref } = useIMask(
    {
      mask: [
        { mask: '(00) 0000-0000' },
        { mask: '(00) 00000-0000' },
      ],
    },
    {
      onAccept: (val) => onChange(val),
    },
  );

  React.useEffect(() => {
    const input = ref.current as HTMLInputElement | null;
    if (input && input.value !== value) {
      input.value = value;
    }
  }, [value, ref]);

  return (
    <input
      ref={ref as React.Ref<HTMLInputElement>}
      defaultValue={value}
      className={cn(
        'flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        error ? 'border-brand-error' : 'border-input',
        className,
      )}
      {...props}
    />
  );
}
