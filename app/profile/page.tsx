'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function ProfilePage() {
  const router = useRouter();
  const [tenantName, setTenantName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [userId, setUserId] = useState('');
  const [initialEmail, setInitialEmail] = useState('');

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      setLoading(true);

      try {
        const supabase = createClient();
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData.user) {
          if (active) {
            setError('Sesi login tidak valid. Silakan masuk ulang.');
            setLoading(false);
          }
          router.replace('/login');
          return;
        }

        const user = userData.user;
        setUserId(user.id);
        setInitialEmail(user.email ?? '');
        setEmail(user.email ?? '');

        const { data: membership } = await supabase
          .from('tenant_users')
          .select('tenant_id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();

        if (membership?.tenant_id) {
          setTenantId(membership.tenant_id);
          const { data: tenantData } = await supabase
            .from('tenants')
            .select('name')
            .eq('id', membership.tenant_id)
            .maybeSingle();

          if (tenantData?.name) {
            setTenantName(tenantData.name);
          }
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .maybeSingle();

        if (profileData?.full_name) {
          setOwnerName(profileData.full_name);
        } else {
          setOwnerName(user.email?.split('@')[0] || 'Pemilik Warung');
        }
      } catch {
        if (active) setError('Gagal memuat profil. Coba lagi.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      if (password && password !== confirmPassword) {
        setError('Konfirmasi password tidak cocok.');
        setSaving(false);
        return;
      }

      if (password && password.length < 6) {
        setError('Password baru minimal 6 karakter.');
        setSaving(false);
        return;
      }

      const supabase = createClient();
      const nextEmail = email.trim();
      const emailChanged = Boolean(nextEmail) && nextEmail.toLowerCase() !== initialEmail.toLowerCase();

      if (emailChanged) {
        const { error: emailError } = await supabase.auth.updateUser({ email: nextEmail });
        if (emailError) {
          throw emailError;
        }
      }

      if (userId) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({ id: userId, full_name: ownerName.trim() || 'Pemilik Warung' })
          .select()
          .single();

        if (profileError) {
          throw profileError;
        }
      }

      if (tenantId && tenantName.trim()) {
        const { error: tenantError } = await supabase
          .from('tenants')
          .update({ name: tenantName.trim() })
          .eq('id', tenantId)
          .select()
          .single();

        if (tenantError) {
          throw tenantError;
        }
      }

      if (password) {
        const { error: passwordError } = await supabase.auth.updateUser({ password });
        if (passwordError) {
          throw passwordError;
        }
      }

      const passwordChanged = Boolean(password);

      if (emailChanged && !passwordChanged) {
        setSuccess('Permintaan ganti email berhasil dikirim. Silakan cek inbox email baru Anda untuk konfirmasi.');
      } else if (emailChanged && passwordChanged) {
        setSuccess('Email dan password berhasil diperbarui. Silakan cek email baru untuk konfirmasi perubahan email.');
      } else if (passwordChanged) {
        setSuccess('Password berhasil diperbarui.');
      } else {
        setSuccess('Perubahan profil berhasil disimpan.');
      }

      setPassword('');
      setConfirmPassword('');
    } catch (submitError: unknown) {
      const message = submitError instanceof Error ? submitError.message : 'Gagal menyimpan perubahan.';
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8f1dd,_#f3ead7_35%,_#efe6d5_100%)] px-6 py-10 text-charcoal">
        <div className="mx-auto max-w-2xl rounded-[30px] border border-charcoal/10 bg-white/90 p-8 shadow-[0_20px_70px_rgba(32,35,31,0.08)] backdrop-blur">
          <p className="text-sm text-charcoal/60">Memuat profil...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8f1dd,_#f3ead7_35%,_#efe6d5_100%)] px-6 py-10 text-charcoal">
      <div className="mx-auto max-w-3xl rounded-[30px] border border-charcoal/10 bg-white/90 p-8 shadow-[0_20px_70px_rgba(32,35,31,0.08)] backdrop-blur">
        <div className="mb-8 flex items-center justify-between gap-3">
          <div>
            <p className="font-serif text-3xl text-charcoal">
              Warung<span className="text-gold">Ku</span>
            </p>
            <h1 className="mt-4 text-3xl font-semibold">Profil akun</h1>
          </div>
          <Link href="/dashboard" className="rounded-full border border-charcoal/10 px-4 py-2 text-sm font-medium text-charcoal/80 hover:bg-charcoal/5">
            Kembali
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-charcoal/80">
              <span>Nama tenant</span>
              <input
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                className="w-full rounded-2xl border border-charcoal/10 bg-white px-4 py-3 outline-none transition focus:border-gold"
                placeholder="Nama tenant"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-charcoal/80">
              <span>Nama pemilik</span>
              <input
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full rounded-2xl border border-charcoal/10 bg-white px-4 py-3 outline-none transition focus:border-gold"
                placeholder="Nama pemilik"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-charcoal/80 md:col-span-2">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-charcoal/10 bg-white px-4 py-3 outline-none transition focus:border-gold"
                placeholder="Email"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-charcoal/80">
              <span>Password baru</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-charcoal/10 bg-white px-4 py-3 outline-none transition focus:border-gold"
                placeholder="Password baru"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-charcoal/80">
              <span>Konfirmasi password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-2xl border border-charcoal/10 bg-white px-4 py-3 outline-none transition focus:border-gold"
                placeholder="Ulangi password"
              />
            </label>
          </div>

          {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}
          {success ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p> : null}

          <div className="rounded-2xl border border-gold/15 bg-gold/10 px-4 py-3 text-sm text-charcoal/75">
            Catatan: perubahan email dan password akan dikonfirmasi oleh System melalui email yang baru.
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-2xl bg-charcoal px-5 py-3 font-semibold text-white transition hover:bg-charcoal/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? 'Menyimpan...' : 'Simpan perubahan'}
          </button>
        </form>
      </div>
    </main>
  );
}
