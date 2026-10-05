import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('@/components/AppNav', () => ({
  AppNav: () => <div>AppNav</div>,
}));

vi.mock('@/lib/permissions', () => ({
  isAdminRole: (role: string | null | undefined) => role === 'SUPER_ADMIN',
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      }),
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'token-123' } },
        error: null,
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { tenant_id: 'tenant-1', role: 'OWNER' },
        error: null,
      }),
    })),
  }),
}));

import AdminPage from './admin/page';

describe('admin page', () => {
  it('renders the admin access check before auth completes', () => {
    const html = renderToStaticMarkup(<AdminPage />);
    expect(html).toContain('Memeriksa akses admin');
  });
});
