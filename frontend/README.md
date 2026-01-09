# Frontend - Plataforma Financeira

Frontend web application built with Next.js 14, TypeScript, and TailwindCSS.

## Features Implemented

- ✅ Next.js 14 with App Router
- ✅ TypeScript configuration
- ✅ TailwindCSS with Shadcn/ui components
- ✅ Sidebar navigation with expandable menu items
- ✅ Dashboard layout with header and main content area
- ✅ NextAuth.js configuration for authentication
- ✅ Basic routing structure (auth and dashboard)
- ✅ Responsive design
- ✅ Component library setup (Button, Card, Input, Label)

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Dashboard routes
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # Base UI components (Shadcn/ui)
│   └── layout/           # Layout components
├── lib/                  # Utilities and configurations
├── hooks/                # Custom React hooks
└── types/                # TypeScript type definitions
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment variables:
   ```bash
   cp .env.local.example .env.local
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Authentication

The application uses NextAuth.js for authentication with support for:
- Credentials (email/password)
- OAuth providers (Google, Microsoft, etc.)

## UI Components

Built with Shadcn/ui components and TailwindCSS:
- Button, Card, Input, Label components
- Responsive sidebar navigation
- Dashboard layout with header

## Next Steps

The following features will be implemented in subsequent tasks:
- Transaction management
- Investment tracking
- Goal setting and tracking
- Reports and analytics
- Mobile responsiveness improvements