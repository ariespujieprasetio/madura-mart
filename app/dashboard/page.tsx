'use client';

import Link from 'next/link';
import { DashboardView } from '@/components/DashboardView';
import { useEffect, useMemo, useState } from 'react';
import { AppNav } from '@/components/AppNav';
import { createClient } from '@/lib/supabase/client';
import { summarizeCashFlow, summarizeReceivables } from '@/lib/finance';

const fallbackMetrics = [
  { label: 'Penjualan Hari Ini', value: 'Rp 2.450.000' },
  { label: 'Jumlah Transaksi', value: '87' },
  { label: 'Laba Kotor', value: 'Rp 430.000' },
  { label: 'Pengeluaran', value: 'Rp 120.000' },
  { label: 'Piutang Pelanggan', value: 'Rp 750.000' },
  { label: 'Hutang Supplier', value: 'Rp 3.200.000' },
  { label: 'Kas Saat Ini', value: 'Rp 1.850.000' },
  { label: 'Stok Menipis', value: '12 produk' },
];

const fallbackTopProducts = [
  ['Indomie Goreng', '398 pcs'],
  ['Aqua 600ml', '310 pcs'],
  ['Rokok Sampoerna', '245 pcs'],
  ['Teh Botol', '198 pcs'],
];

const fallbackLatestTransactions = [
  { id: 'INV-1042', time: '22:35', total: 'Rp 84.500', status: 'Selesai' },
  { id: 'INV-1041', time: '22:12', total: 'Rp 32.000', status: 'Selesai' },
  { id: 'INV-1039', time: '21:45', total: 'Rp 160.000', status: 'Bon' },
  { id: 'INV-1038', time: '21:22', total: 'Rp 48.000', status: 'Selesai' },
];

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [metrics, setMetrics] = useState(fallbackMetrics.map((item) => ({ ...item, value: item.label === 'Stok Menipis' ? '0 produk' : item.label === 'Jumlah Transaksi' ? '0' : 'Rp 0' })));
  const [topProducts, setTopProducts] = useState<string[][]>([]);
  const [latestTransactions, setLatestTransactions] = useState<Array<{id:string;time:string;total:string;status:string}>>([]);
  const [tenantName, setTenantName] = useState('Warung Anda');
  const [ownerName, setOwnerName] = useState('Pemilik warung');

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          if (active) {
            setIsDemoMode(false);
            setLoading(false);
          }
          return;
        }

        const supabase = createClient();
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData.user) {
          if (active) {
            setIsDemoMode(false);
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
            setIsDemoMode(false);
            setLoading(false);
          }
          return;
        }

        const tenantId = membership.tenant_id;
        const [{ data: tenant }, { data: profile }] = await Promise.all([
          supabase.from('tenants').select('name').eq('id', tenantId).maybeSingle(),
          supabase.from('profiles').select('full_name').eq('id', userData.user.id).maybeSingle(),
        ]);
        if (active) {
          setTenantName(tenant?.name || 'Warung Anda');
          setOwnerName(profile?.full_name || 'Pemilik warung');
        }

        const dayStart = new Date();
        dayStart.setHours(0, 0, 0, 0);
        const [salesRes, purchaseRes, expenseRes, productRes, receivableRes] = await Promise.all([
          supabase
            .from('sales')
            .select('id,invoice_no,total,payment_method,created_at')
            .eq('tenant_id', tenantId)
            .gte('created_at', dayStart.toISOString())
            .order('created_at', { ascending: false }),
          supabase.from('purchases').select('total').eq('tenant_id', tenantId).gte('purchased_at', dayStart.toISOString()),
          supabase.from('expenses').select('amount').eq('tenant_id', tenantId).gte('spent_at', dayStart.toISOString()),
          supabase
            .from('products')
            .select('name,stock,minimum_stock,unit,selling_price')
            .eq('tenant_id', tenantId)
            .order('stock', { ascending: true })
            .limit(4),
          supabase.from('receivables').select('amount,paid_amount').eq('tenant_id', tenantId),
        ]);

        const salesRows = salesRes.data ?? [];
        const purchaseRows = purchaseRes.data ?? [];
        const expenseRows = expenseRes.data ?? [];
        const productRows = productRes.data ?? [];
        const receivableRows = receivableRes.data ?? [];

        const totalSales = salesRows.reduce((sum, row) => sum + Number(row.total ?? 0), 0);
        const totalPurchases = purchaseRows.reduce((sum, row) => sum + Number(row.total ?? 0), 0);
        const totalExpenses = expenseRows.reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
        const cashFlow = summarizeCashFlow({ sales: totalSales, purchases: totalPurchases, expenses: totalExpenses, initialCash: 0 });
        const receivableSummary = summarizeReceivables(
          receivableRows.map((row) => ({ total: Number(row.amount ?? 0), paid: Number(row.paid_amount ?? 0) })),
        );
        const lowStockCount = productRows.filter((row) => Number(row.stock ?? 0) <= Number(row.minimum_stock ?? 0)).length;

        const liveMetrics = [
          { label: 'Penjualan Hari Ini', value: `Rp ${totalSales.toLocaleString('id-ID')}` },
          { label: 'Jumlah Transaksi', value: `${salesRows.length}` },
          { label: 'Laba Kotor', value: `Rp ${Math.max(cashFlow.netCash, 0).toLocaleString('id-ID')}` },
          { label: 'Pengeluaran', value: `Rp ${totalExpenses.toLocaleString('id-ID')}` },
          { label: 'Piutang Pelanggan', value: `Rp ${receivableSummary.remaining.toLocaleString('id-ID')}` },
          { label: 'Hutang Supplier', value: `Rp ${totalPurchases.toLocaleString('id-ID')}` },
          { label: 'Kas Saat Ini', value: `Rp ${cashFlow.endingCash.toLocaleString('id-ID')}` },
          { label: 'Stok Menipis', value: `${lowStockCount} produk` },
        ];

        const liveTopProducts = productRows.slice(0, 4).map((row) => [row.name, `${Number(row.stock ?? 0).toFixed(0)} ${row.unit ?? 'pcs'}`]);
        const liveTransactions = salesRows.slice(0, 4).map((row) => ({
          id: row.invoice_no ?? 'INV',
          time: new Date(row.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          total: `Rp ${Number(row.total ?? 0).toLocaleString('id-ID')}`,
          status: row.payment_method ?? 'CASH',
        }));

        if (active) {
          setIsDemoMode(false);
          setMetrics(liveMetrics);
          setTopProducts(liveTopProducts);
          setLatestTransactions(liveTransactions);
        }
      } catch {
        if (active) {
          setIsDemoMode(false);
          setMetrics(fallbackMetrics.map((item) => ({ ...item, value: item.label === 'Stok Menipis' ? '0 produk' : item.label === 'Jumlah Transaksi' ? '0' : 'Rp 0' })));
          setTopProducts([]);
          setLatestTransactions([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);
  return <DashboardView tenantName={tenantName} ownerName={ownerName} loading={loading} metrics={metrics} products={topProducts} transactions={latestTransactions}/>;
}
