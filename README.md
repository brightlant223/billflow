# Billflow — Invoice Management SaaS

A responsive invoice-management SaaS starter built with Next.js App Router, React, TypeScript and a custom dark/orange glassmorphism design by BrightLant.

## Features
- Revenue dashboard, invoice status breakdown and recent activity
- Create invoices with line items, quantities, tax and due dates
- Manage invoice status (Paid, Pending, Overdue, Draft)
- Invoice detail view and print-to-PDF workflow
- Client directory and add-client form
- Product/service catalog
- Reports with CSV export
- Business profile, currency selection and notification preferences
- Local browser persistence using localStorage
- Responsive layout and keyboard-friendly controls

## Run locally
Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Production build
```bash
npm run build
npm start
```

## Important production notes
This starter is a frontend demo. Data is stored in the current browser via localStorage and is not shared across users or devices. Before production use, integrate authentication, a database, server-side validation, secure file storage, email delivery and payment-provider webhooks. Do not use the demo data as real financial records.

## Deploy
Import this repository into Vercel. Framework preset: **Next.js**. Build command: `npm run build`. No output directory override is needed.
