import { describe, expect, it } from 'vitest';
import { can, isAdminRole } from './permissions';

describe('role permissions', () => {
  it('keeps admin access restricted to the super admin role', () => {
    expect(can('OWNER', 'tenant:write')).toBe(true);
    expect(can('SUPER_ADMIN', 'tenant:write')).toBe(true);
    expect(can('CASHIER', 'tenant:write')).toBe(false);
    expect(isAdminRole('OWNER')).toBe(false);
    expect(isAdminRole('SUPER_ADMIN')).toBe(true);
    expect(isAdminRole('CASHIER')).toBe(false);
  });
});
