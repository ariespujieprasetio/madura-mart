"use client";

import { useEffect, useMemo, useState } from 'react';
import { AppNav } from '@/components/AppNav';
import { createClient } from '@/lib/supabase/client';
import { calculateCartTotals, calculateChange } from '@/lib/finance';

type Product = {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  unit: string;
};

type CartItem = {
  product: Product;
  quantity: number;
  discount: number;
};

const fallbackCatalog: Product[] = [
  { id: 'demo-1', name: 'Indomie Goreng', sku: 'IND-001', price: 3500, stock: 42, unit: 'pcs' },
  { id: 'demo-2', name: 'Aqua 600ml', sku: 'AQUA-600', price: 4000, stock: 84, unit: 'botol' },
  { id: 'demo-3', name: 'Rokok Sampoerna', sku: 'ROK-01', price: 25000, stock: 18, unit: 'bungkus' },
  { id: 'demo-4', name: 'Teh Botol', sku: 'THB-202', price: 5000, stock: 27, unit: 'botol' },
  { id: 'demo-5', name: 'Minyak Goreng', sku: 'MGO-500', price: 18000, stock: 12, unit: 'liter' },
  { id: 'demo-6', name: 'Sabun Cuci', sku: 'SAB-003', price: 9000, stock: 30, unit: 'pcs' },
  { id: 'demo-7', name: 'Mie Instan', sku: 'MIE-022', price: 3200, stock: 60, unit: 'pcs' },
  { id: 'demo-8', name: 'Kopi Kapal Api', sku: 'KOP-001', price: 4500, stock: 35, unit: 'pcs' },
];

