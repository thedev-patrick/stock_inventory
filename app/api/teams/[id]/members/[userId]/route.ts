import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface RouteParams {
  params: Promise<{ id: string; userId: string }>
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, userId } = await params

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if current user is the owner of this team
    const team = await prisma.team.findUnique({
      where: { id },
      select: { ownerId: true }
    })

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    if (team.ownerId !== currentUser.id) {
      return NextResponse.json({ error: "Only team owners can remove members" }, { status: 403 })
    }

    // Can't remove the owner
    if (userId === currentUser.id) {
      return NextResponse.json({ error: "Cannot remove yourself from the team" }, { status: 400 })
    }

    // Check if the user to remove is actually a member
    const membership = await prisma.teamMember.findFirst({
      where: {
        teamId: id,
        userId: userId
      }
    })

    if (!membership) {
      return NextResponse.json({ error: "User is not a member of this team" }, { status: 404 })
    }

    // Remove the member
    await prisma.teamMember.delete({
      where: {
        id: membership.id
      }
    })

    return NextResponse.json({ message: "Member removed successfully" })
  } catch (error) {
    console.error("Error removing member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}