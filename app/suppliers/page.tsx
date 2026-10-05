'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppNav } from '@/components/AppNav';
import { createClient } from '@/lib/supabase/client';
import { calculateBalanceStatus } from '@/lib/finance';

type SupplierRow = {
  name: string;
  sales: string;
  whatsapp: string;
  status: 'LUNAS' | 'BELUM LUNAS' | 'JATUH TEMPO';
  total: number;
  paid: number;
};

export default function SuppliersPage() {
  const [supplierRows, setSupplierRows] = useState<SupplierRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [salesName, setSalesName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadSuppliers = async () => {
      try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          if (active) {
            setSupplierRows([]);
            setLoading(false);
          }
          return;
        }

        const supabase = createClient();
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData.user) {
          if (active) {
            setSupplierRows([]);
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
            setSupplierRows([]);
            setLoading(false);
          }
          return;
        }

        const { data, error } = await supabase
          .from('suppliers')
          .select('*')
          .eq('tenant_id', membership.tenant_id)
          .order('name');

        if (error) throw error;

        const mapped = (data ?? []).map((row) => {
          const total = 0;
          const paid = 0;
          const debt = calculateBalanceStatus(total, paid);
          return {
            name: row.name,
            sales: row.sales_name ?? '—',
            whatsapp: row.whatsapp ?? '—',
            status: (debt.remaining === 0 ? 'LUNAS' : 'BELUM LUNAS') as SupplierRow['status'],
            total,
            paid,
          };
        });

        if (active) setSupplierRows(mapped);
      } catch {
        if (active) setSupplierRows([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadSuppliers();

    return () => {
      active = false;
    };
  }, []);

  const summary = useMemo(() => {
    const totalHutang = supplierRows.reduce((sum, row) => sum + row.total, 0);
    const totalPaid = supplierRows.reduce((sum, row) => sum + row.paid, 0);
    const remaining = supplierRows.reduce((sum, row) => sum + calculateBalanceStatus(row.total, row.paid).remaining, 0);
    const overdue = supplierRows.filter((row) => row.status === 'JATUH TEMPO').length;

    return {
      totalHutang,
      remaining,
      paid: totalPaid,
      overdue,
    };
  }, [supplierRows]);

  const handleCreateSupplier = async () => {
    if (!name.trim()) {
      setNotice('Nama supplier wajib diisi.');
      return;
    }

    setSaving(true);
    setNotice(null);

    try {
      const supabase = createClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        throw new Error('Silakan login sebelum menambah supplier.');
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

      const { error } = await supabase.from('suppliers').insert({
        tenant_id: membership.tenant_id,
        name: name.trim(),
        sales_name: salesName.trim() || null,
        whatsapp: whatsapp.trim() || null,
      });

      if (error) throw error;

      setName('');
      setSalesName('');
      setWhatsapp('');
      setNotice('Supplier berhasil ditambahkan.');
      window.location.reload();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Gagal menambah supplier.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AppNav />
      <main className="min-h-screen bg-[#f6f2ea] p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-charcoal/60">Supplier</p>
              <h1 className="text-3xl md:text-4xl">Daftar Supplier</h1>
            </div>
          </div>

          <div className="panel rounded-[24px] p-5">
            <div className="grid gap-3 md:grid-cols-4">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Nama supplier"
                className="rounded-2xl border border-charcoal/10 bg-white px-3 py-3"
              />
              <input
                value={salesName}
                onChange={(event) => setSalesName(event.target.value)}
                placeholder="Nama sales"
                className="rounded-2xl border border-charcoal/10 bg-white px-3 py-3"
              />
              <input
                value={whatsapp}
                onChange={(event) => setWhatsapp(event.target.value)}
                placeholder="WhatsApp"
                className="rounded-2xl border border-charcoal/10 bg-white px-3 py-3"
              />
              <button
                onClick={handleCreateSupplier}
                disabled={saving}
                className="rounded-2xl bg-charcoal px-4 py-3 font-semibold text-white disabled:opacity-60"
              >
                {saving ? 'Menyimpan...' : '+ Tambah Supplier'}
              </button>
            </div>
            {notice && <p className="mt-3 text-sm text-charcoal/70">{notice}</p>}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              ['Total Hutang', `Rp ${summary.totalHutang.toLocaleString('id-ID')}`],
              ['Jatuh Tempo', `${summary.overdue} supplier`],
              ['Sudah Lunas', `Rp ${summary.paid.toLocaleString('id-ID')}`],
            ].map(([label, value]) => (
              <div key={label} className="panel rounded-[22px] p-5">
                <p className="text-sm text-charcoal/60">{label}</p>
                <p className="mt-3 text-2xl font-semibold">{value}</p>
              </div>
            ))}
          </div>

          <div className="panel rounded-[24px] p-5">
            {loading ? (
              <p className="text-sm text-charcoal/60">Memuat supplier...</p>
            ) : supplierRows.length === 0 ? (
              <p className="text-sm text-charcoal/60">Belum ada data supplier untuk tenant ini.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-charcoal/10 text-charcoal/60">
                      <th className="p-3">Supplier</th>
                      <th className="p-3">Sales</th>
                      <th className="p-3">WhatsApp</th>
                      <th className="p-3">Total</th>
                      <th className="p-3">Sudah Dibayar</th>
                      <th className="p-3">Sisa</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supplierRows.map((row) => {
                      const debt = calculateBalanceStatus(row.total, row.paid);
                      return (
                        <tr key={row.name} className="border-b border-charcoal/10">
                          <td className="p-3 font-semibold">{row.name}</td>
                          <td className="p-3">{row.sales}</td>
                          <td className="p-3">{row.whatsapp}</td>
                          <td className="p-3">Rp {row.total.toLocaleString('id-ID')}</td>
                          <td className="p-3">Rp {row.paid.toLocaleString('id-ID')}</td>
                          <td className="p-3">Rp {debt.remaining.toLocaleString('id-ID')}</td>
                          <td className="p-3">
                            <span className={`rounded-full px-2 py-1 text-xs ${row.status === 'LUNAS' ? 'bg-green-100 text-green-700' : row.status === 'JATUH TEMPO' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {row.status}
                            </span>
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

