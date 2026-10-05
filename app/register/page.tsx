'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [warungName, setWarungName] = useState('');
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

    const { data, error: signUpError } = await createClient().auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          warung_name: warungName,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      setError('Akun berhasil dibuat. Silakan cek email konfirmasi Anda.');
      setLoading(false);
      return;
    }

    router.push('/onboarding');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#f8f1dd,_#f3ead7_35%,_#efe6d5_100%)] px-6 py-10">
      <div className="w-full max-w-lg rounded-[30px] border border-charcoal/10 bg-white/90 p-8 shadow-[0_20px_70px_rgba(32,35,31,0.08)] backdrop-blur">
        <p className="font-serif text-3xl text-charcoal">
          Warung<span className="text-gold">Ku</span>
        </p>

        <h1 className="mt-8 text-3xl font-semibold text-charcoal">Mulai 14 hari gratis</h1>
        <p className="mt-2 text-sm text-charcoal/60">Siapkan warung Anda dalam hitungan menit.</p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nama lengkap"
            className="w-full rounded-2xl border border-charcoal/10 bg-white px-4 py-3 outline-none transition focus:border-gold"
          />
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
          <input
            required
            value={warungName}
            onChange={(e) => setWarungName(e.target.value)}
            placeholder="Nama warung"
            className="w-full rounded-2xl border border-charcoal/10 bg-white px-4 py-3 outline-none transition focus:border-gold"
          />

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-charcoal px-4 py-3 font-semibold text-white transition hover:bg-charcoal/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Membuat akun...' : 'Buat akun'}
          </button>
        </form>

        <div className="mt-6 rounded-2xl bg-charcoal/5 p-3 text-center text-sm text-charcoal/70">
          Sudah punya akun? <Link href="/login" className="font-semibold text-gold">Masuk</Link>
        </div>
      </div>
    </main>
  );
}
