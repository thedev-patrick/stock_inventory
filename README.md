# Inventory Tracker

A full-stack Next.js application for tracking gadgets and managing borrowing records.

## Features


- **User Authentication**: Secure sign up and sign in with NextAuth.js
- **Inventory Management**: Add, edit, and delete items from your inventory
- **Borrow Tracking**: Record when items are borrowed and when they're due back
- **Borrow History**: Complete history of all borrowing activities
- **Mobile-First Design**: Responsive design optimized for mobile devices
- **Modern UI**: Minimalist yet bold design using DM Sans and Inter fonts

## Tech Stack


- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js
- **Database**: SQLite with Prisma ORM
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:

Create a `.env.local` file in the root directory with:
```
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET="your-secret-key-change-this-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

Generate a secure `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

3. Initialize the database:
```bash
npx prisma generate
npx prisma db push --url="file:./dev.db"
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
stock_inventory/
├── app/
│   ├── api/              # API routes
│   ├── auth/             # Authentication pages
│   ├── dashboard/        # Dashboard and item pages
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Landing page
│   └── providers.tsx     # NextAuth provider
├── lib/
│   ├── auth.ts          # NextAuth configuration
│   └── prisma.ts        # Prisma client
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── prisma.config.ts # Prisma configuration
└── types/
    └── next-auth.d.ts   # NextAuth type definitions
```

## Database Schema

### User
- id, email, name, password
- Relationships: Has many items

### Item
- id, name, description, category
- Relationships: Belongs to user, has many borrow records

### BorrowRecord
- id, borrowerName, borrowerEmail, borrowerPhone
- borrowedAt, expectedReturnAt, returnedAt, notes
- Relationships: Belongs to item

## Deployment to Vercel

1. Push your code to GitHub

2. Import your repository in Vercel

3. Configure environment variables in Vercel:
   - `DATABASE_URL`: Your production database URL
   - `NEXTAUTH_SECRET`: Secure random string
   - `NEXTAUTH_URL`: Your production URL

4. For production, consider using PostgreSQL instead of SQLite:
   - Update `prisma/schema.prisma` datasource to use postgresql
   - Update `DATABASE_URL` to your PostgreSQL connection string
   - Run migrations

5. Deploy!

## Usage

### Creating an Account
1. Click "Get Started" or "Sign Up"
2. Enter your email and password
3. You'll be automatically signed in

### Adding Items
1. From the dashboard, click "+ Add Item"
2. Enter item details (name, category, description)
3. Click "Add Item"

### Recording Borrowed Items
1. Click on an item from your inventory
2. Click "Mark as Borrowed"
3. Enter borrower details and expected return date
4. Click "Mark as Borrowed"

### Marking Items as Returned
1. Open the borrowed item
2. Click "Mark Returned" in the status section
3. The item will be marked as available again

## License

MIT
