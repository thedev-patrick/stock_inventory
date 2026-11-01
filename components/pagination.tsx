import { ChevronLeft, ChevronRight } from "lucide-react"

export default function Pagination({
  page,
  total,
  limit,
  onPageChange,
}: {
  page: number
  total: number
  limit: number
  onPageChange: (page: number) => void
}) {
  const pages = Math.max(1, Math.ceil(total / limit))
  if (pages <= 1) return null

  const from = (page - 1) * limit + 1
  const to = Math.min(page * limit, total)
  const buttonClass =
    "flex items-center gap-1 px-3 py-1.5 text-sm border border-accent/20 rounded-lg text-foreground hover:bg-accent/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"

  return (
    <div className="flex items-center justify-between gap-2 pt-2">
      <p className="text-xs sm:text-sm text-foreground/60">
        {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-2">
        <button type="button" className={buttonClass} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="h-4 w-4" /> Prev
        </button>
        <span className="text-xs sm:text-sm text-foreground/60">
          {page} / {pages}
        </span>
        <button type="button" className={buttonClass} disabled={page >= pages} onClick={() => onPageChange(page + 1)}>
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
