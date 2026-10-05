# WarungKu POS

WarungKu POS adalah aplikasi SaaS multi-tenant untuk warung Madura, fokus pada transaksi POS, produk, inventory, piutang, hutang, laporan, dan operasi multi-cabang.

## Architecture yang dipakai
- Frontend: Next.js + TypeScript + Tailwind CSS
- UI Foundation: mobile-first, premium dark/cream palette, desktop sidebar, mobile bottom nav ready
- Backend: Supabase PostgreSQL + RLS + auth
- Domain logic: reusable business functions for price, discount, change, and shift reconciliation
- Security: tenant isolation enforced at database and application layer

## Database foundation
Tabel inti sudah dibuat dalam migration Supabase seperti:
- `profiles`, `tenants`, `branches`, `tenant_users`, `roles`
- `products`, `categories`, `suppliers`, `stock_movements`
- `sales`, `sale_items`, `payments`
- `purchases`, `purchase_items`, `expenses`
- `customers`, `receivables`, `receivable_payments`
- `subscriptions`, `subscription_plans`

Dokumentasi arsitektur lengkap ada di [docs/architecture.md](docs/architecture.md).

## Implementation plan
1. Phase 1: architecture, auth, layout, dashboard, onboarding
2. Phase 2: products, inventory, suppliers
3. Phase 3: POS, sales, receipts, payments
4. Phase 4: purchase, payables, receivables, expenses
5. Phase 5: shift, reports, dashboard analytics
6. Phase 6: subscription and super admin
7. Phase 7: PWA polish and testing

## Menjalankan project
1. Copy `.env.example` to `.env.local` and fill the Supabase URL and anon key.
2. Run `npm install`
3. Run `npm run dev`
4. Apply Supabase migrations in the Supabase SQL editor.

## Testing
- Core financial logic is covered by Vitest in `lib/finance.test.ts`
- Run with: `npm test`

## Deployment
Project is prepared for Vercel deployment with a multi-tenant Supabase backend and mobile-friendly frontend structure.
