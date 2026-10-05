import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8f1dd,_#f3ead7_35%,_#efe6d5_100%)] text-charcoal">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="font-serif text-2xl text-charcoal">
          Warung<span className="text-gold">Ku</span>
        </span>
        <Link
          href="/login"
          className="rounded-full bg-charcoal px-5 py-2 text-sm font-semibold text-white hover:bg-charcoal/90"
        >
          Masuk
        </Link>
      </nav>

      <section className="mx-auto grid max-w-5xl items-center gap-10 px-6 pb-20 pt-12 md:grid-cols-[1.1fr_0.9fr] md:pt-20">
        <div>
          <span className="inline-flex rounded-full border border-charcoal/10 bg-white/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-charcoal/70">
            Sistem kasir warung
          </span>
          <h1 className="mt-6 text-4xl font-semibold leading-tight md:text-6xl">
            Kelola warung
            <span className="block text-gold">lebih cepat dan rapi.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-charcoal/70">
            Pantau penjualan, stok, pelanggan, dan keuangan dalam satu dashboard yang simpel untuk operasional harian.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/login" className="rounded-full bg-gold px-6 py-3 font-semibold text-charcoal shadow-sm">
              Masuk ke dashboard
            </Link>
          </div>
        </div>

        <div className="rounded-[28px] border border-charcoal/10 bg-white/80 p-5 shadow-[0_30px_80px_rgba(50,45,31,0.08)]">
          <div className="rounded-[24px] bg-[#f7f2ea] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-charcoal/60">Hari ini</p>
                <h2 className="mt-2 text-2xl font-semibold text-charcoal">Ringkasan</h2>
              </div>
              <span className="rounded-full bg-[#efe0bc] px-3 py-1 text-sm font-semibold text-charcoal">Live</span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                ['Penjualan', 'Rp 2.450.000'],
                ['Transaksi', '87'],
                ['Laba', 'Rp 430.000'],
                ['Stok', '12 menipis'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-charcoal/10 bg-white p-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-charcoal/55">{label}</p>
                  <p className="mt-3 text-lg font-semibold text-charcoal">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl bg-charcoal p-4 text-white">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">7 hari terakhir</p>
              <div className="mt-5 flex h-20 items-end gap-2">
                {[42, 58, 48, 72, 66, 90, 80].map((height, index) => (
                  <div key={index} className="flex-1 rounded-t-lg bg-gold/90" style={{ height: `${height}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
