"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Package, Plus, CheckCircle, Clock, Search } from "lucide-react"

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

export default function ItemsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showBorrowModal, setShowBorrowModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    } else if (status === "authenticated") {
      fetchItems()
    }
  }, [status, router])

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/items")
      const data = await res.json()
      setItems(data.items || [])
    } catch (error) {
      console.error("Error fetching items:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const category = formData.get("category") as string

    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || null,
          category: category || null,
        }),
      })

      if (res.ok) {
        setShowAddModal(false)
        fetchItems()
      }
    } catch (error) {
      console.error("Error adding item:", error)
    }
  }

  const handleBorrowItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedItem) return

    const formData = new FormData(e.currentTarget)
    const borrowerName = formData.get("borrowerName") as string
    const borrowerEmail = formData.get("borrowerEmail") as string
    const borrowerPhone = formData.get("borrowerPhone") as string
    const expectedReturnAt = formData.get("expectedReturnAt") as string

    try {
      const res = await fetch(`/api/borrow-records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: selectedItem.id,
          borrowerName,
          borrowerEmail: borrowerEmail || null,
          borrowerPhone: borrowerPhone || null,
          expectedReturnAt,
        }),
      })

      if (res.ok) {
        setShowBorrowModal(false)
        setSelectedItem(null)
        fetchItems()
      }
    } catch (error) {
      console.error("Error borrowing item:", error)
    }
  }

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const availableItems = filteredItems.filter(item =>
    !item.borrowRecords.some(record => record.returnedAt === null)
  )

  const borrowedItems = filteredItems.filter(item =>
    item.borrowRecords.some(record => record.returnedAt === null)
  )

  if (status === "loading") {
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
          <h1 className="text-3xl font-bold text-foreground">My Items</h1>
          <p className="text-foreground/70 mt-1">
            Manage your personal inventory
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-accent text-background px-4 py-2 rounded-lg hover:opacity-90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Item
        </button>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => {
          const isBorrowed = item.borrowRecords.some(record => record.returnedAt === null)
          const currentBorrow = item.borrowRecords.find(record => record.returnedAt === null)

          return (
            <div
              key={item.id}
              className="bg-background border border-accent/20 rounded-lg p-6 hover:border-accent/40 transition-colors"
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

              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Link
                  href={`/dashboard/items/${item.id}`}
                  className="text-sm font-semibold text-accent hover:text-accent/80"
                >
                  Manage item
                </Link>
              </div>

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
                  onClick={() => {
                    setSelectedItem(item)
                    setShowBorrowModal(true)
                  }}
                  className="w-full bg-accent text-background px-4 py-2 rounded-lg hover:opacity-90 transition-colors text-sm font-medium"
                >
                  Mark as Borrowed
                </button>
              )}
            </div>
          )
        })}
      </div>

      {filteredItems.length === 0 && !loading && (
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
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-foreground mb-4">Add New Item</h2>
            <form onSubmit={handleAddItem}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-3 py-2 border border-accent/20 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    name="category"
                    className="w-full px-3 py-2 border border-accent/20 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    className="w-full px-3 py-2 border border-accent/20 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-accent text-background px-4 py-2 rounded-lg hover:opacity-90 transition-colors"
                >
                  Add Item
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-accent/20 rounded-lg text-foreground hover:bg-accent/10 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Borrow Item Modal */}
      {showBorrowModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Borrow "{selectedItem.name}"
            </h2>
            <form onSubmit={handleBorrowItem}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Borrower Name *
                  </label>
                  <input
                    type="text"
                    name="borrowerName"
                    required
                    className="w-full px-3 py-2 border border-accent/20 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="borrowerEmail"
                    className="w-full px-3 py-2 border border-accent/20 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="borrowerPhone"
                    className="w-full px-3 py-2 border border-accent/20 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Expected Return Date *
                  </label>
                  <input
                    type="date"
                    name="expectedReturnAt"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-accent/20 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-accent text-background px-4 py-2 rounded-lg hover:opacity-90 transition-colors"
                >
                  Mark as Borrowed
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBorrowModal(false)
                    setSelectedItem(null)
                  }}
                  className="px-4 py-2 border border-accent/20 rounded-lg text-foreground hover:bg-accent/10 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}