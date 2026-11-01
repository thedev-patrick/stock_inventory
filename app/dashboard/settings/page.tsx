"use client"

import { useEffect, useState } from "react"
import { Lock, Eye, EyeOff, Download, CheckCircle } from "lucide-react"
import { validatePassword, getPasswordStrengthColor, getPasswordStrengthBg } from "@/lib/password-validation"

type Team = { id: string; name: string }

const inputClass =
  "w-full pl-12 pr-12 py-3 border-2 border-foreground rounded-lg bg-background text-foreground focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all"

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  autoComplete: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-foreground mb-2">
        {label}
      </label>
      <div className="relative">
        <Lock aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground opacity-50 pointer-events-none" />
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          autoComplete={autoComplete}
          className={inputClass}
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground opacity-50 hover:opacity-100 transition-opacity"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [saving, setSaving] = useState(false)

  const [teams, setTeams] = useState<Team[]>([])
  const [scope, setScope] = useState("all")
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState("")

  const validation = validatePassword(newPassword)

  useEffect(() => {
    fetch("/api/teams")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setTeams(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!validation.isValid) {
      setError("Please fix password validation errors")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Something went wrong")
        return
      }
      setSuccess("Your password has been updated")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch {
      setError("Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  const handleExport = async () => {
    setExportError("")
    setExporting(true)
    try {
      const res = await fetch(`/api/reports/export?scope=${encodeURIComponent(scope)}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setExportError(data.error || "Failed to export report")
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `inventory-report-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      setExportError("Failed to export report")
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-foreground/60 mt-1">Manage your account and export your data</p>
      </div>

      <section className="rounded-2xl border-2 border-foreground p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Change Password</h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-5">
          {error && (
            <div className="border-2 border-accent text-accent px-4 py-3 rounded-lg text-sm">{error}</div>
          )}
          {success && (
            <div className="flex items-center gap-2 border-2 border-accent text-accent px-4 py-3 rounded-lg text-sm">
              <CheckCircle className="w-4 h-4" /> {success}
            </div>
          )}

          <PasswordField id="currentPassword" label="Current Password" value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" />

          <div>
            <PasswordField id="newPassword" label="New Password" value={newPassword} onChange={setNewPassword} autoComplete="new-password" />
            {newPassword && (
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-foreground/20 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${getPasswordStrengthBg(validation.strength)}`}
                      style={{ width: validation.strength === "weak" ? "33%" : validation.strength === "medium" ? "66%" : "100%" }}
                    />
                  </div>
                  <span className={`text-xs font-semibold ${getPasswordStrengthColor(validation.strength)}`}>
                    {validation.strength.charAt(0).toUpperCase() + validation.strength.slice(1)}
                  </span>
                </div>
                {validation.errors.length > 0 && (
                  <ul className="text-xs text-accent space-y-1">
                    {validation.errors.map((err, i) => (
                      <li key={i}>• {err}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div>
            <PasswordField id="confirmPassword" label="Confirm New Password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-accent mt-1">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-accent text-background py-3 rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Updating..." : "Update Password"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border-2 border-foreground p-6">
        <h2 className="text-xl font-semibold text-foreground mb-1">Export Report</h2>
        <p className="text-sm text-foreground/60 mb-4">
          Download a CSV of your items and their borrow history.
        </p>
        {exportError && (
          <div className="border-2 border-accent text-accent px-4 py-3 rounded-lg text-sm mb-4">{exportError}</div>
        )}
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            aria-label="Report scope"
            className="flex-1 px-4 py-3 border-2 border-foreground rounded-lg bg-background text-foreground focus:ring-2 focus:ring-accent outline-none"
          >
            <option value="all">All inventories</option>
            <option value="personal">Personal items only</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                Team: {t.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center justify-center gap-2 bg-accent text-background px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50"
          >
            <Download className="w-5 h-5" />
            {exporting ? "Exporting..." : "Export CSV"}
          </button>
        </div>
      </section>
    </div>
  )
}
