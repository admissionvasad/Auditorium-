create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  color text not null default '#2563eb',
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table if not exists contact_tags (
  contact_id uuid not null references contacts(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (contact_id, tag_id)
);

create table if not exists inbox_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  conversation_id uuid references conversations(id) on delete set null,
  provider_message_id text unique,
  channel text not null default 'WHATSAPP',
  direction text not null check (direction in ('INBOUND', 'OUTBOUND')),
  from_number text,
  to_number text,
  body text,
  message_type text not null default 'text',
  media jsonb not null default '{}'::jsonb,
  status text not null default 'RECEIVED',
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists inbox_messages_org_created_idx on inbox_messages(organization_id, created_at desc);
alter table inbox_messages replica identity full;
alter publication supabase_realtime add table inbox_messages;