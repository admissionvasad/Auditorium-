# WhatsApp Dashboard — Private Self-Use

A private/self-use WhatsApp Business dashboard built with:

* **Next.js** — Frontend UI
* **Node.js + Express** — Backend API
* **Supabase PostgreSQL** — Database
* **Supabase Auth** — Login/authentication
* **Supabase Realtime** — Live inbox updates
* **Supabase Storage** — Media storage
* **Meta WhatsApp Cloud API** — WhatsApp messaging
* **Redis + BullMQ** — Campaign queue and scheduling
* **GitHub** — Source code and version control
* **Docker** — Optional deployment

This project is intended for **personal/internal use**. It is not designed as a multi-tenant SaaS platform.

---

# 1. Architecture

```text
                         ┌─────────────────────┐
                         │      Browser        │
                         │      Next.js        │
                         │                     │
                         │ Dashboard           │
                         │ Inbox               │
                         │ Contacts            │
                         │ Campaigns           │
                         │ Templates           │
                         │ Reports             │
                         └──────────┬──────────┘
                                    │
                                  HTTPS
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Node.js / Express   │
                         │                     │
                         │ Authentication      │
                         │ WhatsApp API        │
                         │ Webhooks            │
                         │ Campaigns           │
                         │ Templates           │
                         │ Reports             │
                         └──────┬───────┬──────┘
                                │       │
                  ┌─────────────┘       └──────────────┐
                  ▼                                    ▼
          ┌────────────────┐                  ┌─────────────────┐
          │    Supabase    │                  │ Meta WhatsApp   │
          │                │                  │ Cloud API       │
          │ PostgreSQL     │                  │                 │
          │ Auth           │                  │ Messages        │
          │ Realtime       │                  │ Templates       │
          │ Storage        │                  │ Media           │
          └────────────────┘                  └────────┬────────┘
                                                       │
                                                     Webhook
                                                       │
                                                       ▼
                                                Node.js Backend
```

---

# 2. Main Features

## Dashboard

* Total contacts
* Messages sent
* Delivered messages
* Read messages
* Failed messages
* Campaign statistics
* Recent activity
* WhatsApp connection status

## WhatsApp Inbox

* Conversation list
* Search conversations
* Unread count
* Incoming messages
* Outgoing messages
* Text replies
* Template replies
* Image/media messages
* Delivery status
* Read status
* Contact details
* Tags
* Notes
* Realtime updates

## Contacts

* Add contact
* Edit contact
* Delete contact
* Search contacts
* Import CSV
* Export CSV
* Groups
* Tags
* Custom fields
* Opt-in status

## Groups

Example:

```text
Customers
Leads
VIP
Pending Payment
Wholesale
Ahmedabad Customers
```

## Tags

Example:

```text
VIP
New Lead
Interested
Paid
Pending
Follow-up
```

## Templates

* Sync templates from Meta
* Template name
* Category
* Language
* Status
* Components
* Variables
* Template preview

## Campaigns

* Create campaign
* Select audience
* Select group
* Select tags
* Select template
* Template variables
* Preview
* Send now
* Schedule
* Pause
* Resume
* Cancel
* Campaign statistics

## Reports

* Sent
* Delivered
* Read
* Failed
* Delivery rate
* Failure rate
* Recipient-level status
* Campaign-level reports

## Media

* Images
* Videos
* Documents
* Audio
* Supabase Storage integration

## Settings

* WhatsApp configuration
* WABA ID
* Phone Number ID
* API connection test
* Webhook configuration
* Profile
* Application settings

---

# 3. UI Layout

```text
┌───────────────────────────────────────────────────────────────┐
│ LOGO       Search                         🔔     User ▼       │
├───────────────┬───────────────────────────────────────────────┤
│               │                                               │
│ Dashboard     │                                               │
│               │                                               │
│ Inbox         │                 PAGE CONTENT                  │
│ Contacts      │                                               │
│ Groups        │                                               │
│ Templates     │                                               │
│ Campaigns     │                                               │
│ Scheduled     │                                               │
│ Reports       │                                               │
│ Media         │                                               │
│               │                                               │
│ Settings      │                                               │
│               │                                               │
│ Logout        │                                               │
└───────────────┴───────────────────────────────────────────────┘
```

