import Link from 'next/link';

const features = [
  'Kasir cepat dan satu-tangan',
  'Stok otomatis',
  'Catat bon pelanggan',
  'Hutang supplier',
  'Laporan penjualan & laba',
  'Multi cabang & karyawan',
];

const pricing = [
  { name: 'Trial', price: 'Gratis 14 hari', perks: ['1 cabang', '2 user', 'Semua fitur dasar'], highlight: false },
  { name: 'Basic', price: 'Rp 149.000/bulan', perks: ['1 cabang', '2 user', 'Laporan dasar'], highlight: true },
  { name: 'Pro', price: 'Rp 349.000/bulan', perks: ['3 cabang', '10 user', 'Multi-branch + support'], highlight: false },
];

const faqs = [
  { question: 'Apakah cocok untuk warung kecil?', answer: 'Ya. Antarmuka dibuat simpel, cepat, dan mudah dipahami untuk pemilik warung maupun kasir.' },
  { question: 'Apakah bisa dipakai di HP?', answer: 'Tentu. Aplikasi didesain mobile-first dan bisa diinstall seperti app Android.' },
  { question: 'Apakah data warung aman terpisah?', answer: 'Setiap tenant memiliki data terpisah dan arsitektur multi-tenant sudah terancang sejak awal.' },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-charcoal text-cream">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="font-serif text-2xl text-white">
          Warung<span className="text-gold">Ku</span>
        </span>
        <div className="flex items-center gap-3">
          <Link href="/login" className="rounded-full border border-white/15 px-5 py-2 text-sm text-white hover:border-gold">
            Masuk
          </Link>
          <Link href="/register" className="rounded-full bg-gold px-5 py-2 text-sm font-semibold text-charcoal">
            Coba Gratis
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-6 pb-16 pt-12 md:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <span className="gold-pill">Sistem Kasir &amp; Manajemen Warung Madura</span>
            <h1 className="mt-6 max-w-3xl text-5xl leading-tight md:text-7xl">
              Kelola Warung Lebih Mudah.
              <span className="block text-gold">Dari Kasir Sampai Laporan.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-cream/75">
              Sistem kasir dan manajemen warung yang dirancang untuk membantu pemilik warung mengelola penjualan, stok, bon pelanggan, hutang supplier, dan laporan dalam satu aplikasi.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link href="/register" className="rounded-full bg-gold px-6 py-3 font-semibold text-charcoal">
                Coba Gratis
              </Link>
              <Link href="/dashboard" className="rounded-full border border-cream/25 px-6 py-3 text-white">
                Lihat Demo
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-6 text-sm text-cream/70">
              <span>50+ produk demo</span>
              <span>Fast POS</span>
              <span>Multi branch ready</span>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 shadow-2xl shadow-black/20 backdrop-blur-sm">
            <div className="rounded-[22px] bg-[#f6efe7] p-5 text-charcoal">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-charcoal/60">Warung Madura Barokah</p>
                  <h2 className="mt-2 text-2xl font-semibold">Dashboard Hari Ini</h2>
                </div>
                <div className="rounded-full bg-[#efe0bc] px-3 py-1 text-sm font-semibold text-charcoal">+18.4%</div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  ['Penjualan', 'Rp 2.450.000'],
                  ['Transaksi', '87'],
                  ['Laba Kotor', 'Rp 430.000'],
                  ['Stok Menipis', '12 produk'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border bg-white p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-charcoal/55">{label}</p>
                    <p className="mt-3 text-xl font-semibold">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl bg-charcoal p-4 text-white">
                <p className="text-xs uppercase tracking-[0.18em] text-white/60">7 hari terakhir</p>
                <div className="mt-5 flex h-20 items-end gap-2">
                  {[40, 60, 45, 72, 58, 88, 74].map((height, index) => (
                    <div key={index} className="flex-1 rounded-t-lg bg-gold/90" style={{ height: `${height}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-8 text-center">
          <span className="gold-pill">Fitur utama</span>
          <h2 className="mt-4 text-4xl md:text-5xl">Semua kebutuhan warung dalam satu aplikasi</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <div key={feature} className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="mb-5 h-12 w-12 rounded-2xl bg-gold/20" />
              <p className="text-xl font-semibold text-white">{feature}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#f7f3eb] py-16 text-charcoal">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-8 text-center">
            <span className="gold-pill bg-[#efe4cc]">Paket</span>
            <h2 className="mt-4 text-4xl md:text-5xl">Mulai dari trial sampai bisnis scale-up</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {pricing.map((plan) => (
              <div key={plan.name} className={`rounded-[28px] border p-6 ${plan.highlight ? 'border-gold bg-charcoal text-white' : 'border-charcoal/10 bg-white text-charcoal'}`}>
                <p className="text-sm uppercase tracking-[0.24em] opacity-75">{plan.name}</p>
                <p className="mt-4 text-3xl font-semibold">{plan.price}</p>
                <ul className="mt-6 space-y-3 text-sm">
                  {plan.perks.map((perk) => (
                    <li key={perk}>✓ {perk}</li>
                  ))}
                </ul>
                <Link href="/register" className={`mt-8 inline-flex rounded-full px-5 py-3 text-sm font-semibold ${plan.highlight ? 'bg-gold text-charcoal' : 'bg-charcoal text-white'}`}>
                  Pilih paket
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-8 text-center">
          <span className="gold-pill">FAQ</span>
          <h2 className="mt-4 text-4xl md:text-5xl">Pertanyaan umum</h2>
        </div>
        <div className="space-y-4">
          {faqs.map((faq) => (
            <div key={faq.question} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-lg font-semibold text-white">{faq.question}</p>
              <p className="mt-2 text-cream/75">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#1a1d1a] py-16 text-center">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-4xl md:text-5xl">Siap tingkatkan warung Anda dengan sistem yang cepat dan profesional?</h2>
          <div className="mt-8 flex justify-center gap-4">
            <a href="https://wa.me/6281234567890" className="rounded-full bg-gold px-6 py-3 font-semibold text-charcoal">
              Hubungi Sales
            </a>
            <Link href="/register" className="rounded-full border border-white/20 px-6 py-3 text-white">
              Coba Gratis
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
