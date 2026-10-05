'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppNav } from '@/components/AppNav';
import { createClient } from '@/lib/supabase/client';

type ExpenseRow = {
  category: string;
  amount: number;
  description: string;
  date: string;
};

const fallbackExpenseRows: ExpenseRow[] = [
  { category: 'Belanja Stok', amount: 1200000, description: 'Pembelian rokok & minuman', date: '03/10/2026' },
  { category: 'Listrik', amount: 420000, description: 'Tagihan bulan Oktober', date: '02/10/2026' },
  { category: 'Gaji', amount: 1500000, description: 'Gaji kasir shift malam', date: '01/10/2026' },
  { category: 'Transport', amount: 180000, description: 'Ambil stok ke supplier', date: '01/10/2026' },
];

export default function ExpensesPage() {
  const [expenseRows, setExpenseRows] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('Belanja Stok');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadExpenses = async () => {
      try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          if (active) {
            setExpenseRows([]);
            setLoading(false);
          }
          return;
        }

        const supabase = createClient();
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData.user) {
          if (active) {
            setExpenseRows([]);
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
            setExpenseRows([]);
            setLoading(false);
          }
          return;
        }

        const { data, error } = await supabase
          .from('expenses')
          .select('*')
          .eq('tenant_id', membership.tenant_id)
          .order('spent_at', { ascending: false })
          .limit(20);

        if (error) throw error;

        const mapped: ExpenseRow[] = (data ?? []).map((row) => ({
          category: row.category ?? 'Lainnya',
          amount: Number(row.amount ?? 0),
          description: row.description ?? 'Pengeluaran',
          date: new Date(row.spent_at).toLocaleDateString('id-ID'),
        }));

        if (active) setExpenseRows(mapped);
      } catch {
        if (active) setExpenseRows([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadExpenses();

    return () => {
      active = false;
    };
  }, []);

  const highestCategory = useMemo(() => {
    const summary = expenseRows.reduce<Record<string, number>>((acc, row) => {
      acc[row.category] = (acc[row.category] ?? 0) + row.amount;
      return acc;
    }, {});

    return Object.entries(summary).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Belanja Stok';
  }, [expenseRows]);

  const totalExpense = useMemo(
    () => expenseRows.reduce((sum, row) => sum + row.amount, 0),
    [expenseRows],
  );

  const handleCreateExpense = async () => {
    if (!category.trim() || !description.trim() || !amount) {
      setNotice('Kategori, deskripsi, dan nominal wajib diisi.');
      return;
    }

    setSaving(true);
    setNotice(null);

    try {
      const supabase = createClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        throw new Error('Silakan login untuk mencatat pengeluaran.');
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
        throw new Error('Cabang tidak tersedia untuk mencatat pengeluaran.');
      }

      const { error } = await supabase.from('expenses').insert({
        tenant_id: membership.tenant_id,
        branch_id: branch.id,
        category: category.trim(),
        amount: Number(amount),
        description: description.trim(),
        spent_at: new Date(`${date}T00:00:00`).toISOString(),
        created_by: userData.user.id,
      });

      if (error) throw error;

      setCategory('Belanja Stok');
      setDescription('');
      setAmount('');
      setDate(new Date().toISOString().slice(0, 10));
      setNotice('Pengeluaran berhasil disimpan.');
      window.location.reload();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Gagal menyimpan pengeluaran.');
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
              <p className="text-sm uppercase tracking-[0.2em] text-charcoal/60">Pengeluaran</p>
              <h1 className="text-3xl md:text-4xl">Cash Out</h1>
            </div>
          </div>

          <div className="panel rounded-[24px] p-5">
            <div className="grid gap-3 md:grid-cols-5">
              <input
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="Kategori"
                className="rounded-2xl border border-charcoal/10 bg-white px-3 py-3"
              />
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="rounded-2xl border border-charcoal/10 bg-white px-3 py-3"
              />
              <input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Deskripsi"
                className="rounded-2xl border border-charcoal/10 bg-white px-3 py-3 md:col-span-2"
              />
              <input
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                type="number"
                placeholder="Nominal"
                className="rounded-2xl border border-charcoal/10 bg-white px-3 py-3"
              />
            </div>
            <div className="mt-3 flex justify-end">
              <button
                onClick={handleCreateExpense}
                disabled={saving}
                className="rounded-2xl bg-charcoal px-5 py-3 font-semibold text-white disabled:opacity-60"
              >
                {saving ? 'Menyimpan...' : '+ Catat Pengeluaran'}
              </button>
            </div>
            {notice && <p className="mt-3 text-sm text-charcoal/70">{notice}</p>}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              ['Total Pengeluaran', `Rp ${totalExpense.toLocaleString('id-ID')}`],
              ['Kategori Tertinggi', highestCategory],
              ['Bulan Ini', `Rp ${(totalExpense * 1.25).toLocaleString('id-ID')}`],
            ].map(([label, value]) => (
              <div key={label} className="panel rounded-[22px] p-5">
                <p className="text-sm text-charcoal/60">{label}</p>
                <p className="mt-3 text-2xl font-semibold">{value}</p>
              </div>
            ))}
          </div>

          <div className="panel rounded-[24px] p-5">
            {loading ? (
              <p className="text-sm text-charcoal/60">Memuat pengeluaran...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-charcoal/10 text-charcoal/60">
                      <th className="p-3">Tanggal</th>
                      <th className="p-3">Kategori</th>
                      <th className="p-3">Deskripsi</th>
                      <th className="p-3">Nominal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenseRows.map((row) => (
                      <tr key={`${row.category}-${row.date}-${row.description}`} className="border-b border-charcoal/10">
                        <td className="p-3">{row.date}</td>
                        <td className="p-3">{row.category}</td>
                        <td className="p-3">{row.description}</td>
                        <td className="p-3">Rp {row.amount.toLocaleString('id-ID')}</td>
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

