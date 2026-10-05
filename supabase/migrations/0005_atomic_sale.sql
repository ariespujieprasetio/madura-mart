create or replace function public.create_sale_atomic(
  p_tenant_id uuid, p_branch_id uuid, p_invoice_no text,
  p_subtotal numeric, p_total numeric, p_method public.payment_method,
  p_paid numeric, p_change numeric, p_items jsonb
) returns uuid language plpgsql security definer set search_path=public as $$
declare v_sale_id uuid; v_item jsonb; v_product public.products%rowtype; v_quantity numeric; v_subtotal numeric := 0; v_total numeric;
begin
  if not public.is_tenant_member(p_tenant_id) then raise exception 'not a tenant member'; end if;
  if not exists (select 1 from public.branches where id=p_branch_id and tenant_id=p_tenant_id and is_active) then raise exception 'invalid branch'; end if;
  if p_method = 'CASH' and p_paid < 0 then raise exception 'invalid payment'; end if;
  if jsonb_array_length(p_items) = 0 then raise exception 'cart kosong'; end if;
  if exists (select 1 from jsonb_array_elements(p_items) x where coalesce((x->>'quantity')::numeric,0) <= 0) then raise exception 'quantity tidak valid'; end if;
  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_product from public.products where id=(v_item->>'product_id')::uuid and tenant_id=p_tenant_id and active=true for update;
    v_quantity := (v_item->>'quantity')::numeric;
    if not found or v_product.stock < v_quantity then raise exception 'stok tidak cukup'; end if;
    v_subtotal := v_subtotal + v_quantity * v_product.selling_price;
  end loop;
  v_total := v_subtotal;
  if p_subtotal <> v_subtotal or p_total <> v_total then raise exception 'total transaksi tidak valid'; end if;
  if p_method in ('CASH','QRIS','TRANSFER','OTHER') and p_paid < v_total then raise exception 'pembayaran kurang'; end if;
  if p_change <> greatest(p_paid-v_total,0) then raise exception 'kembalian tidak valid'; end if;
  insert into public.sales(tenant_id,branch_id,invoice_no,subtotal,total,payment_method,paid_amount,change_amount,created_by)
  values(p_tenant_id,p_branch_id,p_invoice_no,v_subtotal,v_total,p_method,p_paid,p_change,auth.uid()) returning id into v_sale_id;
  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_product from public.products where id=(v_item->>'product_id')::uuid and tenant_id=p_tenant_id and active=true for update;
    v_quantity := (v_item->>'quantity')::numeric;
    insert into public.sale_items(sale_id,tenant_id,product_id,product_name,quantity,unit_price,line_total)
    values(v_sale_id,p_tenant_id,v_product.id,v_product.name,v_quantity,v_product.selling_price,v_quantity*v_product.selling_price);
    update public.products set stock=stock-v_quantity,updated_at=now() where id=v_product.id;
    insert into public.stock_movements(tenant_id,branch_id,product_id,quantity,movement_type,reference_type,reference_id,created_by)
    values(p_tenant_id,p_branch_id,v_product.id,-v_quantity,'OUT','SALE',v_sale_id,auth.uid());
  end loop;
  insert into public.payments(tenant_id,sale_id,method,amount,created_by) values(p_tenant_id,v_sale_id,p_method,p_paid,auth.uid());
  return v_sale_id;
end; $$;
revoke all on function public.create_sale_atomic(uuid,uuid,text,numeric,numeric,public.payment_method,numeric,numeric,jsonb) from public;
grant execute on function public.create_sale_atomic(uuid,uuid,text,numeric,numeric,public.payment_method,numeric,numeric,jsonb) to authenticated;
