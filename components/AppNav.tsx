"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/dashboard', label: 'Beranda' },
  { href: '/pos', label: 'Kasir' },
  { href: '/transactions', label: 'Transaksi' },
  { href: '/inventory', label: 'Stok' },
  { href: '/products', label: 'Produk' },
  { href: '/suppliers', label: 'Supplier' },
  { href: '/customers', label: 'Pelanggan' },
  { href: '/purchases', label: 'Pembelian' },
  { href: '/expenses', label: 'Pengeluaran' },
  { href: '/reports', label: 'Laporan' },
  { href: '/admin', label: 'Admin' },
] as const;

export { WorkspaceNav as AppNav } from './WorkspaceNav';

function LegacyNav() {
  const pathname = usePathname();

  return (
    <nav className="app-navigation relative z-40 w-full border-b border-charcoal/10 bg-[#f8f4ee] p-3 md:fixed md:inset-y-0 md:left-0 md:w-64 md:border-b-0 md:border-r md:p-5">
      <div className="flex flex-col items-stretch gap-5 px-0 py-0">
        <Link href="/dashboard" className="mr-4 shrink-0 font-serif text-xl text-charcoal">
          Warung<span className="text-gold">Ku</span>
        </Link>

        <div className="flex flex-col gap-1">
          <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[.18em] text-charcoal/40">Operasional</p>
          {items.map((item, index) => (<span key={item.href}>{[0,4,7,10].includes(index) && <p className="px-3 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-[.18em] text-charcoal/40">{index===0?'Operasional':index===4?'Master data':index===7?'Keuangan':'Platform'}</p>}<Link
              key={item.href}
              href={item.href}
              className={`rounded-xl px-3 py-2 text-left text-sm transition ${
                pathname === item.href ? 'bg-charcoal text-white' : 'text-charcoal/70 hover:bg-charcoal/5'
              }`}
            >
              {item.label}
            </Link></span>
          ))}
        </div>

        <Link href="/login" className="ml-auto rounded-xl border border-charcoal/10 bg-white px-3 py-2 text-sm font-medium">Keluar</Link>
      </div>
    </nav>
  );
}
