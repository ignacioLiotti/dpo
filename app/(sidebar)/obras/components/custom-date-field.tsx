import React, { useState, useEffect, ChangeEvent } from 'react';
import { format as formatDateFn, parse as parseDateFn, isValid as isValidDate } from 'date-fns';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import type { FieldApi } from '@tanstack/react-form';
import { cn } from '@/utils/utils';

interface CustomDateFieldProps<
  TFormValues extends Record<string, any>,
  TFieldName extends keyof TFormValues & string
> {
  field: FieldApi<TFormValues, TFieldName, any, any, TFormValues[TFieldName]>;
  label: string;
  disabled?: boolean;
  placeholder?: string;
  value?: Date;
  emptyValue?: string;
  className?: string;
}

export function CustomDateField<
  TFormValues extends Record<string, any>,
  TFieldName extends keyof TFormValues & string
>({
  field,
  label,
  disabled,
  placeholder = 'DD/MM/YYYY',
  value = new Date(),
  emptyValue = '',
  className = '',
}: CustomDateFieldProps<TFormValues, TFieldName>) {
  const [inputValue, setInputValue] = useState(formatDateFn(new Date(), 'dd/MM/yyyy'));
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    const fieldValue = field.state.value as unknown;
    if (fieldValue instanceof Date && isValidDate(fieldValue)) {
      setInputValue(formatDateFn(fieldValue, 'dd/MM/yyyy'));
    } else if (typeof fieldValue === 'string') {
      const parsedFromString = parseDateFn(fieldValue, 'dd/MM/yyyy', new Date());
      if (isValidDate(parsedFromString)) {
        setInputValue(formatDateFn(parsedFromString, 'dd/MM/yyyy'));
      } else {
        setInputValue(value ? formatDateFn(value, 'dd/MM/yyyy') : emptyValue);
      }
    } else {
      setInputValue(value ? formatDateFn(value, 'dd/MM/yyyy') : emptyValue);
    }
  }, [field.state.value]);

  const parseAndValidateInput = (value: string): Date | null => {
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      return null;
    }
    const parsedDate = parseDateFn(value, 'dd/MM/yyyy', new Date());
    return isValidDate(parsedDate) ? parsedDate : null;
  };

  const handleDateInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
    let formatted = digits.slice(0, 2);
    if (digits.length > 2) {
      formatted += '/' + digits.slice(2, 4);
    }
    if (digits.length > 4) {
      formatted += '/' + digits.slice(4, 8);
    }
    setInputValue(formatted);

    if (digits.length === 8) {
      const parsed = parseAndValidateInput(formatted);
      field.handleChange(parsed as TFormValues[TFieldName]);
    } else if (formatted === '' && field.state.value !== null) {
      field.handleChange(null as TFormValues[TFieldName]);
    }
  };

  const handleDateInputBlur = () => {
    const parsed = parseAndValidateInput(inputValue);
    if (parsed) {
      field.handleChange(parsed as TFormValues[TFieldName]);
      setInputValue(formatDateFn(parsed, 'dd/MM/yyyy'));
    } else {
      if (inputValue !== '') {
        field.handleChange(null as TFormValues[TFieldName]);
        setInputValue('');
      }
    }
    field.handleBlur();
  };

  const handleCalendarSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      field.handleChange(selectedDate as TFormValues[TFieldName]);
      setInputValue(formatDateFn(selectedDate, 'dd/MM/yyyy'));
    } else {
      field.handleChange(null as TFormValues[TFieldName]);
      setInputValue('');
    }
    setIsCalendarOpen(false);
  };

  const hasError = field.state.meta.touchedErrors && field.state.meta.touchedErrors.length > 0;
  const fieldValueAsDate = field.state.value instanceof Date && isValidDate(field.state.value) ? field.state.value : undefined;

  return (
    <div className={cn("flex font-mono h-5", className)}>
      <Label htmlFor={field.name} className={cn('text-xs text-primary/80 flex min-w-max items-center', hasError ? 'text-destructive' : '')}>
        {label}:
      </Label>
      <div
        className={cn('flex-grow group flex items-center gap-2 border rounded-none border-none group transition-all duration-200 ease-spring max-w-40', hasError ? 'border-destructive focus-visible:ring-destructive' : '', inputValue === '' ? 'bg-dashedInput max-w-full hover:max-w-40 focus-within:bg-none hover:bg-none hover:text-primary text-transparent' : 'bg - transparent text - primary')}
      >
        <Input
          id={field.name}
          name={field.name}
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleDateInputChange}
          onBlur={handleDateInputBlur}
          disabled={disabled}
          className='border-none shadow-none outline-none outline-0 bg-transparent pt-0 h-4'
          inputDirectClassName={cn(inputValue === '' ? 'placeholder:text-transparent group-hover:placeholder:text-muted-foreground' : 'text-primary')}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${field.name}-error` : undefined}
          maxLength={10}
        />
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant={"ghost"}
              className={cn(
                "h-5 w-10 p-0 font-normal items-center gap-1 rounded-xl border-none px-1.5 py-0.5 text-xs text-muted-foreground group-hover:opacity-100 opacity-0 transition-opacity duration-300 ease-spring flex bg-containerBackground/80 outline outline-outline outline-1 shadow",
                !field.state.value && "text-muted-foreground"
              )}
              disabled={disabled}
              onClick={() => setIsCalendarOpen((prev) => !prev)}
            >
              <span className="sr-only">Abrir calendario</span>
              <CalendarIcon className="!size-[14px]" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 pointer-events-auto" align="end">
            <Calendar
              mode="single"
              selected={fieldValueAsDate}
              onSelect={handleCalendarSelect}
              disabled={disabled}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      {
        hasError && (
          <p id={`${field.name}-error`} className="text-sm text-destructive">
            {field.state.meta.touchedErrors!.join(', ')}
          </p>
        )
      }
    </div >
  );
} 