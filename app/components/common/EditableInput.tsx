import React, { useState, useEffect, useRef } from 'react';
import { cn } from "@/lib/utils";
import { EditableCellProps } from '@/lib/types/common';

export function EditableInput({
  value: initialValue,
  onChange,
  suffix = "",
  prefix = "",
  originalValue,
  highlightChanges = false,
}: EditableCellProps) {
  const [value, setValue] = useState(String(initialValue));
  const originalValueRef = useRef(originalValue);
  const hasChanged = originalValueRef.current !== undefined && String(originalValueRef.current) !== String(initialValue);
  const shouldHighlight = highlightChanges && hasChanged;
  const hiddenSpanRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(String(initialValue));
  }, [initialValue]);

  const handleBlur = () => {
    onChange(value);
  };

  return (
    <div className={cn(
      "flex items-center justify-center gap-1 h-full flex-grow relative group",
      shouldHighlight && "bg-yellow-100"
    )}>
      {prefix && <span className="text-sm text-gray-700">{prefix}</span>}
      <div className="relative">
        <input
          ref={inputRef}
          className={cn(
            "border-b border-transparent group-hover:border-gray-300 group-focus:border-gray-300",
            "focus:outline-none bg-transparent text-right focus-within:border-gray-300 w-[20px] min-w-0"
          )}
          value={value}
          style={{ width: hiddenSpanRef.current ? `${hiddenSpanRef.current.offsetWidth + 4}px` : 'auto' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
            }
          }}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
        />
        <span
          ref={hiddenSpanRef}
          className="invisible absolute top-0 left-0 whitespace-pre"
          style={{
            font: 'inherit',
            position: 'absolute',
            padding: '0',
            border: '0',
            whiteSpace: 'pre'
          }}
        >
          {value}
        </span>
      </div>
      {suffix && <span className="text-sm text-gray-700">{suffix}</span>}
      {shouldHighlight && (
        <div className="absolute invisible group-hover:visible bg-black text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
          Original: {originalValueRef.current}
        </div>
      )}
    </div>
  );
} 