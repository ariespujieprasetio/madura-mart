export const rolePermissions={SUPER_ADMIN:['*'],OWNER:['tenant:read','tenant:write','branch:write','users:write','reports:read'],MANAGER:['products:write','inventory:write','sales:write','reports:read'],CASHIER:['pos:write','shift:write']} as const;
export type AppRole = keyof typeof rolePermissions;

export function isAdminRole(role: string | null | undefined) {
  return role === 'SUPER_ADMIN';
}

export function can(role: AppRole, permission:string){const list=rolePermissions[role]; return list.includes('*' as never)||list.includes(permission as never)}
