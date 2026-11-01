import type { Prisma } from "@prisma/client"

export function parsePaging(
  params: URLSearchParams,
  { defaultLimit = 24, maxLimit = 100 } = {}
) {
  const page = Math.max(1, parseInt(params.get("page") || "1", 10) || 1)
  const limit = Math.min(
    maxLimit,
    Math.max(1, parseInt(params.get("limit") || String(defaultLimit), 10) || defaultLimit)
  )
  return { page, limit, skip: (page - 1) * limit }
}

// Search + status filter shared by the personal and team item lists.
// Status is evaluated in the database: an item is "borrowed" while it has an unreturned record.
export function itemFilter(params: URLSearchParams): Prisma.ItemWhereInput {
  const q = params.get("q")?.trim()
  const status = params.get("status")
  const where: Prisma.ItemWhereInput = {}

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { category: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ]
  }
  if (status === "borrowed") where.borrowRecords = { some: { returnedAt: null } }
  if (status === "available") where.borrowRecords = { none: { returnedAt: null } }

  return where
}

// Only the open borrow record is needed to render an item card.
export const openBorrowInclude = {
  borrowRecords: {
    where: { returnedAt: null },
    orderBy: { borrowedAt: "desc" },
    take: 1,
  },
} satisfies Prisma.ItemInclude
