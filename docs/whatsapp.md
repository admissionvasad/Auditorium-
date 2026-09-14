# WhatsApp Integration Notes

## Recommended approach

- Prefer Meta Cloud API or Twilio WhatsApp.
- Keep access tokens on the backend only.
- Never expose tokens or secrets to the browser.
- Validate webhook signatures before processing incoming messages.

## Operational requirements

- Business verification required before production use.
- Sender number and messaging template approval must be configured in the provider account.
- Maintain a clear mapping between organization sender and provider sender.
