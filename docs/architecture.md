# WarungKu POS Architecture

## Overview
WarungKu POS is a multi-tenant SaaS designed for Indonesian warung operations. The app uses Next.js + TypeScript on the frontend and Supabase PostgreSQL + RLS on the backend. The design is intentionally product-oriented: a premium operational experience for owners, managers, and cashiers on mobile-first devices.

## Core principles
- Tenant isolation at every data layer.
- Role-based access control via `tenant_users` and `roles`.
- Mobile-first POS for fast transactions.
- Accurate financial logic with audit-friendly transaction records.
- Clean separation between UI, domain logic, permissions, and persistence.

## Layered architecture
- Frontend: Next.js app router, shared components, dashboard pages, mobile-first layouts.
- Domain logic: validation and finance helpers (pricing, discounts, change, shift reconciliation).
- Data layer: Supabase PostgreSQL with migrations and row-level security.
- Security: server-side validation, tenant checks, and role enforcement outside the browser.

## Database architecture
The existing schema already contains the foundations for multi-tenant operations:
- `profiles`, `tenants`, `branches`, `tenant_users`, `roles`
- `products`, `categories`, `suppliers`, `inventory`, `stock_movements`
- `sales`, `sale_items`, `payments`
- `purchases`, `purchase_items`, `expenses`
- `customers`, `receivables`, `receivable_payments`
- `subscriptions`, `subscription_plans`, `audit_logs`

This is aligned with the SaaS brief and can be extended with `shifts`, `cash_movements`, notifications, and `super_admin` tooling in later phases.

## Implementation plan
### Phase 1
- Finish app shell and design system.
- Stabilize TypeScript, auth pages, dashboard, and navigation.
- Add tenant onboarding and role structure.

### Phase 2
- Product catalog, stock, supplier management, and reports foundation.
- POS cart calculations, item discounts, and receipt preview.

### Phase 3
- Purchases, payables, receivables, and expenses flows.
- Cashbook, shift reconciliation, and audit logs.

### Phase 4
- SaaS subscription, super admin, tenant management, and compliance checks.
- PWA polish, offline-ready cart draft, and performance tuning.

## Recommended delivery path
1. Keep the base product stable and mobile-friendly.
2. Prioritize fast POS for small warung operations.
3. Validate each financial calculation with unit tests.
4. Extend data models only after business flows are proven.
5. Treat tenant data separation as a product requirement, not an optional feature.
