import React, { useState, useEffect } from 'react';
import { isValid as isValidDate, addDays } from 'date-fns';
// import { es } from 'date-fns/locale'; // Uncomment if Spanish month names etc. are needed in formatting (not used in dd/MM/yyyy)

import { Label } from '@/components/ui/label';
import type { FieldApi } from '@tanstack/react-form';
import { cn } from '@/utils/utils';
import { CustomInput } from '@/components/ui/custom-input';
import { CustomDateField } from './custom-date-field'; // +Import CustomDateField

interface CustomDateFieldWithDurationProps<
  TFormValues extends Record<string, any>,
  TStartDateFieldName extends keyof TFormValues & string,
  TEndDateFieldName extends keyof TFormValues & string
> {
  form: {
    setFieldValue: (name: keyof TFormValues, value: any) => void;
    // getFieldValue?: (name: keyof TFormValues) => any; // Optional: if needed for clearing end date logic
  };
  startDateField: FieldApi<any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any>;
  endDateFieldName: TEndDateFieldName;
  label: string;
  disabled?: boolean;
}

export function CustomDateFieldWithDuration<
  TFormValues extends Record<string, any>,
  TStartDateFieldName extends keyof TFormValues & string,
  TEndDateFieldName extends keyof TFormValues & string
>({
  form,
  startDateField,
  endDateFieldName,
  label,
  disabled,
}: CustomDateFieldWithDurationProps<TFormValues, TStartDateFieldName, TEndDateFieldName>) {
  const [durationValue, setDurationValue] = useState(''); // Keep for the number input

  // Effect to update end date when start date or duration changes
  useEffect(() => {
    const currentStartDate = startDateField.state.value as unknown;
    const days = parseInt(durationValue, 10);

    if (
      !isNaN(days) &&
      days > 0 &&
      currentStartDate instanceof Date &&
      isValidDate(currentStartDate)
    ) {
      const newEndDate = addDays(currentStartDate, days);
      form.setFieldValue(endDateFieldName, newEndDate);
    }
    // Optional: else if form.getFieldValue(endDateFieldName) !== null { form.setFieldValue(endDateFieldName, null); }
    // This depends on whether you want to clear the end date if start/duration is invalid.
  }, [startDateField.state.value, durationValue, form, endDateFieldName]);


  const handleDurationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDuration = e.target.value.replace(/[^\d]/g, '');
    setDurationValue(newDuration);

    // The useEffect above will handle updating the end date,
    // so direct update here is redundant if we rely on the effect.
    // However, to make it more immediate for this specific interaction, we can keep it,
    // or ensure the effect correctly captures this change.
    // For simplicity, let the effect handle it to avoid duplicate logic.
    // const days = parseInt(newDuration, 10);
    // const currentStartDate = startDateField.state.value as unknown;
    // if (!isNaN(days) && days > 0 && currentStartDate instanceof Date && isValidDate(currentStartDate)) {
    //   const newEndDate = addDays(currentStartDate, days);
    //   form.setFieldValue(endDateFieldName, newEndDate);
    // }
  };

  // startDateField errors and value display are handled by CustomDateField
  const isStartDateSet = startDateField.state.value instanceof Date && isValidDate(startDateField.state.value);

  return (
    <div className="flex flex-col sm:items-start gap-2">
      <CustomDateField
        field={startDateField}
        label={label} // Pass the label to CustomDateField
        disabled={disabled}
      // Placeholder will default to current date in CustomDateField
      />

      {/* Duration input section */}
      <div className={cn("w-full sm:w-auto sm:min-w-[120px] pl-0 sm:pl-6", !isStartDateSet ? "hidden" : "")}>
        <Label htmlFor={`${startDateField.name}-duration`} className="text-xs text-muted-foreground mb-1 block">
          Duración en días (opcional)
        </Label>
        <CustomInput
          id={`${startDateField.name}-duration`}
          type="number"
          variant="show-empty"
          value={durationValue}
          onChange={handleDurationInputChange}
          disabled={disabled || !isStartDateSet}
          className="w-full"
          min="0"
        />
      </div>
    </div>
  );
} 