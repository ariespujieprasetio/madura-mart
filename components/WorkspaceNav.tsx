'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LayoutDashboard, ShoppingBasket, ReceiptText, Boxes, Package, Truck, Users, ShoppingBag, Wallet, ChartNoAxesCombined, Settings, Store, Menu, X, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const groups = [
  { title: 'WARUNG', items: [
    { href: '/dashboard', label: 'Ringkasan', icon: LayoutDashboard },
    { href: '/pos', label: 'Kasir', icon: ShoppingBasket },
    { href: '/transactions', label: 'Transaksi', icon: ReceiptText },
  ] },
  { title: 'KELOLA', items: [
    { href: '/products', label: 'Produk', icon: Package },
    { href: '/inventory', label: 'Persediaan', icon: Boxes },
    { href: '/suppliers', label: 'Supplier', icon: Truck },
    { href: '/customers', label: 'Pelanggan', icon: Users },
  ] },
  { title: 'KEUANGAN', items: [
    { href: '/purchases', label: 'Pembelian', icon: ShoppingBag },
    { href: '/expenses', label: 'Pengeluaran', icon: Wallet },
    { href: '/reports', label: 'Laporan', icon: ChartNoAxesCombined },
    { href: '/admin', label: 'Administrasi', icon: Settings },
  ] },
] as const;

export function WorkspaceNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function logout() {
    setBusy(true);
    try {
      const result = await createClient().auth.signOut();
      if (result.error) throw result.error;
      window.location.assign('/login');
    } catch { setError('Gagal keluar. Coba lagi.'); setBusy(false); }
  }
  return <div className="workspace-navigation">
    <header className="mobile-bar"><Link href="/dashboard" className="workspace-brand"><Store size={21}/>WarungKu</Link><button aria-label={open ? 'Tutup menu' : 'Buka menu'} aria-expanded={open} aria-controls="workspace-sidebar" onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button></header>
    {open && <button className="nav-backdrop" aria-label="Tutup menu" onClick={() => setOpen(false)}/>}
    <aside id="workspace-sidebar" className={`workspace-sidebar ${open ? 'is-open' : ''}`}>
      <Link href="/dashboard" className="workspace-brand"><span className="brand-symbol"><Store size={21}/></span>WarungKu<span className="brand-tag">POS</span></Link>
      <div className="workspace-caption">Ruang kerja warung Anda</div>
      <nav aria-label="Navigasi utama">{groups.map(group => <section className="nav-section" key={group.title}><h2>{group.title}</h2>{group.items.map(item => <Link key={item.href} href={item.href} aria-current={pathname === item.href ? 'page' : undefined} onClick={() => setOpen(false)}><item.icon size={18} strokeWidth={1.7}/><span>{item.label}</span></Link>)}</section>)}</nav>
      <footer className="nav-footer"><button disabled={busy} onClick={logout}><LogOut size={17}/>{busy ? 'Keluar…' : 'Keluar akun'}</button>{error && <p role="alert">{error}</p>}<small>WarungKu · Kelola dengan mudah</small></footer>
    </aside>
  </div>;
}
