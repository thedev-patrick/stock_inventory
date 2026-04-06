"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import ConfirmModal from "../../../components/confirm-modal"
import { Plus, Users, Package, Mail, Trash2, Crown, User, Search } from "lucide-react"

interface Team {
  id: string
  name: string
  description?: string
  owner: {
    id: string
    name?: string
    email: string
  }
  members: Array<{
    user: {
      id: string
      name?: string
      email: string
    }
  }>
  items: Array<{
    id: string
    name: string
    description?: string
    category?: string
    borrowRecords: Array<{
      id: string
      borrowerName: string
      returnedAt: null
      validatedBy: string | null
    }>
  }>
  userRole: "OWNER" | "MEMBER"
}

export default function TeamPage() {
  const params = useParams()
  const router = useRouter()
  const teamId = params.id as string

  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [showAddItemForm, setShowAddItemForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [suggestedUsers, setSuggestedUsers] = useState<Array<{ id: string; name?: string; email: string }>>([])
  const [searchingUsers, setSearchingUsers] = useState(false)
  const [searchUsersError, setSearchUsersError] = useState<string | null>(null)
  const [itemSearchQuery, setItemSearchQuery] = useState("")
  const [itemError, setItemError] = useState<string | null>(null)
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    category: "",
  })
  const [confirmDelete, setConfirmDelete] = useState<{
    type: "member" | "team"
    targetId?: string
    title: string
    description: string
  } | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    fetchTeam()
  }, [teamId])

  useEffect(() => {
    const query = inviteEmail.trim()
    if (query.length < 2) {
      setSuggestedUsers([])
      setSearchingUsers(false)
      setSearchUsersError(null)
      return
    }

    const timeout = setTimeout(async () => {
      setSearchingUsers(true)
      setSearchUsersError(null)

      try {
        const response = await fetch(`/api/users?search=${encodeURIComponent(query)}`)
        if (!response.ok) {
          throw new Error("Unable to search users")
        }

        const users = await response.json()
        setSuggestedUsers(users)
      } catch (error) {
        console.error("Error searching users:", error)
        setSearchUsersError("Unable to load matching users")
        setSuggestedUsers([])
      } finally {
        setSearchingUsers(false)
      }
    }, 300)

    return () => clearTimeout(timeout)
  }, [inviteEmail])

  const fetchTeam = async () => {
    try {
      const response = await fetch(`/api/teams/${teamId}`)
      if (response.ok) {
        const data = await response.json()
        setTeam(data)
      } else if (response.status === 403) {
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Error fetching team:", error)
    } finally {
      setLoading(false)
    }
  }

  const inviteMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    try {
      const response = await fetch(`/api/teams/${teamId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      })

      if (response.ok) {
        setInviteEmail("")
        setSuggestedUsers([])
        setSearchUsersError(null)
        setShowInviteForm(false)
        fetchTeam()
      }
    } catch (error) {
      console.error("Error inviting member:", error)
    }
  }

  const removeMember = (userId: string) => {
    setConfirmDelete({
      type: "member",
      targetId: userId,
      title: "Remove team member",
      description: "Are you sure you want to remove this member from the team? This action cannot be undone.",
    })
  }

  const selectSuggestedUser = (email: string) => {
    setInviteEmail(email)
    setSuggestedUsers([])
  }

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItem.name.trim()) return

    setItemError(null)

    try {
      const response = await fetch(`/api/teams/${teamId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      })

      if (response.ok) {
        setNewItem({ name: "", description: "", category: "" })
        setShowAddItemForm(false)
        setItemError(null)
        fetchTeam()
      } else {
        const data = await response.json()
        setItemError(data.error || "Failed to add item")
      }
    } catch (error) {
      console.error("Error adding item:", error)
      setItemError("Failed to add item")
    }
  }

  const deleteTeam = () => {
    setConfirmDelete({
      type: "team",
      title: "Delete team",
      description: "Are you sure you want to delete this team? This action cannot be undone.",
    })
  }

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return

    setDeleteLoading(true)

    try {
      if (confirmDelete.type === "member" && confirmDelete.targetId) {
        const response = await fetch(`/api/teams/${teamId}/members/${confirmDelete.targetId}`, {
          method: "DELETE",
        })

        if (response.ok) {
          fetchTeam()
        }
      }

      if (confirmDelete.type === "team") {
        const response = await fetch(`/api/teams/${teamId}`, {
          method: "DELETE",
        })

        if (response.ok) {
          router.push("/dashboard/teams")
        }
      }
    } catch (error) {
      console.error("Error deleting team:", error)
    } finally {
      setDeleteLoading(false)
      setConfirmDelete(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-foreground mb-2">Team not found</h1>
        <p className="text-foreground/70">The team you're looking for doesn't exist or you don't have access.</p>
      </div>
    )
  }

  const existingMemberEmails = [
    team.owner.email,
    ...team.members.map((member) => member.user.email),
  ]

  const filteredSuggestedUsers = suggestedUsers.filter(
    (user) => !existingMemberEmails.includes(user.email)
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{team.name}</h1>
          {team.description && (
            <p className="text-foreground/70 mt-1">{team.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm px-2 py-1 bg-accent/10 text-accent rounded-full">
              {team.userRole}
            </span>
            <span className="text-sm text-foreground/60">
              Owned by {team.owner.name || team.owner.email}
            </span>
          </div>
        </div>

        {team.userRole === "OWNER" && (
          <button
            type="button"
            onClick={deleteTeam}
            className="flex items-center gap-2 px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Delete Team
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Members */}
        <div className="bg-background border border-accent/20 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members ({team.members.filter(member => member.user.id !== team.owner.id).length})
            </h2>
            {team.userRole === "OWNER" && (
              <button
                type="button"
                onClick={() => setShowInviteForm(true)}
                className="flex items-center gap-2 bg-accent text-background px-3 py-1 rounded-lg text-sm hover:opacity-90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Invite
              </button>
            )}
          </div>

          {showInviteForm && (
            <form onSubmit={inviteMember} className="mb-4 p-4 bg-accent/5 rounded-lg">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="flex-1 px-3 py-2 border border-accent/20 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                />
                <button
                  type="submit"
                  className="bg-accent text-background px-4 py-2 rounded-lg hover:opacity-90 transition-colors"
                >
                  Invite
                </button>
                <button
                  type="button"
                  onClick={() => setShowInviteForm(false)}
                  className="px-4 py-2 border border-accent/20 rounded-lg text-foreground hover:bg-accent/10 transition-colors"
                >
                  Cancel
                </button>
              </div>

              {inviteEmail.trim().length >= 2 && (
                <div className="mt-3 rounded-xl border border-accent/20 bg-background shadow-sm">
                  {searchingUsers ? (
                    <div className="px-3 py-2 text-sm text-foreground/60">Searching users…</div>
                  ) : searchUsersError ? (
                    <div className="px-3 py-2 text-sm text-red-600">{searchUsersError}</div>
                  ) : filteredSuggestedUsers.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-foreground/60">No matching users found.</div>
                  ) : (
                    filteredSuggestedUsers.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        title={`Select ${user.email}`}
                        aria-label={`Select ${user.email}`}
                        onClick={() => selectSuggestedUser(user.email)}
                        className="w-full text-left px-3 py-3 hover:bg-accent/10 transition-colors"
                      >
                        <p className="text-sm font-medium text-foreground">{user.name || user.email}</p>
                        <p className="text-xs text-foreground/60">{user.email}</p>
                      </button>
                    ))
                  )}
                </div>
              )}
            </form>
          )}

          <div className="space-y-3">
            {/* Show owner first */}
            <div className="flex items-center justify-between p-3 bg-accent/10 rounded-lg border border-accent/20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                  <Crown className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {team.owner.name || team.owner.email} <span className="text-xs px-2 py-1 bg-accent/20 text-accent rounded-full ml-2">Owner</span>
                  </p>
                  <p className="text-sm text-foreground/60">{team.owner.email}</p>
                </div>
              </div>
            </div>

            {/* Show other members */}
            {team.members
              .filter(member => member.user.id !== team.owner.id)
              .map((member) => {
              const isCurrentUser = member.user.id === "current-user-id" // TODO: Get from session

              return (
                <div key={member.user.id} className="flex items-center justify-between p-3 bg-accent/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {member.user.name || member.user.email}
                      </p>
                      <p className="text-sm text-foreground/60">{member.user.email}</p>
                    </div>
                  </div>

                  {team.userRole === "OWNER" && (
                    <button
                      type="button"
                      title="Remove member"
                      aria-label="Remove member"
                      onClick={() => removeMember(member.user.id)}
                      className="text-red-600 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Team Items */}
        <div className="bg-background border border-accent/20 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Package className="h-5 w-5" />
              Team Items ({team.items.length})
            </h2>
            <button
              type="button"
              onClick={() => setShowAddItemForm(true)}
              className="flex items-center gap-2 bg-accent text-background px-3 py-1 rounded-lg text-sm hover:opacity-90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Item
            </button>
          </div>

          {showAddItemForm && (
            <form onSubmit={addItem} className="mb-4 p-4 bg-accent/5 rounded-lg space-y-3">
              {itemError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  {itemError}
                </div>
              )}
              <div>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="Item name"
                  className="w-full px-3 py-2 border border-accent/20 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                />
              </div>
              <div>
                <input
                  type="text"
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  placeholder="Category (optional)"
                  className="w-full px-3 py-2 border border-accent/20 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Description (optional)"
                  rows={2}
                  className="w-full px-3 py-2 border border-accent/20 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-accent text-background px-4 py-2 rounded-lg hover:opacity-90 transition-colors"
                >
                  Add Item
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddItemForm(false)
                    setItemError(null)
                  }}
                  className="px-4 py-2 border border-accent/20 rounded-lg text-foreground hover:bg-accent/10 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {team.items.length === 0 ? (
            <p className="text-foreground/60 text-center py-8">
              No items in this team yet. Add your first item!
            </p>
          ) : (
            <>
              {/* Item Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground/40" />
                <input
                  type="text"
                  value={itemSearchQuery}
                  onChange={(e) => setItemSearchQuery(e.target.value)}
                  placeholder="Search items by name or category..."
                  className="w-full pl-10 pr-4 py-2 border border-accent/20 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div className="space-y-3">
                {team.items
                  .filter((item) =>
                    item.name.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
                    item.category?.toLowerCase().includes(itemSearchQuery.toLowerCase())
                  )
                  .map((item) => (
                    <Link
                      key={item.id}
                      href={`/dashboard/items/${item.id}`}
                      className="block p-3 bg-accent/5 rounded-lg hover:bg-accent/10 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-foreground">{item.name}</h3>
                          {item.category && (
                            <span className="text-xs px-2 py-1 bg-accent/10 text-accent rounded-full">
                              {item.category}
                            </span>
                          )}
                          {item.description && (
                            <p className="text-sm text-foreground/70 mt-1">{item.description}</p>
                          )}
                        </div>
                        {item.borrowRecords.length > 0 && (
                          <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">
                            Borrowed by {item.borrowRecords[0].borrowerName}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
              </div>
            </>
          )}
        </div>
      </div>
      {confirmDelete && (
        <ConfirmModal
          title={confirmDelete.title}
          description={confirmDelete.description}
          confirmText={confirmDelete.type === "team" ? "Delete team" : "Remove member"}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDelete(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  )
}