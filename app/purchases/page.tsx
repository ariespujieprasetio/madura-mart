'use client';

import { useEffect, useState } from 'react';
import { AppNav } from '@/components/AppNav';
import { createClient } from '@/lib/supabase/client';

type PurchaseRow = {
  invoice: string;
  supplier: string;
  date: string;
  subtotal: number;
  discount: number;
  total: number;
  status: 'LUNAS' | 'UNPAID' | 'PARTIAL';
};

const fallbackPurchaseRows: PurchaseRow[] = [
  { invoice: 'INV-SUP-1041', supplier: 'PT Sumber Jaya', date: '03/10/2026', subtotal: 1200000, discount: 0, total: 1200000, status: 'UNPAID' },
  { invoice: 'INV-SUP-1038', supplier: 'CV Sentosa Mitra', date: '02/10/2026', subtotal: 850000, discount: 0, total: 850000, status: 'LUNAS' },
  { invoice: 'INV-SUP-1034', supplier: 'Toko Grosir Barokah', date: '30/09/2026', subtotal: 680000, discount: 0, total: 680000, status: 'PARTIAL' },
];

export default function PurchasesPage() {
  const [purchaseRows, setPurchaseRows] = useState<PurchaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [supplier, setSupplier] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [subtotal, setSubtotal] = useState('');
  const [discount, setDiscount] = useState('0');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadPurchases = async () => {
      try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          if (active) {
            setPurchaseRows([]);
            setLoading(false);
          }
          return;
        }

        const supabase = createClient();
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData.user) {
          if (active) {
            setPurchaseRows([]);
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
            setPurchaseRows([]);
            setLoading(false);
          }
          return;
        }

        const { data, error } = await supabase
          .from('purchases')
          .select('invoice_no, subtotal, discount, total, status, purchased_at, suppliers(name)')
          .eq('tenant_id', membership.tenant_id)
          .order('purchased_at', { ascending: false })
          .limit(20);

        if (error) throw error;

        const mapped = (data ?? []).map((row) => {
          const supplierRow = row as any;
          const supplierName = Array.isArray(supplierRow.suppliers)
            ? supplierRow.suppliers[0]?.name ?? 'Supplier'
            : supplierRow.suppliers?.name ?? 'Supplier';

          return {
            invoice: row.invoice_no,
            supplier: supplierName,
            date: new Date(row.purchased_at).toLocaleDateString('id-ID'),
            subtotal: Number(row.subtotal ?? 0),
            discount: Number(row.discount ?? 0),
            total: Number(row.total ?? 0),
            status: (row.status ?? 'UNPAID') as PurchaseRow['status'],
          };
        });

        if (active) {
          setPurchaseRows(mapped);
        }
      } catch {
        if (active) setPurchaseRows([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadPurchases();

    return () => {
      active = false;
    };
  }, []);

  const handleCreatePurchase = async () => {
    if (!supplier.trim() || !invoiceNo.trim() || !subtotal) {
      setNotice('Supplier, invoice, dan total pembelian wajib diisi.');
      return;
    }

    setSaving(true);
    setNotice(null);

    try {
      const supabase = createClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        throw new Error('Silakan login untuk mencatat pembelian.');
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
        throw new Error('Cabang aktif belum tersedia.');
      }

      const { data: existingSupplier } = await supabase
        .from('suppliers')
        .select('id')
        .eq('tenant_id', membership.tenant_id)
        .ilike('name', `%${supplier.trim()}%`)
        .limit(1)
        .maybeSingle();

      const totalValue = Number(subtotal) - Number(discount || 0);
      const payload = {
        tenant_id: membership.tenant_id,
        branch_id: branch.id,
        supplier_id: existingSupplier?.id ?? null,
        invoice_no: invoiceNo.trim(),
        subtotal: Number(subtotal),
        discount: Number(discount || 0),
        total: totalValue,
        status: totalValue > 0 ? 'UNPAID' : 'PAID',
        purchased_at: new Date(`${purchaseDate}T00:00:00`).toISOString(),
        created_by: userData.user.id,
      };

      const { error } = await supabase.from('purchases').insert([payload]);
      if (error) throw error;

      setSupplier('');
      setInvoiceNo('');
      setDiscount('0');
      setSubtotal('');
      setPurchaseDate(new Date().toISOString().slice(0, 10));
      setNotice('Pembelian berhasil dicatat.');
      window.location.reload();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Gagal menyimpan pembelian.');
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
              <p className="text-sm uppercase tracking-[0.2em] text-charcoal/60">Pembelian</p>
              <h1 className="text-3xl md:text-4xl">Pembelian Supplier</h1>
            </div>
          </div>

          <div className="panel rounded-[24px] p-5">
            <div className="grid gap-3 md:grid-cols-5">
              <input
                value={supplier}
                onChange={(event) => setSupplier(event.target.value)}
                placeholder="Supplier"
                className="rounded-2xl border border-charcoal/10 bg-white px-3 py-3"
              />
              <input
                type="date"
                value={purchaseDate}
                onChange={(event) => setPurchaseDate(event.target.value)}
                className="rounded-2xl border border-charcoal/10 bg-white px-3 py-3"
              />
              <input
                value={invoiceNo}
                onChange={(event) => setInvoiceNo(event.target.value)}
                placeholder="Nomor Invoice"
                className="rounded-2xl border border-charcoal/10 bg-white px-3 py-3"
              />
              <input
                value={subtotal}
                onChange={(event) => setSubtotal(event.target.value)}
                placeholder="Total"
                type="number"
                className="rounded-2xl border border-charcoal/10 bg-white px-3 py-3"
              />
              <button
                onClick={handleCreatePurchase}
                disabled={saving}
                className="rounded-2xl bg-charcoal px-4 py-3 font-semibold text-white disabled:opacity-60"
              >
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <input
                value={discount}
                onChange={(event) => setDiscount(event.target.value)}
                placeholder="Diskon"
                type="number"
                className="rounded-2xl border border-charcoal/10 bg-white px-3 py-3"
              />
              <div className="rounded-2xl bg-[#f8f3ed] px-3 py-3 text-sm text-charcoal/70">
                Total akhir: Rp {((Number(subtotal || 0) - Number(discount || 0)).toLocaleString('id-ID'))}
              </div>
            </div>
            {notice && <p className="mt-3 text-sm text-charcoal/70">{notice}</p>}
          </div>

          <div className="panel rounded-[24px] p-5">
            {loading ? (
              <p className="text-sm text-charcoal/60">Memuat pembelian...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-charcoal/10 text-charcoal/60">
                      <th className="p-3">Invoice</th>
                      <th className="p-3">Supplier</th>
                      <th className="p-3">Tanggal</th>
                      <th className="p-3">Subtotal</th>
                      <th className="p-3">Diskon</th>
                      <th className="p-3">Total</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseRows.map((row) => (
                      <tr key={row.invoice} className="border-b border-charcoal/10">
                        <td className="p-3 font-semibold">{row.invoice}</td>
                        <td className="p-3">{row.supplier}</td>
                        <td className="p-3">{row.date}</td>
                        <td className="p-3">Rp {row.subtotal.toLocaleString('id-ID')}</td>
                        <td className="p-3">Rp {row.discount.toLocaleString('id-ID')}</td>
                        <td className="p-3">Rp {row.total.toLocaleString('id-ID')}</td>
                        <td className="p-3">
                          <span className={`rounded-full px-2 py-1 text-xs ${row.status === 'LUNAS' ? 'bg-green-100 text-green-700' : row.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                            {row.status}
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
