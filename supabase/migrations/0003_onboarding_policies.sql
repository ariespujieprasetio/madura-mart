alter table public.profiles enable row level security;
create policy profiles_self on public.profiles for all using (id=auth.uid()) with check (id=auth.uid());
create policy tenants_create on public.tenants for insert with check (owner_id=auth.uid());
create policy tenants_owner_select on public.tenants for select using (owner_id=auth.uid());
create policy subscriptions_owner_create on public.subscriptions for insert with check (public.is_tenant_member(tenant_id));
