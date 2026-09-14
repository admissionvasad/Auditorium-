# Central WhatsApp + SMS Notification System
## Node.js + Supabase + WhatsApp Business Platform + SMS Gateway

A production-ready notification platform for an institute/trust/organization that sends WhatsApp and SMS notifications from one central software.

> **Important India note:** WhatsApp and domestic SMS are different messaging channels. The same physical mobile number can be registered as a WhatsApp sender, but Indian domestic SMS commonly requires DLT registration and an approved Sender ID/header. Therefore, the software should expose one **logical organization sender** while allowing the WhatsApp sender and SMS Sender ID to be configured separately. Do not assume that an Indian SMS recipient will see the same numeric mobile number as the WhatsApp sender.

---

## 1. Project Goals

The system must provide:

- Central Admin Panel
- One organization/sender profile
- WhatsApp + SMS from one interface
- Student/staff/contact management
- Excel/CSV import
- Groups and tags
- Message templates
- WhatsApp template support
- SMS DLT template support
- Individual and bulk messaging
- Scheduled messages
- Retry failed messages
- Delivery/read/failed status tracking
- Incoming WhatsApp/SMS webhook handling
- Message history
- Usage and cost reporting
- Role-based access
- Audit logs
- API-first architecture
- Provider abstraction so WhatsApp/SMS providers can be changed later

---

## 2. Recommended Architecture

```text
                         ┌──────────────────────┐
                         │      Web Browser      │
                         │   Admin / Operator    │
                         └──────────┬───────────┘
                                    │ HTTPS
                                    ▼
                         ┌──────────────────────┐
                         │ React / Next.js UI   │
                         └──────────┬───────────┘
                                    │ REST API
                                    ▼
                         ┌──────────────────────┐
                         │ Node.js + Express    │
                         │ API Server            │
                         └───────┬───────┬──────┘
                                 │       │
                   ┌─────────────┘       └──────────────┐
                   ▼                                    ▼
          ┌──────────────────┐                 ┌──────────────────┐
          │ Supabase         │                 │ Message Queue    │
          │ PostgreSQL/Auth  │                 │ Worker/Redis*    │
          │ Storage/RLS      │                 │                  │
          └──────────────────┘                 └────────┬─────────┘
                                                        │
                              ┌─────────────────────────┴───────────┐
                              ▼                                     ▼
                    ┌──────────────────┐                  ┌──────────────────┐
                    │ WhatsApp Adapter │                  │ SMS Adapter      │
                    │ Meta Cloud API / │                  │ Twilio / Indian  │
                    │ Twilio           │                  │ DLT SMS provider │
                    └────────┬─────────┘                  └────────┬─────────┘
                             │                                     │
                             ▼                                     ▼
                       WhatsApp Users                         Mobile Users

                         ▲
                         │ Webhooks
                         │
                 ┌───────┴────────┐
                 │ Node.js API    │
                 │ webhook routes │
                 └────────────────┘
```

\* For a first version, a PostgreSQL-backed queue can be used. Redis/BullMQ can be added when traffic increases.

---

## 3. Technology Stack

### Frontend
- Next.js / React
- TypeScript
- Tailwind CSS
- shadcn/ui or equivalent component library
- React Hook Form
- Zod validation
- TanStack Query

### Backend
- Node.js
- Express
- TypeScript
- Zod
- Supabase JS
- Provider SDK/API clients
- Pino logging

### Database
- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- Row Level Security (RLS)

### Messaging
- WhatsApp Business Platform / Meta Cloud API OR Twilio WhatsApp
- SMS provider with India DLT support
- Provider adapter pattern

### Deployment
- Frontend: Vercel
- API: Render / Railway / AWS / VPS
- Database/Auth: Supabase
- Worker: Render/Railway/VPS
- Domain: organization domain
- HTTPS: mandatory

---

# 4. Core Modules

## 4.1 Dashboard

Cards:

- Total Contacts
- WhatsApp Enabled
- SMS Enabled
- Messages Today
- WhatsApp Sent
- SMS Sent
- Delivered
- Failed
- Pending
- Scheduled
- Monthly Cost

Charts:

- Daily messages
- Channel-wise messages
- Delivery rate
- Failure rate
- Department-wise messages

---

## 4.2 Contact Management

Fields:

- Full Name
- Mobile Number
- WhatsApp Number
- Email
- Student ID / Employee ID
- Department
- Course
- Semester
- Batch
- Category
- Tags
- WhatsApp Opt-in
- SMS Opt-in
- Active/Inactive
- Notes

