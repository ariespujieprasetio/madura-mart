import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1', email: 'owner@mail.com' } },
        error: null,
      }),
      updateUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { full_name: 'Pemilik', name: 'Warung Ku' }, error: null }),
      update: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'tenant-1' }, error: null }),
    })),
  }),
}));

import ProfilePage from './profile/page';

describe('profile page', () => {
  it('renders tenant, email, and password settings fields', () => {
    const html = renderToStaticMarkup(<ProfilePage />);

    expect(html).toContain('Profil akun');
    expect(html).toContain('Nama tenant');
    expect(html).toContain('Email');
    expect(html).toContain('Password baru');
  });
});
