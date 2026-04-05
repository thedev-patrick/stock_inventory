"use client"

import { useState } from "react"
import Link from "next/link"
import { Mail, ArrowLeft } from "lucide-react"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Something went wrong")
        setLoading(false)
        return
      }

      setSuccess(true)
    } catch (error) {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
        <div className="w-full max-w-md animate-fadeIn">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-accent rounded-2xl mb-4 animate-scaleIn">
              <Mail className="w-8 h-8 text-background" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">
              Check Your Email
            </h1>
            <p className="text-foreground">We sent you a password reset link</p>
          </div>

          <div className="bg-background rounded-2xl border-2 border-foreground p-8">
            <p className="text-center text-foreground mb-6">
              If an account exists for <strong>{email}</strong>, you will receive an email with instructions to reset your password.
            </p>
            <p className="text-center text-sm text-foreground opacity-70 mb-6">
              The link will expire in 1 hour.
            </p>
            <Link
              href="/auth/signin"
              className="flex items-center justify-center gap-2 w-full bg-accent text-background py-3 rounded-lg font-semibold hover:opacity-90 transition-all hover:scale-105"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md animate-fadeIn">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent rounded-2xl mb-4 animate-scaleIn">
            <Mail className="w-8 h-8 text-background" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">
            Forgot Password?
          </h1>
          <p className="text-foreground">Enter your email to reset your password</p>
        </div>

        <div className="bg-background rounded-2xl border-2 border-foreground p-8 animate-fadeIn" style={{ animationDelay: "0.1s" }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="border-2 border-accent text-accent px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-2">
                Email
              </label>
              <div className="relative">
                <Mail aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground opacity-50 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full pl-12 pr-4 py-3 border-2 border-foreground rounded-lg bg-background text-foreground focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-background py-3 rounded-lg font-semibold hover:opacity-90 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/auth/signin"
              className="inline-flex items-center gap-2 text-sm text-accent hover:opacity-80 hover:underline font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