Actions:

- Add
- Edit
- Delete/Deactivate
- Search
- Filter
- Export
- Import Excel/CSV
- Send test message
- View message history

Phone numbers must be normalized to E.164 format internally, e.g.:

```text
+9198XXXXXXXX
```

---

## 4.3 Groups

Examples:

- First Year Students
- MBA Students
- MCA Students
- Faculty
- Non-Teaching Staff
- Parents
- Alumni
- Trust Members

A contact can belong to multiple groups.

---

## 4.4 Templates

Template types:

```text
WHATSAPP
SMS
```

Fields:

- Template Name
- Channel
- Provider
- Language
- Provider Template ID
- Body
- Variables
- Category
- Active
- Approval Status

Example:

```text
Dear {{name}},

Your {{event}} is scheduled on {{date}} at {{time}}.

Regards,
SVIT, Vasad
```

Variables must be validated before sending.

---

# 5. Message Composer

The operator selects:

1. Channel
   - WhatsApp
   - SMS
   - Both

2. Audience
   - Individual
   - Group
   - Multiple Groups
   - Imported contacts

3. Template

4. Variables

5. Schedule
   - Send Now
   - Schedule Later

6. Optional attachment for supported channels

7. Confirmation

Before sending bulk messages, display:

```text
Recipients: 1,250
WhatsApp: 1,100
SMS: 1,180
Duplicates removed: 30
Invalid numbers: 20
Estimated usage/cost: XXXX
```

---

# 6. Message Lifecycle

Every outbound message follows:

```text
DRAFT
  ↓
QUEUED
  ↓
PROCESSING
  ↓
SENT
  ↓
DELIVERED
  ↓
READ (WhatsApp only, where provider reports it)
```

Failure path:

```text
PROCESSING
    ↓
FAILED
    ↓
RETRY
    ↓
PROCESSING
```

Possible final statuses:

```text
QUEUED
PROCESSING
SENT
DELIVERED
READ
FAILED
CANCELLED
```

---

# 7. Database Design

## 7.1 organizations

```sql
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  code text unique,
  logo_url text,
  timezone text default 'Asia/Kolkata',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

---

## 7.2 user_profiles

```sql
create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references organizations(id),
  full_name text not null,
  email text,
  mobile text,
  role text not null check (
    role in ('SUPER_ADMIN','ADMIN','OPERATOR','REPORT_VIEWER')
  ),
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

---

## 7.3 contacts

```sql
create table contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
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
  whatsapp_opt_in boolean default false,
  sms_opt_in boolean default false,
  active boolean default true,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index contacts_mobile_idx
on contacts(organization_id, mobile_e164);

create index contacts_department_idx
on contacts(organization_id, department);
```

---

## 7.4 groups

```sql
create table contact_groups (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  name text not null,
  description text,
  active boolean default true,
  created_at timestamptz default now()
);
```

---

## 7.5 group_members

```sql
create table group_members (
  group_id uuid references contact_groups(id) on delete cascade,
  contact_id uuid references contacts(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (group_id, contact_id)
);
```

---

## 7.6 message_templates

```sql
create table message_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  name text not null,
  channel text not null check (channel in ('WHATSAPP','SMS')),
  provider text,
  provider_template_id text,
  language_code text default 'en',
  category text,
  body text not null,
  variables jsonb default '[]'::jsonb,
  approval_status text default 'PENDING',
  active boolean default true,
  created_by uuid references user_profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

---

## 7.7 campaigns

```sql
create table campaigns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  name text not null,
  channel text not null check (channel in ('WHATSAPP','SMS','BOTH')),
  template_id uuid references message_templates(id),
  status text default 'DRAFT',
  scheduled_at timestamptz,
  created_by uuid references user_profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

---

## 7.8 messages

```sql
create table messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  campaign_id uuid references campaigns(id),
  contact_id uuid references contacts(id),
  channel text not null check (channel in ('WHATSAPP','SMS')),
  to_number text not null,
  from_sender text,
  template_id uuid references message_templates(id),
  body text,
  provider text,
  provider_message_id text,
  status text default 'QUEUED',
  error_code text,
  error_message text,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  failed_at timestamptz,
  retry_count integer default 0,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index messages_campaign_idx on messages(campaign_id);
create index messages_contact_idx on messages(contact_id);
create index messages_provider_id_idx on messages(provider_message_id);
create index messages_status_idx on messages(status);
```

