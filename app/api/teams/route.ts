import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { parsePaging } from "@/lib/pagination"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description } = await request.json()

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Team name is required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        description: description?.trim(),
        ownerId: user.id,
        members: {
          create: {
            userId: user.id,
            role: "OWNER"
          }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        _count: {
          select: { items: true }
        }
      }
    })

    return NextResponse.json(team)
  } catch (error: any) {
    console.error("Error creating team:", error)

    // Handle unique constraint violation
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "You already have a team with this name" },
        { status: 409 }
      )
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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
    const q = params.get("q")?.trim()
    // Paginated when ?page is given (total in X-Total-Count); otherwise the full, lightweight list
    const paged = params.has("page")
    const { limit, skip } = parsePaging(params, { defaultLimit: 12 })
    const where = {
      members: { some: { userId: user.id } },
      ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {})
    }

    // Counts only: member lists are fetched per team from /api/teams/[id]/members
    const teams = await prisma.team.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        ownerId: true,
        members: {
          where: { userId: user.id },
          select: { role: true }
        },
        _count: { select: { items: true, members: true } }
      },
      orderBy: { updatedAt: "desc" },
      ...(paged ? { skip, take: limit } : {})
    })
    const total = paged ? await prisma.team.count({ where }) : teams.length

    return NextResponse.json(
      teams.map(({ members, ownerId, ...team }) => ({
        ...team,
        role: ownerId === user.id ? "OWNER" : members[0]?.role ?? "MEMBER"
      })),
      { headers: { "X-Total-Count": String(total) } }
    )
  } catch (error) {
    console.error("Error fetching teams:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
