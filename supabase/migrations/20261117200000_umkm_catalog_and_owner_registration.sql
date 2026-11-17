alter table public.businesses
  alter column id set default gen_random_uuid()::text,
  add column if not exists category text not null default 'Makanan',
  add column if not exists description text not null default '',
  add column if not exists address text not null default '',
  add column if not exists image_path text,
  add column if not exists starting_price integer not null default 0,
  add column if not exists distance_km numeric(6, 2) not null default 0,
  add column if not exists rating numeric(2, 1) not null default 0,
  add column if not exists queue_count integer not null default 0,
  add column if not exists open_until text not null default '22.00',
  add column if not exists is_active boolean not null default true,
  add column if not exists sort_order integer not null default 100,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add constraint businesses_starting_price_check check (starting_price >= 0),
  add constraint businesses_distance_km_check check (distance_km >= 0),
  add constraint businesses_rating_check check (rating between 0 and 5),
  add constraint businesses_queue_count_check check (queue_count >= 0);

alter table public.products
  alter column id set default gen_random_uuid()::text,
  add column if not exists created_at timestamptz not null default now();

alter table public.products
  drop constraint if exists products_price_check;

alter table public.products
  add constraint products_price_check check (price >= 0);

do $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_constraint
    where conname = 'businesses_category_check'
      and conrelid = 'public.businesses'::regclass
  ) then
    alter table public.businesses
      add constraint businesses_category_check
      check (category in ('Makanan', 'Minuman', 'Laundry', 'Bengkel', 'Cetak'));
  end if;
end;
$$;

