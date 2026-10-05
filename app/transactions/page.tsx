'use client';

import { useEffect, useState } from 'react';
import { AppNav } from '@/components/AppNav';
import { createClient } from '@/lib/supabase/client';

const fallbackRecentSales: RecentSale[] = [];
type RecentSale = { invoice: string; method: string; total: number; time: string };

export default function TransactionsPage() {
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadSales = async () => {
      try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          if (active) {
            setRecentSales([]);
            setLoading(false);
          }
          return;
        }

        const supabase = createClient();
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData.user) {
          if (active) {
            setRecentSales([]);
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
            setRecentSales([]);
            setLoading(false);
          }
          return;
        }

        const { data, error } = await supabase
          .from('sales')
          .select('invoice_no,payment_method,total,created_at')
          .eq('tenant_id', membership.tenant_id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;

        const mapped = (data ?? []).map((row) => ({
          invoice: row.invoice_no,
          method: row.payment_method ?? 'CASH',
          total: Number(row.total ?? 0),
          time: new Date(row.created_at).toLocaleString('id-ID', {
            dateStyle: 'short',
            timeStyle: 'short',
          }),
        }));

        if (active) {
          setRecentSales(mapped);
        }
      } catch {
        if (active) setRecentSales([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadSales();

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <AppNav />
      <main className="min-h-screen bg-[#f6f2ea] p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-charcoal/60">Transaksi</p>
              <h1 className="text-3xl md:text-4xl">Riwayat Penjualan</h1>
            </div>
            <button className="rounded-full bg-gold px-5 py-3 font-semibold text-charcoal">+ Baru</button>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {[
              ['Total Penjualan', 'Rp 18.240.000'],
              ['Jumlah Transaksi', '184'],
              ['Rata-rata', 'Rp 99.130'],
              ['Laba Kotor', 'Rp 3.760.000'],
            ].map(([label, value]) => (
              <div key={label} className="panel rounded-[22px] p-5">
                <p className="text-sm text-charcoal/60">{label}</p>
                <p className="mt-3 text-2xl font-semibold">{value}</p>
              </div>
            ))}
          </div>

          <div className="panel rounded-[24px] p-5">
            {loading ? (
              <p className="text-sm text-charcoal/60">Memuat riwayat transaksi...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-charcoal/10 text-charcoal/60">
                      <th className="p-3">Invoice</th>
                      <th className="p-3">Waktu</th>
                      <th className="p-3">Metode</th>
                      <th className="p-3">Total</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSales.map((sale) => (
                      <tr key={sale.invoice} className="border-b border-charcoal/10">
                        <td className="p-3 font-semibold">{sale.invoice}</td>
                        <td className="p-3">{sale.time}</td>
                        <td className="p-3">{sale.method}</td>
                        <td className="p-3">Rp {sale.total.toLocaleString('id-ID')}</td>
                        <td className="p-3">
                          <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">Selesai</span>
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

