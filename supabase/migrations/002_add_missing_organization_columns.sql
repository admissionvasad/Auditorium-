alter table if exists user_profiles
  add column if not exists organization_id uuid references organizations(id) on delete cascade;

alter table if exists contacts
  add column if not exists organization_id uuid references organizations(id) on delete cascade;

alter table if exists contact_groups
  add column if not exists organization_id uuid references organizations(id) on delete cascade;

alter table if exists message_templates
  add column if not exists organization_id uuid references organizations(id) on delete cascade;

alter table if exists campaigns
  add column if not exists organization_id uuid references organizations(id) on delete cascade;

alter table if exists messages
  add column if not exists organization_id uuid references organizations(id) on delete cascade;

alter table if exists scheduled_jobs
  add column if not exists organization_id uuid references organizations(id) on delete cascade;

alter table if exists provider_settings
  add column if not exists organization_id uuid references organizations(id) on delete cascade;

alter table if exists audit_logs
  add column if not exists organization_id uuid references organizations(id) on delete cascade;

alter table if exists conversations
  add column if not exists organization_id uuid references organizations(id) on delete cascade;

create index if not exists contact_groups_organization_idx
on contact_groups(organization_id);

create index if not exists message_templates_organization_idx
on message_templates(organization_id);