---

## 7.9 message_events

```sql
create table message_events (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references messages(id) on delete cascade,
  provider text,
  event_type text not null,
  provider_event_id text,
  payload jsonb not null,
  created_at timestamptz default now()
);
```

---

## 7.10 scheduled_jobs

```sql
create table scheduled_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  campaign_id uuid references campaigns(id),
  run_at timestamptz not null,
  status text default 'PENDING',
  attempts integer default 0,
  last_error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

---

## 7.11 provider_settings

Do NOT store provider secrets in normal application tables.

```sql
create table provider_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  provider_type text not null,
  provider_name text not null,
  sender_name text,
  whatsapp_sender text,
  sms_sender text,
  active boolean default true,
  public_config jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

Secrets belong in environment variables or a dedicated secrets manager.

---

## 7.12 audit_logs

```sql
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  user_id uuid references user_profiles(id),
  action text not null,
  entity_type text,
  entity_id uuid,
  ip_address inet,
  user_agent text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
```

---

# 8. API Structure

Base URL:

```text
/api/v1
```

## Authentication

```text
POST /auth/login
POST /auth/logout
GET  /auth/me
```

Use Supabase Auth for authentication.

---

## Contacts

```text
GET    /contacts
POST   /contacts
GET    /contacts/:id
PATCH  /contacts/:id
DELETE /contacts/:id

POST   /contacts/import
GET    /contacts/export
```

---

## Groups

```text
GET    /groups
POST   /groups
PATCH  /groups/:id
DELETE /groups/:id

POST   /groups/:id/members
DELETE /groups/:id/members/:contactId
```

---

## Templates

```text
GET    /templates
POST   /templates
GET    /templates/:id
PATCH  /templates/:id
DELETE /templates/:id

POST   /templates/:id/test
```

---

## Messaging

```text
POST /messages/send
POST /messages/send-bulk
GET  /messages
GET  /messages/:id
POST /messages/:id/retry
POST /messages/:id/cancel
```

---

## Campaigns

```text
GET    /campaigns
POST   /campaigns
GET    /campaigns/:id
PATCH  /campaigns/:id
POST   /campaigns/:id/send
POST   /campaigns/:id/cancel
```

---

## Reports

```text
GET /reports/dashboard
GET /reports/messages
GET /reports/delivery
GET /reports/failures
GET /reports/usage
GET /reports/export
```

---

## Webhooks

```text
POST /webhooks/whatsapp
POST /webhooks/sms
```

Webhook routes must be public but strongly verified using the provider's signature/authentication mechanism.

---

# 9. Send API Example

Request:

```json
{
  "channel": "BOTH",
  "contactIds": [
    "CONTACT_UUID_1",
    "CONTACT_UUID_2"
  ],
  "templateId": "TEMPLATE_UUID",
  "variables": {
    "name": "Rahul Patel",
    "date": "15-09-2026",
    "time": "10:30 AM"
  }
}
```

Backend flow:

```text
Validate JWT
   ↓
Check role
   ↓
Load contacts
   ↓
Check opt-in/channel eligibility
   ↓
Remove duplicates
   ↓
Validate template
   ↓
Create message records
   ↓
Queue jobs
   ↓
Worker sends WhatsApp/SMS
   ↓
Store provider message ID
   ↓
Provider webhook updates status
   ↓
Dashboard displays result
```

---

# 10. WhatsApp Integration

## Option A — Meta WhatsApp Business Platform

Recommended when the organization wants direct Meta integration.

Store:

```text
WHATSAPP_ACCESS_TOKEN
WHATSAPP_PHONE_NUMBER_ID
WHATSAPP_BUSINESS_ACCOUNT_ID
WHATSAPP_VERIFY_TOKEN
```

The backend should call Meta's Graph API from the server only.

Never expose access tokens in frontend JavaScript.

## Option B — Twilio WhatsApp

Twilio can provide a common messaging API for WhatsApp and SMS.

Typical Node.js package:

```bash
npm install twilio
```

Example structure:

```js
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

await client.messages.create({
  from: `whatsapp:${process.env.WHATSAPP_SENDER}`,
  to: `whatsapp:${recipient}`,
  contentSid: templateSid,
  contentVariables: JSON.stringify(variables)
});
```

Production WhatsApp sender registration and business verification must be completed before production use.

---

# 11. SMS Integration

Create an adapter:

```ts
interface SmsProvider {
  sendMessage(input: {
    to: string;
    body: string;
    templateId?: string;
    variables?: Record<string, string>;
  }): Promise<{
    providerMessageId: string;
    status: string;
  }>;
}
```

Possible providers:

```text
Twilio
MSG91
Gupshup
Exotel
Other DLT-compliant Indian SMS provider
```

For India, select the provider based on:

- DLT support
- Sender ID/header
- Template registration
- Delivery reporting
- API reliability
- Pricing
- Unicode/Gujarati support
- Support for transactional/service messages

---

# 12. Important India SMS Compliance

For Indian domestic SMS, build the software around DLT-compliant templates.

Maintain these configuration fields:

```text
Principal Entity ID
Sender ID / Header
DLT Template ID
Telemarketer ID / PE-TM chain where applicable
Message Category
Language
```

Do not allow an operator to freely change an approved SMS template's text and bypass the registered template.

The software should maintain:

```text
DLT Template
      ↓
Application Template
      ↓
Variable Validation
      ↓
Provider API
```

TRAI states that commercial communication requires registered sender/header and content-template processes. Recent TRAI directions also require pre-tagging of variable components in SMS content templates. See the official TRAI guidance before production deployment.

---

# 13. WhatsApp + SMS Unified Provider Interface

Create:

```text
src/providers/
    whatsapp/
        whatsapp.interface.ts
        meta-whatsapp.provider.ts
        twilio-whatsapp.provider.ts

    sms/
        sms.interface.ts
        twilio-sms.provider.ts
        indian-sms.provider.ts

    notification/
        notification.service.ts
```

Interface:

```ts
export interface NotificationProvider {
  send(input: SendMessageInput): Promise<SendMessageResult>;
}
```

Then:

```ts
notificationService.send({
  channel: "WHATSAPP",
  to: "+9198XXXXXXXX",
  template: "...",
  variables: {...}
});
```

or:

```ts
notificationService.send({
  channel: "SMS",
  to: "+9198XXXXXXXX",
  template: "...",
  variables: {...}
});
```

For BOTH:

```ts
await notificationService.sendBoth({
  to: "+9198XXXXXXXX",
  templateId: "...",
  variables: {...}
});
```

---

# 14. Admin Panel

## Sidebar

```text
Dashboard
Contacts
Groups
Templates
Send Message
Campaigns
Scheduled Messages
Message History
Reports
Provider Settings
Users & Roles
Audit Logs
System Settings
```

---

## Dashboard

```text
+------------------------------------------------+
| Total Contacts       12,540                    |
| WhatsApp Enabled     11,920                    |
| SMS Enabled          12,100                    |
| Messages Today        4,850                    |
+------------------------------------------------+

WhatsApp Delivery: 96%
SMS Delivery:      94%

Today's Messages
WhatsApp █████████████
SMS      █████████
```

---

## Send Message Page

```text
Channel:
[ WhatsApp ] [ SMS ] [ BOTH ]

Audience:
[ Individual ]
[ Group ]
[ Import ]

Group:
[ First Year Students ▼ ]

Template:
[ Exam Notice ▼ ]

Variables:
Name: {{name}}
Date: {{date}}
Time: {{time}}

[Preview]

Recipients: 1,250

[Send Now] [Schedule]
```

---

# 15. Roles

## SUPER_ADMIN

Full access.

## ADMIN

- Contacts
- Groups
- Templates
- Campaigns
- Reports
- Messaging

Cannot manage organization owner credentials.

## OPERATOR

- View contacts
- Send messages
- View own/history
- No provider credential access

## REPORT_VIEWER

- Dashboard
- Reports
- Message history
- No send permission

---

# 16. Security

Must implement:

- Supabase Auth
- Row Level Security
- Role-based authorization
- API rate limiting
- Input validation
- Helmet
- CORS allowlist
- HTTPS
- Webhook signature verification
- Audit logging
- Secret management
- No provider credentials in frontend
- No service-role key in browser
- Passwordless/MFA where appropriate
- Database backups
- Soft-delete for important records

Environment variables:

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

WHATSAPP_PROVIDER=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_SENDER=
TWILIO_SMS_SENDER=

