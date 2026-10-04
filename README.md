# WarungKu POS

Fondasi SaaS multi-tenant untuk kasir dan manajemen Warung Madura. Phase 1 berisi scaffold Next.js, landing/auth/dashboard awal, schema Supabase dengan UUID, role, subscription, tenant isolation dan RLS.

## Menjalankan

1. Salin `.env.example` menjadi `.env.local` dan isi URL/key Supabase.
2. Jalankan `npm install` lalu `npm run dev`.
3. Jalankan `supabase/migrations/0001_phase1.sql` pada SQL editor Supabase.

Deployment diarahkan ke Vercel. Tahap berikutnya menambahkan tabel produk, inventory, POS, dan transaksi di atas tenant/branch foundation ini.
