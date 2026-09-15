-- Campaign audience + reporting
alter table campaigns
  add column if not exists group_id uuid references contact_groups(id) on delete set null;

alter table campaigns
  add column if not exists metadata jsonb not null default '{}'::jsonb;

-- Campaign reporting counters
alter table campaigns
  add column if not exists total_recipients integer not null default 0;

alter table campaigns
  add column if not exists sent_count integer not null default 0;

alter table campaigns
  add column if not exists delivered_count integer not null default 0;

alter table campaigns
  add column if not exists read_count integer not null default 0;

alter table campaigns
  add column if not exists failed_count integer not null default 0;

alter table campaigns
  add column if not exists started_at timestamptz;

alter table campaigns
  add column if not exists completed_at timestamptz;

-- Trigger to stamp campaign counters from message updates
create or replace function refresh_campaign_counters()
returns trigger as $$
begin
  update campaigns set
    sent_count = (
      select count(*) from messages m
      where m.campaign_id = new.campaign_id and m.status in ('SENT', 'DELIVERED', 'READ', 'FAILED')
    ),
    delivered_count = (
      select count(*) from messages m
      where m.campaign_id = new.campaign_id and m.status in ('DELIVERED', 'READ')
    ),
    read_count = (
      select count(*) from messages m
      where m.campaign_id = new.campaign_id and m.status = 'READ'
    ),
    failed_count = (
      select count(*) from messages m
      where m.campaign_id = new.campaign_id and m.status = 'FAILED'
    )
  where id = new.campaign_id;
  return new;
end;
$$ language plpgsql;

drop trigger if exists campaigns_counter_refresh on messages;
create trigger campaigns_counter_refresh
after insert or update of status on messages
for each row
when (new.campaign_id is not null)
execute function refresh_campaign_counters();

-- RLS policies (private single-org app: authenticated users only)
alter table organizations enable row level security;
alter table user_profiles enable row level security;
alter table contacts enable row level security;
alter table contact_groups enable row level security;
alter table group_members enable row level security;
alter table message_templates enable row level security;
alter table campaigns enable row level security;
alter table messages enable row level security;
alter table scheduled_jobs enable row level security;
alter table provider_settings enable row level security;
alter table audit_logs enable row level security;
alter table conversations enable row level security;
alter table inbox_messages enable row level security;

drop policy if exists organizations_select on organizations;
create policy organizations_select on organizations
  for select using (true);

drop policy if exists profiles_all_auth on user_profiles;
create policy profiles_all_auth on user_profiles
  for all to authenticated using (true) with check (true);

drop policy if exists contacts_all_auth on contacts;
create policy contacts_all_auth on contacts
  for all to authenticated using (true) with check (true);

drop policy if exists contact_groups_all_auth on contact_groups;
create policy contact_groups_all_auth on contact_groups
  for all to authenticated using (true) with check (true);

drop policy if exists group_members_all_auth on group_members;
create policy group_members_all_auth on group_members
  for all to authenticated using (true) with check (true);

drop policy if exists message_templates_all_auth on message_templates;
create policy message_templates_all_auth on message_templates
  for all to authenticated using (true) with check (true);

drop policy if exists campaigns_all_auth on campaigns;
create policy campaigns_all_auth on campaigns
  for all to authenticated using (true) with check (true);

drop policy if exists messages_all_auth on messages;
create policy messages_all_auth on messages
  for all to authenticated using (true) with check (true);

drop policy if exists scheduled_jobs_all_auth on scheduled_jobs;
create policy scheduled_jobs_all_auth on scheduled_jobs
  for all to authenticated using (true) with check (true);

drop policy if exists provider_settings_all_auth on provider_settings;
create policy provider_settings_all_auth on provider_settings
  for all to authenticated using (true) with check (true);

drop policy if exists audit_logs_all_auth on audit_logs;
create policy audit_logs_all_auth on audit_logs
  for all to authenticated using (true) with check (true);

drop policy if exists conversations_all_auth on conversations;
create policy conversations_all_auth on conversations
  for all to authenticated using (true) with check (true);

drop policy if exists inbox_messages_all_auth on inbox_messages;
create policy inbox_messages_all_auth on inbox_messages
  for all to authenticated using (true) with check (true);

-- Provider settings seed
insert into provider_settings (organization_id, provider_type, provider_name, whatsapp_sender)
select id, 'WHATSAPP', 'mock', null from organizations
on conflict do nothing;