---

# 4. Login

Authentication is handled by **Supabase Auth**.

```text
Email
[________________________]

Password
[________________________]

[ LOGIN ]
```

Do not create a custom password system when Supabase Auth is available.

---

# 5. Dashboard UI

```text
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Contacts     │ │ Sent Today   │ │ Delivered    │ │ Failed       │
│ 12,450       │ │ 4,820        │ │ 4,601        │ │ 219          │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

Charts:

* Messages by day
* Delivered vs failed
* Incoming vs outgoing
* Campaign performance

---

# 6. Inbox UI

```text
┌─────────────────┬──────────────────────────┬─────────────────┐
│ Conversations   │ Conversation             │ Contact         │
│                 │                          │                 │
│ Rahul           │ Rahul                    │ Rahul Patel     │
│ Hello...        │                          │ +91XXXXXXXXXX   │
│                 │ Rahul: Hello             │                 │
│ Amit            │                          │ Tags            │
│ Thank you       │ You: Hi Rahul            │ [VIP]           │
│                 │                          │                 │
│ Priya           │ Rahul: Order status?     │ Notes           │
│ Order...        │                          │                 │
│                 │ [Type message...] [Send]  │                 │
└─────────────────┴──────────────────────────┴─────────────────┘
```

Incoming messages should appear through **Supabase Realtime** without refreshing the page.

---

# 7. Contacts UI

```text
Contacts

[ + Add Contact ] [ Import CSV ] [ Export CSV ]

Search ___________________________

Name       Phone          Group       Tags
------------------------------------------------
Rahul      +9198XXXXXX    Customers   VIP
Amit       +9197XXXXXX    Leads       New
Priya      +9199XXXXXX    Customers   Paid
```

Contact fields:

```text
name
phone
email
avatar
opt_in
notes
custom_fields
groups
tags
```

Phone numbers should normally be stored in international format.

Example:

```text
919812345678
```

---

# 8. Database Structure

Main database:

```text
auth.users
     │
     ▼
profiles
     │
     └──────── audit_logs

contacts
     │
     ├──── contact_group_members ──── contact_groups
     │
     └──── contact_tag_map ───────── tags
     
contacts
     │
     ▼
conversations
     │
     ▼
messages
     │
     └──── media

templates
     │
     ▼
campaigns
     │
     ▼
campaign_recipients

webhook_events
```

---

# 9. Database Tables

## profiles

```text
id
email
full_name
avatar_url
role
created_at
updated_at
```

`id` should correspond to `auth.users.id`.

---

## contacts

```text
id
phone
name
email
avatar_url
opt_in
opt_in_at
status
notes
custom_fields
last_message_at
created_at
updated_at
```

Example `custom_fields`:

```json
{
  "order_id": "ORD10023",
  "city": "Ahmedabad",
  "customer_type": "VIP"
}
```

---

## contact_groups

```text
id
name
description
created_at
```

Membership:

```text
contact_group_members

contact_id
group_id
created_at
```

---

## tags

```text
id
name
created_at
```

Mapping:

```text
contact_tag_map

