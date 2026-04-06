"use client"

import { useState, useEffect } from "react"
import { Plus, Users, Package, Search } from "lucide-react"
import Link from "next/link"

interface Team {
  id: string
  name: string
  description?: string
  role: "OWNER" | "MEMBER"
  members: Array<{
    user: {
      id: string
      name?: string
      email: string
    }
  }>
  _count: {
    items: number
  }
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTeamName, setNewTeamName] = useState("")
  const [newTeamDescription, setNewTeamDescription] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    try {
      const response = await fetch("/api/teams")
      if (response.ok) {
        const data = await response.json()
        setTeams(data)
      }
    } catch (error) {
      console.error("Error fetching teams:", error)
    } finally {
      setLoading(false)
    }
  }

  const createTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTeamName.trim()) return

    setError(null)

    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTeamName.trim(),
          description: newTeamDescription.trim() || undefined,
        }),
      })

      if (response.ok) {
        setNewTeamName("")
        setNewTeamDescription("")
        setShowCreateForm(false)
        setError(null)
        fetchTeams()
      } else {
        const data = await response.json()
        setError(data.error || "Failed to create team")
      }
    } catch (error) {
      console.error("Error creating team:", error)
      setError("Failed to create team")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Teams</h1>
          <p className="text-foreground/70 mt-1">
            Manage your teams and collaborate on inventory
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 bg-accent text-background px-4 py-2 rounded-lg hover:opacity-90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Team
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-background border border-accent/20 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Create New Team</h2>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={createTeam} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Team Name *
              </label>
              <input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                className="w-full px-3 py-2 border border-accent/20 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Enter team name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Description
              </label>
              <textarea
                value={newTeamDescription}
                onChange={(e) => setNewTeamDescription(e.target.value)}
                className="w-full px-3 py-2 border border-accent/20 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Describe your team's purpose"
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-accent text-background px-4 py-2 rounded-lg hover:opacity-90 transition-colors"
              >
                Create Team
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false)
                  setError(null)
                }}
                className="px-4 py-2 border border-accent/20 rounded-lg text-foreground hover:bg-accent/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search Bar */}
      {teams.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search teams by name..."
            className="w-full pl-10 pr-4 py-2 border border-accent/20 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      )}

      {teams.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-accent/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No teams yet</h3>
          <p className="text-foreground/70 mb-4">
            Create your first team to start collaborating on inventory management
          </p>
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="bg-accent text-background px-6 py-3 rounded-lg hover:opacity-90 transition-colors"
          >
            Create Your First Team
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.filter((team) =>
            team.name.toLowerCase().includes(searchQuery.toLowerCase())
          ).map((team) => (
            <Link
              key={team.id}
              href={`/dashboard/teams/${team.id}`}
              className="block bg-background border border-accent/20 rounded-lg p-6 hover:border-accent/40 transition-colors group"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-accent transition-colors">
                    {team.name}
                  </h3>
                  <span className="text-xs px-2 py-1 bg-accent/10 text-accent rounded-full">
                    {team.role}
                  </span>
                </div>
                <Users className="h-5 w-5 text-accent/50" />
              </div>

              {team.description && (
                <p className="text-foreground/70 text-sm mb-4 line-clamp-2">
                  {team.description}
                </p>
              )}

              <div className="flex items-center justify-between text-sm text-foreground/60">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {team.members.length} members
                </div>
                <div className="flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  {team._count.items} items
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}