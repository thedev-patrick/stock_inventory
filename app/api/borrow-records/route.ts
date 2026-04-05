import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

    const { itemId, borrowerName, borrowerEmail, borrowerPhone, expectedReturnAt, notes } = await request.json()

    if (!itemId || !borrowerName || !expectedReturnAt) {
      return NextResponse.json(
        { error: "Item ID, borrower name, and expected return date are required" },
        { status: 400 }
      )
    }

    // Check if item exists and user has access (personal item or team item where user is member)
    const item = await prisma.item.findFirst({
      where: {
        id: itemId,
        OR: [
          { userId: user.id }, // Personal item
          {
            teamId: {
              not: null
            },
            team: {
              members: {
                some: {
                  userId: user.id
                }
              }
            }
          } // Team item where user is member
        ]
      },
      include: {
        team: true
      }
    })

    if (!item) {
      return NextResponse.json({ error: "Item not found or access denied" }, { status: 404 })
    }

    const borrowRecord = await prisma.borrowRecord.create({
      data: {
        itemId,
        borrowerName,
        borrowerEmail: borrowerEmail || null,
        borrowerPhone: borrowerPhone || null,
        expectedReturnAt: new Date(expectedReturnAt),
        notes: notes || null
      },
      include: {
        item: true
      }
    })

    return NextResponse.json({ borrowRecord }, { status: 201 })
  } catch (error) {
    console.error("Error creating borrow record:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}