contact_id
tag_id
created_at
```

---

## conversations

```text
id
contact_id
status
unread_count
last_message_id
last_message_at
created_at
updated_at
```

Statuses:

```text
open
closed
archived
```

---

## messages

```text
id
conversation_id
contact_id
direction
message_type
meta_message_id
text
template_name
template_language
media_id
status
error_code
error_message
sent_at
delivered_at
read_at
created_at
```

Direction:

```text
incoming
outgoing
```

Message types:

```text
text
template
image
video
audio
document
location
interactive
button
reaction
```

Statuses:

```text
queued
sent
delivered
read
failed
```

---

## media

```text
id
contact_id
message_id
storage_path
mime_type
file_name
file_size
meta_media_id
created_at
```

---

## templates

```text
id
meta_template_id
name
language
category
status
components
created_at
updated_at
```

`components` is stored as JSONB.

---

## campaigns

```text
id
name
description
template_id
status
scheduled_at
started_at
completed_at
total_recipients
sent_count
delivered_count
read_count
failed_count
created_by
created_at
updated_at
```

Campaign statuses:

```text
draft
scheduled
running
paused
completed
cancelled
failed
```

---

## campaign_recipients

```text
id
campaign_id
contact_id
phone
variables
meta_message_id
status
queued_at
sent_at
delivered_at
read_at
error_code
error_message
created_at
updated_at
```

---

## webhook_events

```text
id
event_id
event_type
payload
processed
processed_at
error
created_at
```

This table helps prevent duplicate webhook processing.

---

## audit_logs

```text
id
user_id
action
entity_type
entity_id
metadata
ip_address
created_at
```

Examples:

```text
LOGIN
SEND_MESSAGE
CREATE_CAMPAIGN
DELETE_CONTACT
SYNC_TEMPLATES
UPDATE_SETTINGS
```

---

# 10. WhatsApp Cloud API

This project uses the official **Meta WhatsApp Cloud API**.

Required information:

```text
Meta App
WhatsApp Business Account
WABA ID
Phone Number ID
Access Token
App Secret
Verify Token
```

Do not use unofficial WhatsApp Web/QR scraping for this project.

---

# 11. WhatsApp Message Flow

## Outgoing message

```text
User
 │
 ▼
Next.js
 │
 ▼
Node.js API
 │
 ├── Authenticate user
 ├── Validate contact
 ├── Validate message
 │
 ▼
Meta WhatsApp Cloud API
 │
 ▼
WhatsApp User
```

After Meta accepts the message:

```text
Node.js
 │
 └── Save message
      └── meta_message_id
```

Initial status:

```text
sent
```

Later webhook statuses:

```text
sent
  ↓
delivered
  ↓
read
```

---

# 12. Incoming Message Flow

```text
WhatsApp User
      │
      ▼
Meta WhatsApp
      │
      ▼
Webhook
      │
      ▼
Node.js
      │
      ├── Verify signature
      │
      ├── Find contact
      │
      ├── Find/create conversation
      │
      └── Insert message
      │
      ▼
Supabase
      │
      ▼
Realtime
      │
      ▼
Next.js Inbox
```

The new message should appear in the Inbox automatically.

---

# 13. Webhook

Endpoint:

```text
GET /api/webhooks/whatsapp
POST /api/webhooks/whatsapp
```

GET is used for Meta verification.

POST receives:

* Incoming messages
* Message statuses
* Delivery updates
* Read updates
* Errors

The webhook must validate:

```text
X-Hub-Signature-256
```

using the Meta App Secret.

Important:

**Signature verification must use the raw request body.**

Do not calculate the signature from a newly serialized JSON object.

---

# 14. Webhook Processing

```text
POST /api/webhooks/whatsapp
            │
            ▼
Validate X-Hub-Signature-256
            │
            ▼
Save webhook_events
            │
            ▼
Check duplicate event
            │
            ▼
Process event
            │
     ┌──────┼───────────┐
     ▼      ▼           ▼
 Message  Status      Error
     │      │
     ▼      ▼
Supabase Supabase
```

---

# 15. Message Status

```text
             ┌─────────┐
             │ queued  │
             └────┬────┘
                  │
                  ▼
             ┌─────────┐
             │  sent   │
             └────┬────┘
                  │
          ┌───────┴────────┐
          ▼                ▼
     ┌───────────┐    ┌─────────┐
     │ delivered │    │ failed  │
     └─────┬─────┘    └─────────┘
           │
           ▼
      ┌─────────┐
      │  read   │
      └─────────┘
```

---

# 16. WhatsApp Templates

Templates are managed through Meta.

Example:

```text
Template:

Hello {{1}},

