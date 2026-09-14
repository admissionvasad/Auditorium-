# Supabase Setup

This folder is reserved for database migrations, seed scripts, and server-side functions.

## Apply the database

Run the files in this order:

1. `migrations/001_init_schema.sql`
2. `migrations/002_add_missing_organization_columns.sql`
3. `seed.sql`

For a completely empty database, do not run migration `002` by itself: it
expects the `organizations` table created by `001`.

If `001_init_schema.sql` itself fails because an older table is missing
`organization_id`, run `002_add_missing_organization_columns.sql` first, then
rerun `001_init_schema.sql`, and finally run `seed.sql`. This repair-first order
only applies when the base tables already exist but have an older shape.

In the Supabase dashboard, open **SQL Editor**, create a new query, paste the
complete migration files, and click **Run** for each one. After both migrations
succeed, run `seed.sql` in a separate query. The second migration is safe to run
against an existing database and fixes older `contact_groups` or
`message_templates` tables that are missing `organization_id`.

For a local Supabase CLI project, use:

```bash
supabase db reset
```

This applies migrations and then runs the configured seed script.

Recommended initial migration objects:

- organizations
- user_profiles
- contacts
- contact_groups
- group_members
- message_templates
- campaigns
- messages
- message_events
- scheduled_jobs
- provider_settings
- audit_logs
- conversations

Use Supabase Auth and RLS policies to enforce organization-level access for all queries.
