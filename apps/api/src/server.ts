import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import router from './routes/index.js';
import authRouter from './routes/auth.js';
import contactsRouter from './routes/contacts.js';
import groupsRouter from './routes/groups.js';
import templatesRouter from './routes/templates.js';
import campaignsRouter from './routes/campaigns.js';
import reportsRouter from './routes/reports.js';
import settingsRouter from './routes/settings.js';
import { env } from './config/env.js';
import { requireAuth } from './middleware/auth.js';
import webhookRouter from './routes/webhook.js';
import inboxRouter from './routes/inbox.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.get('/', (_req, res) => {
  res.json({ service: 'auditorium-notify-api', status: 'ok', health: `${env.apiBase}/health` });
});
app.use(env.apiBase, router);
app.use(`${env.apiBase}/auth`, authRouter);
app.use(`${env.apiBase}/webhooks`, webhookRouter);
app.use(`${env.apiBase}/inbox`, requireAuth, inboxRouter);
app.use(`${env.apiBase}/contacts`, requireAuth, contactsRouter);
app.use(`${env.apiBase}/groups`, requireAuth, groupsRouter);
app.use(`${env.apiBase}/templates`, requireAuth, templatesRouter);
app.use(`${env.apiBase}/campaigns`, requireAuth, campaignsRouter);
app.use(`${env.apiBase}/reports`, requireAuth, reportsRouter);
app.use(`${env.apiBase}/settings`, requireAuth, settingsRouter);

app.listen(env.port, () => {
  console.log(`API server listening on http://localhost:${env.port}`);
});