Your order {{2}} has been confirmed.

Thank you.
```

Variables:

```text
{{1}} = Customer Name
{{2}} = Order ID
```

Example generated message:

```text
Hello Rahul,

Your order ORD10023 has been confirmed.

Thank you.
```

The application should only use templates that are available/approved for the relevant WhatsApp Business account.

---

# 17. Template Sync

From the Templates page:

```text
[ Sync Templates ]
```

Flow:

```text
Next.js
   │
   ▼
Node.js
   │
   ▼
Meta Graph API
   │
   ▼
WABA Templates
   │
   ▼
Supabase
```

The application upserts the templates into the local database.

---

# 18. Campaign Flow

```text
Create Campaign
       │
       ▼
Select Audience
       │
       ▼
Select Template
       │
       ▼
Configure Variables
       │
       ▼
Preview
       │
       ▼
Send Now / Schedule
       │
       ▼
campaign_recipients
       │
       ▼
Queue
       │
       ▼
Worker
       │
       ▼
Meta WhatsApp API
       │
       ▼
WhatsApp
```

---

# 19. Audience Filtering

Example:

```text
Group = Customers
AND
Tag = VIP
AND
opt_in = true
```

Result:

```text
850 recipients
```

Only those recipients are inserted into:

```text
campaign_recipients
```

---

# 20. Campaign Queue

Bulk campaigns should not send thousands of messages inside one HTTP request.

Recommended:

```text
Next.js
   │
   ▼
Node.js
   │
   ▼
Create Campaign
   │
   ▼
PostgreSQL
   │
   ▼
Redis / BullMQ
   │
   ▼
Worker
   │
   ▼
Meta API
```

Benefits:

* Queue processing
* Retry
* Pause
* Resume
* Scheduling
* Failure handling
* Controlled sending
* Better reliability

---

# 21. Scheduled Campaign

```text
Create campaign
      │
      ▼
status = scheduled
      │
      ▼
scheduled_at = future date/time
      │
      ▼
Scheduler
      │
      ▼
status = running
      │
      ▼
Queue recipients
      │
      ▼
Worker sends
      │
      ▼
Webhook updates status
      │
      ▼
Campaign completed
```

---

# 22. Supabase Realtime

Realtime is mainly used for the Inbox.

```text
Incoming WhatsApp Message
          │
          ▼
Node.js
          │
          ▼
Supabase messages INSERT
          │
          ▼
Supabase Realtime
          │
          ▼
Next.js
          │
          ▼
Inbox updates automatically
```

---

# 23. Authentication Flow

```text
Login Page
    │
    ▼
Supabase Auth
    │
    ▼
Authenticated Session
    │
    ▼
JWT
    │
    ▼
Node.js API
    │
    ▼
Verify User
```

Use Supabase Row Level Security where applicable.

---

# 24. Security

## Frontend environment variables

Only public values:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=
```

## Backend environment variables

Private values:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

META_ACCESS_TOKEN=
META_PHONE_NUMBER_ID=
META_WABA_ID=
META_APP_SECRET=
META_VERIFY_TOKEN=

JWT_SECRET=
```

Never expose these in frontend code:

```text
SUPABASE_SERVICE_ROLE_KEY
META_ACCESS_TOKEN
META_APP_SECRET
JWT_SECRET
```

Never commit `.env` to GitHub.

---

# 25. Project Structure

```text
whatsapp-dashboard/
│
├── README.md
│
├── frontend/
│   ├── app/
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── inbox/
│   │   ├── contacts/
│   │   ├── groups/
│   │   ├── templates/
│   │   ├── campaigns/
│   │   ├── scheduled/
│   │   ├── reports/
│   │   ├── media/
│   │   └── settings/
│   │
│   ├── components/
│   ├── lib/
│   └── hooks/
│
├── backend/
│   └── src/
│       ├── server.ts
│       ├── config/
│       ├── middleware/
│       ├── routes/
│       ├── controllers/
│       ├── services/
│       │   ├── whatsapp/
│       │   ├── campaigns/
│       │   ├── templates/
│       │   └── contacts/
│       ├── workers/
│       ├── webhooks/
│       └── utils/
│
├── supabase/
│   └── migrations/
│
├── docs/
│
├── docker-compose.yml
│
└── .env.example
```

---

# 26. Requirements

Install:

* Git
* Node.js 20+
* npm
* VS Code
* Supabase account
* GitHub account
* Meta Developer account
* WhatsApp Business Account

Optional:

* Docker
* Redis
* Cloudflare Tunnel
* ngrok

---

# 27. Clone GitHub Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd whatsapp-dashboard
```