SMS_PROVIDER=
SMS_API_KEY=
SMS_SENDER_ID=
```

Never commit `.env`.

---

# 17. Folder Structure

```text
notification-system/
│
├── apps/
│   ├── web/
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   └── hooks/
│   │
│   └── api/
│       └── src/
│           ├── config/
│           ├── controllers/
│           ├── routes/
│           ├── middleware/
│           ├── services/
│           ├── providers/
│           ├── workers/
│           ├── validators/
│           ├── utils/
│           └── server.ts
│
├── supabase/
│   ├── migrations/
│   ├── seed.sql
│   └── functions/
│
├── packages/
│   ├── types/
│   ├── validation/
│   └── shared/
│
├── docs/
│   ├── architecture.md
│   ├── api.md
│   ├── whatsapp.md
│   ├── sms.md
│   └── deployment.md
│
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

# 18. Queue / Worker

Do not send 5,000 messages inside one HTTP request.

Use:

```text
HTTP Request
     ↓
Create message rows
     ↓
Queue
     ↓
Worker
     ↓
Provider API
     ↓
Status callback
```

Worker pseudocode:

```ts
while (true) {
  const job = await getNextPendingJob();

  if (!job) {
    await sleep(1000);
    continue;
  }

  try {
    const result = await provider.send(job);

    await markSent(job.id, result);
  } catch (error) {
    await handleFailure(job.id, error);
  }
}
```

Add:

- exponential backoff
- maximum retries
- dead-letter handling
- provider rate-limit handling
- idempotency

---

# 19. Idempotency

Every send operation should have an idempotency key.

Example:

```text
campaignId + contactId + channel
```

Before creating a duplicate message, check whether an existing message is already queued/sent for the same operation.

This prevents accidental duplicate SMS/WhatsApp messages.

---

# 20. Incoming Message Handling

When a user replies:

```text
WhatsApp/SMS
     ↓
Provider
     ↓
Webhook
     ↓
Node.js
     ↓
Find Contact
     ↓
Store incoming message
     ↓
Optional Auto Reply
     ↓
Admin Inbox
```

Additional table:

```sql
create table conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  contact_id uuid references contacts(id),
  channel text not null,
  last_message_at timestamptz,
  status text default 'OPEN',
  created_at timestamptz default now()
);
```

---

# 21. Message Inbox

Add an optional module:

```text
Inbox

Rahul Patel
WhatsApp
"Sir, I have submitted the form."

Admin:
"Thank you. Your request has been received."
```

Filters:

- WhatsApp
- SMS
- Unread
- Open
- Closed
- Department

---

# 22. Excel Import

Required columns:

```text
Name
Mobile
WhatsApp
Email
Student ID
Department
Course
Semester
Batch
Group
```

Import flow:

```text
Upload Excel
    ↓
Read rows
    ↓
Validate mobile
    ↓
Normalize number
    ↓
Check duplicates
    ↓
Show preview
    ↓
Import
```

Do not directly import without preview.

---

# 23. Notification Examples

### Admission

```text
Dear {{name}},
Your admission application has been successfully received.
Application No.: {{application_no}}

Regards,
SVIT, Vasad
```

### Exam

```text
Dear {{name}},
Your examination is scheduled on {{date}} at {{time}}.
Venue: {{venue}}

SVIT, Vasad
```

### Fee Reminder

```text
Dear {{name}},
This is a reminder regarding pending fees for {{course}}.
Please contact the Accounts Department.

SVIT, Vasad
```

---

# 24. Scheduled Notifications

Examples:

```text
Every Monday 9:00 AM
→ Staff reminder

Every exam day 7:00 AM
→ Student notification

Admission deadline - 1 day before
→ Applicant reminder
```

Store all times in UTC internally and display in:

```text
Asia/Kolkata
```

---

# 25. Reports

Reports should include:

```text
Date
Campaign
Contact
Channel
Template
Provider
Sent
Delivered
Read
Failed
Error
Cost
```

Export:

```text
Excel
CSV
PDF
```

---

# 26. API Error Format

All APIs should return:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_TEMPLATE",
    "message": "Template variables are missing"
  },
  "requestId": "REQ-123456"
}
```

Success:

```json
{
  "success": true,
  "data": {},
  "requestId": "REQ-123456"
}
```

---

# 27. Environment Setup

```bash
git clone YOUR_REPOSITORY_URL
cd notification-system

npm install

