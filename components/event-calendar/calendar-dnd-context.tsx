"use client"

import {
  createContext,
  useContext,
  useId,
  useRef,
  useState,
  type ReactNode,
  useEffect,
} from "react"
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { addMinutes, differenceInMinutes, startOfDay } from "date-fns"


import { CalendarEvent } from "./types"
import { EventItem } from "./event-item"

// Helper to get a consistent column key
const getColumnKey = (date: Date): string => {
  return startOfDay(date).toISOString().slice(0, 10) // YYYY-MM-DD
}

// Define the context type
type CalendarDndContextType = {
  activeEvent: CalendarEvent | null
  activeId: UniqueIdentifier | null
  activeView: "month" | "week" | "day" | null
  currentTime: Date | null
  eventHeight: number | null
  isMultiDay: boolean
  multiDayWidth: number | null
  dragHandlePosition: {
    x?: number
    y?: number
    data?: {
      isFirstDay?: boolean
      isLastDay?: boolean
    }
  } | null
  currentDraggableColumnKey: string | null // New: Key for the currently active column for dragging
}

// Create the context
const CalendarDndContext = createContext<CalendarDndContextType>({
  activeEvent: null,
  activeId: null,
  activeView: null,
  currentTime: null,
  eventHeight: null,
  isMultiDay: false,
  multiDayWidth: null,
  dragHandlePosition: null,
  currentDraggableColumnKey: null, // New
})

// Hook to use the context
export const useCalendarDnd = () => useContext(CalendarDndContext)

// Props for the provider
interface CalendarDndProviderProps {
  children: ReactNode
  onEventUpdate: (event: CalendarEvent) => void
}

