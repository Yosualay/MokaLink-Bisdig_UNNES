create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  address text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.businesses (
  id text primary key,
  name text not null
);

create table if not exists public.products (
  id text not null,
  business_id text not null references public.businesses (id) on delete cascade,
  name text not null,
  price integer not null check (price >= 0),
  primary key (business_id, id)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default (
    'ML-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))
  ),
  user_id uuid not null references auth.users (id) on delete cascade,
  buyer_name text not null,
  phone text not null,
  address text not null default '',
  fulfillment text not null check (fulfillment in ('Antar', 'Ambil sendiri')),
  payment_method text not null check (payment_method in ('QRIS', 'Tunai', 'E-Wallet')),
  pickup_time text not null check (pickup_time in ('now', 'later')),
  note text not null default '',
  subtotal integer not null check (subtotal >= 0),
  delivery_fee integer not null check (delivery_fee >= 0),
  discount integer not null default 0 check (discount >= 0),
  total integer not null check (total >= 0),
  status text not null default 'Dipesan'
    check (status in ('Dipesan', 'Diproses', 'Siap diambil', 'Selesai', 'Dibatalkan')),
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  business_id text not null,
  product_id text not null,
  business_name text not null,
  product_name text not null,
  unit_price integer not null check (unit_price >= 0),
  quantity integer not null check (quantity between 1 and 99),
  foreign key (business_id, product_id)
    references public.products (business_id, id)
);

create index if not exists orders_user_created_at_idx
  on public.orders (user_id, created_at desc);
create index if not exists order_items_order_id_idx
  on public.order_items (order_id);

insert into public.businesses (id, name) values
  ('ayam-geprek-arnold', 'Ayam Geprek Arnold'),
  ('laundry-al-barokah', 'Laundry Al-Barokah 2'),
  ('es-teh-jumbo', 'Es Teh Jumbo'),
  ('bakso-pak-kumis', 'Bakso Pak Kumis'),
  ('cahaya-motor', 'Cahaya Motor'),
  ('fotocopy-mandiri', 'FotoCopy Mandiri Jaya')
on conflict (id) do update set name = excluded.name;

insert into public.products (business_id, id, name, price) values
  ('ayam-geprek-arnold', 'ayam-geprek', 'Ayam Geprek', 9000),
  ('ayam-geprek-arnold', 'paket-geprek-dada', 'Paket Geprek Dada', 35000),
  ('ayam-geprek-arnold', 'paket-geprek-paha-atas', 'Paket Geprek Paha Atas', 35000),
  ('ayam-geprek-arnold', 'paket-geprek-paha-bawah', 'Paket Geprek Paha Bawah', 32000),
  ('ayam-geprek-arnold', 'paket-geprek-sayap', 'Paket Geprek Sayap', 32000),
  ('ayam-geprek-arnold', 'geprek-sambal-matah', 'Ayam Geprek Sambal Matah', 28000),
  ('laundry-al-barokah', 'laundry-cuci-setrika', 'Cuci dan setrika (per kg)', 5000),
  ('laundry-al-barokah', 'laundry-cuci-kering', 'Cuci kering (per kg)', 4000),
  ('es-teh-jumbo', 'es-teh-jumbo', 'Es Teh Jumbo', 3000),
  ('es-teh-jumbo', 'es-teh-lemon', 'Es Teh Lemon', 5000),
  ('es-teh-jumbo', 'es-teh-less-sugar', 'Es Teh Less Sugar', 4000),
  ('bakso-pak-kumis', 'bakso-komplit', 'Bakso komplit', 12000),
  ('cahaya-motor', 'servis-motor', 'Servis motor ringan', 25000),
  ('fotocopy-mandiri', 'fotocopy', 'Fotokopi hitam putih', 500)
on conflict (business_id, id) do update
set name = excluded.name, price = excluded.price;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      ''
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "Customers can read their profile" on public.profiles;
create policy "Customers can read their profile"
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Customers can create their profile" on public.profiles;
create policy "Customers can create their profile"
on public.profiles for insert to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "Customers can update their profile" on public.profiles;
create policy "Customers can update their profile"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "Anyone can read businesses" on public.businesses;
create policy "Anyone can read businesses"
on public.businesses for select to anon, authenticated
using (true);

drop policy if exists "Anyone can read products" on public.products;
create policy "Anyone can read products"
on public.products for select to anon, authenticated
using (true);

drop policy if exists "Customers can read their orders" on public.orders;
create policy "Customers can read their orders"
on public.orders for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Customers can read their order items" on public.order_items;
create policy "Customers can read their order items"
on public.order_items for select to authenticated
using (
  exists (
    select 1
    from public.orders
    where orders.id = order_items.order_id
      and orders.user_id = (select auth.uid())
  )
);

grant select, insert, update on public.profiles to authenticated;
grant select on public.businesses, public.products to anon, authenticated;
grant select on public.orders, public.order_items to authenticated;
revoke insert, update, delete on public.orders, public.order_items from anon, authenticated;