---

# 28. Install Frontend

```bash
cd frontend
npm install
```

Run:

```bash
npm run dev
```

Frontend:

```text
http://localhost:3000
```

---

# 29. Install Backend

Open another terminal:

```bash
cd backend
npm install
```

Run:

```bash
npm run dev
```

Backend:

```text
http://localhost:4000
```

Health check:

```text
http://localhost:4000/health
```

Expected:

```json
{
  "ok": true
}
```

---

# 30. Supabase Setup

Create a new Supabase project.

After creating the project, open:

```text
Supabase Dashboard
    ↓
SQL Editor
```

Run the migration files from:

```text
supabase/migrations/
```

Verify the tables:

```text
profiles
contacts
contact_groups
contact_group_members
tags
contact_tag_map
conversations
messages
media
templates
campaigns
campaign_recipients
webhook_events
audit_logs
```

---

# 31. Supabase Environment Variables

From Supabase:

```text
Project Settings
    ↓
API
```

Copy:

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

The service-role key must only be used by the backend.

---

# 32. Local Environment

Create:

```text
.env
```

from:

```text
.env.example
```

Example:

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY

PORT=4000
FRONTEND_URL=http://localhost:3000

JWT_SECRET=CHANGE_THIS_TO_A_LONG_RANDOM_SECRET

META_GRAPH_VERSION=VERIFY_CURRENT_META_VERSION
META_ACCESS_TOKEN=
META_PHONE_NUMBER_ID=
META_WABA_ID=
META_VERIFY_TOKEN=
META_APP_SECRET=

NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

Do not copy real production secrets into this README.

---

# 33. Meta WhatsApp Setup

Create/configure a Meta Developer application with WhatsApp.

You need:

```text
WhatsApp Business Account
Phone Number
Phone Number ID
WABA ID
Access Token
App Secret
```

The exact Meta dashboard UI and API version can change, so verify the current Meta documentation before production deployment.

---

# 34. WhatsApp Phone Number ID

Your backend needs:

```env
META_PHONE_NUMBER_ID=
```

This identifies the WhatsApp Business phone number used by the Cloud API.

---

# 35. WABA ID

Set:

```env
META_WABA_ID=
```

The WABA ID is used for WhatsApp Business Account operations such as template management.

---

# 36. Access Token

Set:

```env
META_ACCESS_TOKEN=
```

Keep this only on the backend.

Never put it into:

```text
frontend
browser JavaScript
GitHub
README
public files
```

---

# 37. App Secret

Set:

```env
META_APP_SECRET=
```

This is required for webhook signature validation.

---

# 38. Verify Token

Create your own random verify token:

```env
META_VERIFY_TOKEN=your-random-webhook-token
```

This is not the same thing as the Meta access token.

---

# 39. Webhook Setup

Production webhook:

```text
https://YOUR_BACKEND_DOMAIN/api/webhooks/whatsapp
```

Example:

```text
https://api.example.com/api/webhooks/whatsapp
```

Configure the webhook in the Meta Developer dashboard.

Use:

```text
Verify Token
```

matching:

```env
META_VERIFY_TOKEN
```

Subscribe to the required WhatsApp webhook fields.

---

# 40. Local Webhook Testing

Localhost is normally not directly reachable by Meta.

Use an HTTPS tunnel.

Example with Cloudflare Tunnel:

```bash
cloudflared tunnel --url http://localhost:4000
```

