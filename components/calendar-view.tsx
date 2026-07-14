"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import useSWR from "swr"
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CalendarCheck, ChevronLeft, ChevronRight, Clock, Mic, PhoneCall } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface Booking {
  id: number
  callId: number | null
  title: string
  contactName: string | null
  scheduledAt: string
  notes: string | null
  status: string
}

export function CalendarView() {
  const { data: bookings, isLoading } = useSWR<Booking[]>("/api/bookings", fetcher)
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [selected, setSelected] = useState<Date>(() => new Date())

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
      }),
    [month],
  )

  const bookingsByDay = useMemo(() => {
    const map = new Map<string, Booking[]>()
    for (const b of bookings ?? []) {
      const key = format(new Date(b.scheduledAt), "yyyy-MM-dd")
      const list = map.get(key) ?? []
      list.push(b)
      map.set(key, list)
    }
    return map
  }, [bookings])

  const selectedBookings = bookingsByDay.get(format(selected, "yyyy-MM-dd")) ?? []
  const upcoming = (bookings ?? [])
    .filter((b) => new Date(b.scheduledAt) >= new Date())
    .slice(0, 5)

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-4 md:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Appointments booked by your voice agents during live calls.
          </p>
        </div>
        <Button asChild className="gap-2 self-start rounded-full">
          <Link href="/call">
            <Mic className="size-4" />
            Book via Call
          </Link>
        </Button>
      </header>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* month grid */}
        <div className="rounded-xl border border-border bg-card p-4 lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">{format(month, "MMMM yyyy")}</h2>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => setMonth((m) => addMonths(m, -1))}
                aria-label="Previous month"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => setMonth((m) => addMonths(m, 1))}
                aria-label="Next month"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
              <span key={d} className="py-1 text-[10px] font-medium uppercase text-muted-foreground">
                {d}
              </span>
            ))}
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd")
              const dayBookings = bookingsByDay.get(key) ?? []
              const inMonth = isSameMonth(day, month)
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelected(day)}
                  className={cn(
                    "relative flex aspect-square flex-col items-center justify-center rounded-md text-xs transition-colors",
                    inMonth ? "text-foreground" : "text-muted-foreground/40",
                    isSameDay(day, selected)
                      ? "bg-primary text-primary-foreground"
                      : isToday(day)
                        ? "bg-accent"
                        : "hover:bg-accent/60",
                  )}
                >
                  {format(day, "d")}
                  {dayBookings.length > 0 && (
                    <span
                      className={cn(
                        "absolute bottom-1 size-1 rounded-full",
                        isSameDay(day, selected) ? "bg-primary-foreground" : "bg-primary",
                      )}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* day detail + upcoming */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">{format(selected, "EEEE, d MMMM")}</h2>
            {selectedBookings.length === 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">No appointments on this day.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {selectedBookings.map((b) => (
                  <li key={b.id} className="rounded-lg border border-border bg-background p-3">
                    <p className="flex items-center gap-2 text-sm font-medium">
                      <CalendarCheck className="size-3.5 text-chart-2" />
                      {b.title}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      {format(new Date(b.scheduledAt), "h:mm a")}
                      {b.contactName && ` · ${b.contactName}`}
                    </p>
                    {b.notes && <p className="mt-1 text-xs text-muted-foreground">{b.notes}</p>}
                    {b.callId && (
                      <Link
                        href={`/calls/${b.callId}`}
                        className="mt-2 flex w-fit items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <PhoneCall className="size-3" />
                        View source call
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Upcoming</h2>
            {isLoading ? (
              <p className="mt-3 text-xs text-muted-foreground">Loading...</p>
            ) : upcoming.length === 0 ? (
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                Nothing scheduled. Ask an agent on a live call to book an appointment — it lands here
                automatically.
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {upcoming.map((b) => (
                  <li key={b.id} className="flex items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-chart-2/15">
                      <CalendarCheck className="size-3.5 text-chart-2" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium">{b.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {format(new Date(b.scheduledAt), "d MMM, h:mm a")}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
