-- Procurement, Payment, Invoice and Finance Management System
-- PostgreSQL schema for Supabase

create extension if not exists pgcrypto;

create type public.user_role as enum ('employee', 'team_lead', 'finance', 'admin');
create type public.transaction_type as enum ('payment_made', 'payment_received');
create type public.payment_method as enum ('bank_transfer', 'upi', 'cash', 'card', 'other');
create type public.approval_status as enum ('pending', 'approved', 'rejected');
create type public.invoice_status as enum ('pending', 'submitted', 'under_review', 'verified', 'rejected', 'completed');
create type public.payment_status as enum ('pending', 'recorded', 'partially_paid', 'paid', 'rejected');
create type public.bank_reconciliation_status as enum ('unmatched', 'matched', 'mismatch');
create type public.notification_channel as enum ('in_app', 'email', 'sms');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role public.user_role not null default 'employee',
  team text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text not null unique,
  description text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.parameters (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, name)
);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  parameter_id uuid not null references public.parameters(id) on delete restrict,
  name text not null,
  description text,
  unit text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, parameter_id, name)
);

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  vendor_code text,
  contact_person text,
  email text,
  phone text,
  gstin text,
  address text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id),
  parameter_id uuid not null references public.parameters(id),
  item_id uuid not null references public.items(id),
  created_by uuid not null references public.profiles(id),
  transaction_type public.transaction_type not null,
  amount numeric(14,2) not null check (amount >= 0),
  vendor_id uuid references public.vendors(id),
  vendor_name text,
  transaction_date date not null,
  payment_method public.payment_method not null,
  reference_number text,
  remarks text,
  supporting_document_url text,
  status public.approval_status not null default 'pending',
  invoice_status public.invoice_status not null default 'pending',
  submitted_at timestamptz,
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  rejected_by uuid references public.profiles(id),
  rejection_reason text,
  rejected_at timestamptz,
  invoice_due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.transaction_payments (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  payment_amount numeric(14,2) not null check (payment_amount >= 0),
  payment_date date not null,
  payment_method public.payment_method not null,
  bank_reference text,
  recorded_by uuid not null references public.profiles(id),
  supporting_document_url text,
  status public.payment_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references public.transactions(id),
  invoice_number text not null,
  invoice_date date not null,
  invoice_amount numeric(14,2) not null check (invoice_amount >= 0),
  vendor_id uuid references public.vendors(id),
  vendor_name text,
  file_url text,
  uploaded_by uuid not null references public.profiles(id),
  uploaded_at timestamptz not null default now(),
  verification_status public.invoice_status not null default 'pending',
  verified_by uuid references public.profiles(id),
  verified_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  transaction_id uuid references public.transactions(id),
  project_id uuid references public.projects(id),
  parameter_id uuid references public.parameters(id),
  item_id uuid references public.items(id),
  description text,
  quantity numeric(12,2),
  unit_price numeric(14,2),
  amount numeric(14,2) not null check (amount >= 0),
  created_at timestamptz not null default now()
);

create table public.approvals (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  approver_id uuid not null references public.profiles(id),
  action text not null check (action in ('submitted', 'approved', 'rejected', 'invoice_uploaded', 'invoice_verified', 'payment_recorded')),
  status public.approval_status not null,
  comments text,
  created_at timestamptz not null default now()
);

create table public.bank_transactions (
  id uuid primary key default gen_random_uuid(),
  bank_transaction_id text not null unique,
  transaction_date date not null,
  amount numeric(14,2) not null,
  description text,
  reference text,
  credit_debit text not null check (credit_debit in ('credit', 'debit')),
  reconciliation_status public.bank_reconciliation_status not null default 'unmatched',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reconciliation_records (
  id uuid primary key default gen_random_uuid(),
  bank_transaction_id uuid not null references public.bank_transactions(id),
  payment_id uuid references public.transaction_payments(id),
  invoice_id uuid references public.invoices(id),
  project_id uuid references public.projects(id),
  parameter_id uuid references public.parameters(id),
  item_id uuid references public.items(id),
  match_status public.bank_reconciliation_status not null default 'unmatched',
  matched_by uuid references public.profiles(id),
  matched_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  action text not null,
  entity text not null,
  entity_id uuid,
  old_value jsonb,
  new_value jsonb,
  reason text,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  title text not null,
  message text not null,
  entity text,
  entity_id uuid,
  channel public.notification_channel not null default 'in_app',
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  due_at timestamptz
);

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id),
  parameter_id uuid references public.parameters(id),
  fiscal_year int not null,
  budget_amount numeric(14,2) not null check (budget_amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.parameters(project_id, status);
create index on public.items(project_id, parameter_id, status);
create index on public.transactions(project_id, parameter_id, item_id, status, invoice_status);
create index on public.transaction_payments(transaction_id, payment_date);
create index on public.invoices(transaction_id, verification_status);
create index on public.bank_transactions(reconciliation_status, transaction_date);
create index on public.audit_logs(entity, entity_id, created_at);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.parameters enable row level security;
alter table public.items enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_payments enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.approvals enable row level security;
alter table public.bank_transactions enable row level security;
alter table public.reconciliation_records enable row level security;
alter table public.audit_logs enable row level security;
alter table public.notifications enable row level security;
alter table public.vendors enable row level security;
alter table public.budgets enable row level security;

create policy "Profiles are viewable by authenticated users" on public.profiles
for select using (auth.uid() is not null);

create policy "Projects are viewable by authenticated users" on public.projects
for select using (auth.uid() is not null);

create policy "Parameters are viewable by authenticated users" on public.parameters
for select using (auth.uid() is not null);

create policy "Items are viewable by authenticated users" on public.items
for select using (auth.uid() is not null);

create policy "Transactions are viewable to owning employee or authorized role" on public.transactions
for select using (
  auth.uid() is not null and (
    created_by = auth.uid() or
    exists (select 1 from public.profiles where id = auth.uid() and role in ('team_lead', 'finance', 'admin'))
  )
);

create policy "Transactions are editable by owner or admin" on public.transactions
for update using (
  auth.uid() is not null and (
    created_by = auth.uid() or
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  )
);

create policy "Finance records are viewable by finance/admin" on public.transaction_payments
for select using (
  auth.uid() is not null and exists (
    select 1 from public.profiles where id = auth.uid() and role in ('finance', 'admin')
  )
);

create policy "Invoices are viewable by the uploader or finance/admin" on public.invoices
for select using (
  auth.uid() is not null and (
    uploaded_by = auth.uid() or
    exists (select 1 from public.profiles where id = auth.uid() and role in ('finance', 'admin'))
  )
);

create policy "Audit logs are readable only by admin" on public.audit_logs
for select using (
  auth.uid() is not null and exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  )
);

create policy "Notifications are readable by owner" on public.notifications
for select using (user_id = auth.uid());
