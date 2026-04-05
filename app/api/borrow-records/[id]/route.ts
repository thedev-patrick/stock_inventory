import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { returnedAt } = await request.json()

    const borrowRecord = await prisma.borrowRecord.findFirst({
      where: { id },
      include: {
        item: true
      }
    })

    if (!borrowRecord) {
      return NextResponse.json({ error: "Borrow record not found" }, { status: 404 })
    }

    let hasAccess = borrowRecord.item.userId === user.id

    if (!hasAccess && borrowRecord.item.teamId) {
      const membership = await prisma.teamMember.findFirst({
        where: {
          teamId: borrowRecord.item.teamId,
          userId: user.id
        }
      })
      hasAccess = Boolean(membership)
    }

    if (!hasAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const updatedRecord = await prisma.borrowRecord.update({
      where: { id },
      data: {
        returnedAt: returnedAt ? new Date(returnedAt) : new Date(),
        validatedBy: `Validated by ${session.user.name || session.user.email}`
      },
      include: {
        item: true
      }
    })

    return NextResponse.json({ borrowRecord: updatedRecord })
  } catch (error) {
    console.error("Error updating borrow record:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}
