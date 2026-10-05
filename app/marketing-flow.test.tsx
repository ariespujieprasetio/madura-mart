import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: vi.fn(),
    refresh: vi.fn(),
    push: vi.fn(),
  }),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
    },
  }),
}));

import Home from './page';
import LoginPage from './login/page';

describe('marketing flow', () => {
  it('keeps only the login flow visible and hides registration calls to action', () => {
    const landingPage = renderToStaticMarkup(<Home />);

    expect(landingPage).toContain('Masuk');
    expect(landingPage).not.toContain('Coba Gratis');
    expect(landingPage).not.toContain('/register');

    const loginPage = renderToStaticMarkup(<LoginPage />);

    expect(loginPage).toContain('Masuk');
    expect(loginPage).not.toContain('Daftar gratis');
  });
});