Or use another trusted HTTPS tunneling solution.

Then use:

```text
https://YOUR-TUNNEL-DOMAIN/api/webhooks/whatsapp
```

as the webhook URL during testing.

Do not use an HTTP-only public endpoint for production.

---

# 41. Test Message

After WhatsApp API configuration:

```text
Next.js
   ↓
Node.js
   ↓
Meta API
   ↓
WhatsApp
```

Test:

```text
Send text
```

Then check:

```text
messages
```

in Supabase.

---

# 42. Test Incoming Message

Send a WhatsApp message from another phone to the configured business number.

Expected:

```text
WhatsApp
   ↓
Meta
   ↓
Webhook
   ↓
Node.js
   ↓
Supabase
   ↓
Realtime
   ↓
Inbox
```

The message should appear in the Inbox.

---

# 43. Test Delivery Status

Send a message and verify:

```text
sent
```

Then webhook updates:

```text
delivered
```

Then:

```text
read
```

if the recipient reads the message and the relevant status is available.

---

# 44. Campaign Example

Campaign:

```text
Name:
Diwali Offer
```

Audience:

```text
Group:
Customers

Tag:
VIP

Opt-in:
true
```

Template:

```text
diwali_offer
```

Variables:

```text
{{1}} = Customer Name
{{2}} = Coupon Code
```

Example:

```text
Hello Rahul,

Get 20% off on your next order.

Use code: DIWALI20
```

---

# 45. Reports

Campaign:

```text
Total Recipients: 5,000
Sent:              5,000
Delivered:         4,821
Read:              4,102
Failed:              179
```

Rates:

```text
Delivery Rate = Delivered / Sent × 100

Failure Rate = Failed / Sent × 100
```

---

# 46. GitHub Setup

Initialize repository:

```bash
git init
```

Check files:

```bash
git status
```

Add:

```bash
git add .
```

Commit:

```bash
git commit -m "Initial WhatsApp dashboard"
```

Set main branch:

```bash
git branch -M main
```

Add GitHub remote:

```bash
git remote add origin YOUR_GITHUB_REPOSITORY_URL
```

Push:

```bash
git push -u origin main
```

---

# 47. GitHub Security

Before pushing:

```bash
git status
```

Make sure you do NOT have:

```text
.env
.env.local
production secrets
Meta access tokens
Supabase service-role key
private certificates
```

The repository should contain:

```text
.env.example
```

but not:

```text
.env
```

---

# 48. `.gitignore`

Recommended:

```gitignore
node_modules/
.next/
.env
.env.local
.env.production
dist/
build/
coverage/
*.log
.DS_Store
```

---

# 49. Supabase Security

Enable Row Level Security for application tables where appropriate.

Recommended policies should ensure:

* Authenticated users can access permitted application data.
* Anonymous users cannot access private data.
* Service-role operations remain backend-only.
* Users cannot modify records they should not control.

For a single-user/private application, policies can be kept simple, but they should still be enabled before production.

---

# 50. Production Deployment

Recommended architecture:

```text
                    GitHub
                      │
             ┌────────┴────────┐
             ▼                 ▼
        Next.js Host      Node.js Host
             │                 │
             │                 │
             └────────┬────────┘
                      │
                ┌─────┴─────┐
                ▼           ▼
            Supabase       Redis
                │
                ▼
           Meta WhatsApp
```

Possible hosting choices:

```text
Frontend:
Vercel / similar Next.js hosting

Backend:
VPS / Render / Railway / similar Node.js hosting

Database:
Supabase

Redis:
Managed Redis / VPS Redis

DNS:
Your domain provider
```

Use HTTPS everywhere.

---

# 51. Production Environment

Frontend:

```env
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Backend:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

META_ACCESS_TOKEN=
META_PHONE_NUMBER_ID=
META_WABA_ID=
META_APP_SECRET=
META_VERIFY_TOKEN=

FRONTEND_URL=https://app.example.com
JWT_SECRET=
```

Never put backend secrets into the frontend deployment.

