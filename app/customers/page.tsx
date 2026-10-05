'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppNav } from '@/components/AppNav';
import { createClient } from '@/lib/supabase/client';
import { calculateBalanceStatus, summarizeReceivables } from '@/lib/finance';

const fallbackCustomerRows = [
  { name: 'Budi', phone: '0812-7777-1111', total: 235000, paid: 75000 },
  { name: 'Siti', phone: '0812-5555-2222', total: 180000, paid: 180000 },
  { name: 'Dewi', phone: '0812-3333-4444', total: 65000, paid: 18000 },
];
type CustomerRow = { name: string; phone: string; total: number; paid: number };

export default function CustomersPage() {
  const [customerRows, setCustomerRows] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadCustomers = async () => {
      try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          if (active) {
            setCustomerRows([]);
            setLoading(false);
          }
          return;
        }

        const supabase = createClient();
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData.user) {
          if (active) {
            setCustomerRows([]);
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
            setCustomerRows([]);
            setLoading(false);
          }
          return;
        }

        const [{ data: customers }, { data: receivables }] = await Promise.all([
          supabase.from('customers').select('id,name,phone').eq('tenant_id', membership.tenant_id),
          supabase.from('receivables').select('customer_id,amount,paid_amount').eq('tenant_id', membership.tenant_id),
        ]);

        const receivableMap = new Map(
          (receivables ?? []).map((row) => [row.customer_id, { total: Number(row.amount ?? 0), paid: Number(row.paid_amount ?? 0) }]),
        );

        const mappedRows = (customers ?? []).map((customer) => {
          const receivable = receivableMap.get(customer.id) ?? { total: 0, paid: 0 };
          return {
            name: customer.name,
            phone: customer.phone ?? '—',
            total: Number(receivable.total ?? 0),
            paid: Number(receivable.paid ?? 0),
          };
        });

        if (active) setCustomerRows(mappedRows);
      } catch {
        if (active) setCustomerRows([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadCustomers();

    return () => {
      active = false;
    };
  }, []);

  const summary = useMemo(() => summarizeReceivables(customerRows.map((row) => ({ total: row.total, paid: row.paid }))), [customerRows]);

  return (
    <>
      <AppNav />
      <main className="min-h-screen bg-[#f6f2ea] p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-charcoal/60">Pelanggan</p>
              <h1 className="text-3xl md:text-4xl">Piutang & Bon</h1>
            </div>
            <button className="rounded-full bg-gold px-5 py-3 font-semibold text-charcoal">+ Tambah Pelanggan</button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              ['Total Piutang', `Rp ${summary.total.toLocaleString('id-ID')}`],
              ['Belum Lunas', `Rp ${summary.remaining.toLocaleString('id-ID')}`],
              ['Lunas', `Rp ${summary.paid.toLocaleString('id-ID')}`],
            ].map(([label, value]) => (
              <div key={label} className="panel rounded-[22px] p-5">
                <p className="text-sm text-charcoal/60">{label}</p>
                <p className="mt-3 text-2xl font-semibold">{value}</p>
              </div>
            ))}
          </div>

          <div className="panel rounded-[24px] p-5">
            {loading ? (
              <p className="text-sm text-charcoal/60">Memuat data piutang pelanggan...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-charcoal/10 text-charcoal/60">
                      <th className="p-3">Nama</th>
                      <th className="p-3">Nomor HP</th>
                      <th className="p-3">Total Bon</th>
                      <th className="p-3">Sudah Dibayar</th>
                      <th className="p-3">Sisa</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerRows.map((row) => {
                      const summaryStatus = calculateBalanceStatus(row.total, row.paid);
                      return (
                        <tr key={`${row.name}-${row.phone}`} className="border-b border-charcoal/10">
                          <td className="p-3 font-semibold">{row.name}</td>
                          <td className="p-3">{row.phone}</td>
                          <td className="p-3">Rp {row.total.toLocaleString('id-ID')}</td>
                          <td className="p-3">Rp {row.paid.toLocaleString('id-ID')}</td>
                          <td className="p-3">Rp {summaryStatus.remaining.toLocaleString('id-ID')}</td>
                          <td className="p-3">
                            <span className={`rounded-full px-2 py-1 text-xs ${summaryStatus.status === 'LUNAS' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {summaryStatus.status}
                            </span>
                          </td>
                          <td className="p-3">
                            <button className="rounded-full bg-charcoal px-3 py-2 text-xs font-medium text-white">Tagih via WhatsApp</button>
                          </td>
                        </tr>
                      );
                    })}
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

