'use client';

import { useEffect, useState } from 'react';
import { AppNav } from '@/components/AppNav';
import { createClient } from '@/lib/supabase/client';

type ProductRow = {
  id?: string;
  name: string;
  sku: string;
  category: string;
  purchase: number;
  selling: number;
  stock: number;
  unit: string;
  status: 'Aktif' | 'Stok Menipis';
};

function normalizeSku(input: string, name: string) {
  const base = (input || name || 'produk').trim();
  const clean = base.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'PRODUK';
  return clean.slice(0, 24);
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    name: '',
    sku: '',
    purchase: '',
    selling: '',
    stock: '0',
    unit: 'pcs',
  });

  const loadProducts = async () => {
    const supabase = createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const { data: tenantMembership } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', userData.user.id)
      .limit(1)
      .maybeSingle();

    if (!tenantMembership?.tenant_id) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('tenant_id', tenantMembership.tenant_id)
      .order('name');

    if (error) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const mapped: ProductRow[] = (data ?? []).map((row) => {
      const stock = Number(row.stock ?? 0);
      const minimum = Number(row.minimum_stock ?? 0);
      const status: ProductRow['status'] = row.active && stock <= minimum ? 'Stok Menipis' : 'Aktif';

      return {
        id: row.id,
        name: row.name,
        sku: row.sku,
        category: 'Umum',
        purchase: Number(row.purchase_price ?? 0),
        selling: Number(row.selling_price ?? 0),
        stock,
        unit: row.unit ?? 'pcs',
        status,
      };
    });

    setProducts(mapped);
    setLoading(false);
  };

  useEffect(() => {
    let alive = true;

    const run = async () => {
      try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          if (alive) {
            setProducts([]);
            setLoading(false);
          }
          return;
        }

        await loadProducts();
      } catch {
        if (alive) {
          setProducts([]);
          setLoading(false);
        }
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, []);

  async function handleAddProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');

    if (!form.name.trim()) {
      setFormError('Nama produk wajib diisi.');
      return;
    }

    const purchase = Number(form.purchase || 0);
    const selling = Number(form.selling || 0);
    const stock = Number(form.stock || 0);
    const sku = normalizeSku(form.sku, form.name);

    if (purchase < 0 || selling < 0 || stock < 0) {
      setFormError('Harga dan stok tidak boleh negatif.');
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        setFormError('Sesi login tidak valid. Silakan login ulang.');
        setSaving(false);
        return;
      }

      const { data: tenantMembership } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', userData.user.id)
        .limit(1)
        .maybeSingle();

      if (!tenantMembership?.tenant_id) {
        setFormError('Akun Anda belum terhubung ke tenant.');
        setSaving(false);
        return;
      }

      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('tenant_id', tenantMembership.tenant_id)
        .eq('sku', sku)
        .maybeSingle();

      if (existing) {
        setFormError(`SKU ${sku} sudah dipakai. Silakan ganti SKU lain.`);
        setSaving(false);
        return;
      }

      const payload = {
        tenant_id: tenantMembership.tenant_id,
        name: form.name.trim(),
        sku,
        purchase_price: purchase,
        selling_price: selling,
        stock,
        minimum_stock: 0,
        unit: form.unit || 'pcs',
        active: true,
      };

      const { data: inserted, error: insertError } = await supabase
        .from('products')
        .insert(payload)
        .select()
        .single();

      if (insertError) throw insertError;

      setProducts((current) => [{
        id: inserted.id,
        name: inserted.name,
        sku: inserted.sku,
        category: 'Umum',
        purchase: Number(inserted.purchase_price ?? 0),
        selling: Number(inserted.selling_price ?? 0),
        stock: Number(inserted.stock ?? 0),
        unit: inserted.unit ?? 'pcs',
        status: Number(inserted.stock ?? 0) <= Number(inserted.minimum_stock ?? 0) ? 'Stok Menipis' : 'Aktif',
      }, ...current]);

      setForm({ name: '', sku: '', purchase: '', selling: '', stock: '0', unit: 'pcs' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menambah produk.';
      setFormError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AppNav />
      <main className="min-h-screen bg-[#f6f2ea] p-4 md:p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-charcoal/60">Master Data</p>
              <h1 className="text-3xl md:text-4xl">Produk</h1>
            </div>
            <button
              className="rounded-full bg-gold px-5 py-3 font-semibold text-charcoal"
              type="button"
              onClick={() => setShowForm((current) => !current)}
            >
              {showForm ? '- Tutup Form' : '+ Tambah Produk'}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleAddProduct} className="panel mb-6 rounded-[24px] p-5">
              <div className="grid gap-3 md:grid-cols-6">
                <input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Nama produk"
                  className="rounded-2xl border border-charcoal/10 bg-white px-3 py-3 md:col-span-2"
                />
                <input
                  value={form.sku}
                  onChange={(event) => setForm((current) => ({ ...current, sku: event.target.value }))}
                  placeholder="SKU"
                  className="rounded-2xl border border-charcoal/10 bg-white px-3 py-3"
                />
                <input
                  value={form.purchase}
                  onChange={(event) => setForm((current) => ({ ...current, purchase: event.target.value }))}
                  placeholder="Harga modal"
                  type="number"
                  className="rounded-2xl border border-charcoal/10 bg-white px-3 py-3"
                />
                <input
                  value={form.selling}
                  onChange={(event) => setForm((current) => ({ ...current, selling: event.target.value }))}
                  placeholder="Harga jual"
                  type="number"
                  className="rounded-2xl border border-charcoal/10 bg-white px-3 py-3"
                />
                <input
                  value={form.stock}
                  onChange={(event) => setForm((current) => ({ ...current, stock: event.target.value }))}
                  placeholder="Stok awal"
                  type="number"
                  className="rounded-2xl border border-charcoal/10 bg-white px-3 py-3"
                />
                <input
                  value={form.unit}
                  onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))}
                  placeholder="Satuan"
                  className="rounded-2xl border border-charcoal/10 bg-white px-3 py-3 md:col-span-1"
                />
                <div className="md:col-span-6 flex items-center justify-between gap-3">
                  <button type="submit" disabled={saving} className="rounded-2xl bg-charcoal px-4 py-3 font-semibold text-white disabled:opacity-60">
                    {saving ? 'Menyimpan...' : 'Simpan Produk'}
                  </button>
                  {formError && <p className="text-sm text-red-600">{formError}</p>}
                </div>
              </div>
            </form>
          )}

          <div className="panel rounded-[24px] p-5">
            <div className="mb-4 flex items-center justify-between">
              <input placeholder="Cari produk atau SKU" className="w-full max-w-sm rounded-2xl border border-charcoal/10 bg-white px-3 py-3" />
              <button className="rounded-full border border-charcoal/10 bg-white px-4 py-2">Export CSV</button>
            </div>

            {loading ? (
              <p className="py-4 text-sm text-charcoal/60">Memuat produk...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-charcoal/10 text-charcoal/60">
                      <th className="p-3">Nama</th>
                      <th className="p-3">SKU</th>
                      <th className="p-3">Kategori</th>
                      <th className="p-3">Harga Modal</th>
                      <th className="p-3">Harga Jual</th>
                      <th className="p-3">Stok</th>
                      <th className="p-3">Satuan</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.sku} className="border-b border-charcoal/10">
                        <td className="p-3 font-semibold">{product.name}</td>
                        <td className="p-3">{product.sku}</td>
                        <td className="p-3">{product.category}</td>
                        <td className="p-3">Rp {product.purchase.toLocaleString('id-ID')}</td>
                        <td className="p-3">Rp {product.selling.toLocaleString('id-ID')}</td>
                        <td className="p-3">{product.stock}</td>
                        <td className="p-3">{product.unit}</td>
                        <td className="p-3">
                          <span className={`rounded-full px-2 py-1 text-xs ${product.status === 'Stok Menipis' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {product.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
