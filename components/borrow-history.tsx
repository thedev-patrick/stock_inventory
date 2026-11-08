"use client"

import { useEffect, useState } from "react"
import {
  AlertTriangle,
  ArrowDownUp,
  CheckCircle,
  Clock,
  History,
  Mail,
  Phone,
  Search,
  StickyNote,
  UserCheck,
} from "lucide-react"
import Pagination from "./pagination"
import { useDebouncedValue } from "@/lib/use-debounced-value"

const PAGE_SIZE = 15

type BorrowRecord = {
  id: string
  borrowerName: string
  borrowerEmail: string | null
  borrowerPhone: string | null
  borrowedAt: string
  expectedReturnAt: string
  returnedAt: string | null
  validatedBy: string | null
  notes: string | null
}

type Stats = { total: number; active: number; overdue: number; returned: number }
type StatusFilter = "all" | "active" | "overdue" | "returned"

const FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "active", label: "Borrowed" },
  { value: "overdue", label: "Overdue" },
  { value: "returned", label: "Returned" },
]

const DAY = 24 * 60 * 60 * 1000

function fmtDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function fmtDateTime(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function plural(n: number, unit: string) {
  return `${n} ${unit}${n === 1 ? "" : "s"}`
}

// Describes where a record stands relative to its due date.
function describe(r: BorrowRecord) {
  const borrowed = new Date(r.borrowedAt).getTime()
  const due = new Date(r.expectedReturnAt).getTime()
  const now = Date.now()

  if (r.returnedAt) {
    const returned = new Date(r.returnedAt).getTime()
    const held = Math.max(0, Math.round((returned - borrowed) / DAY))
    const lateDays = Math.ceil((returned - due) / DAY)
    return lateDays > 0
      ? {
          key: "late" as const,
          label: "Returned late",
          detail: `${plural(lateDays, "day")} late · held ${plural(held, "day")}`,
        }
      : {
          key: "returned" as const,
          label: "Returned",
          detail: `Held ${plural(held, "day")}`,
        }
  }
  if (due < now) {
    const days = Math.max(1, Math.ceil((now - due) / DAY))
    return { key: "overdue" as const, label: "Overdue", detail: `${plural(days, "day")} overdue` }
  }
  const left = Math.ceil((due - now) / DAY)
  return {
    key: "active" as const,
    label: "Borrowed",
    detail: left <= 0 ? "Due today" : `Due in ${plural(left, "day")}`,
  }
}

const BADGE: Record<string, string> = {
  active: "bg-orange-500/15 text-orange-600",
  overdue: "bg-red-500/15 text-red-600",
  returned: "bg-green-500/15 text-green-600",
  late: "bg-yellow-500/15 text-yellow-700",
}

const DOT: Record<string, string> = {
  active: "bg-orange-500",
  overdue: "bg-red-500",
  returned: "bg-green-500",
  late: "bg-yellow-500",
}

export default function BorrowHistory({
  itemId,
  refreshKey = 0,
}: {
  itemId: string
  // Bump to reload after the parent changes borrow state (borrow / return).
  refreshKey?: number
}) {
  const [records, setRecords] = useState<BorrowRecord[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, overdue: 0, returned: 0 })
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<StatusFilter>("all")
  const [sort, setSort] = useState<"newest" | "oldest">("newest")
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const query = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
      status: filter,
      sort,
    })
    if (debouncedSearch.trim()) query.set("q", debouncedSearch.trim())

    fetch(`/api/items/${itemId}/history?${query}`)
      .then(async (res) => {
        const data = await res.json()
        if (cancelled) return
        if (!res.ok) {
          setError(data.error || "Failed to load history")
          return
        }
        setError(null)
        setRecords(data.records)
        setTotal(data.total)
        setStats(data.stats)
      })
      .catch((e) => {
        if (cancelled) return
        console.error("Error loading borrow history:", e)
        setError("Failed to load history")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [itemId, page, filter, sort, debouncedSearch, refreshKey])

  const filtered = filter !== "all" || debouncedSearch.trim() !== ""

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    )
  }

  if (error) {
    return <p className="text-center py-8 text-foreground/70">{error}</p>
  }

  const statCards = [
    { label: "Total borrows", value: stats.total, icon: History, color: "text-accent" },
    { label: "Currently out", value: stats.active, icon: Clock, color: "text-orange-600" },
    { label: "Overdue", value: stats.overdue, icon: AlertTriangle, color: "text-red-600" },
    { label: "Returned", value: stats.returned, icon: CheckCircle, color: "text-green-600" },
  ]

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-background border border-accent/20 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Icon className={`h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0 ${color}`} />
              <div>
                <p className="text-xl sm:text-2xl font-bold text-foreground">{value}</p>
                <p className="text-xs sm:text-sm text-foreground/70">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/60 h-4 w-4" />
            <input
              type="text"
              placeholder="Search borrower, email, phone or notes..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="w-full pl-10 pr-4 py-2 border border-accent/20 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setSort(sort === "newest" ? "oldest" : "newest")
              setPage(1)
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-accent/20 rounded-lg text-foreground hover:bg-accent/10 transition-colors text-sm whitespace-nowrap"
          >
            <ArrowDownUp className="h-4 w-4" />
            {sort === "newest" ? "Newest first" : "Oldest first"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => {
                setFilter(f.value)
                setPage(1)
              }}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                filter === f.value
                  ? "bg-accent text-background border-accent"
                  : "border-accent/20 text-foreground hover:bg-accent/10"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      {records.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-accent/20 rounded-lg">
          <History className="h-12 w-12 text-accent/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">
            {filtered ? "No matching records" : "Never borrowed"}
          </h3>
          <p className="text-foreground/70 text-sm">
            {filtered
              ? "Try a different filter or search term."
              : "Borrowing activity for this item will appear here."}
          </p>
        </div>
      ) : (
        <ol className="space-y-3">
          {records.map((r) => {
            const s = describe(r)
            return (
              <li
                key={r.id}
                className="bg-background border border-accent/20 rounded-lg p-4 sm:p-5 hover:border-accent/40 transition-colors"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-3 h-3 rounded-full flex-shrink-0 ${DOT[s.key]}`} />
                    <h3 className="font-semibold text-foreground truncate">{r.borrowerName}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-foreground/60">{s.detail}</span>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${BADGE[s.key]}`}>
                      {s.label}
                    </span>
                  </div>
                </div>

                {(r.borrowerEmail || r.borrowerPhone) && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 ml-6 text-sm text-foreground/70">
                    {r.borrowerEmail && (
                      <span className="inline-flex items-center gap-1 break-all">
                        <Mail className="h-3.5 w-3.5 flex-shrink-0" /> {r.borrowerEmail}
                      </span>
                    )}
                    {r.borrowerPhone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 flex-shrink-0" /> {r.borrowerPhone}
                      </span>
                    )}
                  </div>
                )}

                <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 ml-6 text-sm">
                  <div>
                    <dt className="text-xs text-foreground/60">Borrowed</dt>
                    <dd className="text-foreground">{fmtDateTime(r.borrowedAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-foreground/60">Expected return</dt>
                    <dd className="text-foreground">{fmtDate(r.expectedReturnAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-foreground/60">Returned</dt>
                    <dd className="text-foreground">
                      {r.returnedAt ? fmtDateTime(r.returnedAt) : "Not yet returned"}
                    </dd>
                  </div>
                </dl>

                {(r.validatedBy || r.notes) && (
                  <div className="mt-3 ml-6 space-y-1 text-sm text-foreground/70">
                    {r.validatedBy && (
                      <p className="inline-flex items-center gap-1">
                        <UserCheck className="h-3.5 w-3.5 flex-shrink-0" /> Validated by {r.validatedBy}
                      </p>
                    )}
                    {r.notes && (
                      <p className="flex items-start gap-1">
                        <StickyNote className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                        <span className="whitespace-pre-wrap break-words">{r.notes}</span>
                      </p>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      )}

      <Pagination page={page} total={total} limit={PAGE_SIZE} onPageChange={setPage} />
    </div>
  )
}
