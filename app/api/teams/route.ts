import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
  } catch (error) {
    console.error("Error creating team:", error)
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
      where: { email: session.user.email },
      include: {
        ownedTeams: {
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
        },
        teamMemberships: {
          include: {
            team: {
              include: {
                owner: {
                  select: { id: true, name: true, email: true }
                },
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
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Combine owned teams and member teams, avoiding duplicates
    const teamMap = new Map()

    // Add owned teams
    user.ownedTeams.forEach(team => {
      teamMap.set(team.id, { ...team, role: "OWNER" })
    })

    // Add member teams (skip if already added as owner)
    user.teamMemberships.forEach(membership => {
      if (!teamMap.has(membership.team.id)) {
        teamMap.set(membership.team.id, {
          ...membership.team,
          role: membership.role
        })
      }
    })

    const teams = Array.from(teamMap.values())

    return NextResponse.json(teams)
  } catch (error) {
    console.error("Error fetching teams:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}