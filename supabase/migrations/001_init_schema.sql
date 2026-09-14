create extension if not exists pgcrypto;

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  code text unique,
  logo_url text,
  timezone text not null default 'Asia/Kolkata',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep reruns compatible with older tables created before organization scoping.
alter table if exists user_profiles
  add column if not exists organization_id uuid references organizations(id) on delete cascade;

alter table if exists contacts
  add column if not exists organization_id uuid references organizations(id) on delete cascade;

alter table if exists contacts
  add column if not exists mobile_e164 text;

alter table if exists contacts
  add column if not exists department text;

alter table if exists contact_groups
  add column if not exists organization_id uuid references organizations(id) on delete cascade;

alter table if exists message_templates
  add column if not exists organization_id uuid references organizations(id) on delete cascade;

alter table if exists campaigns
  add column if not exists organization_id uuid references organizations(id) on delete cascade;

alter table if exists messages
  add column if not exists organization_id uuid references organizations(id) on delete cascade;

alter table if exists messages
  add column if not exists campaign_id uuid;

alter table if exists messages
  add column if not exists contact_id uuid;

alter table if exists messages
  add column if not exists provider_message_id text;

alter table if exists messages
  add column if not exists status text;

alter table if exists scheduled_jobs
  add column if not exists organization_id uuid references organizations(id) on delete cascade;

alter table if exists provider_settings
  add column if not exists organization_id uuid references organizations(id) on delete cascade;

alter table if exists audit_logs
  add column if not exists organization_id uuid references organizations(id) on delete cascade;

alter table if exists conversations
  add column if not exists organization_id uuid references organizations(id) on delete cascade;

create table if not exists user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  full_name text not null,
  email text,
  mobile text,
  role text not null check (
    role in ('SUPER_ADMIN','ADMIN','OPERATOR','REPORT_VIEWER')
  ),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  external_id text,
  full_name text not null,
  mobile_e164 text not null,
  whatsapp_e164 text,
  email text,
  department text,
  course text,
  semester text,
  batch text,
  category text,
  whatsapp_opt_in boolean not null default false,
  sms_opt_in boolean not null default false,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contacts_mobile_idx
on contacts(organization_id, mobile_e164);

create index if not exists contacts_department_idx
on contacts(organization_id, department);

create table if not exists contact_groups (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists group_members (
  group_id uuid not null references contact_groups(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (group_id, contact_id)
);

create table if not exists message_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  channel text not null check (channel in ('WHATSAPP','SMS')),
  provider text,
  provider_template_id text,
  language_code text not null default 'en',
  category text,
  body text not null,
  variables jsonb not null default '[]'::jsonb,
  approval_status text not null default 'PENDING',
  active boolean not null default true,
  created_by uuid references user_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  channel text not null check (channel in ('WHATSAPP','SMS','BOTH')),
  template_id uuid references message_templates(id),
  status text not null default 'DRAFT',
  scheduled_at timestamptz,
  created_by uuid references user_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  campaign_id uuid references campaigns(id) on delete set null,
  contact_id uuid references contacts(id) on delete set null,
  channel text not null check (channel in ('WHATSAPP','SMS')),
  to_number text not null,
  from_sender text,
  template_id uuid references message_templates(id),
  body text,
  provider text,
  provider_message_id text,
  status text not null default 'QUEUED',
  error_code text,
  error_message text,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  failed_at timestamptz,
  retry_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists messages_campaign_idx on messages(campaign_id);
create index if not exists messages_contact_idx on messages(contact_id);
create index if not exists messages_provider_id_idx on messages(provider_message_id);
create index if not exists messages_status_idx on messages(status);

create table if not exists message_events (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references messages(id) on delete cascade,
  provider text,
  event_type text not null,
  provider_event_id text,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists scheduled_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  campaign_id uuid references campaigns(id) on delete set null,
  run_at timestamptz not null,
  status text not null default 'PENDING',
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists provider_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  provider_type text not null,
  provider_name text not null,
  sender_name text,
  whatsapp_sender text,
  sms_sender text,
  active boolean not null default true,
  public_config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  user_id uuid references user_profiles(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  ip_address inet,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  contact_id uuid references contacts(id) on delete cascade,
  channel text not null,
  last_message_at timestamptz,
  status text not null default 'OPEN',
  created_at timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger organizations_set_updated_at
before update on organizations
for each row execute function set_updated_at();

create or replace trigger user_profiles_set_updated_at
before update on user_profiles
for each row execute function set_updated_at();

create or replace trigger contacts_set_updated_at
before update on contacts
for each row execute function set_updated_at();

create or replace trigger contact_groups_set_updated_at
before update on contact_groups
for each row execute function set_updated_at();

create or replace trigger message_templates_set_updated_at
before update on message_templates
for each row execute function set_updated_at();

create or replace trigger campaigns_set_updated_at
before update on campaigns
for each row execute function set_updated_at();

create or replace trigger messages_set_updated_at
before update on messages
for each row execute function set_updated_at();

create or replace trigger scheduled_jobs_set_updated_at
before update on scheduled_jobs
for each row execute function set_updated_at();

create or replace trigger provider_settings_set_updated_at
before update on provider_settings
for each row execute function set_updated_at();
