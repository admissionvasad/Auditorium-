# API Reference

## Base URL

- http://localhost:4000/api/v1

## Health

GET /health

## Messaging

POST /messages/send

Example body:

```json
{
  "channel": "WHATSAPP",
  "to": "+919876543210",
  "template": "Admission accepted for {{name}}",
  "variables": {
    "name": "Rahul"
  }
}
```

POST /messages/send-both

## Dashboard

GET /dashboard
