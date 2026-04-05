"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react"
import { validatePassword, getPasswordStrengthColor, getPasswordStrengthBg } from "@/lib/password-validation"

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [passwordValidation, setPasswordValidation] = useState({
    isValid: false,
    errors: [] as string[],
    strength: 'weak' as 'weak' | 'medium' | 'strong'
  })
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token")
    }
  }, [token])

  useEffect(() => {
    if (password) {
      const validation = validatePassword(password)
      setPasswordValidation(validation)
    }
  }, [password])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setTouched(true)
    setLoading(true)

    if (!token) {
      setError("Invalid or missing reset token")
      setLoading(false)
      return
    }

    // Validate password
    if (!passwordValidation.isValid) {
      setError("Please fix password validation errors")
      setLoading(false)
      return
    }

    // Check password confirmation
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Something went wrong")
        setLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/auth/signin")
      }, 3000)
    } catch (error) {
      setError("Something went wrong")
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
        <div className="w-full max-w-md animate-fadeIn">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-accent rounded-2xl mb-4 animate-scaleIn">
              <CheckCircle className="w-8 h-8 text-background" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">
              Password Reset!
            </h1>
            <p className="text-foreground">Your password has been successfully reset</p>
          </div>

          <div className="bg-background rounded-2xl border-2 border-foreground p-8">
            <p className="text-center text-foreground mb-6">
              Redirecting you to sign in...
            </p>
            <Link
              href="/auth/signin"
              className="flex items-center justify-center w-full bg-accent text-background py-3 rounded-lg font-semibold hover:opacity-90 transition-all hover:scale-105"
            >
              Sign In Now
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
            <Lock className="w-8 h-8 text-background" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">
            Reset Password
          </h1>
          <p className="text-foreground">Choose a new password for your account</p>
        </div>

        <div className="bg-background rounded-2xl border-2 border-foreground p-8 animate-fadeIn" style={{ animationDelay: "0.1s" }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="border-2 border-accent text-accent px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-foreground mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground opacity-50 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched(true)}
                  required
                  autoComplete="new-password"
                  className="w-full pl-12 pr-12 py-3 border-2 border-foreground rounded-lg bg-background text-foreground focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground opacity-50 hover:opacity-100 transition-opacity"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {password && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-foreground/20 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${getPasswordStrengthBg(passwordValidation.strength)}`}
                        style={{
                          width: passwordValidation.strength === 'weak' ? '33%' :
                                 passwordValidation.strength === 'medium' ? '66%' : '100%'
                        }}
                      />
                    </div>
                    <span className={`text-xs font-semibold ${getPasswordStrengthColor(passwordValidation.strength)}`}>
                      {passwordValidation.strength.charAt(0).toUpperCase() + passwordValidation.strength.slice(1)}
                    </span>
                  </div>

                  {touched && passwordValidation.errors.length > 0 && (
                    <ul className="text-xs text-accent space-y-1">
                      {passwordValidation.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-foreground mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground opacity-50 pointer-events-none" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="w-full pl-12 pr-12 py-3 border-2 border-foreground rounded-lg bg-background text-foreground focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground opacity-50 hover:opacity-100 transition-opacity"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {touched && confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-accent mt-1">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full bg-accent text-background py-3 rounded-lg font-semibold hover:opacity-90 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/auth/signin"
              className="text-sm text-accent hover:opacity-80 hover:underline font-semibold"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ResetPassword() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
