import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"
import { parsePaging } from "@/lib/pagination"

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/items/:id/history?status=all|active|overdue|returned&q=&sort=newest|oldest&page=&limit=
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const user = { id: session.user.id }

    // Item must be personal to the user, or belong to a team they are in.
    const item = await prisma.item.findFirst({
      where: {
        id,
        OR: [
          { userId: user.id },
          { team: { members: { some: { userId: user.id } } } },
        ],
      },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        teamId: true,
        team: { select: { name: true } },
      },
    })
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    const params_ = request.nextUrl.searchParams
    const { page, limit, skip } = parsePaging(params_, { defaultLimit: 15, maxLimit: 100 })
    const status = params_.get("status") || "all"
    const q = params_.get("q")?.trim()
    const sort = params_.get("sort") === "oldest" ? "asc" : "desc"
    const now = new Date()

    const where: Prisma.BorrowRecordWhereInput = { itemId: id }
    if (status === "active") where.returnedAt = null
    if (status === "overdue") {
      where.returnedAt = null
      where.expectedReturnAt = { lt: now }
    }
    if (status === "returned") where.returnedAt = { not: null }
    if (q) {
      where.OR = [
        { borrowerName: { contains: q, mode: "insensitive" } },
        { borrowerEmail: { contains: q, mode: "insensitive" } },
        { borrowerPhone: { contains: q, mode: "insensitive" } },
        { notes: { contains: q, mode: "insensitive" } },
      ]
    }

    const [records, total, all, active, overdue] = await Promise.all([
      prisma.borrowRecord.findMany({
        where,
        orderBy: [{ borrowedAt: sort }, { id: sort }],
        skip,
        take: limit,
      }),
      prisma.borrowRecord.count({ where }),
      prisma.borrowRecord.count({ where: { itemId: id } }),
      prisma.borrowRecord.count({ where: { itemId: id, returnedAt: null } }),
      prisma.borrowRecord.count({
        where: { itemId: id, returnedAt: null, expectedReturnAt: { lt: now } },
      }),
    ])

    return NextResponse.json({
      item,
      records,
      total,
      page,
      limit,
      stats: { total: all, active, overdue, returned: all - active },
    })
  } catch (error) {
    console.error("Error fetching borrow history:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
