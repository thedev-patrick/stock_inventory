"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"

interface DatePickerProps {
  value?: string        // YYYY-MM-DD
  onChange?: (value: string) => void
  name?: string         // for hidden input in uncontrolled forms
  required?: boolean
  min?: string          // YYYY-MM-DD — dates before this are disabled
  placeholder?: string
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

function parseDate(str: string | undefined): Date | null {
  if (!str) return null
  const [y, m, d] = str.split("-").map(Number)
  return new Date(y, m - 1, d)
}

function toYMD(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export default function DatePicker({
  value,
  onChange,
  name,
  required,
  min,
  placeholder = "Select a date",
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [internalValue, setInternalValue] = useState<string>("")
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = value !== undefined ? value : internalValue
  const minDate = parseDate(min)

  // Default calendar view: start on the selected month, or today
  const initial = parseDate(selected) ?? new Date()
  const [viewYear, setViewYear] = useState(initial.getFullYear())
  const [viewMonth, setViewMonth] = useState(initial.getMonth())

  // Sync view when selected value changes externally
  useEffect(() => {
    const d = parseDate(selected)
    if (d) {
      setViewYear(d.getFullYear())
      setViewMonth(d.getMonth())
    }
  }, [selected])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  function selectDate(date: Date) {
    const ymd = toYMD(date)
    if (value === undefined) setInternalValue(ymd)
    onChange?.(ymd)
    setOpen(false)
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  // Build grid of days for viewMonth/viewYear
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to full rows
  while (cells.length % 7 !== 0) cells.push(null)

  const selectedDate = parseDate(selected)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  function isDisabled(day: number) {
    const d = new Date(viewYear, viewMonth, day)
    return minDate ? d < minDate : false
  }

  function isSelected(day: number) {
    if (!selectedDate) return false
    return (
      selectedDate.getFullYear() === viewYear &&
      selectedDate.getMonth() === viewMonth &&
      selectedDate.getDate() === day
    )
  }

  function isToday(day: number) {
    return (
      today.getFullYear() === viewYear &&
      today.getMonth() === viewMonth &&
      today.getDate() === day
    )
  }

  const displayValue = selectedDate
    ? selectedDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null

  return (
    <div ref={containerRef} className="relative">
      {/* Hidden input for uncontrolled form submission */}
      {name && (
        <input type="hidden" name={name} value={selected} required={required} />
      )}

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 border border-accent/20 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent hover:border-accent/40 transition-colors text-left"
      >
        <Calendar className="w-4 h-4 text-accent shrink-0" />
        <span className={displayValue ? "text-foreground" : "text-foreground/40"}>
          {displayValue ?? placeholder}
        </span>
      </button>

      {/* Calendar dropdown */}
      {open && (
        <div className="absolute z-50 mt-2 w-72 rounded-xl border border-accent/20 bg-background shadow-lg p-3">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 rounded-lg hover:bg-accent/10 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </button>
            <span className="text-sm font-semibold text-foreground">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 rounded-lg hover:bg-accent/10 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-foreground" />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-medium text-foreground/50 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-y-1">
            {cells.map((day, i) => {
              if (day === null) return <div key={i} />
              const disabled = isDisabled(day)
              const selected = isSelected(day)
              const todayCell = isToday(day)
              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled}
                  onClick={() => selectDate(new Date(viewYear, viewMonth, day))}
                  className={[
                    "text-sm h-8 w-full rounded-lg flex items-center justify-center transition-colors",
                    selected
                      ? "bg-accent text-background font-semibold"
                      : todayCell
                      ? "border border-accent text-accent font-medium hover:bg-accent/10"
                      : disabled
                      ? "text-foreground/20 cursor-not-allowed"
                      : "text-foreground hover:bg-accent/10 cursor-pointer",
                  ].join(" ")}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
