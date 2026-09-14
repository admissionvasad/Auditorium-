# Deployment Guide

## Recommended setup

- Frontend: Vercel
- API: Render or Railway
- Database/Auth: Supabase
- Queue worker: Render or VPS

## Environment variables

Use the values from .env.example and ensure provider credentials are only set in server-side environments.

## Deployment checklist

1. Create a Supabase project and apply the SQL migration under supabase/migrations.
2. Set up Supabase Auth and RLS policies for organization access.
3. Configure WhatsApp and SMS secrets in the server runtime environment.
4. Deploy the frontend and API separately.
5. Enable HTTPS and webhook verification.
6. Add scheduled worker tasks for queued delivery jobs.
