"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import ConfirmModal from "../../../components/confirm-modal"
import Pagination from "../../../../components/pagination"
import { useDebouncedValue } from "@/lib/use-debounced-value"
import { Plus, Users, Package, Mail, Trash2, Crown, User, Search, Pencil } from "lucide-react"

const MEMBERS_PAGE_SIZE = 20
const ITEMS_PAGE_SIZE = 20

interface Team {
  id: string
  name: string
  description?: string
  owner: {
    id: string
    name?: string
    email: string
  }
  _count: {
    members: number
    items: number
  }
  userRole: "OWNER" | "MEMBER"
}

interface Member {
  user: {
    id: string
    name?: string
    email: string
  }
}

interface TeamItem {
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
}

export default function TeamPage() {
  const params = useParams()
  const router = useRouter()
  const teamId = params.id as string

  const [team, setTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [membersTotal, setMembersTotal] = useState(0)
  const [membersPage, setMembersPage] = useState(1)
  const [memberSearch, setMemberSearch] = useState("")
  const debouncedMemberSearch = useDebouncedValue(memberSearch)
  const [items, setItems] = useState<TeamItem[]>([])
  const [itemsTotal, setItemsTotal] = useState(0)
  const [itemsPage, setItemsPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [showAddItemForm, setShowAddItemForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [suggestedUsers, setSuggestedUsers] = useState<Array<{ id: string; name?: string; email: string }>>([])
  const [searchingUsers, setSearchingUsers] = useState(false)
  const [searchUsersError, setSearchUsersError] = useState<string | null>(null)
  const [itemSearchQuery, setItemSearchQuery] = useState("")
  const debouncedItemSearch = useDebouncedValue(itemSearchQuery)
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
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editError, setEditError] = useState<string | null>(null)
  const [editSaving, setEditSaving] = useState(false)

  useEffect(() => {
    fetchTeam()
  }, [teamId])

  useEffect(() => {
    setMembersPage(1)
  }, [debouncedMemberSearch])

  useEffect(() => {
    setItemsPage(1)
  }, [debouncedItemSearch])

  useEffect(() => {
    fetchMembers()
  }, [teamId, membersPage, debouncedMemberSearch])

  useEffect(() => {
    fetchItems()
  }, [teamId, itemsPage, debouncedItemSearch])

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
        const response = await fetch(`/api/users?search=${encodeURIComponent(query)}&teamId=${teamId}`)
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

  const fetchMembers = async () => {
    try {
      const query = new URLSearchParams({ page: String(membersPage), limit: String(MEMBERS_PAGE_SIZE) })
      if (debouncedMemberSearch.trim()) query.set("q", debouncedMemberSearch.trim())
      const response = await fetch(`/api/teams/${teamId}/members?${query}`)
      if (response.ok) {
        const data = await response.json()
        setMembers(data.members)
        setMembersTotal(data.total)
      }
    } catch (error) {
      console.error("Error fetching members:", error)
    }
  }

  const fetchItems = async () => {
    try {
      const query = new URLSearchParams({ page: String(itemsPage), limit: String(ITEMS_PAGE_SIZE) })
      if (debouncedItemSearch.trim()) query.set("q", debouncedItemSearch.trim())
      const response = await fetch(`/api/teams/${teamId}/items?${query}`)
      if (response.ok) {
        const data = await response.json()
        setItems(data.items)
        setItemsTotal(data.total)
      }
    } catch (error) {
      console.error("Error fetching items:", error)
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
        fetchMembers()
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
        fetchItems()
      } else {
        const data = await response.json()
        setItemError(data.error || "Failed to add item")
      }
    } catch (error) {
      console.error("Error adding item:", error)
      setItemError("Failed to add item")
    }
  }

  const startEditing = () => {
    if (!team) return
    setEditName(team.name)
    setEditDescription(team.description || "")
    setEditError(null)
    setEditing(true)
  }

  const saveTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editName.trim()) return

    setEditSaving(true)
    setEditError(null)

    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, description: editDescription }),
      })

      if (response.ok) {
        const updated = await response.json()
        setTeam((prev) => (prev ? { ...prev, name: updated.name, description: updated.description ?? undefined } : prev))
        setEditing(false)
      } else {
        const data = await response.json()
        setEditError(data.error || "Failed to update team")
      }
    } catch (error) {
      console.error("Error updating team:", error)
      setEditError("Failed to update team")
    } finally {
      setEditSaving(false)
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
          fetchMembers()
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

  // The users endpoint already excludes existing members when given a teamId
  const filteredSuggestedUsers = suggestedUsers

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="flex-1 min-w-0">
          {editing ? (
            <form onSubmit={saveTeam} className="space-y-3 mb-2">
              {editError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  {editError}
                </div>
              )}
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Team name"
                aria-label="Team name"
                required
                autoFocus
                className="w-full px-3 py-2 border border-accent/20 rounded-lg bg-background text-foreground text-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Description (optional)"
                aria-label="Team description"
                rows={2}
                className="w-full px-3 py-2 border border-accent/20 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={editSaving}
                  className="bg-accent text-background px-4 py-2 rounded-lg hover:opacity-90 transition-colors disabled:opacity-50"
                >
                  {editSaving ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 border border-accent/20 rounded-lg text-foreground hover:bg-accent/10 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground break-words">{team.name}</h1>
              {team.description && (
                <p className="text-foreground/70 mt-1 text-sm sm:text-base">{team.description}</p>
              )}
            </>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="text-xs sm:text-sm px-2 py-1 bg-accent/10 text-accent rounded-full">
              {team.userRole}
            </span>
            <span className="text-xs sm:text-sm text-foreground/60 break-words">
              Owned by {team.owner.name || team.owner.email}
            </span>
          </div>
        </div>

        {team.userRole === "OWNER" && (
          <div className="flex gap-2 flex-shrink-0">
          {!editing && (
            <button
              type="button"
              onClick={startEditing}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 border border-accent/20 text-foreground rounded-lg hover:bg-accent/10 transition-colors text-sm whitespace-nowrap"
            >
              <Pencil className="h-4 w-4" />
              <span className="hidden sm:inline">Edit Team</span>
              <span className="sm:hidden">Edit</span>
            </button>
          )}
          <button
            type="button"
            onClick={deleteTeam}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm whitespace-nowrap flex-shrink-0"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Delete Team</span>
            <span className="sm:hidden">Delete</span>
          </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Members */}
        <div className="bg-background border border-accent/20 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members ({Math.max(0, team._count.members - 1)})
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
            {team._count.members > 21 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground/40" />
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Search members by name or email..."
                  className="w-full pl-10 pr-4 py-2 border border-accent/20 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            )}

            {members
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

            {members.length === 0 && memberSearch.trim() && (
              <p className="text-foreground/60 text-center py-4">No members match your search</p>
            )}

            <Pagination page={membersPage} total={membersTotal} limit={MEMBERS_PAGE_SIZE} onPageChange={setMembersPage} />
          </div>
        </div>

        {/* Team Items */}
        <div className="bg-background border border-accent/20 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Package className="h-5 w-5" />
              Team Items ({team._count.items})
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

          {team._count.items === 0 ? (
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
                {items
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
                {items.length === 0 && (
                  <p className="text-foreground/60 text-center py-4">No items match your search</p>
                )}
              </div>
              <Pagination page={itemsPage} total={itemsTotal} limit={ITEMS_PAGE_SIZE} onPageChange={setItemsPage} />
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