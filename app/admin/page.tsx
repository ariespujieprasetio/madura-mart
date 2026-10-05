'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AppNav } from '@/components/AppNav';
import { createClient } from '@/lib/supabase/client';
import { isAdminRole } from '@/lib/permissions';

export default function AdminPage() {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    tenantName: '',
    branchName: 'Cabang Utama',
    address: '',
    whatsapp: '',
    role: 'OWNER',
  });

  useEffect(() => {
    let active = true;

    const checkAccess = async () => {
      try {
        const supabase = createClient();
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData.user) {
          if (active) {
            setAuthorized(false);
            setLoading(false);
          }
          return;
        }

        const { data: membershipData } = await supabase
          .from('tenant_users')
          .select('role')
          .eq('user_id', userData.user.id)
          .limit(1)
          .maybeSingle();

        const isAdmin = isAdminRole(membershipData?.role ?? null);

        if (active) {
          setAuthorized(isAdmin);
          setLoading(false);
        }
      } catch {
        if (active) {
          setAuthorized(false);
          setLoading(false);
        }
      }
    };

    checkAccess();
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      if (!form.fullName || !form.email || !form.password || !form.tenantName) {
        setError('Nama lengkap, email, password, dan nama tenant wajib diisi.');
        return;
      }

      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        setError('Sesi admin tidak valid. Silakan masuk ulang.');
        return;
      }

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          tenantName: form.tenantName,
          branchName: form.branchName,
          address: form.address,
          whatsapp: form.whatsapp,
          role: form.role,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal membuat akun customer baru.');
      }

      setSuccess(`Akun ${result.user.email} berhasil dibuat untuk tenant ${result.tenant.name}.`);
      setForm({
        fullName: '',
        email: '',
        password: '',
        tenantName: '',
        branchName: 'Cabang Utama',
        address: '',
        whatsapp: '',
        role: 'OWNER',
      });
    } catch (submitError: unknown) {
      const message = submitError instanceof Error ? submitError.message : 'Gagal membuat akun customer baru.';
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <>
        <AppNav />
        <main className="min-h-screen bg-[#f6f2ea] p-4 md:p-6">
          <div className="mx-auto max-w-7xl text-sm text-charcoal/60">Memeriksa akses admin...</div>
        </main>
      </>
    );
  }

  if (!authorized) {
    return (
      <>
        <AppNav />
        <main className="min-h-screen bg-[#f6f2ea] p-4 md:p-6">
          <div className="mx-auto max-w-2xl rounded-[24px] border border-red-200 bg-red-50 p-6 text-red-900">
            <p className="text-sm uppercase tracking-[0.2em] text-red-700">Akses ditolak</p>
            <h1 className="mt-3 text-3xl font-semibold">Halaman admin hanya untuk super admin</h1>
            <p className="mt-2 text-sm">Masuk dengan akun yang memiliki role SUPER_ADMIN untuk membuat tenant baru dan akun customer.</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <AppNav />
      <main className="min-h-screen bg-[#f6f2ea] p-4 md:p-6">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-charcoal/60">App Owner</p>
              <h1 className="text-3xl md:text-4xl">Buat customer baru</h1>
            </div>
            <span className="rounded-full bg-charcoal px-4 py-2 text-sm font-medium text-white">Super Admin</span>
          </div>

          <section className="rounded-[24px] border border-charcoal/10 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">Onboarding tenant & user</h2>
            <p className="mt-1 text-sm text-charcoal/60">Form ini membuat akun auth, tenant, branch, dan relasi user ke tenant sekaligus.</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-charcoal/80 md:col-span-2">
                  <span>Nama lengkap pemilik</span>
                  <input
                    value={form.fullName}
                    onChange={(e) => setForm((current) => ({ ...current, fullName: e.target.value }))}
                    placeholder="Nama lengkap"
                    className="w-full rounded-2xl border border-charcoal/10 bg-white px-4 py-3 outline-none transition focus:border-gold"
                  />
                </label>

                <label className="space-y-2 text-sm font-medium text-charcoal/80">
                  <span>Email login</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
                    placeholder="user@warungku.com"
                    className="w-full rounded-2xl border border-charcoal/10 bg-white px-4 py-3 outline-none transition focus:border-gold"
                  />
                </label>

                <label className="space-y-2 text-sm font-medium text-charcoal/80">
                  <span>Password</span>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm((current) => ({ ...current, password: e.target.value }))}
                    placeholder="Password minimal 6 karakter"
                    className="w-full rounded-2xl border border-charcoal/10 bg-white px-4 py-3 outline-none transition focus:border-gold"
                  />
                </label>

                <label className="space-y-2 text-sm font-medium text-charcoal/80 md:col-span-2">
                  <span>Nama tenant / warung</span>
                  <input
                    value={form.tenantName}
                    onChange={(e) => setForm((current) => ({ ...current, tenantName: e.target.value }))}
                    placeholder="Contoh: Warung Sari Makmur"
                    className="w-full rounded-2xl border border-charcoal/10 bg-white px-4 py-3 outline-none transition focus:border-gold"
                  />
                </label>

                <label className="space-y-2 text-sm font-medium text-charcoal/80">
                  <span>Nama cabang</span>
                  <input
                    value={form.branchName}
                    onChange={(e) => setForm((current) => ({ ...current, branchName: e.target.value }))}
                    placeholder="Cabang Utama"
                    className="w-full rounded-2xl border border-charcoal/10 bg-white px-4 py-3 outline-none transition focus:border-gold"
                  />
                </label>

                <label className="space-y-2 text-sm font-medium text-charcoal/80">
                  <span>WhatsApp</span>
                  <input
                    value={form.whatsapp}
                    onChange={(e) => setForm((current) => ({ ...current, whatsapp: e.target.value }))}
                    placeholder="08xx"
                    className="w-full rounded-2xl border border-charcoal/10 bg-white px-4 py-3 outline-none transition focus:border-gold"
                  />
                </label>

                <label className="space-y-2 text-sm font-medium text-charcoal/80 md:col-span-2">
                  <span>Alamat</span>
                  <input
                    value={form.address}
                    onChange={(e) => setForm((current) => ({ ...current, address: e.target.value }))}
                    placeholder="Alamat lengkap"
                    className="w-full rounded-2xl border border-charcoal/10 bg-white px-4 py-3 outline-none transition focus:border-gold"
                  />
                </label>

                <label className="space-y-2 text-sm font-medium text-charcoal/80 md:col-span-2">
                  <span>Role</span>
                  <select
                    value={form.role}
                    onChange={(e) => setForm((current) => ({ ...current, role: e.target.value }))}
                    className="w-full rounded-2xl border border-charcoal/10 bg-white px-4 py-3 outline-none transition focus:border-gold"
                  >
                    <option value="OWNER">Owner</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="MANAGER">Manager</option>
                    <option value="CASHIER">Kasir</option>
                  </select>
                </label>
              </div>

              {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}
              {success ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p> : null}

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-2xl bg-charcoal px-5 py-3 font-semibold text-white transition hover:bg-charcoal/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? 'Membuat akun customer...' : 'Buat akun customer baru'}
              </button>
            </form>
          </section>
        </div>
      </main>
    </>
  );
}
