"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { signOut } from "next-auth/react"
import { Package, Plus, LogOut, CheckCircle, Clock, Search, Users, Building } from "lucide-react"

type Item = {
  id: string
  name: string
  description: string | null
  category: string | null
  borrowRecords: Array<{
    id: string
    borrowerName: string
    borrowedAt: string
    returnedAt: string | null
    expectedReturnAt: string
    validatedBy: string | null
  }>
}

type Team = {
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

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [items, setItems] = useState<Item[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    } else if (status === "authenticated") {
      fetchData()
    }
  }, [status, router])

  const fetchData = async () => {
    try {
      const [itemsRes, teamsRes] = await Promise.all([
        fetch("/api/items"),
        fetch("/api/teams")
      ])
      const itemsData = await itemsRes.json()
      const teamsData = await teamsRes.json()
      setItems(itemsData.items || [])
      setTeams(teamsData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getItemStatus = (item: Item) => {
    const latestRecord = item.borrowRecords[0]
    if (!latestRecord) return { text: "Available", color: "border border-foreground text-foreground", icon: CheckCircle }
    if (!latestRecord.returnedAt) return { text: "Borrowed", color: "bg-accent text-background", icon: Clock }
    return { text: "Available", color: "border border-foreground text-foreground", icon: CheckCircle }
  }

  const filteredItems = items.filter(item => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      item.name.toLowerCase().includes(query) ||
      (item.category && item.category.toLowerCase().includes(query))
    )
  })

  const availableItems = filteredItems.filter(item =>
    !item.borrowRecords.some(record => record.returnedAt === null)
  )

  const borrowedItems = filteredItems.filter(item =>
    item.borrowRecords.some(record => record.returnedAt === null)
  )

  if (status === "loading" || loading) {
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
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-foreground/70 mt-1">
            Welcome back, {session?.user?.name || session?.user?.email}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-accent text-background px-4 py-2 rounded-lg hover:opacity-90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className="flex items-center gap-2 text-foreground hover:text-accent font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/60 h-4 w-4" />
        <input
          type="text"
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-accent/20 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-background border border-accent/20 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-accent" />
            <div>
              <p className="text-2xl font-bold text-foreground">{items.length}</p>
              <p className="text-sm text-foreground/70">Total Items</p>
            </div>
          </div>
        </div>
        <div className="bg-background border border-accent/20 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-foreground">{availableItems.length}</p>
              <p className="text-sm text-foreground/70">Available</p>
            </div>
          </div>
        </div>
        <div className="bg-background border border-accent/20 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-2xl font-bold text-foreground">{borrowedItems.length}</p>
              <p className="text-sm text-foreground/70">Borrowed</p>
            </div>
          </div>
        </div>
        <div className="bg-background border border-accent/20 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-foreground">{teams.length}</p>
              <p className="text-sm text-foreground/70">Teams</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Items */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Recent Items</h2>
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-accent/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {searchQuery ? "No items found" : "No items yet"}
            </h3>
            <p className="text-foreground/70 mb-4">
              {searchQuery
                ? "Try adjusting your search terms"
                : "Add your first item to get started"
              }
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-accent text-background px-6 py-3 rounded-lg hover:opacity-90 transition-colors"
              >
                Add Your First Item
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.slice(0, 6).map((item) => {
              const isBorrowed = item.borrowRecords.some(record => record.returnedAt === null)
              const currentBorrow = item.borrowRecords.find(record => record.returnedAt === null)

              return (
                <div
                  key={item.id}
                  className="bg-background border border-accent/20 rounded-lg p-6 hover:border-accent/40 transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/items/${item.id}`)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        {item.name}
                      </h3>
                      {item.category && (
                        <span className="text-xs px-2 py-1 bg-accent/10 text-accent rounded-full">
                          {item.category}
                        </span>
                      )}
                    </div>
                    <div className={`w-3 h-3 rounded-full ${isBorrowed ? 'bg-orange-500' : 'bg-green-500'}`} />
                  </div>

                  {item.description && (
                    <p className="text-foreground/70 text-sm mb-4 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  {isBorrowed && currentBorrow ? (
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 mb-4">
                      <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                        Borrowed by {currentBorrow.borrowerName}
                      </p>
                      <p className="text-xs text-orange-600 dark:text-orange-300">
                        Due: {new Date(currentBorrow.expectedReturnAt).toLocaleDateString()}
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/dashboard/items/${item.id}`)
                      }}
                      className="w-full bg-accent text-background px-4 py-2 rounded-lg hover:opacity-90 transition-colors text-sm font-medium"
                    >
                      View Details
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Recent Teams */}
      {teams.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-foreground">Your Teams</h2>
            <button
              onClick={() => router.push('/dashboard/teams')}
              className="text-accent hover:text-accent/80 text-sm font-medium"
            >
              View all teams
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.slice(0, 3).map((team) => (
              <div
                key={team.id}
                className="bg-background border border-accent/20 rounded-lg p-6 hover:border-accent/40 transition-colors cursor-pointer"
                onClick={() => router.push(`/dashboard/teams/${team.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {team.name}
                    </h3>
                    <span className="text-xs px-2 py-1 bg-accent/10 text-accent rounded-full">
                      {team.role}
                    </span>
                  </div>
                  <Building className="h-5 w-5 text-accent/50" />
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
              </div>
            ))}
          </div>
        </div>
      )}

      {showAddModal && (
        <AddItemModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            fetchData()
          }}
        />
      )}
    </div>
  )
}

function AddItemModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, category }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Failed to add item")
        setLoading(false)
        return
      }

      onSuccess()
    } catch (error) {
      setError("Something went wrong")
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Add New Item</h2>
          <button onClick={onClose} className="text-foreground hover:text-accent transition-colors">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="border border-accent text-accent px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Item Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-accent/20 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="AirPods Pro"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Category
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-accent/20 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Electronics"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-accent/20 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              placeholder="Add any additional details..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-accent/20 rounded-lg text-foreground hover:bg-accent/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-accent text-background py-2 rounded-lg hover:opacity-90 transition-colors disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
