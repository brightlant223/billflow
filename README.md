# Billflow — Invoice Management SaaS

Responsive invoice-management starter built with Next.js App Router, React, TypeScript and a dark/orange design by BrightLant.

## Existing demo UI
- Revenue dashboard, invoice status breakdown and recent activity
- Create invoices with line items, tax and due dates
- Manage invoice status, clients, products/services, reports and business settings
- Browser-local demo data and print-to-PDF workflow

## Backend foundation committed

- Supabase email/password authentication helpers and /login page
- Email confirmation callback and sign-out route
- PostgreSQL schema for businesses, memberships, clients, products, invoices and invoice items
- Row Level Security (RLS) policies that isolate tenant-owned records
- Signup trigger that provisions a private workspace and owner membership
- Authenticated, tenant-scoped APIs for clients, products and invoices
- Server-generated PDF downloads and invoice email with PDF attachment via Resend

**Integration status:** the existing dashboard at / still uses demo/localStorage state. The new backend endpoints and auth foundation are not yet wired into the dashboard's current forms and tables. Do not use this stage as a production accounting system until that migration and its tests are completed.

## Setup

1. Create a Supabase project.
2. Run the full supabase/schema.sql in Supabase Dashboard → SQL Editor. It creates the tables, RLS policies and signup workspace trigger.
3. Copy .env.example to .env.local and set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, RESEND_API_KEY and EMAIL_FROM.
4. In Supabase Auth settings, configure the site URL and allowed redirect URLs, including http://localhost:3000/auth/callback and the production callback URL. Choose whether email confirmation is required.
5. Verify your sender domain in Resend before using it in EMAIL_FROM.
6. Run npm install then npm run dev.
7. Add the same environment variables to Vercel project settings before deployment.

## API endpoints

All endpoints require an authenticated Supabase session; RLS remains the database authorization boundary.

- GET /api/clients, POST /api/clients
- GET /api/products, POST /api/products
- GET /api/invoices, POST /api/invoices
- GET /api/invoices/:id, PATCH /api/invoices/:id
- GET /api/invoices/:id/pdf
- POST /api/invoices/:id/email

Invoice creation JSON shape:

    {
      "client_id": "client-uuid",
      "issue_date": "2026-10-23",
      "due_date": "2026-11-06",
      "status": "pending",
      "notes": "Thanks for your business",
      "items": [
        { "description": "Website development", "quantity": 1, "unit_price": 48000, "tax_rate": 18 }
      ]
    }

## Security and production checklist

- Never expose a Supabase secret/service-role key to the browser. The current helpers use the publishable key and cookie-based sessions.
- Test tenant isolation with two separate accounts before launch.
- Migrate the dashboard away from localStorage/demo seed data to these APIs.
- Move invoice-number allocation into a transaction/database function before concurrent production use; the current starter's read-then-insert allocation can race.
- Add rate limiting, audit logs, robust pagination, tests for cross-tenant access, and email delivery monitoring.
- Configure database backups, email sender authentication and privacy/retention policies.
- PDF layout is currently a one-page template for up to 22 line items; implement pagination for longer invoices.

## Deployment

Import the repository into Vercel. Framework preset: Next.js; build command npm run build. No output directory override is needed.
