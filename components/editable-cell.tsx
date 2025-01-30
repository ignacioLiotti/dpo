import React, { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface EditableCellProps {
  value: string
  onChange: (newVal: string) => void
  className?: string
  onClick?: () => void
  /**
   * Optional: Use this if you want to display something else in read mode
   * (e.g., highlighted text) instead of the raw value.
   */
  displayValue?: React.ReactNode
}


export const EditableCell: React.FC<EditableCellProps> = ({
  value,
  onChange,
  displayValue,  // new optional prop
  className,
  onClick,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  const handleDoubleClick = () => {
    setIsEditing(true)
  }

  const handleBlur = () => {
    setIsEditing(false)
    onChange(editValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(false)
      onChange(editValue)
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      setEditValue(value) // revert changes
    }
  }

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={editValue}
        className={cn("border border-gray-300 rounded px-2 py-1 w-full h-full", className)}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
    )
  }

  /**
   * If a "displayValue" is provided, we render that in read-mode.
   * Otherwise, render the original "value".
   */
  return (
    <div
      className={cn("h-9 flex justify-start items-center", className)}
      onClick={onClick}
      onDoubleClick={handleDoubleClick} >
      {displayValue !== undefined ? displayValue : value}
    </div>
  )
}
