'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppNav } from '@/components/AppNav';
import { createClient } from '@/lib/supabase/client';

type StockRow = {
  name: string;
  sku: string;
  stock: number;
  minimum: number;
  unit: string;
  status: 'Menipis' | 'Aman';
};

type StockHistoryItem = {
  date: string;
  name: string;
  movement: string;
  note: string;
  isIncrease: boolean;
};

export default function InventoryPage() {
  const [stockRows, setStockRows] = useState<StockRow[]>([]);
  const [stockHistory, setStockHistory] = useState<StockHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    const loadInventory = async () => {
      try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          if (alive) {
            setStockRows([]);
            setStockHistory([]);
            setLoading(false);
          }
          return;
        }

        const supabase = createClient();
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData.user) {
          if (alive) {
            setStockRows([]);
            setStockHistory([]);
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
            setStockRows([]);
            setStockHistory([]);
            setLoading(false);
          }
          return;
        }

        const tenantId = tenantMembership.tenant_id;

        const [productsResult, movementsResult] = await Promise.all([
          supabase.from('products').select('*').eq('tenant_id', tenantId).order('name'),
          supabase
            .from('stock_movements')
            .select('created_at, quantity, movement_type, product_id, products(name, sku)')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })
            .limit(12),
        ]);

        if (productsResult.error) throw productsResult.error;
        if (movementsResult.error) throw movementsResult.error;

        const mappedRows: StockRow[] = (productsResult.data ?? []).map((row) => {
          const stock = Number(row.stock ?? 0);
          const minimum = Number(row.minimum_stock ?? 0);
          const status: StockRow['status'] = stock <= minimum ? 'Menipis' : 'Aman';

          return {
            name: row.name,
            sku: row.sku,
            stock,
            minimum,
            unit: row.unit ?? 'pcs',
            status,
          };
        });

        const mappedHistory: StockHistoryItem[] = (movementsResult.data ?? []).map((row) => {
          const quantity = Number(row.quantity ?? 0);
          const product = Array.isArray(row.products) ? row.products[0] : row.products;
          const movementValue = Math.abs(quantity);
          const movementText = `${quantity > 0 ? '+' : '-'}${movementValue}`;
          const noteMap: Record<string, string> = {
            IN: 'Stock masuk',
            OUT: 'Penjualan / pengurangan',
            ADJUSTMENT: 'Penyesuaian stok',
            TRANSFER: 'Transfer antar cabang',
          };

          return {
            date: new Date(row.created_at).toLocaleDateString('id-ID'),
            name: product?.name ?? 'Produk',
            movement: movementText,
            note: noteMap[row.movement_type ?? 'OUT'] ?? 'Perubahan stok',
            isIncrease: quantity > 0,
          };
        });

        if (alive) {
          setStockRows(mappedRows);
          setStockHistory(mappedHistory);
        }
      } catch {
        if (alive) {
          setStockRows([]);
          setStockHistory([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    };

    loadInventory();

    return () => {
      alive = false;
    };
  }, []);

  const summary = useMemo(() => ({
    totalSku: stockRows.length,
    lowStock: stockRows.filter((row) => row.status === 'Menipis').length,
    stockInToday: stockHistory.filter((item) => item.isIncrease && item.date === new Date().toLocaleDateString('id-ID')).length,
  }), [stockRows, stockHistory]);

  return (
    <>
      <AppNav />
      <main className="min-h-screen bg-[#f6f2ea] p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-charcoal/60">Persediaan</p>
              <h1 className="text-3xl md:text-4xl">Inventory & Stok</h1>
            </div>
            <button className="rounded-full bg-gold px-5 py-3 font-semibold text-charcoal">+ Stock In</button>
          </div>

          <div className="panel rounded-[24px] p-5">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                ['Total SKU', String(summary.totalSku)],
                ['Stok Menipis', String(summary.lowStock)],
                ['Stock In Hari Ini', String(summary.stockInToday)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[20px] bg-[#f8f3ed] p-4">
                  <p className="text-sm text-charcoal/60">{label}</p>
                  <p className="mt-3 text-2xl font-semibold">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="panel rounded-[24px] p-5">
              <h2 className="text-2xl">Stok menipis</h2>
              {loading ? (
                <p className="mt-4 text-sm text-charcoal/60">Memuat stok...</p>
              ) : stockRows.length === 0 ? (
                <p className="mt-4 text-sm text-charcoal/60">Belum ada data stok untuk tenant ini.</p>
              ) : (
                <div className="mt-5 space-y-3">
                  {stockRows.map((row) => (
                    <div key={row.sku} className="flex items-center justify-between rounded-2xl bg-[#f8f3ed] p-3">
                      <div>
                        <p className="font-semibold">{row.name}</p>
                        <p className="text-sm text-charcoal/60">{row.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{row.stock} {row.unit}</p>
                        <p className={`text-xs ${row.status === 'Menipis' ? 'text-red-600' : 'text-green-700'}`}>{row.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="panel rounded-[24px] p-5">
              <h2 className="text-2xl">Stock history</h2>
              {loading ? (
                <p className="mt-4 text-sm text-charcoal/60">Memuat riwayat stok...</p>
              ) : stockHistory.length === 0 ? (
                <p className="mt-4 text-sm text-charcoal/60">Belum ada riwayat perubahan stok.</p>
              ) : (
                <div className="mt-5 space-y-3">
                  {stockHistory.map((item, index) => (
                    <div key={`${item.date}-${item.name}-${index}`} className="rounded-2xl bg-[#f8f3ed] p-3">
                      <p className="text-sm text-charcoal/60">{item.date}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-semibold">{item.name}</span>
                        <span className={item.isIncrease ? 'text-green-700' : 'text-red-600'}>{item.movement}</span>
                      </div>
                      <p className="mt-1 text-sm text-charcoal/60">{item.note}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