create table if not exists public.business_owners (
  business_id text primary key references public.businesses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  owner_name text not null,
  contact_phone text not null,
  owner_email text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists businesses_active_sort_idx
  on public.businesses (is_active, sort_order, created_at);
create index if not exists business_owners_user_id_idx
  on public.business_owners (user_id);
create index if not exists products_business_id_idx
  on public.products (business_id);

update public.businesses
set category = 'Makanan',
    description = 'Ayam geprek hangat dengan sambal pilihan, dibuat saat dipesan.',
    starting_price = 4000,
    distance_km = 0.4,
    rating = 4.8,
    queue_count = 3,
    open_until = '21.00',
    image_path = '/store-food.webp',
    sort_order = 10
where id = 'ayam-geprek-arnold';

update public.businesses
set category = 'Laundry',
    description = 'Laundry kiloan bersih dan wangi, selesai dalam satu hari.',
    starting_price = 5000,
    distance_km = 0.9,
    rating = 4.6,
    queue_count = 1,
    open_until = '20.00',
    image_path = '/store-laundry.webp',
    sort_order = 20
where id = 'laundry-al-barokah';

update public.businesses
set category = 'Minuman',
    description = 'Es teh segar racikan rumahan, tersedia beberapa ukuran.',
    starting_price = 3000,
    distance_km = 1.2,
    rating = 4.7,
    queue_count = 1,
    open_until = '22.00',
    image_path = '/store-drink.webp',
    sort_order = 30
where id = 'es-teh-jumbo';

update public.businesses
set category = 'Makanan',
    description = 'Bakso kuah gurih dan hangat, dibuat dari bahan pilihan.',
    starting_price = 8000,
    distance_km = 1.1,
    rating = 4.7,
    queue_count = 2,
    open_until = '20.00',
    image_path = '/store-food.webp',
    sort_order = 40
where id = 'bakso-pak-kumis';

update public.businesses
set category = 'Bengkel',
    description = 'Servis ringan, ganti oli, dan perawatan motor harian.',
    starting_price = 25000,
    distance_km = 1.8,
    rating = 5.0,
    queue_count = 1,
    open_until = '18.00',
    image_path = '/category-repair.png',
    sort_order = 50
where id = 'cahaya-motor';

update public.businesses
set category = 'Cetak',
    description = 'Cetak, fotokopi, dan jilid dokumen dengan cepat.',
    starting_price = 2000,
    distance_km = 0.7,
    rating = 4.8,
    queue_count = 1,
    open_until = '20.00',
    image_path = '/category-print.png',
    sort_order = 60
where id = 'fotocopy-mandiri';

alter table public.business_owners enable row level security;

drop policy if exists "Anyone can read businesses" on public.businesses;
create policy "Public can read active businesses"
on public.businesses for select to anon, authenticated
using (
  is_active
  or exists (
    select 1
    from public.business_owners
    where business_owners.business_id = businesses.id
      and business_owners.user_id = (select auth.uid())
  )
);

drop policy if exists "Anyone can read products" on public.products;
create policy "Public can read active business products"
on public.products for select to anon, authenticated
using (
  exists (
    select 1
    from public.businesses
    where businesses.id = products.business_id
      and (
        businesses.is_active
        or exists (
          select 1
          from public.business_owners
          where business_owners.business_id = businesses.id
            and business_owners.user_id = (select auth.uid())
        )
      )
  )
);

drop policy if exists "Owners can read their business ownership" on public.business_owners;
create policy "Owners can read their business ownership"
on public.business_owners for select to authenticated
using ((select auth.uid()) = user_id);

grant select on public.businesses, public.products to anon, authenticated;
grant select on public.business_owners to authenticated;
revoke insert, update, delete on public.businesses, public.products, public.business_owners
  from anon, authenticated;

create or replace function public.register_owner_business(
  p_name text,
  p_category text,
  p_description text,
  p_address text,
  p_owner_name text,
  p_contact_phone text,
  p_products jsonb
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_business_id text := gen_random_uuid()::text;
  v_owner_email text;
  v_product jsonb;
  v_product_name text;
  v_price integer;
  v_starting_price integer;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Silakan masuk sebelum mendaftarkan UMKM.';
  end if;

  if nullif(trim(p_name), '') is null or length(trim(p_name)) > 120
    or nullif(trim(p_owner_name), '') is null or length(trim(p_owner_name)) > 120
    or nullif(trim(p_contact_phone), '') is null or length(trim(p_contact_phone)) > 40 then
    raise exception using errcode = '22023', message = 'Nama usaha, nama pemilik, dan nomor HP wajib diisi.';
  end if;

  if p_category not in ('Makanan', 'Minuman', 'Laundry', 'Bengkel', 'Cetak') then
    raise exception using errcode = '22023', message = 'Kategori UMKM tidak valid.';
  end if;

  if length(coalesce(p_description, '')) > 1000
    or length(coalesce(p_address, '')) > 500 then
    raise exception using errcode = '22023', message = 'Deskripsi atau alamat terlalu panjang.';
  end if;

  if p_products is null or jsonb_typeof(p_products) is distinct from 'array'
    or jsonb_array_length(p_products) not between 1 and 30 then
    raise exception using errcode = '22023', message = 'Tambahkan minimal satu menu atau layanan.';
  end if;

  for v_product in select value from pg_catalog.jsonb_array_elements(p_products)
  loop
    if jsonb_typeof(v_product) is distinct from 'object' then
      raise exception using errcode = '22023', message = 'Data menu tidak valid.';
    end if;

    v_product_name := nullif(trim(v_product ->> 'name'), '');
    begin
      v_price := (v_product ->> 'price')::integer;
    exception when others then
      raise exception using errcode = '22023', message = 'Harga menu harus berupa angka bulat.';
    end;

    if v_product_name is null or length(v_product_name) > 120
      or v_price is null or v_price < 0 then
      raise exception using errcode = '22023', message = 'Nama menu atau harga tidak valid.';
    end if;

    v_starting_price := least(coalesce(v_starting_price, v_price), v_price);
  end loop;

  select email into v_owner_email
  from auth.users
  where id = v_user_id;

  insert into public.businesses (
    id, name, category, description, address, starting_price, is_active, sort_order
  )
  values (
    v_business_id,
    trim(p_name),
    p_category,
    coalesce(trim(p_description), ''),
    coalesce(trim(p_address), ''),
    v_starting_price,
    true,
    100
  );

  insert into public.business_owners (
    business_id, user_id, owner_name, contact_phone, owner_email
  )
  values (
    v_business_id,
    v_user_id,
    trim(p_owner_name),
    trim(p_contact_phone),
    coalesce(v_owner_email, '')
  );

  for v_product in select value from pg_catalog.jsonb_array_elements(p_products)
  loop
    insert into public.products (business_id, name, price)
    values (
      v_business_id,
      trim(v_product ->> 'name'),
      (v_product ->> 'price')::integer
    );
  end loop;

  insert into public.profiles (id, full_name, phone)
  values (v_user_id, trim(p_owner_name), trim(p_contact_phone))
  on conflict (id) do update
  set full_name = excluded.full_name,
      phone = excluded.phone;

  return v_business_id;
end;
$$;

revoke all on function public.register_owner_business(text, text, text, text, text, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.register_owner_business(text, text, text, text, text, text, jsonb)
  to authenticated;

drop trigger if exists businesses_set_updated_at on public.businesses;
create trigger businesses_set_updated_at
before update on public.businesses
for each row execute function public.set_updated_at();

do $$
begin
  if exists (select 1 from pg_catalog.pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_catalog.pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'businesses'
    ) then
      execute 'alter publication supabase_realtime add table public.businesses';
    end if;

    if not exists (
      select 1 from pg_catalog.pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'products'
    ) then
      execute 'alter publication supabase_realtime add table public.products';
    end if;
  end if;
end;
$$;
