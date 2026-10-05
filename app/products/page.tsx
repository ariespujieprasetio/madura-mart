'use client';

import { useEffect, useState } from 'react';
import { AppNav } from '@/components/AppNav';
import { createClient } from '@/lib/supabase/client';

type ProductRow = {
  name: string;
  sku: string;
  category: string;
  purchase: number;
  selling: number;
  stock: number;
  unit: string;
  status: 'Aktif' | 'Stok Menipis';
};

const fallbackProducts: ProductRow[] = [
  { name: 'Indomie Goreng', sku: 'IND-001', category: 'Mie Instan', purchase: 2400, selling: 3500, stock: 42, unit: 'pcs', status: 'Aktif' },
  { name: 'Aqua 600ml', sku: 'AQUA-600', category: 'Minuman', purchase: 3000, selling: 4000, stock: 84, unit: 'botol', status: 'Aktif' },
  { name: 'Rokok Sampoerna', sku: 'ROK-01', category: 'Rokok', purchase: 21000, selling: 25000, stock: 18, unit: 'bungkus', status: 'Aktif' },
  { name: 'Teh Botol', sku: 'THB-202', category: 'Minuman', purchase: 3500, selling: 5000, stock: 27, unit: 'botol', status: 'Aktif' },
  { name: 'Sabun Cuci', sku: 'SAB-003', category: 'Kebutuhan Rumah', purchase: 6500, selling: 9000, stock: 30, unit: 'pcs', status: 'Stok Menipis' },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    const loadProducts = async () => {
      try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          if (alive) {
            setProducts([]);
            setLoading(false);
          }
          return;
        }

        const supabase = createClient();
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData.user) {
          if (alive) {
            setProducts([]);
            setLoading(false);
          }
          return;
        }

        const { data: tenantMembership } = await supabase
          .from('tenant_users')
          .select('tenant_id')
          .eq('user_id', userData.user.id)
          .limit(1)
          .maybeSingle();

        if (!tenantMembership?.tenant_id) {
          if (alive) {
            setProducts([]);
            setLoading(false);
          }
          return;
        }

        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('tenant_id', tenantMembership.tenant_id)
          .order('name');

        if (error) throw error;

        const mapped: ProductRow[] = (data ?? []).map((row) => {
          const stock = Number(row.stock ?? 0);
          const minimum = Number(row.minimum_stock ?? 0);
          const status: ProductRow['status'] = row.active && stock <= minimum ? 'Stok Menipis' : 'Aktif';

          return {
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

        if (alive) {
          setProducts(mapped);
        }
      } catch {
        if (alive) {
          setProducts([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    };

    loadProducts();

    return () => {
      alive = false;
    };
  }, []);

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
            <button className="rounded-full bg-gold px-5 py-3 font-semibold text-charcoal">+ Tambah Produk</button>
          </div>

          <div className="panel mb-6 rounded-[24px] p-5">
            <div className="grid gap-3 md:grid-cols-4">
              <input placeholder="Nama produk" className="rounded-2xl border border-charcoal/10 bg-white px-3 py-3" />
              <input placeholder="SKU" className="rounded-2xl border border-charcoal/10 bg-white px-3 py-3" />
              <input placeholder="Harga jual" type="number" className="rounded-2xl border border-charcoal/10 bg-white px-3 py-3" />
              <button className="rounded-2xl bg-charcoal px-3 py-3 font-semibold text-white">Simpan Produk</button>
            </div>
          </div>

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
