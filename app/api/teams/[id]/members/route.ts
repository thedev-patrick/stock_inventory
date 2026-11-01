import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { parsePaging } from "@/lib/pagination"

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

    const membership = await prisma.teamMember.findFirst({
      where: { teamId: id, userId: user.id }
    })

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const { page, limit, skip } = parsePaging(searchParams, { defaultLimit: 20, maxLimit: 100 })
    const q = searchParams.get("q")?.trim()

    // The owner is shown separately on the team page
    const where = {
      teamId: id,
      role: { not: "OWNER" as const },
      ...(q
        ? {
            user: {
              OR: [
                { email: { contains: q, mode: "insensitive" as const } },
                { name: { contains: q, mode: "insensitive" as const } }
              ]
            }
          }
        : {})
    }

    const [members, total] = await Promise.all([
      prisma.teamMember.findMany({
        where,
        select: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { joinedAt: "desc" },
        skip,
        take: limit
      }),
      prisma.teamMember.count({ where })
    ])

    return NextResponse.json({ members, total, page, limit })
  } catch (error) {
    console.error("Error fetching team members:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
