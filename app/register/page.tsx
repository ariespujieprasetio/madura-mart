'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#f8f1dd,_#f3ead7_35%,_#efe6d5_100%)] px-6 py-10">
      <div className="w-full max-w-md rounded-[30px] border border-charcoal/10 bg-white/90 p-8 text-center shadow-[0_20px_70px_rgba(32,35,31,0.08)] backdrop-blur">
        <p className="font-serif text-3xl text-charcoal">
          Warung<span className="text-gold">Ku</span>
        </p>
        <h1 className="mt-8 text-2xl font-semibold text-charcoal">Pendaftaran sementara ditutup</h1>
        <p className="mt-3 text-sm text-charcoal/60">Anda akan dialihkan ke halaman masuk.</p>
      </div>
    </main>
  );
}
