import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { items: true, members: true }
        }
      }
    })

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    return NextResponse.json({
      ...team,
      userRole: membership.role
    })
  } catch (error) {
    console.error("Error fetching team:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Check if user is the owner of this team
    const team = await prisma.team.findUnique({
      where: { id },
      select: { ownerId: true }
    })

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    if (team.ownerId !== user.id) {
      return NextResponse.json({ error: "Only team owners can delete teams" }, { status: 403 })
    }

    // Delete team (cascade will handle members and items)
    await prisma.team.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Team deleted successfully" })
  } catch (error) {
    console.error("Error deleting team:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
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

    const team = await prisma.team.findUnique({
      where: { id },
      select: { ownerId: true }
    })

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    if (team.ownerId !== user.id) {
      return NextResponse.json({ error: "Only team owners can edit teams" }, { status: 403 })
    }

    const updated = await prisma.team.update({
      where: { id },
      data: {
        name: name.trim(),
        description: typeof description === "string" ? description.trim() || null : null
      },
      select: { id: true, name: true, description: true }
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error("Error updating team:", error)

    // Unique on [name, ownerId]
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "You already have a team with this name" },
        { status: 409 }
      )
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
