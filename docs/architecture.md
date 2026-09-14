# Architecture Overview

The system is structured as a production-oriented monorepo with a Next.js frontend and an Express API. The frontend communicates with the API over REST; the API validates payloads and delegates to provider adapters that abstract WhatsApp and SMS sending logic.

## Key principles

- API-first architecture
- Organization-aware data access
- Provider abstraction
- Message records before send
- Queue and worker pattern for bulk traffic
- Status updates through provider webhooks
- DLT-compliant SMS design for India

## Major flow

1. User logs in through the admin interface.
2. Dashboard queries aggregated metrics from the API.
3. Messaging request is validated and queued.
4. Worker processes queued jobs and calls the correct provider.
5. Provider response is recorded.
6. Webhook updates mark messages as delivered or failed.
