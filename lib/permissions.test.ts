import { describe, expect, it } from 'vitest';
import { can, isAdminRole } from './permissions';

describe('role permissions', () => {
  it('treats the merchant account as the default full admin in the single-account model', () => {
    expect(can('OWNER', 'tenant:write')).toBe(true);
    expect(can('SUPER_ADMIN', 'tenant:write')).toBe(true);
    expect(can('CASHIER', 'tenant:write')).toBe(false);
    expect(isAdminRole('OWNER')).toBe(true);
    expect(isAdminRole('SUPER_ADMIN')).toBe(true);
    expect(isAdminRole('CASHIER')).toBe(false);
  });
});
