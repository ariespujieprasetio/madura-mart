'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function OnboardingPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [warungName, setWarungName] = useState('');
  const [address, setAddress] = useState('');
  const [branch, setBranch] = useState('Cabang Utama');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setError('Supabase belum dikonfigurasi. Isi variabel .env.local Anda.');
      setLoading(false);
      return;
    }

    const { data: userData, error: userError } = await createClient().auth.getUser();

    if (userError || !userData.user) {
      setError('Sesi login tidak valid. Silakan masuk ulang.');
      setLoading(false);
      router.replace('/login');
      return;
    }

    const user = userData.user;
    const profilePayload = {
      id: user.id,
      full_name: fullName || user.email?.split('@')[0] || 'Pemilik Warung',
      phone,
    };

    const { error: profileError } = await createClient().from('profiles').upsert(profilePayload).select().single();

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    const slug = `${(warungName || 'warung-ku').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') || 'warung-ku'}-${user.id.slice(0, 6)}`;
    const tenantResult = await createClient()
      .from('tenants')
      .insert({
        name: warungName,
        slug,
        address,
        whatsapp: phone,
        owner_id: user.id,
      })
      .select()
      .single();

    if (tenantResult.error) {
      setError(tenantResult.error.message);
      setLoading(false);
      return;
    }

    const branchResult = await createClient()
      .from('branches')
      .insert({
        tenant_id: tenantResult.data.id,
        name: branch,
        address,
      })
      .select()
      .single();

    if (branchResult.error) {
      setError(branchResult.error.message);
      setLoading(false);
      return;
    }

    const memberResult = await createClient().from('tenant_users').insert({
      tenant_id: tenantResult.data.id,
      user_id: user.id,
      role: 'SUPER_ADMIN',
      branch_id: branchResult.data.id,
      is_active: true,
    });

    if (memberResult.error) {
      setError(memberResult.error.message);
      setLoading(false);
      return;
    }

    const today = new Date();
    const end = new Date(today);
    end.setDate(end.getDate() + 14);

    const subscriptionResult = await createClient().from('subscriptions').insert({
      tenant_id: tenantResult.data.id,
      plan_id: 'TRIAL',
      start_date: today.toISOString().slice(0, 10),
      end_date: end.toISOString().slice(0, 10),
      status: 'TRIAL',
    });

    if (subscriptionResult.error) {
      setError(subscriptionResult.error.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#f8f1dd,_#f3ead7_35%,_#efe6d5_100%)] px-6 py-10">
      <div className="w-full max-w-2xl rounded-[30px] border border-charcoal/10 bg-white/90 p-8 shadow-[0_20px_70px_rgba(32,35,31,0.08)] backdrop-blur">
        <p className="font-serif text-3xl text-charcoal">
          Warung<span className="text-gold">Ku</span>
        </p>

        <h1 className="mt-8 text-3xl font-semibold text-charcoal">Siapkan warung Anda</h1>
        <p className="mt-2 text-sm text-charcoal/60">Mari mulai dari profil usaha, cabang, dan lisensi operasional dasar.</p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nama lengkap pemilik"
              className="rounded-2xl border border-charcoal/10 bg-white px-4 py-3 outline-none transition focus:border-gold"
            />
            <input
              required
              value={warungName}
              onChange={(e) => setWarungName(e.target.value)}
              placeholder="Nama warung"
              className="rounded-2xl border border-charcoal/10 bg-white px-4 py-3 outline-none transition focus:border-gold"
            />
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Alamat warung"
              className="md:col-span-2 rounded-2xl border border-charcoal/10 bg-white px-4 py-3 outline-none transition focus:border-gold"
            />
            <input
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="Cabang utama"
              className="rounded-2xl border border-charcoal/10 bg-white px-4 py-3 outline-none transition focus:border-gold"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Nomor WhatsApp"
              className="rounded-2xl border border-charcoal/10 bg-white px-4 py-3 outline-none transition focus:border-gold"
            />
          </div>

          <div className="mt-8 flex items-center justify-between rounded-2xl border border-gold/25 bg-gold/10 p-4 text-sm text-charcoal/80">
            <span>Trial aktif selama 14 hari</span>
            <span className="font-semibold text-gold">Gratis</span>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="mt-8 flex items-center justify-between gap-3">
            <Link href="/login" className="text-sm font-medium text-charcoal/70">Kembali</Link>
            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-charcoal px-5 py-3 font-semibold text-white transition hover:bg-charcoal/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Memproses...' : 'Lanjutkan'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