export default function PosPage() {
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paidAmount, setPaidAmount] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadCatalog = async () => {
      try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          if (active) {
            setCatalog([]);
            setLoading(false);
          }
          return;
        }

        const supabase = createClient();
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData.user) {
          if (active) {
            setCatalog([]);
            setLoading(false);
          }
          return;
        }

        const { data: membership } = await supabase
          .from('tenant_users')
          .select('tenant_id')
          .eq('user_id', userData.user.id)
          .limit(1)
          .maybeSingle();

        if (!membership?.tenant_id) {
          if (active) {
            setCatalog([]);
            setLoading(false);
          }
          return;
        }

        const { data, error } = await supabase
          .from('products')
          .select('id,name,sku,selling_price,stock,unit,active')
          .eq('tenant_id', membership.tenant_id)
          .eq('active', true)
          .order('name');

        if (error) throw error;

        const mapped = (data ?? []).map((row) => ({
          id: row.id,
          name: row.name,
          sku: row.sku,
          price: Number(row.selling_price ?? 0),
          stock: Number(row.stock ?? 0),
          unit: row.unit ?? 'pcs',
        }));

        if (active) {
          setCatalog(mapped);
        }
      } catch {
        if (active) setCatalog([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadCatalog();

    return () => {
      active = false;
    };
  }, []);

  const filteredProducts = useMemo(
    () =>
      catalog.filter((product) =>
        `${product.name} ${product.sku}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [catalog, search],
  );

  const addToCart = (product: Product) => {
    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id);

      if (existing) {
        return current.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
            : item,
        );
      }

      return [...current, { product, quantity: 1, discount: 0 }];
    });
  };

  const updateQuantity = (productId: string, nextQuantity: number) => {
    setCart((current) =>
      current
        .map((item) =>
          item.product.id === productId ? { ...item, quantity: Math.max(0, nextQuantity) } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const totals = calculateCartTotals(
    cart.map((item) => ({ quantity: item.quantity, unitPrice: item.product.price, discount: item.discount })),
  );

  const change = calculateChange(totals.total, Number(paidAmount || 0));

  const handleCheckout = async () => {
    if (cart.length === 0 || totals.total <= 0 || saving) return;

    setSaving(true);
    setNotice(null);

    try {
      const supabase = createClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        throw new Error('Silakan login terlebih dahulu untuk menyimpan transaksi.');
      }

      const { data: membership } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', userData.user.id)
        .limit(1)
        .maybeSingle();

      if (!membership?.tenant_id) {
        throw new Error('Akun belum terhubung ke tenant aktif.');
      }

      const { data: branch } = await supabase
        .from('branches')
        .select('id')
        .eq('tenant_id', membership.tenant_id)
        .limit(1)
        .maybeSingle();

      if (!branch?.id) {
        throw new Error('Cabang aktif belum tersedia untuk transaksi.');
      }

      if (paymentMethod === 'RECEIVABLE') {
        throw new Error('Pembayaran bon belum tersedia sampai pencatatan pelanggan dan piutang terhubung.');
      }
      const cashReceived = paymentMethod === 'CASH' ? Number(paidAmount) : totals.total;
      if (!Number.isFinite(cashReceived) || cashReceived < totals.total) {
        throw new Error('Uang diterima belum cukup.');
      }
      const changeAmount = paymentMethod === 'CASH' ? Math.max(cashReceived - totals.total, 0) : 0;
      const invoiceNo = `INV-${crypto.randomUUID()}`;

      const { error: saleError } = await supabase.rpc('create_sale_atomic', {
        p_tenant_id: membership.tenant_id,
        p_branch_id: branch.id,
        p_invoice_no: invoiceNo,
        p_subtotal: totals.subtotal,
        p_total: totals.total,
        p_method: paymentMethod,
        p_paid: cashReceived,
        p_change: changeAmount,
        p_items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
      });

      if (saleError) throw saleError;

      setCart([]);
      setPaidAmount('');
      setPaymentMethod('CASH');
      setNotice(`Transaksi ${invoiceNo} berhasil disimpan.`);
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : 'Transaksi gagal disimpan. Silakan coba lagi.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AppNav />
      <main className="grid min-h-[calc(100vh-72px)] gap-4 bg-[#f6f2ea] p-4 lg:grid-cols-[1.4fr_0.9fr] lg:p-6">
        <section className="panel rounded-[28px] p-4 md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-charcoal/60">Kasir</p>
              <h1 className="text-3xl md:text-4xl">Point of Sale</h1>
            </div>
            <div className="rounded-full bg-[#efe4cc] px-3 py-1 text-sm font-semibold">Mode mobile-first</div>
          </div>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari produk atau SKU"
            className="mt-5 w-full rounded-2xl border border-charcoal/10 bg-white px-4 py-3 text-sm outline-none ring-0"
          />

          {loading ? (
            <p className="mt-5 text-sm text-charcoal/60">Memuat katalog produk...</p>
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="rounded-[20px] border border-charcoal/10 bg-white p-4 text-left transition hover:border-gold hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{product.name}</span>
                    <span className="rounded-full bg-[#f4ecdf] px-2 py-1 text-[10px] uppercase text-charcoal">{product.stock} stok</span>
                  </div>
                  <p className="mt-2 text-sm text-charcoal/60">{product.sku}</p>
                  <p className="mt-4 text-lg font-semibold">Rp {product.price.toLocaleString('id-ID')}</p>
                </button>
              ))}
            </div>
          )}
        </section>

        <aside className="rounded-[28px] bg-charcoal p-4 text-white md:p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl">Keranjang</h2>
            <span className="rounded-full bg-white/10 px-2 py-1 text-sm">{cart.length} item</span>
          </div>

          <div className="mt-5 space-y-3">
            {cart.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/20 p-6 text-center text-white/60">
                Belum ada produk di keranjang.
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{item.product.name}</p>
                      <p className="text-xs text-white/50">{item.product.sku}</p>
                    </div>
                    <button
                      onClick={() => updateQuantity(item.product.id, 0)}
                      className="text-sm text-red-300"
                    >
                      Hapus
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center overflow-hidden rounded-xl border border-white/10">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="h-9 w-9 text-lg"
                      >
                        −
                      </button>
                      <span className="w-10 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="h-9 w-9 text-lg"
                      >
                        +
                      </button>
                    </div>
                    <p className="font-semibold">Rp {(item.product.price * item.quantity).toLocaleString('id-ID')}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 space-y-3 rounded-2xl bg-white/5 p-3">
            <div className="flex items-center justify-between text-sm text-white/70">
              <span>Subtotal</span>
              <span>Rp {totals.subtotal.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-white/70">
              <span>Diskon</span>
              <span>Rp {totals.discount.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex items-center justify-between text-xl font-semibold">
              <span>Total</span>
              <span>Rp {totals.total.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <label className="block text-sm text-white/70">Metode pembayaran</label>
            <select
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white px-3 py-3 text-charcoal outline-none"
            >
              <option value="CASH">Cash</option>
              <option value="QRIS">QRIS</option>
              <option value="TRANSFER">Transfer</option>
              <option value="RECEIVABLE" disabled>Bon (belum tersedia)</option>
              <option value="OTHER">Lainnya</option>
            </select>

            {paymentMethod === 'CASH' && (
              <>
                <label className="block text-sm text-white/70">Uang diterima</label>
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(event) => setPaidAmount(event.target.value)}
                  placeholder="Rp 50.000"
                  className="w-full rounded-2xl border border-white/10 bg-white px-3 py-3 text-charcoal outline-none"
                />
                <div className="flex items-center justify-between text-sm text-white/70">
                  <span>Kembalian</span>
                  <span>Rp {change.toLocaleString('id-ID')}</span>
                </div>
              </>
            )}
          </div>

          {notice && <p className="mt-4 text-sm text-[#f5d9a0]">{notice}</p>}

          <button
            onClick={handleCheckout}
            disabled={saving || cart.length === 0 || totals.total <= 0}
            className="mt-6 w-full rounded-2xl bg-gold px-4 py-4 text-lg font-semibold text-charcoal disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'MEMPROSES...' : 'BAYAR'}
          </button>
        </aside>
      </main>
    </>
  );
}
