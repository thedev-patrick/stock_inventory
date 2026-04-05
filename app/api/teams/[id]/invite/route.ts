import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { email } = await request.json()

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if current user can invite to this team
    const membership = await prisma.teamMember.findFirst({
      where: {
        teamId: id,
        userId: currentUser.id,
        role: "OWNER" // Only owners can invite
      }
    })

    if (!membership) {
      return NextResponse.json({ error: "Only team owners can invite members" }, { status: 403 })
    }

    // Find the user to invite
    const userToInvite = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!userToInvite) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user is already a member
    const existingMembership = await prisma.teamMember.findFirst({
      where: {
        teamId: id,
        userId: userToInvite.id
      }
    })

    if (existingMembership) {
      return NextResponse.json({ error: "User is already a member of this team" }, { status: 400 })
    }

    // Add user to team
    const newMembership = await prisma.teamMember.create({
      data: {
        teamId: id,
        userId: userToInvite.id,
        role: "MEMBER"
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json({
      message: "User invited successfully",
      member: newMembership
    })
  } catch (error) {
    console.error("Error inviting user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}