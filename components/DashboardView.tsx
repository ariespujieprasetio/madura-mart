import Link from 'next/link';
import { ArrowUpRight, Plus, Package, ReceiptText, Wallet, ShoppingBasket, ArrowDownLeft, Banknote, CircleDollarSign, Boxes } from 'lucide-react';
import { AppNav } from './AppNav';

type Props = {
  tenantName: string; ownerName: string; loading: boolean;
  metrics: {label: string; value: string}[];
  products: string[][];
  transactions: {id: string; time: string; total: string; status: string}[];
};
const icons = [ShoppingBasket, ReceiptText, CircleDollarSign, ArrowDownLeft, Wallet, Banknote, Wallet, Boxes];

export function DashboardView({tenantName, ownerName, loading, metrics, products, transactions}: Props) {
  return <><AppNav/><main className="overview-page">
    <div className="overview-topbar"><span>Ruang kerja <span className="breadcrumb-divider">/</span> <strong>Ringkasan</strong></span><span className="tenant-chip"><span/>{tenantName}</span></div>
    <div className="overview-body">
      <header className="overview-heading"><div><p className="eyebrow">KENALI BISNIS ANDA</p><h1>Ringkasan warung</h1><p>Halo, {ownerName}. Semua aktivitas warung dalam satu tempat.</p></div><Link className="primary-action" href="/pos"><Plus size={18}/>Transaksi baru</Link></header>
      {loading ? <div className="metric-grid" aria-label="Memuat ringkasan">{icons.map((_, i) => <div key={i} className="metric-card skeleton"/>)}</div> : <>
        <section className="metric-grid" aria-label="Ringkasan keuangan">{metrics.map((metric, i) => {const Icon = icons[i] || Wallet; return <article className="metric-card" key={metric.label}><div className="metric-label"><span>{metric.label}</span><Icon size={17}/></div><strong>{metric.value}</strong></article>;})}</section>
        <section className="overview-columns">
          <article className="overview-card"><div className="card-heading"><div><h2>Transaksi terbaru</h2><p>Aktivitas penjualan hari ini</p></div><Link href="/transactions">Lihat semua <ArrowUpRight size={15}/></Link></div>
            {transactions.length ? <div className="transaction-list">{transactions.map(item => <div key={item.id}><span className="list-symbol"><ReceiptText size={18}/></span><div><strong>{item.id}</strong><small>{item.time} · {item.status}</small></div><b>{item.total}</b></div>)}</div> : <div className="dashboard-empty"><span className="empty-symbol"><ReceiptText size={27}/></span><h3>Penjualan pertama dimulai di sini</h3><p>Transaksi yang berhasil akan tampil otomatis.<br/>Buka kasir untuk mulai melayani pelanggan.</p><Link href="/pos">Buka kasir <ArrowUpRight size={16}/></Link></div>}
          </article>
          <aside className="overview-card quick-actions"><div className="card-heading"><div><h2>Mulai dari sini</h2><p>Langkah sederhana untuk operasional Anda</p></div></div>
            <Link href="/products"><span className="list-symbol"><Package size={20}/></span><div><strong>Kelola produk</strong><small>Tambahkan barang dan harga jual</small></div><ArrowUpRight size={17}/></Link>
            <Link href="/pos"><span className="list-symbol"><ShoppingBasket size={20}/></span><div><strong>Buka kasir</strong><small>Catat penjualan pelanggan</small></div><ArrowUpRight size={17}/></Link>
            <Link href="/inventory"><span className="list-symbol"><Boxes size={20}/></span><div><strong>Periksa persediaan</strong><small>Pantau ketersediaan barang</small></div><ArrowUpRight size={17}/></Link>
            <div className="quick-note">Catatan yang rapi dimulai dari setiap transaksi.</div>
          </aside>
        </section>
        <section className="overview-card stock-preview"><div className="card-heading"><div><h2>Persediaan produk</h2><p>Produk dengan stok paling sedikit</p></div><Link href="/inventory">Buka persediaan <ArrowUpRight size={15}/></Link></div>{products.length ? <div className="stock-grid">{products.map(([name, stock]) => <div key={name}><Package size={18}/><strong>{name}</strong><span>{stock}</span></div>)}</div> : <div className="stock-empty"><Package size={22}/><p>Belum ada produk yang tercatat.</p><Link href="/products">Tambahkan produk <Plus size={15}/></Link></div>}</section>
      </>}
      <footer className="overview-footer">WarungKu POS <span>Satu tempat untuk mengelola warung.</span></footer>
    </div>
  </main></>;
}
