import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'warung-ku';
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : null;

    if (!token || !supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const { data: userData, error: userError } = await authClient.auth.getUser(token);

    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Sesi login tidak valid.' }, { status: 401 });
    }

    const { data: membershipData } = await authClient
      .from('tenant_users')
      .select('role')
      .eq('user_id', userData.user.id)
      .limit(1)
      .maybeSingle();

    const isAdmin = membershipData?.role === 'SUPER_ADMIN';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Hanya super admin yang boleh membuat customer baru.' }, { status: 403 });
    }

    const body = await request.json();
    const role = String(body.role ?? 'OWNER');
    const email = String(body.email ?? '').trim();
    const password = String(body.password ?? '');
    const fullName = String(body.fullName ?? '').trim();
    const tenantName = String(body.tenantName ?? '').trim();
    const branchName = String(body.branchName ?? 'Cabang Utama').trim();
    const address = String(body.address ?? '').trim();
    const whatsapp = String(body.whatsapp ?? '').trim();

    if (!email || !password || !fullName || !tenantName) {
      return NextResponse.json({ error: 'Nama lengkap, email, password, dan nama tenant wajib diisi.' }, { status: 400 });
    }

    if (!serviceRoleKey) {
      return NextResponse.json({ error: 'Konfigurasi admin Supabase belum tersedia.' }, { status: 500 });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: createdUser, error: createUserError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (createUserError || !createdUser?.user) {
      return NextResponse.json({ error: createUserError?.message ?? 'Gagal membuat user baru.' }, { status: 400 });
    }

    const profilePayload = {
      id: createdUser.user.id,
      full_name: fullName,
      phone: whatsapp || null,
    };

    const { error: profileError } = await adminClient.from('profiles').upsert(profilePayload).select().single();
    if (profileError) {
      await adminClient.auth.admin.deleteUser(createdUser.user.id);
      return NextResponse.json({ error: `Gagal membuat profil user: ${profileError.message}` }, { status: 400 });
    }

    const slug = `${slugify(tenantName)}-${createdUser.user.id.slice(0, 6)}`;
    const { data: tenantData, error: tenantError } = await adminClient
      .from('tenants')
      .insert({
        name: tenantName,
        slug,
        address: address || null,
        whatsapp: whatsapp || null,
        owner_id: createdUser.user.id,
      })
      .select()
      .single();

    if (tenantError || !tenantData) {
      await adminClient.auth.admin.deleteUser(createdUser.user.id);
      return NextResponse.json({ error: `Gagal membuat tenant: ${tenantError?.message ?? 'Unknown error'}` }, { status: 400 });
    }

    const { data: branchData, error: branchError } = await adminClient
      .from('branches')
      .insert({
        tenant_id: tenantData.id,
        name: branchName || 'Cabang Utama',
        address: address || null,
        is_active: true,
      })
      .select()
      .single();

    if (branchError || !branchData) {
      await adminClient.auth.admin.deleteUser(createdUser.user.id);
      await adminClient.from('tenants').delete().eq('id', tenantData.id);
      return NextResponse.json({ error: `Gagal membuat cabang: ${branchError?.message ?? 'Unknown error'}` }, { status: 400 });
    }

    const { error: memberError } = await adminClient.from('tenant_users').insert({
      tenant_id: tenantData.id,
      user_id: createdUser.user.id,
      role,
      branch_id: branchData.id,
      is_active: true,
    });

    if (memberError) {
      await adminClient.auth.admin.deleteUser(createdUser.user.id);
      await adminClient.from('branches').delete().eq('tenant_id', tenantData.id);
      await adminClient.from('tenants').delete().eq('id', tenantData.id);
      return NextResponse.json({ error: `Gagal menambahkan user ke tenant: ${memberError.message}` }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: createdUser.user.id,
        email: createdUser.user.email,
        fullName,
      },
      tenant: {
        id: tenantData.id,
        name: tenantData.name,
      },
      branch: {
        id: branchData.id,
        name: branchData.name,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
