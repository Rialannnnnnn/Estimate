create table if not exists public.financial_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  pendapatan_bulanan numeric(14,2) not null default 0,
  tanggal_gajian int not null default 25 check (tanggal_gajian between 1 and 31),
  target_tabungan_bulanan numeric(14,2) not null default 0,
  mindset_type text,
  mindset_jawaban jsonb,
  alokasi_default jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nama text not null,
  ikon text not null default 'Wallet',
  warna_hex text not null default '#2563EB',
  tipe text not null check (tipe in ('wajib','variabel','tabungan')),
  plafon numeric(14,2),
  frekuensi text not null default 'bulanan' check (frekuensi in ('sekali','harian','mingguan','bulanan','tahunan')),
  hitung_burn boolean not null default true,
  urutan int not null default 0,
  arsip boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kategori_id uuid references public.expense_categories(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  tipe text not null default 'keluar' check (tipe in ('masuk','keluar')),
  tanggal date not null default current_date,
  jumlah numeric(14,2) not null check (jumlah > 0),
  catatan text,
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_tanggal_idx on public.transactions(user_id, tanggal);
create index if not exists transactions_project_idx on public.transactions(project_id);
create index if not exists expense_categories_user_urutan_idx on public.expense_categories(user_id, urutan);
create unique index if not exists expense_categories_user_name_idx on public.expense_categories(user_id, nama);

alter table public.projects add column if not exists tanggal_mulai date;
alter table public.projects add column if not exists tanggal_selesai date;
alter table public.projects add column if not exists budget_total numeric(14,2);
alter table public.projects add column if not exists status text default 'aktif';

do $$ begin
  alter table public.projects add constraint projects_status_check check (status in ('rencana','aktif','selesai'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.projects add constraint projects_budget_total_check check (budget_total is null or budget_total >= 0);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.projects add constraint projects_date_range_check check (tanggal_mulai is null or tanggal_selesai is null or tanggal_mulai <= tanggal_selesai);
exception when duplicate_object then null; end $$;

alter table public.projects enable row level security;
alter table public.financial_profiles enable row level security;
alter table public.expense_categories enable row level security;
alter table public.transactions enable row level security;

drop policy if exists projects_finance_select_own on public.projects;
drop policy if exists projects_finance_insert_own on public.projects;
drop policy if exists projects_finance_update_own on public.projects;
drop policy if exists projects_finance_delete_own on public.projects;
create policy projects_finance_select_own on public.projects for select using (user_id = auth.uid());
create policy projects_finance_insert_own on public.projects for insert with check (user_id = auth.uid());
create policy projects_finance_update_own on public.projects for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy projects_finance_delete_own on public.projects for delete using (user_id = auth.uid());

drop policy if exists financial_profiles_select_own on public.financial_profiles;
drop policy if exists financial_profiles_insert_own on public.financial_profiles;
drop policy if exists financial_profiles_update_own on public.financial_profiles;
drop policy if exists financial_profiles_delete_own on public.financial_profiles;
create policy financial_profiles_select_own on public.financial_profiles for select using (user_id = auth.uid());
create policy financial_profiles_insert_own on public.financial_profiles for insert with check (user_id = auth.uid());
create policy financial_profiles_update_own on public.financial_profiles for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy financial_profiles_delete_own on public.financial_profiles for delete using (user_id = auth.uid());

drop policy if exists expense_categories_select_own on public.expense_categories;
drop policy if exists expense_categories_insert_own on public.expense_categories;
drop policy if exists expense_categories_update_own on public.expense_categories;
drop policy if exists expense_categories_delete_own on public.expense_categories;
create policy expense_categories_select_own on public.expense_categories for select using (user_id = auth.uid());
create policy expense_categories_insert_own on public.expense_categories for insert with check (user_id = auth.uid());
create policy expense_categories_update_own on public.expense_categories for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy expense_categories_delete_own on public.expense_categories for delete using (user_id = auth.uid());

drop policy if exists transactions_select_own on public.transactions;
drop policy if exists transactions_insert_own on public.transactions;
drop policy if exists transactions_update_own on public.transactions;
drop policy if exists transactions_delete_own on public.transactions;
create policy transactions_select_own on public.transactions for select using (user_id = auth.uid());
create policy transactions_insert_own on public.transactions for insert with check (
  user_id = auth.uid()
  and (kategori_id is null or exists (
    select 1 from public.expense_categories c
    where c.id = kategori_id and c.user_id = auth.uid()
  ))
  and (project_id is null or exists (
    select 1 from public.projects p
    where p.id = project_id and p.user_id = auth.uid()
  ))
);
create policy transactions_update_own on public.transactions for update
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and (kategori_id is null or exists (
    select 1 from public.expense_categories c
    where c.id = kategori_id and c.user_id = auth.uid()
  ))
  and (project_id is null or exists (
    select 1 from public.projects p
    where p.id = project_id and p.user_id = auth.uid()
  ))
);
create policy transactions_delete_own on public.transactions for delete using (user_id = auth.uid());
