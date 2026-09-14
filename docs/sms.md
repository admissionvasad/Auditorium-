# SMS Integration Notes

## India DLT compliance

For Indian domestic SMS, always use a DLT-compliant template flow:

1. DLT template registration
2. Approved application template
3. Variable validation
4. Provider API call
5. Delivery status tracking

Do not allow freeform template editing that bypasses approved content.

## Provider suggestions

- Twilio
- MSG91
- Gupshup
- Exotel

Choose based on DLT support, sender ID rules, template approval flow, reliability, and pricing.
