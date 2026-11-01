import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { parsePaging, itemFilter, openBorrowInclude } from "@/lib/pagination"

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user is a member of this team
    const membership = await prisma.teamMember.findFirst({
      where: {
        teamId: id,
        userId: user.id
      }
    })

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const params = request.nextUrl.searchParams
    const { page, limit, skip } = parsePaging(params)
    const where = { teamId: id, ...itemFilter(params) }

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        include: openBorrowInclude,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.item.count({ where })
    ])

    return NextResponse.json({ items, total, page, limit })
  } catch (error) {
    console.error("Error fetching team items:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { name, description, category } = await request.json()

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Item name is required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user is a member of this team
    const membership = await prisma.teamMember.findFirst({
      where: {
        teamId: id,
        userId: user.id
      }
    })

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const item = await prisma.item.create({
      data: {
        name: name.trim(),
        description: description?.trim(),
        category: category?.trim(),
        teamId: id
      },
      include: {
        borrowRecords: true
      }
    })

    return NextResponse.json(item)
  } catch (error: any) {
    console.error("Error creating team item:", error)

    // Handle unique constraint violation
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "An item with this name already exists in this team" },
        { status: 409 }
      )
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}