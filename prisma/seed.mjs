import bcrypt from "bcrypt"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const adminEmail = "admin@example.com"
  const adminPassword = "Password123!"
  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10)

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "Admin User",
      password: hashedAdminPassword,
    },
    create: {
      email: adminEmail,
      name: "Admin User",
      password: hashedAdminPassword,
    },
  })

  // Create a second user for team testing
  const memberEmail = "member@example.com"
  const memberPassword = "Password123!"
  const hashedMemberPassword = await bcrypt.hash(memberPassword, 10)

  const member = await prisma.user.upsert({
    where: { email: memberEmail },
    update: {
      name: "Team Member",
      password: hashedMemberPassword,
    },
    create: {
      email: memberEmail,
      name: "Team Member",
      password: hashedMemberPassword,
    },
  })

  // Create a sample team
  const team = await prisma.team.upsert({
    where: { id: "sample-team-1" },
    update: {
      name: "Tech Team",
      description: "Managing our tech gadgets and equipment",
    },
    create: {
      id: "sample-team-1",
      name: "Tech Team",
      description: "Managing our tech gadgets and equipment",
      ownerId: admin.id,
    },
  })

  // Add admin as owner and member as team member
  await prisma.teamMember.upsert({
    where: {
      teamId_userId: {
        teamId: team.id,
        userId: admin.id,
      },
    },
    update: {
      role: "OWNER",
    },
    create: {
      teamId: team.id,
      userId: admin.id,
      role: "OWNER",
    },
  })

  await prisma.teamMember.upsert({
    where: {
      teamId_userId: {
        teamId: team.id,
        userId: member.id,
      },
    },
    update: {
      role: "MEMBER",
    },
    create: {
      teamId: team.id,
      userId: member.id,
      role: "MEMBER",
    },
  })

  // Create some personal items for admin
  await prisma.item.upsert({
    where: { id: "personal-laptop" },
    update: {
      name: "MacBook Pro",
      description: "Personal laptop for development",
      category: "Electronics",
    },
    create: {
      id: "personal-laptop",
      name: "MacBook Pro",
      description: "Personal laptop for development",
      category: "Electronics",
      userId: admin.id,
    },
  })

  // Create some team items
  await prisma.item.upsert({
    where: { id: "team-projector" },
    update: {
      name: "Projector",
      description: "Team projector for presentations",
      category: "Electronics",
    },
    create: {
      id: "team-projector",
      name: "Projector",
      description: "Team projector for presentations",
      category: "Electronics",
      teamId: team.id,
    },
  })

  await prisma.item.upsert({
    where: { id: "team-whiteboard" },
    update: {
      name: "Whiteboard",
      description: "Large whiteboard for brainstorming",
      category: "Office Supplies",
    },
    create: {
      id: "team-whiteboard",
      name: "Whiteboard",
      description: "Large whiteboard for brainstorming",
      category: "Office Supplies",
      teamId: team.id,
    },
  })

  console.log("Seeded data:", {
    admin: {
      email: admin.email,
      password: adminPassword,
    },
    member: {
      email: member.email,
      password: memberPassword,
    },
    team: {
      name: team.name,
      members: 2,
      items: 2,
    },
  })
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
