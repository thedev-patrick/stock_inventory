import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { parsePaging, itemFilter, openBorrowInclude } from "@/lib/pagination"

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

    const params = request.nextUrl.searchParams
    const { page, limit, skip } = parsePaging(params)

    // Personal items only (not team items)
    const where = { userId: user.id, ...itemFilter(params) }

    const [items, total, allTotal, borrowed] = await Promise.all([
      prisma.item.findMany({
        where,
        include: openBorrowInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.item.count({ where }),
      prisma.item.count({ where: { userId: user.id } }),
      prisma.item.count({
        where: { userId: user.id, borrowRecords: { some: { returnedAt: null } } }
      })
    ])

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      stats: { total: allTotal, borrowed, available: allTotal - borrowed }
    })
  } catch (error) {
    console.error("Error fetching items:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
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

    const { name, description, category, teamId } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    // If teamId is provided, check if user is a member of that team
    if (teamId) {
      const membership = await prisma.teamMember.findFirst({
        where: {
          teamId,
          userId: user.id
        }
      })

      if (!membership) {
        return NextResponse.json(
          { error: "Access denied to this team" },
          { status: 403 }
        )
      }
    }

    const item = await prisma.item.create({
      data: {
        name,
        description: description || null,
        category: category || null,
        userId: teamId ? null : user.id,
        teamId: teamId || null
      }
    })

    return NextResponse.json({ item }, { status: 201 })
  } catch (error: any) {
    console.error("Error creating item:", error)

    // Handle unique constraint violation
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "An item with this name already exists in your inventory" },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}
