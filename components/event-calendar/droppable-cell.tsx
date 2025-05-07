"use client"

import { useDroppable } from "@dnd-kit/core"
import { startOfDay } from "date-fns"

import { cn } from "@/utils/utils"
import { useCalendarDnd } from "./calendar-dnd-context"

interface DroppableCellProps {
  id: string
  date: Date
  time?: number // For week/day views, represents hours (e.g., 9.25 for 9:15)
  children?: React.ReactNode
  className?: string
  onClick?: () => void
}

export function DroppableCell({
  id,
  date,
  time,
  children,
  className,
  onClick,
}: DroppableCellProps) {
  const { activeEvent, currentDraggableColumnKey, activeView } = useCalendarDnd()

  // Helper to get a consistent column key
  const getColumnKey = (d: Date): string => {
    return startOfDay(d).toISOString().slice(0, 10) // YYYY-MM-DD
  }

  const myColumnKey = getColumnKey(date)
  const isCellInActiveColumn = currentDraggableColumnKey === myColumnKey

  // Cells are disabled if they are not in the active draggable column (for week/day views)
  // For month view, or if no column key is set, cells are always enabled (current behavior)
  const isDisabled =
    (activeView === "week" || activeView === "day") &&
    currentDraggableColumnKey !== null &&
    !isCellInActiveColumn;

  const { setNodeRef, isOver } = useDroppable({
    id,
    disabled: isDisabled,
    data: {
      date,
      time,
      type: "cell", // Identify this droppable as a 'cell'
      columnKey: myColumnKey,
    },
  })

  // Format time for display in tooltip (only for debugging)
  const formattedTime =
    time !== undefined
      ? `${Math.floor(time)}:${Math.round((time - Math.floor(time)) * 60)
        .toString()
        .padStart(2, "0")}`
      : null

  // console.log(
  //   `DroppableCell: ${id}, myKey: ${myColumnKey}, activeKey: ${currentDraggableColumnKey}, disabled: ${isDisabled}, isOver: ${isOver}`
  // )

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={cn(
        "flex h-full flex-col overflow-hidden px-0.5 py-1 transition-colors sm:px-1 bg-blue-200",
        className,
        isDisabled && "bg-red-200 dark:bg-slate-800 opacity-50",
        // !isDisabled && isCellInActiveColumn && "bg-blue-100 dark:bg-blue-900/30",
        // isOver && activeEvent && !isDisabled && "bg-blue-300 dark:bg-blue-700 ring-2 ring-blue-500"
      )}
      title={formattedTime ? `${formattedTime}` : undefined}
      data-dragging={isOver && activeEvent && !isDisabled ? true : undefined}
    >
      {children}
    </div>
  )
}