create or replace function public.create_customer_order(
  p_buyer_name text,
  p_phone text,
  p_address text,
  p_fulfillment text,
  p_payment_method text,
  p_pickup_time text,
  p_note text,
  p_promo_code text,
  p_items jsonb
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_order_id uuid;
  v_order_number text;
  v_item jsonb;
  v_business_id text;
  v_product_id text;
  v_quantity integer;
  v_unit_price integer;
  v_product_name text;
  v_business_name text;
  v_subtotal integer := 0;
  v_delivery_fee integer;
  v_discount integer := 0;
  v_total integer;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Silakan masuk sebelum membuat pesanan.';
  end if;

  if nullif(trim(p_buyer_name), '') is null
    or length(trim(p_buyer_name)) > 120
    or nullif(trim(p_phone), '') is null
    or length(trim(p_phone)) > 40 then
    raise exception using errcode = '22023', message = 'Nama dan nomor telepon wajib diisi.';
  end if;

  if p_fulfillment is null or p_fulfillment not in ('Antar', 'Ambil sendiri')
    or p_payment_method is null or p_payment_method not in ('QRIS', 'Tunai', 'E-Wallet')
    or p_pickup_time is null or p_pickup_time not in ('now', 'later') then
    raise exception using errcode = '22023', message = 'Pilihan pesanan tidak valid.';
  end if;

  if p_fulfillment = 'Antar' and nullif(trim(p_address), '') is null then
    raise exception using errcode = '22023', message = 'Alamat pengantaran wajib diisi.';
  end if;

  if p_address is not null and length(p_address) > 500
    or p_note is not null and length(p_note) > 1000 then
    raise exception using errcode = '22023', message = 'Alamat atau catatan terlalu panjang.';
  end if;

  if p_items is null or jsonb_typeof(p_items) is distinct from 'array' then
    raise exception using errcode = '22023', message = 'Keranjang pesanan tidak valid.';
  end if;
  if jsonb_array_length(p_items) not between 1 and 50 then
    raise exception using errcode = '22023', message = 'Keranjang pesanan tidak valid.';
  end if;

  for v_item in select value from pg_catalog.jsonb_array_elements(p_items)
  loop
    if jsonb_typeof(v_item) is distinct from 'object' then
      raise exception using errcode = '22023', message = 'Item pesanan tidak valid.';
    end if;

    v_business_id := nullif(v_item ->> 'business_id', '');
    v_product_id := nullif(v_item ->> 'product_id', '');
    begin
      v_quantity := (v_item ->> 'quantity')::integer;
    exception when others then
      raise exception using errcode = '22023', message = 'Jumlah produk tidak valid.';
    end;

    if v_business_id is null or v_product_id is null
      or v_quantity is null or v_quantity not between 1 and 99 then
      raise exception using errcode = '22023', message = 'Item atau jumlah pesanan tidak valid.';
    end if;

    select products.price, products.name, businesses.name
    into v_unit_price, v_product_name, v_business_name
    from public.products
    join public.businesses on businesses.id = products.business_id
    where products.business_id = v_business_id
      and products.id = v_product_id;

    if not found then
      raise exception using errcode = '22023', message = 'Produk tidak ditemukan atau sudah tidak tersedia.';
    end if;

    v_subtotal := v_subtotal + (v_unit_price * v_quantity);
  end loop;

  v_delivery_fee := case when p_fulfillment = 'Antar' then 4000 else 0 end;
  if upper(trim(coalesce(p_promo_code, ''))) = 'MAHASISWA' then
    v_discount := least(2000, v_subtotal);
  end if;
  v_total := v_subtotal + v_delivery_fee - v_discount;

  insert into public.profiles (id, full_name, phone, address)
  values (
    v_user_id,
    trim(p_buyer_name),
    trim(p_phone),
    coalesce(trim(p_address), '')
  )
  on conflict (id) do update
  set full_name = excluded.full_name,
      phone = excluded.phone,
      address = excluded.address;

  insert into public.orders (
    user_id,
    buyer_name,
    phone,
    address,
    fulfillment,
    payment_method,
    pickup_time,
    note,
    subtotal,
    delivery_fee,
    discount,
    total
  )
  values (
    v_user_id,
    trim(p_buyer_name),
    trim(p_phone),
    coalesce(trim(p_address), ''),
    p_fulfillment,
    p_payment_method,
    p_pickup_time,
    coalesce(trim(p_note), ''),
    v_subtotal,
    v_delivery_fee,
    v_discount,
    v_total
  )
  returning id, order_number into v_order_id, v_order_number;

  for v_item in select value from pg_catalog.jsonb_array_elements(p_items)
  loop
    v_business_id := v_item ->> 'business_id';
    v_product_id := v_item ->> 'product_id';
    v_quantity := (v_item ->> 'quantity')::integer;

    select products.price, products.name, businesses.name
    into v_unit_price, v_product_name, v_business_name
    from public.products
    join public.businesses on businesses.id = products.business_id
    where products.business_id = v_business_id
      and products.id = v_product_id;

    insert into public.order_items (
      order_id,
      business_id,
      product_id,
      business_name,
      product_name,
      unit_price,
      quantity
    )
    values (
      v_order_id,
      v_business_id,
      v_product_id,
      v_business_name,
      v_product_name,
      v_unit_price,
      v_quantity
    );
  end loop;

  return v_order_number;
end;
$$;

revoke all on function public.create_customer_order(text, text, text, text, text, text, text, text, jsonb)
  from public, anon;
grant execute on function public.create_customer_order(text, text, text, text, text, text, text, text, jsonb)
  to authenticated;

revoke all on function public.handle_new_auth_user() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;
