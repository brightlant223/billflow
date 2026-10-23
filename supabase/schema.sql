-- Billflow multi-tenant SaaS schema for Supabase PostgreSQL.
-- Run once in Supabase Dashboard > SQL Editor. All tenant-owned tables have RLS enabled.

create extension if not exists pgcrypto;
create schema if not exists app_private;

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'My Business',
  email text,
  currency text not null default 'INR' check (currency in ('INR','USD','EUR','GBP')),
  gstin text,
  invoice_prefix text not null default 'INV',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner','admin','member')),
  created_at timestamptz not null default now(),
  unique (business_id, user_id)
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  email text not null default '',
  company text not null default '',
  phone text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, id)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  category text not null default 'Service',
  price numeric(14,2) not null default 0 check (price >= 0),
  tax_rate numeric(5,2) not null default 0 check (tax_rate between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  client_id uuid not null,
  invoice_number text not null,
  issue_date date not null default current_date,
  due_date date not null,
  status text not null default 'pending' check (status in ('draft','pending','paid','overdue')),
  notes text not null default '',
  subtotal numeric(14,2) not null default 0 check (subtotal >= 0),
  tax_total numeric(14,2) not null default 0 check (tax_total >= 0),
  total numeric(14,2) not null default 0 check (total >= 0),
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, invoice_number),
  unique (business_id, id),
  foreign key (business_id, client_id) references public.clients(business_id, id) on delete restrict
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  invoice_id uuid not null,
  description text not null,
  quantity numeric(12,2) not null check (quantity > 0),
  unit_price numeric(14,2) not null check (unit_price >= 0),
  tax_rate numeric(5,2) not null default 0 check (tax_rate between 0 and 100),
  line_subtotal numeric(14,2) not null default 0,
  line_tax numeric(14,2) not null default 0,
  line_total numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  foreign key (business_id, invoice_id) references public.invoices(business_id, id) on delete cascade
);

create index if not exists business_members_user_idx on public.business_members(user_id);
create index if not exists clients_business_idx on public.clients(business_id);
create index if not exists products_business_idx on public.products(business_id);
create index if not exists invoices_business_date_idx on public.invoices(business_id, issue_date desc);
create index if not exists invoices_business_status_idx on public.invoices(business_id, status);
create index if not exists invoice_items_invoice_idx on public.invoice_items(business_id, invoice_id);

alter table public.businesses enable row level security;
alter table public.business_members enable row level security;
alter table public.clients enable row level security;
alter table public.products enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;

drop policy if exists "members can read their memberships" on public.business_members;
create policy "members can read their memberships" on public.business_members
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "members can read their businesses" on public.businesses;
create policy "members can read their businesses" on public.businesses
  for select to authenticated using (exists (
    select 1 from public.business_members m where m.business_id = businesses.id and m.user_id = (select auth.uid())
  ));
drop policy if exists "owners can update their businesses" on public.businesses;
create policy "owners can update their businesses" on public.businesses
  for update to authenticated using (exists (
    select 1 from public.business_members m where m.business_id = businesses.id and m.user_id = (select auth.uid()) and m.role in ('owner','admin')
  )) with check (exists (
    select 1 from public.business_members m where m.business_id = businesses.id and m.user_id = (select auth.uid()) and m.role in ('owner','admin')
  ));

drop policy if exists "members manage their clients" on public.clients;
create policy "members manage their clients" on public.clients for all to authenticated
  using (exists (select 1 from public.business_members m where m.business_id = clients.business_id and m.user_id = (select auth.uid())))
  with check (exists (select 1 from public.business_members m where m.business_id = clients.business_id and m.user_id = (select auth.uid())));

drop policy if exists "members manage their products" on public.products;
create policy "members manage their products" on public.products for all to authenticated
  using (exists (select 1 from public.business_members m where m.business_id = products.business_id and m.user_id = (select auth.uid())))
  with check (exists (select 1 from public.business_members m where m.business_id = products.business_id and m.user_id = (select auth.uid())));

drop policy if exists "members manage their invoices" on public.invoices;
create policy "members manage their invoices" on public.invoices for all to authenticated
  using (exists (select 1 from public.business_members m where m.business_id = invoices.business_id and m.user_id = (select auth.uid())))
  with check (exists (select 1 from public.business_members m where m.business_id = invoices.business_id and m.user_id = (select auth.uid())));

drop policy if exists "members manage their invoice items" on public.invoice_items;
create policy "members manage their invoice items" on public.invoice_items for all to authenticated
  using (exists (select 1 from public.business_members m where m.business_id = invoice_items.business_id and m.user_id = (select auth.uid())))
  with check (exists (select 1 from public.business_members m where m.business_id = invoice_items.business_id and m.user_id = (select auth.uid())));

-- Explicit grants are needed for projects where new public tables are not auto-exposed.
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.businesses, public.business_members, public.clients, public.products, public.invoices, public.invoice_items to authenticated;

-- New signups receive a private workspace and owner membership.
create or replace function app_private.create_business_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_business_id uuid;
  business_label text;
begin
  business_label := coalesce(nullif(trim(new.raw_user_meta_data ->> 'business_name'), ''), split_part(coalesce(new.email, 'My Business'), '@', 1) || '''s Workspace');
  insert into public.businesses(name, email)
  values (business_label, new.email)
  returning id into new_business_id;

  insert into public.business_members(business_id, user_id, role)
  values (new_business_id, new.id, 'owner');
  return new;
end;
$$;

revoke all on function app_private.create_business_for_new_user() from public, anon, authenticated;
drop trigger if exists on_auth_user_created_create_business on auth.users;
create trigger on_auth_user_created_create_business
  after insert on auth.users
  for each row execute function app_private.create_business_for_new_user();

-- Avoid accidental direct writes from unauthenticated clients.
revoke all on public.businesses, public.business_members, public.clients, public.products, public.invoices, public.invoice_items from anon;
