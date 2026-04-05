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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent"></div>
          <p className="mt-4 text-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!item) return null

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-background border-b-2 border-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 animate-fadeIn">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center text-foreground hover:text-accent mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
          <div className="flex items-start justify-between">
            <div className="flex-1 flex items-start gap-4">
              <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center flex-shrink-0">
                <Package className="w-6 h-6 text-background" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{item.name}</h1>
                {item.category && (
                  <p className="text-sm text-foreground">{item.category}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-2 px-4 py-2 border-2 border-foreground rounded-lg text-foreground hover:bg-foreground hover:text-background font-medium transition-all"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 border-2 border-accent rounded-lg text-accent hover:bg-accent hover:text-background font-medium transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {item.description && (
          <div className="bg-background rounded-xl border-2 border-foreground p-6 mb-6 animate-fadeIn">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-accent" />
              <h2 className="text-sm font-semibold text-foreground">Description</h2>
            </div>
            <p className="text-foreground">{item.description}</p>
          </div>
        )}

        <div className="bg-background rounded-xl border-2 border-foreground p-6 mb-6 animate-fadeIn" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Status</h2>
            {!currentBorrow && (
              <button
                onClick={() => setShowBorrowModal(true)}
                className="flex items-center gap-2 bg-accent text-background px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-all hover:scale-105"
              >
                <Clock className="w-4 h-4" />
                Mark as Borrowed
              </button>
            )}
          </div>

          {currentBorrow ? (
            <div className="border-2 border-accent rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-2">
                  <Clock className="w-5 h-5 text-accent mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Currently Borrowed</p>
                    <p className="text-sm text-foreground mt-1 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {currentBorrow.borrowerName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleMarkReturned(currentBorrow.id)}
                  className="flex items-center gap-2 bg-accent text-background px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-all hover:scale-105"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark Returned
                </button>
              </div>
              {currentBorrow.borrowerEmail && (
                <p className="text-sm text-foreground flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {currentBorrow.borrowerEmail}
                </p>
              )}
              {currentBorrow.borrowerPhone && (
                <p className="text-sm text-foreground flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {currentBorrow.borrowerPhone}
                </p>
              )}
              <div className="flex gap-4 mt-3 text-sm">
                <div>
                  <p className="text-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Borrowed
                  </p>
                  <p className="font-medium text-foreground">{new Date(currentBorrow.borrowedAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Expected Return
                  </p>
                  <p className="font-medium text-foreground">{new Date(currentBorrow.expectedReturnAt).toLocaleDateString()}</p>
                </div>
              </div>
              {currentBorrow.notes && (
                <p className="text-sm text-foreground mt-3 pt-3 border-t border-foreground">
                  Note: {currentBorrow.notes}
                </p>
              )}
            </div>
          ) : (
            <div className="border-2 border-foreground rounded-lg p-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-foreground" />
              <div>
                <p className="font-semibold text-foreground">Available</p>
                <p className="text-sm text-foreground">This item is currently available</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-background rounded-xl border-2 border-foreground p-6 animate-fadeIn" style={{ animationDelay: "0.2s" }}>
          <h2 className="text-lg font-bold text-foreground mb-4">Borrow History</h2>
          {item.borrowRecords.length === 0 ? (
            <p className="text-foreground text-center py-8">No borrow history yet</p>
          ) : (
            <div className="space-y-4">
              {item.borrowRecords.map((record) => (
                <div key={record.id} className="border-2 border-foreground rounded-lg p-4 hover:border-accent transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-2">
                      <User className="w-5 h-5 text-accent mt-0.5" />
                      <div>
                        <p className="font-semibold text-foreground">{record.borrowerName}</p>
                        {record.borrowerEmail && (
                          <p className="text-sm text-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {record.borrowerEmail}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                      record.returnedAt
                        ? "border border-foreground text-foreground"
                        : "bg-accent text-background"
                    }`}>
                      {record.returnedAt ? <><CheckCircle className="w-3 h-3" />Returned</> : <><Clock className="w-3 h-3" />Borrowed</>}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 text-sm">
                    <div>
                      <p className="text-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Borrowed
                      </p>
                      <p className="font-medium text-foreground">{new Date(record.borrowedAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Expected Return
                      </p>
                      <p className="font-medium text-foreground">{new Date(record.expectedReturnAt).toLocaleDateString()}</p>
                    </div>
                    {record.returnedAt && (
                      <div>
                        <p className="text-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Returned
                        </p>
                        <p className="font-medium text-foreground">{new Date(record.returnedAt).toLocaleDateString()}</p>
                        {record.validatedBy && (
                          <p className="text-xs text-foreground/70 mt-1">{record.validatedBy}</p>
                        )}
                      </div>
                    )}
                  </div>
                  {record.notes && (
                    <p className="text-sm text-foreground mt-3 pt-3 border-t border-foreground">
                      {record.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

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
  const { X: CloseIcon } = require("lucide-react")

  const handleSubmit = async (e: React.FormEvent) => {
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
    <div className="fixed inset-0 bg-foreground bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn">
      <div className="bg-background rounded-2xl max-w-md w-full p-6 my-8 border-2 border-foreground animate-scaleIn">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Mark as Borrowed</h2>
          <button onClick={onClose} className="text-foreground hover:text-accent transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="border-2 border-accent text-accent px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Borrower Name *
            </label>
            <input
              type="text"
              value={borrowerName}
              onChange={(e) => setBorrowerName(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-foreground rounded-lg bg-background text-foreground focus:ring-2 focus:ring-accent focus:border-accent outline-none"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Email
            </label>
            <input
              type="email"
              value={borrowerEmail}
              onChange={(e) => setBorrowerEmail(e.target.value)}
              className="w-full px-4 py-3 border-2 border-foreground rounded-lg bg-background text-foreground focus:ring-2 focus:ring-accent focus:border-accent outline-none"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={borrowerPhone}
              onChange={(e) => setBorrowerPhone(e.target.value)}
              className="w-full px-4 py-3 border-2 border-foreground rounded-lg bg-background text-foreground focus:ring-2 focus:ring-accent focus:border-accent outline-none"
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Expected Return Date *
            </label>
            <input
              type="date"
              value={expectedReturnAt}
              onChange={(e) => setExpectedReturnAt(e.target.value)}
              required
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border-2 border-foreground rounded-lg bg-background text-foreground focus:ring-2 focus:ring-accent focus:border-accent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border-2 border-foreground rounded-lg bg-background text-foreground focus:ring-2 focus:ring-accent focus:border-accent outline-none resize-none"
              placeholder="Any additional information..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-foreground rounded-lg font-semibold text-foreground hover:bg-foreground hover:text-background transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-accent text-background py-3 rounded-lg font-semibold hover:opacity-90 transition-colors disabled:opacity-50"
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

  const handleSubmit = async (e: React.FormEvent) => {
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
    <div className="fixed inset-0 bg-foreground bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-2xl max-w-md w-full p-6 border-2 border-foreground">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Edit Item</h2>
          <button onClick={onClose} className="text-foreground hover:text-accent" aria-label="Close">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="border-2 border-accent text-accent px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Item Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-foreground rounded-lg bg-background text-foreground focus:ring-2 focus:ring-accent focus:border-accent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Category
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 border-2 border-foreground rounded-lg bg-background text-foreground focus:ring-2 focus:ring-accent focus:border-accent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border-2 border-foreground rounded-lg bg-background text-foreground focus:ring-2 focus:ring-accent focus:border-accent outline-none resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-foreground rounded-lg font-semibold text-foreground hover:bg-foreground hover:text-background transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-accent text-background py-3 rounded-lg font-semibold hover:opacity-90 transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
