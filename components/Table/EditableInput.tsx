import { cn } from '@/lib/utils'
import React from 'react'

interface EditableInputProps {
  value: string | number
  onChange: (val: string) => void
  suffix?: string
  prefix?: string
  className?: string
  editable?: boolean
}

export function EditableInput({
  value: initialValue,
  onChange,
  suffix = "",
  prefix = "",
  editable = true,
  className = "",
}: EditableInputProps) {
  const [value, setValue] = React.useState(String(initialValue))

  React.useEffect(() => {
    setValue(String(initialValue))
  }, [initialValue])

  const handleBlur = () => {
    onChange(value)
  }

  if (!editable) return <span className="text-sm text-gray-700">{value}</span>

  return (
    <div className="flex items-center justify-center gap-1">
      {prefix && <span className="text-sm text-gray-700">{prefix}</span>}
      <input
        className={cn("border-b border-transparent group-hover:border-gray-300 group-focus:border-gray-300 focus:outline-none bg-transparent w-[50px] text-right focus-within:border-gray-300", className)}
        value={value}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
          }
        }}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
      />
      {suffix && <span className="text-sm text-gray-700">{suffix}</span>}
    </div>
  )
} 