"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import ConfirmModal from "../../../components/confirm-modal"
import { ArrowLeft, Edit2, Trash2, Package, User, Mail, Phone, Calendar, FileText, CheckCircle, Clock, X } from "lucide-react"

type BorrowRecord = {
  id: string
  borrowerName: string
  borrowerEmail: string | null
  borrowerPhone: string | null
  borrowedAt: string
  expectedReturnAt: string
  returnedAt: string | null
  validatedBy: string | null
  notes: string | null
}

type Item = {
  id: string
  name: string
  description: string | null
  category: string | null
  borrowRecords: BorrowRecord[]
}

export default function ItemDetail() {
  const router = useRouter()
  const params = useParams()
  const { status } = useSession()
  const [item, setItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(true)
  const [showBorrowModal, setShowBorrowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    } else if (status === "authenticated") {
      fetchItem()
    }
  }, [status, params.id])

  const fetchItem = async () => {
    try {
      const res = await fetch(`/api/items/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setItem(data.item)
      } else {
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Error fetching item:", error)
      router.push("/dashboard")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = () => {
    setShowDeleteModal(true)
  }

  const confirmDeleteItem = async () => {
    setDeleteLoading(true)

    try {
      const res = await fetch(`/api/items/${params.id}`, { method: "DELETE" })
      if (res.ok) {
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Error deleting item:", error)
    } finally {
      setDeleteLoading(false)
      setShowDeleteModal(false)
    }
  }

  const handleMarkReturned = async (recordId: string) => {
    try {
      const res = await fetch(`/api/borrow-records/${recordId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnedAt: new Date().toISOString() }),
      })
      if (res.ok) {
        fetchItem()
      }
    } catch (error) {
      console.error("Error marking as returned:", error)
    }
  }

  const currentBorrow = item?.borrowRecords.find((r) => !r.returnedAt)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    )
  }

  if (!item) return null

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => router.push("/dashboard/items")}
          className="flex items-center text-foreground/70 hover:text-accent transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Items
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Package className="w-6 h-6 sm:w-7 sm:h-7 text-accent" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 break-words">{item.name}</h1>
              {item.category && (
                <span className="inline-block text-xs px-2 py-1 bg-accent/10 text-accent rounded-full">
                  {item.category}
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2 sm:gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowEditModal(true)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-accent/20 rounded-lg text-foreground hover:bg-accent/10 transition-colors text-sm"
            >
              <Edit2 className="w-4 h-4" />
              <span className="hidden sm:inline">Edit</span>
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        </div>
      </div>

      {/* Description Section */}
      {item.description && (
        <div className="bg-background border border-accent/20 rounded-lg p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-accent flex-shrink-0" />
            <h2 className="text-sm sm:text-base font-semibold text-foreground">Description</h2>
          </div>
          <p className="text-sm sm:text-base text-foreground/70">{item.description}</p>
        </div>
      )}

      {/* Status Section */}
      <div className="bg-background border border-accent/20 rounded-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-foreground">Current Status</h2>
          {!currentBorrow && (
            <button
              type="button"
              onClick={() => setShowBorrowModal(true)}
              className="flex items-center justify-center gap-2 bg-accent text-background px-4 py-2 rounded-lg hover:opacity-90 transition-colors text-sm font-medium whitespace-nowrap"
            >
              <Clock className="w-4 h-4" />
              Mark as Borrowed
            </button>
          )}
        </div>

        {currentBorrow ? (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-orange-900 dark:text-orange-200">Currently Borrowed</p>
                  <p className="text-sm text-orange-800 dark:text-orange-300 mt-1 flex items-center gap-1 break-words">
                    <User className="w-3 h-3 flex-shrink-0" />
                    <span className="break-words">{currentBorrow.borrowerName}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleMarkReturned(currentBorrow.id)}
                className="flex items-center justify-center gap-2 bg-accent text-background px-3 sm:px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-colors whitespace-nowrap"
              >
                <CheckCircle className="w-4 h-4" />
                Mark Returned
              </button>
            </div>

            <div className="space-y-2">
              {currentBorrow.borrowerEmail && (
                <p className="text-sm text-orange-800 dark:text-orange-300 flex items-center gap-1 break-all">
                  <Mail className="w-3 h-3 flex-shrink-0" />
                  {currentBorrow.borrowerEmail}
                </p>
              )}
              {currentBorrow.borrowerPhone && (
                <p className="text-sm text-orange-800 dark:text-orange-300 flex items-center gap-1">
                  <Phone className="w-3 h-3 flex-shrink-0" />
                  {currentBorrow.borrowerPhone}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-sm">
              <div>
                <p className="text-orange-700 dark:text-orange-300 flex items-center gap-1 mb-1">
                  <Calendar className="w-3 h-3 flex-shrink-0" />
                  Borrowed
                </p>
                <p className="font-medium text-orange-900 dark:text-orange-200">{new Date(currentBorrow.borrowedAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-orange-700 dark:text-orange-300 flex items-center gap-1 mb-1">
                  <Calendar className="w-3 h-3 flex-shrink-0" />
                  Expected Return
                </p>
                <p className="font-medium text-orange-900 dark:text-orange-200">{new Date(currentBorrow.expectedReturnAt).toLocaleDateString()}</p>
              </div>
            </div>

            {currentBorrow.notes && (
              <p className="text-sm text-orange-800 dark:text-orange-300 mt-3 pt-3 border-t border-orange-200 dark:border-orange-800">
                <span className="font-medium text-orange-900 dark:text-orange-200">Note:</span> {currentBorrow.notes}
              </p>
            )}
          </div>
        ) : (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-900 dark:text-green-200">Available</p>
              <p className="text-sm text-green-800 dark:text-green-300">This item is currently available</p>
            </div>
          </div>
        )}
      </div>

      {/* Borrow History Section */}
      <div className="bg-background border border-accent/20 rounded-lg p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-foreground mb-4">Borrow History</h2>
        {item.borrowRecords.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-10 w-10 sm:h-12 sm:w-12 text-accent/50 mx-auto mb-3" />
            <p className="text-foreground/70 text-sm sm:text-base">No borrow history yet</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {item.borrowRecords.map((record) => (
              <div key={record.id} className="border border-accent/20 rounded-lg p-4 hover:border-accent/40 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <User className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground break-words">{record.borrowerName}</p>
                      {record.borrowerEmail && (
                        <p className="text-sm text-foreground/70 flex items-center gap-1 mt-1 break-all">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          {record.borrowerEmail}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                    record.returnedAt
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                      : "bg-accent text-background"
                  }`}>
                    {record.returnedAt ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        Returned
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3" />
                        Borrowed
                      </>
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-foreground/70 flex items-center gap-1 mb-1">
                      <Calendar className="w-3 h-3 flex-shrink-0" />
                      Borrowed
                    </p>
                    <p className="font-medium text-foreground">{new Date(record.borrowedAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-foreground/70 flex items-center gap-1 mb-1">
                      <Calendar className="w-3 h-3 flex-shrink-0" />
                      Expected Return
                    </p>
                    <p className="font-medium text-foreground">{new Date(record.expectedReturnAt).toLocaleDateString()}</p>
                  </div>
                  {record.returnedAt && (
                    <div>
                      <p className="text-foreground/70 flex items-center gap-1 mb-1">
                        <Calendar className="w-3 h-3 flex-shrink-0" />
                        Returned
                      </p>
                      <p className="font-medium text-foreground">{new Date(record.returnedAt).toLocaleDateString()}</p>
                      {record.validatedBy && (
                        <p className="text-xs text-foreground/60 mt-1">{record.validatedBy}</p>
                      )}
                    </div>
                  )}
                </div>

                {record.notes && (
                  <p className="text-sm text-foreground/70 mt-3 pt-3 border-t border-accent/20">
                    <span className="font-medium text-foreground">Note:</span> {record.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showBorrowModal && (
        <BorrowModal
          itemId={item.id}
          onClose={() => setShowBorrowModal(false)}
          onSuccess={() => {
            setShowBorrowModal(false)
            fetchItem()
          }}
        />
      )}

      {showEditModal && (
        <EditItemModal
          item={item}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false)
            fetchItem()
          }}
        />
      )}

      {showDeleteModal && (
        <ConfirmModal
          title="Delete item"
          description="Are you sure you want to delete this item? This action cannot be undone."
          confirmText="Delete item"
          onConfirm={confirmDeleteItem}
          onCancel={() => setShowDeleteModal(false)}
          loading={deleteLoading}
        />
      )}
    </div>
  )
}

function BorrowModal({ itemId, onClose, onSuccess }: { itemId: string; onClose: () => void; onSuccess: () => void }) {
  const [borrowerName, setBorrowerName] = useState("")
  const [borrowerEmail, setBorrowerEmail] = useState("")
  const [borrowerPhone, setBorrowerPhone] = useState("")
  const [expectedReturnAt, setExpectedReturnAt] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/borrow-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId,
          borrowerName,
          borrowerEmail,
          borrowerPhone,
          expectedReturnAt,
          notes,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Failed to create borrow record")
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
      <div className="bg-background rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">Mark as Borrowed</h2>
          <button type="button" onClick={onClose} className="text-foreground/70 hover:text-accent transition-colors" aria-label="Close modal">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Borrower Name *
            </label>
            <input
              type="text"
              value={borrowerName}
              onChange={(e) => setBorrowerName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-accent/20 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Email
            </label>
            <input
              type="email"
              value={borrowerEmail}
              onChange={(e) => setBorrowerEmail(e.target.value)}
              className="w-full px-3 py-2 border border-accent/20 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={borrowerPhone}
              onChange={(e) => setBorrowerPhone(e.target.value)}
              className="w-full px-3 py-2 border border-accent/20 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Expected Return Date *
            </label>
            <input
              type="date"
              value={expectedReturnAt}
              onChange={(e) => setExpectedReturnAt(e.target.value)}
              required
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-accent/20 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-accent/20 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              placeholder="Any additional information..."
            />
          </div>

          <div className="flex gap-3 pt-2">
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
              className="flex-1 bg-accent text-background px-4 py-2 rounded-lg hover:opacity-90 transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : "Mark as Borrowed"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditItemModal({ item, onClose, onSuccess }: { item: Item; onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState(item.name)
  const [description, setDescription] = useState(item.description || "")
  const [category, setCategory] = useState(item.category || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch(`/api/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, category }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Failed to update item")
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
      <div className="bg-background rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">Edit Item</h2>
          <button type="button" onClick={onClose} className="text-foreground/70 hover:text-accent transition-colors" aria-label="Close modal">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
            />
          </div>

          <div className="flex gap-3 pt-2">
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
              className="flex-1 bg-accent text-background px-4 py-2 rounded-lg hover:opacity-90 transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
