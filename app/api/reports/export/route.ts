import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const HEADERS = [
  "Inventory",
  "Item",
  "Category",
  "Description",
  "Status",
  "Borrower",
  "Borrower Email",
  "Borrower Phone",
  "Borrowed At",
  "Expected Return",
  "Returned At",
  "Validated By",
  "Notes",
]

function escapeCell(value: string): string {
  // Neutralize spreadsheet formula injection
  if (/^[=+\-@\t\r]/.test(value)) value = "'" + value
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

function formatDate(date: Date | null): string {
  return date ? date.toISOString() : ""
}

// scope: "all" (default) | "personal" | <teamId>
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const scope = request.nextUrl.searchParams.get("scope") || "all"

    let where
    if (scope === "personal") {
      where = { userId: user.id }
    } else if (scope === "all") {
      where = {
        OR: [
          { userId: user.id },
          { team: { members: { some: { userId: user.id } } } }
        ]
      }
    } else {
      const membership = await prisma.teamMember.findFirst({
        where: { teamId: scope, userId: user.id }
      })
      if (!membership) {
        return NextResponse.json({ error: "Access denied to this team" }, { status: 403 })
      }
      where = { teamId: scope }
    }

    const items = await prisma.item.findMany({
      where,
      include: {
        team: { select: { name: true } },
        borrowRecords: { orderBy: { borrowedAt: "desc" } }
      },
      orderBy: { name: "asc" }
    })

    const rows: string[][] = []
    for (const item of items) {
      const base = [
        item.team ? `Team: ${item.team.name}` : "Personal",
        item.name,
        item.category ?? "",
        item.description ?? "",
      ]
      if (item.borrowRecords.length === 0) {
        rows.push([...base, "Available", "", "", "", "", "", "", "", ""])
        continue
      }
      for (const r of item.borrowRecords) {
        rows.push([
          ...base,
          r.returnedAt
            ? "Returned"
            : r.expectedReturnAt < new Date() ? "Overdue" : "Borrowed",
          r.borrowerName,
          r.borrowerEmail ?? "",
          r.borrowerPhone ?? "",
          formatDate(r.borrowedAt),
          formatDate(r.expectedReturnAt),
          formatDate(r.returnedAt),
          r.validatedBy ?? "",
          r.notes ?? "",
        ])
      }
    }

    const csv =
      "﻿" +
      [HEADERS, ...rows].map(row => row.map(escapeCell).join(",")).join("\r\n")

    const filename = `inventory-report-${new Date().toISOString().slice(0, 10)}.csv`

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("Error exporting report:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
