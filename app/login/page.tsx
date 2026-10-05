'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

    const { error: signInError } = await createClient().auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.replace('/dashboard');
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#f8f1dd,_#f3ead7_35%,_#efe6d5_100%)] px-6 py-10">
      <div className="w-full max-w-md rounded-[30px] border border-charcoal/10 bg-white/90 p-8 shadow-[0_20px_70px_rgba(32,35,31,0.08)] backdrop-blur">
        <p className="font-serif text-3xl text-charcoal">
          Warung<span className="text-gold">Ku</span>
        </p>

        <h1 className="mt-8 text-3xl font-semibold text-charcoal">Selamat datang kembali</h1>
        <p className="mt-2 text-sm text-charcoal/60">Masuk untuk mengelola warung, stok, dan cash flow secara real-time.</p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-2xl border border-charcoal/10 bg-white px-4 py-3 outline-none transition focus:border-gold"
          />
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-2xl border border-charcoal/10 bg-white px-4 py-3 outline-none transition focus:border-gold"
          />

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-charcoal px-4 py-3 font-semibold text-white transition hover:bg-charcoal/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <div className="mt-6 rounded-2xl bg-charcoal/5 p-3 text-center text-sm text-charcoal/70">
          Belum punya akun? <Link href="/register" className="font-semibold text-gold">Daftar gratis</Link>
        </div>
      </div>
    </main>
  );
}