export function CalendarDndProvider({
  children,
  onEventUpdate,
}: CalendarDndProviderProps) {
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null)
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
  const [activeView, setActiveView] = useState<"month" | "week" | "day" | null>(
    null
  )
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [eventHeight, setEventHeight] = useState<number | null>(null)
  const [isMultiDay, setIsMultiDay] = useState(false)
  const [multiDayWidth, setMultiDayWidth] = useState<number | null>(null)
  const [dragHandlePosition, setDragHandlePosition] = useState<{
    x?: number
    y?: number
    data?: {
      isFirstDay?: boolean
      isLastDay?: boolean
    }
  } | null>(null)
  const [currentDraggableColumnKey, setCurrentDraggableColumnKey] =
    useState<string | null>(null) // New state for active column

  // Effect to log column key changes for debugging
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log("[DND Context] currentDraggableColumnKey updated:", currentDraggableColumnKey);
    }
  }, [currentDraggableColumnKey]);

  // Store original event dimensions
  const eventDimensions = useRef<{ height: number }>({ height: 0 })

  // Configure sensors for better drag detection
  const sensors = useSensors(
    useSensor(MouseSensor, {
      // Require the mouse to move by 5px before activating
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      // Press delay of 250ms, with tolerance of 5px of movement
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(PointerSensor, {
      // Require the pointer to move by 5px before activating
      activationConstraint: {
        distance: 5,
      },
    })
  )

  // Generate a stable ID for the DndContext
  const dndContextId = useId()

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event

    // Add safety check for data.current
    if (!active.data.current) {
      console.error("Missing data in drag start event", event)
      return
    }

    const {
      event: calendarEvent,
      view,
      height,
      isMultiDay: eventIsMultiDay,
      multiDayWidth: eventMultiDayWidth,
      dragHandlePosition: eventDragHandlePosition,
      initialColumnKey,
    } = active.data.current as {
      event: CalendarEvent
      view: "month" | "week" | "day"
      height?: number
      isMultiDay?: boolean
      multiDayWidth?: number
      dragHandlePosition?: {
        x?: number
        y?: number
        data?: {
          isFirstDay?: boolean
          isLastDay?: boolean
        }
      }
      initialColumnKey?: string
    }

    setActiveEvent(calendarEvent)
    setActiveId(active.id)
    setActiveView(view)
    const initialEventDate = new Date(calendarEvent.start)
    setCurrentTime(initialEventDate)
    setIsMultiDay(eventIsMultiDay || false)
    setMultiDayWidth(eventMultiDayWidth || null)
    setDragHandlePosition(eventDragHandlePosition || null)

    // New: Set initial draggable column key
    if (view === "week" || view === "day") {
      setCurrentDraggableColumnKey(
        active.data.current.initialColumnKey || getColumnKey(initialEventDate)
      )
    } else {
      setCurrentDraggableColumnKey(null) // Or handle month view differently if desired
    }

    // Store event height if provided
    if (height) {
      eventDimensions.current.height = height
      setEventHeight(height)
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event

    if (over && activeEvent && over.data.current) {
      const overData = over.data.current as {
        date: Date
        time?: number
        type?: "column-sentinel" | "cell"
        columnKey?: string
      }
      const { date, time, type, columnKey: overColumnKey } = overData

      // New: Update active column if dragging over a sentinel in a different column
      if (
        (activeView === "week" || activeView === "day") &&
        type === "column-sentinel" &&
        overColumnKey &&
        overColumnKey !== currentDraggableColumnKey
      ) {
        setCurrentDraggableColumnKey(overColumnKey)
      }

      // Update time for week/day views
      if (time !== undefined && (activeView === "week" || activeView === "day")) {
        const newTime = new Date(date) // Use the date from the droppable (cell or sentinel)

        // Calculate hours and minutes with 15-minute precision
        const hours = Math.floor(time)
        const fractionalHour = time - hours

        // Map to nearest 15 minute interval (0, 0.25, 0.5, 0.75)
        let minutes = 0
        if (fractionalHour < 0.125) minutes = 0
        else if (fractionalHour < 0.375) minutes = 15
        else if (fractionalHour < 0.625) minutes = 30
        else minutes = 45

        newTime.setHours(hours, minutes, 0, 0)

        // Only update if time or date has changed
        if (
          !currentTime ||
          newTime.getHours() !== currentTime.getHours() ||
          newTime.getMinutes() !== currentTime.getMinutes() ||
          !startOfDay(newTime).getTime() === !startOfDay(currentTime).getTime() // Compare day parts
        ) {
          setCurrentTime(newTime)
        }
      } else if (activeView === "month") {
        // For month view, just update the date but preserve time
        const newTime = new Date(date)
        if (currentTime) {
          newTime.setHours(
            currentTime.getHours(),
            currentTime.getMinutes(),
            currentTime.getSeconds(),
            currentTime.getMilliseconds()
          )
        }

        // Only update if date has changed
        if (
          !currentTime ||
          newTime.getDate() !== currentTime.getDate() ||
          newTime.getMonth() !== currentTime.getMonth() ||
          newTime.getFullYear() !== currentTime.getFullYear()
        ) {
          setCurrentTime(newTime)
        }
      }
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    // Add robust error checking
    if (!over || !activeEvent || !currentTime) {
      // Reset state and exit early
      setActiveEvent(null)
      setActiveId(null)
      setActiveView(null)
      setCurrentTime(null)
      setEventHeight(null)
      setIsMultiDay(false)
      setMultiDayWidth(null)
      setDragHandlePosition(null)
      setCurrentDraggableColumnKey(null) // New: Reset active column
      return
    }

    try {
      // Safely access data with checks
      if (!active.data.current || !over.data.current) {
        throw new Error("Missing data in drag event")
      }

      const activeData = active.data.current as {
        event?: CalendarEvent
        view?: string
      }
      const overData = over.data.current as { date?: Date; time?: number }

      // Verify we have all required data
      if (!activeData.event || !overData.date) {
        throw new Error("Missing required event data")
      }

      const calendarEvent = activeData.event
      const date = overData.date
      const time = overData.time

      // Calculate new start time
      const newStart = new Date(date)

      // If time is provided (for week/day views), set the hours and minutes
      if (time !== undefined) {
        const hours = Math.floor(time)
        const fractionalHour = time - hours

        // Map to nearest 15 minute interval (0, 0.25, 0.5, 0.75)
        let minutes = 0
        if (fractionalHour < 0.125) minutes = 0
        else if (fractionalHour < 0.375) minutes = 15
        else if (fractionalHour < 0.625) minutes = 30
        else minutes = 45

        newStart.setHours(hours, minutes, 0, 0)
      } else {
        // For month view, preserve the original time from currentTime
        newStart.setHours(
          currentTime.getHours(),
          currentTime.getMinutes(),
          currentTime.getSeconds(),
          currentTime.getMilliseconds()
        )
      }

      // Calculate new end time based on the original duration
      const originalStart = new Date(calendarEvent.start)
      const originalEnd = new Date(calendarEvent.end)
      const durationMinutes = differenceInMinutes(originalEnd, originalStart)
      const newEnd = addMinutes(newStart, durationMinutes)

      // Only update if the start time has actually changed
      const hasStartTimeChanged =
        originalStart.getFullYear() !== newStart.getFullYear() ||
        originalStart.getMonth() !== newStart.getMonth() ||
        originalStart.getDate() !== newStart.getDate() ||
        originalStart.getHours() !== newStart.getHours() ||
        originalStart.getMinutes() !== newStart.getMinutes()

      if (hasStartTimeChanged) {
        // Update the event only if the time has changed
        onEventUpdate({
          ...calendarEvent,
          start: newStart,
          end: newEnd,
        })
      }
    } catch (error) {
      console.error("Error in drag end handler:", error)
    } finally {
      // Always reset state
      setActiveEvent(null)
      setActiveId(null)
      setActiveView(null)
      setCurrentTime(null)
      setEventHeight(null)
      setIsMultiDay(false)
      setMultiDayWidth(null)
      setDragHandlePosition(null)
      setCurrentDraggableColumnKey(null) // New: Reset active column
    }
  }

  return (
    <DndContext
      id={dndContextId}
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <CalendarDndContext.Provider
        value={{
          activeEvent,
          activeId,
          activeView,
          currentTime,
          eventHeight,
          isMultiDay,
          multiDayWidth,
          dragHandlePosition,
          currentDraggableColumnKey, // New: Pass down current column key
        }}
      >
        {children}

        <DragOverlay adjustScale={false} dropAnimation={null}>
          {activeEvent && activeView && (
            <div
              style={{
                height: eventHeight ? `${eventHeight}px` : "auto",
                width:
                  isMultiDay && multiDayWidth ? `${multiDayWidth}%` : "100%",
                // Remove the transform that was causing the shift
              }}
            >
              <EventItem
                event={activeEvent}
                view={activeView}
                isDragging={true}
                showTime={activeView !== "month"}
                currentTime={currentTime || undefined}
                isFirstDay={dragHandlePosition?.data?.isFirstDay !== false}
                isLastDay={dragHandlePosition?.data?.isLastDay !== false}
              />
            </div>
          )}
        </DragOverlay>
      </CalendarDndContext.Provider>
    </DndContext>
  )
}
