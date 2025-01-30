import React, { CSSProperties } from 'react'
import { Row } from '@tanstack/react-table' // if using TanStack's Row type
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

/**
 * DraggableRow wraps each top-level "Item" row in a Sortable component.
 * We pass the row's ID as the `id`.
 */
export function DraggableRow<TData extends { id: string }>({
  row,
  children,
}: {
  row: Row<TData>
  children: React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: row.original.id })

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1 : undefined,
    position: isDragging ? 'relative' : undefined,
  }

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className='bolas'
    // We place the drag handle props on a dedicated cell or button,
    // but if you want to drag the entire row, you can do:
    // {...attributes} {...listeners}
    >
      {children}
    </tr>
  )
}

/**
 * A small button or handle for the user to click and drag.
 * Typically goes in the first cell of each row.
 */
export function RowDragHandle({ rowId }: { rowId: string }) {
  const { attributes, listeners } = useSortable({ id: rowId })
  return (
    <button
      {...attributes}
      {...listeners}
      style={{ cursor: 'grab' }}
      aria-label="Drag handle"
    >
      🟰
    </button>
  )
}