cp .env.example .env
```

Configure Supabase.

Run migrations.

Start development:

```bash
npm run dev
```

Production:

```bash
npm run build
npm run start
```

---

# 28. Development Phases

## Phase 1

- Supabase project
- Authentication
- User roles
- Contacts
- Groups
- Dashboard

## Phase 2

- Templates
- Message composer
- SMS provider
- WhatsApp provider

## Phase 3

- Bulk campaigns
- Queue
- Webhooks
- Delivery status
- Retry system

## Phase 4

- Scheduling
- Reports
- Excel import/export
- Audit logs

## Phase 5

- Inbox
- Auto replies
- Advanced analytics
- Multi-department support

---

# 29. Acceptance Criteria

The software is considered ready when:

- Admin can login.
- Admin can create contacts.
- Admin can import Excel.
- Admin can create groups.
- Admin can create templates.
- Admin can select WhatsApp/SMS/BOTH.
- Admin can send one test message.
- Admin can send bulk messages.
- Duplicate messages are prevented.
- Provider message IDs are stored.
- Delivery status is updated through webhooks.
- Failed messages are visible.
- Failed messages can be retried.
- Scheduled messages work.
- Reports can be exported.
- Audit logs record administrative actions.
- Provider secrets are never exposed to frontend.
- RLS prevents cross-organization data access.
- SMS templates comply with applicable Indian DLT requirements.

---

# 30. Recommended Provider Strategy

For the first version, implement provider interfaces rather than hard-code one vendor:

```text
Notification Service
       │
       ├── WhatsAppProvider
       │      ├── MetaCloudProvider
       │      └── TwilioWhatsAppProvider
       │
       └── SmsProvider
              ├── TwilioSmsProvider
              └── IndianDltSmsProvider
```

This prevents the entire application from becoming dependent on one vendor.

---

# 31. Important Sender-Number Design

The UI should display:

```text
Organization Sender
-------------------
Name: SVIT Vasad
WhatsApp Sender: +91XXXXXXXXXX
SMS Sender ID: SVITXX
```

The operator should simply choose:

```text
Send via: BOTH
```

The system decides the technically correct sender for each channel.

This is safer than assuming that WhatsApp and Indian SMS can always display the identical number.

---

# 32. GitHub Development Rules

1. Never commit `.env`.
2. Never commit API tokens.
3. Never expose Supabase service-role key in frontend.
4. Use pull requests for production changes.
5. Use database migrations.
6. Use TypeScript strict mode.
7. Validate every API input.
8. Log provider errors without logging sensitive credentials.
9. Use idempotency for bulk sends.
10. Test webhook signature validation.
11. Add automated tests before production.
12. Keep provider-specific code inside `/providers`.

---

# 33. Final Product Name Suggestion

```text
SVIT Notify
```

Alternative:

```text
SVIT Central Notification System
SVIT Connect
SVIT MessageHub
SVIT NotifyHub
SVIT Communication Portal
```

---

# 34. Final End-to-End Flow

```text
Admin Login
    ↓
Dashboard
    ↓
Select Contacts / Group
    ↓
Select WhatsApp / SMS / BOTH
    ↓
Select Approved Template
    ↓
Enter Variables
    ↓
Preview
    ↓
Confirm
    ↓
Create Campaign
    ↓
Create Message Records
    ↓
Queue
    ↓
Worker
    ├───────────────┐
    ↓               ↓
WhatsApp API      SMS API
    ↓               ↓
Provider           Provider
    ↓               ↓
Webhook           Webhook
    └───────┬───────┘
            ↓
      Update Message
            ↓
      Delivered/Read/
          Failed
            ↓
        Dashboard
            ↓
          Report
```

---

## 35. Build Instruction for AI Coding Agent

Build this project as a complete production-oriented monorepo.

Requirements:

- TypeScript
- Next.js frontend
- Node.js + Express API
- Supabase PostgreSQL/Auth
- Supabase RLS
- Provider adapter architecture
- WhatsApp adapter
- SMS adapter
- Queue/worker architecture
- Webhook handling
- Role-based access
- Responsive admin dashboard
- Excel import/export
- Message templates
- Campaigns
- Scheduling
- Reports
- Audit logs
- Error handling
- Validation
- Tests
- `.env.example`
- Database migrations
- Seed data
- API documentation

Do not place provider API keys in frontend code.

Do not use mock success responses for production API functions. If credentials are not configured, show a clear configuration error.

Create clean reusable components and services.

Every database query must respect organization-level access.

Every outbound message must create a message record before sending.

Every provider response must be stored.

Every provider webhook must update the corresponding message.

Implement retry and idempotency.

The final application should be deployable through GitHub with clear setup instructions.

