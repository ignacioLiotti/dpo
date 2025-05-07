"use client"

import { cn } from "@/utils/utils"

interface StaticCalendarCellProps {
  date: Date
  time?: number // For week/day views, represents hours (e.g., 9.25 for 9:15)
  children?: React.ReactNode
  className?: string
  onClick?: () => void
  title?: string
}

export function StaticCalendarCell({
  // date, // date and time are not strictly needed for rendering if not used in styling/title
  // time,
  children,
  className,
  onClick,
  title,
}: StaticCalendarCellProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex h-full flex-col overflow-hidden px-0.5 py-1 sm:px-1", // Basic styling, can be adjusted
        "hover:bg-slate-100 bg-green-200 dark:hover:bg-slate-700/50 cursor-pointer", // Hover effect for clickability
        className
      )}
      title={title}
    >
      {children}
    </div>
  )
} 