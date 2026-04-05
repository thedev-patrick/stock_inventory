import Link from "next/link"
import { Package, ClipboardList, History, Users, Building, ArrowRight } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center space-y-6 mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
            Inventory <span className="text-accent">Tracker</span>
          </h1>
          <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
            Track your gadgets and manage who borrows them with ease. Collaborate with teams and keep everything organized.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="bg-accent text-background px-6 py-3 rounded-lg hover:opacity-90 transition-colors inline-flex items-center gap-2 font-medium"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/auth/signin"
              className="border border-accent/20 text-foreground px-6 py-3 rounded-lg hover:bg-accent/10 transition-colors inline-flex items-center gap-2 font-medium"
            >
              Sign In
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-background border border-accent/20 rounded-lg p-8 hover:border-accent/40 transition-colors">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Track Items</h3>
            </div>
            <p className="text-foreground/70 mb-4">
              Keep an organized inventory of all your gadgets and equipment
            </p>
            <ul className="text-sm text-foreground/60 space-y-1">
              <li>• Add items with categories and descriptions</li>
              <li>• Track borrowing status and due dates</li>
              <li>• Search and filter your inventory</li>
            </ul>
          </div>

          <div className="bg-background border border-accent/20 rounded-lg p-8 hover:border-accent/40 transition-colors">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Team Collaboration</h3>
            </div>
            <p className="text-foreground/70 mb-4">
              Work together with your team on shared inventory
            </p>
            <ul className="text-sm text-foreground/60 space-y-1">
              <li>• Create and manage teams</li>
              <li>• Invite members to collaborate</li>
              <li>• Share items across your team</li>
            </ul>
          </div>

          <div className="bg-background border border-accent/20 rounded-lg p-8 hover:border-accent/40 transition-colors">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                <ClipboardList className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Monitor Borrowing</h3>
            </div>
            <p className="text-foreground/70 mb-4">
              Record who borrowed what and when it's due back
            </p>
            <ul className="text-sm text-foreground/60 space-y-1">
              <li>• Mark items as borrowed or returned</li>
              <li>• Set expected return dates</li>
              <li>• Track borrower information</li>
            </ul>
          </div>

          <div className="bg-background border border-accent/20 rounded-lg p-8 hover:border-accent/40 transition-colors">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                <History className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">View History</h3>
            </div>
            <p className="text-foreground/70 mb-4">
              Complete history of all borrowing activities
            </p>
            <ul className="text-sm text-foreground/60 space-y-1">
              <li>• Full audit trail of item usage</li>
              <li>• Export and reporting capabilities</li>
              <li>• Historical data analysis</li>
            </ul>
          </div>
        </div>

        <div className="text-center">
          <div className="bg-background border border-accent/20 rounded-lg p-8 max-w-2xl mx-auto">
            <Building className="h-12 w-12 text-accent/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Ready to get organized?</h3>
            <p className="text-foreground/70 mb-6">
              Join thousands of teams already using Inventory Tracker to manage their equipment
            </p>
            <Link
              href="/auth/signup"
              className="bg-accent text-background px-8 py-3 rounded-lg hover:opacity-90 transition-colors inline-flex items-center gap-2 font-medium"
            >
              Start Tracking Today
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
