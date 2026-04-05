import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    // Always return success to prevent email enumeration
    // This is a security best practice
    if (!user) {
      return NextResponse.json(
        { message: "If an account exists, a reset email will be sent" },
        { status: 200 }
      )
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex")
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex")

    // Token expires in 1 hour
    const resetTokenExpiry = new Date(Date.now() + 3600000)

    // Save hashed token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry
      }
    })

    // In a production environment, you would send an email here
    // For now, we'll log the reset URL
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`

    console.log("========================================")
    console.log("PASSWORD RESET REQUESTED")
    console.log("========================================")
    console.log("Email:", email)
    console.log("Reset URL:", resetUrl)
    console.log("Token expires in 1 hour")
    console.log("========================================")
    console.log("")
    console.log("In production, this would be sent via email.")
    console.log("For development, copy the URL above to reset the password.")
    console.log("")

    // TODO: Send email with resetUrl
    // Example with a service like SendGrid, Resend, or Nodemailer:
    // await sendEmail({
    //   to: email,
    //   subject: "Password Reset Request",
    //   html: `Click here to reset your password: <a href="${resetUrl}">${resetUrl}</a>`
    // })

    return NextResponse.json(
      { message: "If an account exists, a reset email will be sent" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}
