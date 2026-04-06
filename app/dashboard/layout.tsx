"use client"

import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { signOut } from "next-auth/react"
import { Package, Users, LogOut, Home, Menu, X } from "lucide-react"
import Link from "next/link"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "My Items", href: "/dashboard/items", icon: Package },
    { name: "Teams", href: "/dashboard/teams", icon: Users },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-background border-b border-accent/20">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <Package className="h-6 w-6 text-accent mr-2" />
            <span className="text-lg font-bold text-foreground">Inventory</span>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-foreground hover:bg-accent/10 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 mt-[57px]"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`lg:hidden fixed top-[57px] left-0 right-0 bottom-0 z-50 bg-background transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"))
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-accent text-background"
                      : "text-foreground hover:bg-accent/10"
                  }`}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User info and logout */}
          <div className="p-4 border-t border-accent/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center flex-1 min-w-0">
                <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-sm font-medium text-accent">
                    {session?.user?.name?.[0] || session?.user?.email?.[0] || "U"}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {session?.user?.name || "User"}
                  </p>
                  <p className="text-xs text-foreground/60 truncate">
                    {session?.user?.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => signOut()}
                className="p-2 text-foreground/60 hover:text-foreground hover:bg-accent/10 rounded-lg transition-colors flex-shrink-0"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed inset-y-0 left-0 w-64 bg-background border-r border-accent/20">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center px-6 py-4 border-b border-accent/20">
            <Package className="h-8 w-8 text-accent mr-3" />
            <span className="text-xl font-bold text-foreground">Inventory</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"))
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-accent text-background"
                      : "text-foreground hover:bg-accent/10"
                  }`}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User info and logout */}
          <div className="p-4 border-t border-accent/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center flex-1 min-w-0">
                <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-sm font-medium text-accent">
                    {session?.user?.name?.[0] || session?.user?.email?.[0] || "U"}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {session?.user?.name || "User"}
                  </p>
                  <p className="text-xs text-foreground/60 truncate">
                    {session?.user?.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => signOut()}
                className="p-2 text-foreground/60 hover:text-foreground hover:bg-accent/10 rounded-lg transition-colors flex-shrink-0"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pt-[57px] lg:pt-0 lg:ml-64">
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}