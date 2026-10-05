'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppNav } from '@/components/AppNav';
import { createClient } from '@/lib/supabase/client';
import { summarizeCashFlow } from '@/lib/finance';

const fallbackSalesSummary = [
  { label: 'Penjualan Hari Ini', value: 18240000, trend: '+12.4%' },
  { label: 'Margin Bersih', value: 3760000, trend: '+8.1%' },
  { label: 'Pembelian', value: 6500000, trend: '-3.2%' },
  { label: 'Kas Tutup Shift', value: 610000, trend: 'Seimbang' },
];

const fallbackChannelBreakdown = [
  { name: 'Cash', amount: 7200000, share: '39%' },
  { name: 'QRIS', amount: 5600000, share: '31%' },
  { name: 'Transfer', amount: 2900000, share: '16%' },
  { name: 'Bon', amount: 2200000, share: '12%' },
  { name: 'Lain-lain', amount: 1000000, share: '2%' },
];

const topProducts = [
  { name: 'Mie Goreng Spesial', sold: 142, revenue: 'Rp 1.920.000' },
  { name: 'Es Teh Botol', sold: 118, revenue: 'Rp 842.000' },
  { name: 'Kopi Susu', sold: 91, revenue: 'Rp 730.000' },
  { name: 'Susu UHT', sold: 76, revenue: 'Rp 610.000' },
];

const recentActions = [
  'Shift pagi ditutup dengan selisih kas Rp 0',
  'Pembelian supplier PT Sumber Jaya masuk 2 jam lalu',
  '2 tagihan pelanggan menunggu konfirmasi WhatsApp',
  'Pengeluaran listrik bulan ini mencapai 82% anggaran',
];

export default function ReportsPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadReports = async () => {
      try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          if (active) {
            setSales([]);
            setPurchases([]);
            setExpenses([]);
            setLoading(false);
          }
          return;
        }

        const supabase = createClient();
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
          if (active) {
            setSales([]);
            setPurchases([]);
            setExpenses([]);
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
            setSales([]);
            setPurchases([]);
            setExpenses([]);
            setLoading(false);
          }
          return;
        }

        const [salesData, purchaseData, expenseData] = await Promise.all([
          supabase.from('sales').select('total,payment_method,created_at').eq('tenant_id', membership.tenant_id),
          supabase.from('purchases').select('total').eq('tenant_id', membership.tenant_id),
          supabase.from('expenses').select('amount').eq('tenant_id', membership.tenant_id),
        ]);

        if (active) {
          setSales(salesData.data ?? []);
          setPurchases(purchaseData.data ?? []);
          setExpenses(expenseData.data ?? []);
        }
      } catch {
        if (active) {
          setSales([]);
          setPurchases([]);
          setExpenses([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadReports();

    return () => {
      active = false;
    };
  }, []);

  const summary = useMemo(() => {
    const totalSales = (sales ?? []).reduce((sum, row) => sum + Number(row.total ?? 0), 0);
    const totalPurchases = (purchases ?? []).reduce((sum, row) => sum + Number(row.total ?? 0), 0);
    const totalExpenses = (expenses ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
    const cashFlow = summarizeCashFlow({ sales: totalSales, purchases: totalPurchases, expenses: totalExpenses, initialCash: 0 });

    return {
      totalSales,
      totalPurchases,
      totalExpenses,
      cashFlow,
      paymentBreakdown: (sales ?? []).reduce<Record<string, number>>((acc, row) => {
        const method = row.payment_method ?? 'CASH';
        acc[method] = (acc[method] ?? 0) + Number(row.total ?? 0);
        return acc;
      }, {}),
    };
  }, [sales, purchases, expenses]);

  const salesSummary = useMemo(() => {
    const paymentTotal = Object.values(summary.paymentBreakdown).reduce((sum, value) => sum + value, 0) || 1;
    const channelBreakdown = Object.entries(summary.paymentBreakdown).map(([name, amount]) => ({
      name,
      amount,
      share: `${Math.max((amount / paymentTotal) * 100, 2).toFixed(0)}%`,
    }));

    const salesValue = summary.totalSales;
    const cashFlowValue = summary.cashFlow.endingCash;

    return {
      cards: [
        { label: 'Penjualan Hari Ini', value: salesValue, trend: '+12.4%' },
        { label: 'Margin Bersih', value: Math.max(summary.cashFlow.netCash, 0), trend: '' },
        { label: 'Pembelian', value: summary.totalPurchases, trend: '' },
        { label: 'Kas Tutup Shift', value: cashFlowValue, trend: 'Seimbang' },
      ],
      channelBreakdown,
    };
  }, [summary]);

  return (
    <>
      <AppNav />
      <main className="min-h-screen bg-[#f6f2ea] p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-charcoal/60">Laporan</p>
              <h1 className="text-3xl md:text-4xl">Ringkasan operasional</h1>
            </div>
            <button className="rounded-full bg-gold px-5 py-3 font-semibold text-charcoal">Export PDF</button>
          </div>

          {loading ? (
            <p className="text-sm text-charcoal/60">Memuat laporan operasional...</p>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {salesSummary.cards.map((item) => (
                  <div key={item.label} className="panel rounded-[24px] p-5">
                    <p className="text-sm text-charcoal/60">{item.label}</p>
                    <p className="mt-3 text-2xl font-semibold">Rp {Number(item.value).toLocaleString('id-ID')}</p>
                    <p className="mt-2 text-sm text-green-700">{item.trend}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
                <div className="panel rounded-[24px] p-5">
                  <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-2xl">Breakdown metode pembayaran</h2>
                    <span className="rounded-full bg-charcoal/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-charcoal/60">Hari ini</span>
                  </div>

                  <div className="space-y-4">
                    {salesSummary.channelBreakdown.map((row) => (
                      <div key={row.name}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span>{row.name}</span>
                          <span>Rp {row.amount.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-charcoal/5">
                          <div className="h-full rounded-full bg-gold" style={{ width: row.share }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="panel rounded-[24px] p-5">
                  <h2 className="text-2xl">Poin penting</h2>
                  <ul className="mt-5 space-y-3">
                    <li className="rounded-2xl bg-charcoal/5 p-3 text-sm text-charcoal/60">Belum ada aktivitas.</li>
                  </ul>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="panel rounded-[24px] p-5">
                  <h2 className="text-2xl">Top produk</h2>
                  <div className="mt-5 space-y-4">
                    <p className="rounded-2xl border border-charcoal/10 p-3 text-sm text-charcoal/60">Belum ada penjualan produk.</p>
                  </div>
                </div>

                <div className="panel rounded-[24px] p-5">
                  <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-2xl">Rekonsiliasi kas shift</h2>
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Balanced</span>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    {[
                      ['Kas awal', 'Rp 0'],
                      ['Kas masuk', `Rp ${summary.totalSales.toLocaleString('id-ID')}`],
                      ['Kas keluar', `Rp ${summary.totalExpenses.toLocaleString('id-ID')}`],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-2xl bg-charcoal/5 p-4">
                        <p className="text-sm text-charcoal/60">{label}</p>
                        <p className="mt-2 text-xl font-semibold">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-2xl border border-dashed border-gold/70 bg-gold/5 p-4">
                    <p className="text-sm uppercase tracking-[0.2em] text-charcoal/60">Kas akhir yang diharapkan</p>
                    <p className="mt-2 text-3xl font-semibold">Rp {summary.cashFlow.endingCash.toLocaleString('id-ID')}</p>
                    <p className="mt-2 text-sm text-charcoal/60">Selisih aktual: Rp 0</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