---

# 52. Recommended Domain Structure

Example:

```text
Dashboard:
https://app.example.com

API:
https://api.example.com

Webhook:
https://api.example.com/api/webhooks/whatsapp
```

---

# 53. Docker

Optional production structure:

```text
docker-compose.yml

services:

  frontend:
    Next.js

  backend:
    Node.js

  redis:
    Redis
```

Supabase can remain hosted separately.

---

# 54. Backup

Important database:

```text
Supabase PostgreSQL
```

Important application data:

```text
contacts
conversations
messages
campaigns
campaign_recipients
templates
audit_logs
```

Media:

```text
Supabase Storage
```

Do not rely only on local files.

---

# 55. Logging

Backend should log:

```text
Incoming webhook
Outgoing API request
Meta response
Message ID
Campaign ID
Recipient ID
Errors
Authentication events
```

Do not log secrets such as:

```text
Access Token
App Secret
Service Role Key
Passwords
```

---

# 56. Error Handling

Meta API errors should be saved:

```text
error_code
error_message
```

For campaign recipients:

```text
status = failed
error_code = ...
error_message = ...
```

The UI should show useful error information without exposing secrets.

---

# 57. Retry Strategy

For temporary failures:

```text
Attempt 1
   ↓
Wait
   ↓
Attempt 2
   ↓
Wait
   ↓
Attempt 3
   ↓
Failed
```

Permanent API errors should not be endlessly retried.

Use BullMQ/Redis for controlled retries.

---

# 58. Idempotency

Webhook events can be delivered more than once.

Therefore:

```text
webhook_events.event_id
```

should be unique where possible.

Also use:

```text
messages.meta_message_id
```

to prevent duplicate message records.

---

# 59. Performance

For a large campaign:

Do not:

```text
for 10,000 recipients
  send API request
```

inside one HTTP request.

Instead:

```text
Campaign
   ↓
Create recipients
   ↓
Queue
   ↓
Worker
   ↓
Controlled API requests
```

This prevents request timeout and makes the campaign recoverable.

---

# 60. Timezone

Store timestamps in:

```text
UTC
```

Display them in the user's configured timezone.

For India:

```text
Asia/Kolkata
```

Do not store local time without timezone information.

---

# 61. Opt-In

The application should maintain:

```text
opt_in
opt_in_at
```

for contacts.

Only message users according to applicable WhatsApp/Meta policies and your users' consent/communication requirements.

Do not use the system for spam or unauthorized bulk messaging.

---

# 62. Important WhatsApp Rules

Use the official WhatsApp Business Cloud API.

Do not build the application around:

```text
WhatsApp Web automation
QR scraping
Browser session automation
Unofficial WhatsApp APIs
```

For production messaging, follow the current Meta/WhatsApp Business Platform policies and template/messaging rules.

---

# 63. API Design

Recommended backend endpoints:

```text
GET    /health

GET    /api/contacts
POST   /api/contacts
GET    /api/contacts/:id
PUT    /api/contacts/:id
DELETE /api/contacts/:id

GET    /api/groups
POST   /api/groups

GET    /api/tags
POST   /api/tags

GET    /api/conversations
GET    /api/conversations/:id/messages

POST   /api/messages/send
POST   /api/messages/send-template
POST   /api/messages/send-media

GET    /api/templates
POST   /api/templates/sync

GET    /api/campaigns
POST   /api/campaigns
GET    /api/campaigns/:id
POST   /api/campaigns/:id/start
POST   /api/campaigns/:id/pause
POST   /api/campaigns/:id/resume
POST   /api/campaigns/:id/cancel

GET    /api/reports

GET    /api/settings/whatsapp
POST   /api/settings/whatsapp/test

GET    /api/webhooks/whatsapp
POST   /api/webhooks/whatsapp
```

---

# 64. Frontend Pages

```text
/login

/dashboard

/inbox
/inbox/:conversationId

/contacts
/contacts/new
/contacts/:id

/groups

/tags

/templates
/templates/:id

/campaigns
/campaigns/new
/campaigns/:id

/scheduled

/reports
/reports/campaigns/:id

/media

/settings
/settings/whatsapp
/settings/profile
```

---

# 65. Recommended Development Order

## Phase 1

```text
Supabase
Database
Auth
RLS
Next.js Layout
Login
Dashboard
```

## Phase 2

```text
Contacts
Groups
Tags
Conversations
Messages
```

## Phase 3

```text
Meta WhatsApp API
Send Text
Webhook
Incoming Messages
Delivery Status
Read Status
```

## Phase 4

```text
Templates
Template Sync
Template Preview
```

## Phase 5

```text
Campaign Builder
Audience Filtering
Recipient Generation
Redis
BullMQ
Worker
```

## Phase 6

```text
Scheduling
Pause
Resume
Retry
Reports
```

## Phase 7

```text
Media
Realtime Inbox
Audit Logs
Production Security
Backup
Deployment
```

---

# 66. Final Architecture

```text
                           ┌──────────────────┐
                           │     GitHub       │
                           │ Source Control   │
                           └────────┬─────────┘
                                    │
              ┌─────────────────────┴────────────────────┐
              │                                          │
              ▼                                          ▼
       ┌──────────────┐                          ┌────────────────┐
       │   Next.js    │                          │    Node.js     │
       │   Frontend   │◄──────── HTTPS ─────────►│    Backend     │
       └──────┬───────┘                          └───────┬────────┘
              │                                          │
              │                                          │
              ▼                                          ├─────────────┐
       ┌──────────────┐                                  │             │
       │ Supabase     │                                  ▼             ▼
       │ Auth         │                           ┌────────────┐ ┌──────────┐
       │ PostgreSQL   │                           │ Meta API   │ │  Redis   │
       │ Realtime     │                           │ WhatsApp   │ │ BullMQ   │
       │ Storage      │                           └─────┬──────┘ └──────────┘
       └──────────────┘                                 │
                                                        │
                                                     Webhook
                                                        │
                                                        ▼
                                                 ┌────────────┐
                                                 │  Node.js   │
                                                 │ Webhook    │
                                                 └────────────┘
```

---

# 67. Production Checklist

Before going live:

```text
[ ] Supabase project created
[ ] Database migrations executed
[ ] RLS configured
[ ] Supabase Auth configured
[ ] Frontend environment configured
[ ] Backend environment configured
[ ] Meta Developer App configured
[ ] WhatsApp Business Account configured
[ ] Phone Number ID configured
[ ] WABA ID configured
[ ] Access Token configured
[ ] App Secret configured
[ ] Verify Token configured
[ ] HTTPS enabled
[ ] Webhook verified
[ ] Incoming message tested
[ ] Outgoing message tested
[ ] Delivery status tested
[ ] Read status tested
[ ] Template sync tested
[ ] Campaign tested with small audience
[ ] Redis configured
[ ] Worker configured
[ ] Logs configured
[ ] Database backup configured
[ ] GitHub secrets checked
[ ] No secrets committed to Git
```

---

# 68. Important Note

The exact Meta WhatsApp Cloud API endpoints, permissions, webhook fields, template rules, and Graph API version can change over time.

Before production deployment, always verify the current official Meta documentation and use the currently supported Graph API version.

---

# 69. Goal

The final application should provide a private dashboard where you can:

```text
Login
  ↓
Dashboard
  ↓
Manage Contacts
  ↓
Manage Groups / Tags
  ↓
View WhatsApp Inbox
  ↓
Reply to Messages
  ↓
Sync WhatsApp Templates
  ↓
Create Campaign
  ↓
Select Audience
  ↓
Preview Template
  ↓
Send Now / Schedule
  ↓
Queue Messages
  ↓
Meta WhatsApp Cloud API
  ↓
Receive Webhooks
  ↓
Update Delivery / Read Status
  ↓
View Reports
```

This architecture keeps the application modular, secure, maintainable, and ready to move from local development to production.
