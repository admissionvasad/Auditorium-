import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import router from './routes/index.js';
import authRouter from './routes/auth.js';
import contactsRouter from './routes/contacts.js';
import groupsRouter from './routes/groups.js';
import templatesRouter from './routes/templates.js';
import { env } from './config/env.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.get('/', (_req, res) => {
  res.json({ service: 'auditorium-notify-api', status: 'ok', health: `${env.apiBase}/health` });
});
app.use(env.apiBase, router);
app.use(`${env.apiBase}/auth`, authRouter);
app.use(`${env.apiBase}/contacts`, contactsRouter);
app.use(`${env.apiBase}/groups`, groupsRouter);
app.use(`${env.apiBase}/templates`, templatesRouter);

app.listen(env.port, () => {
  console.log(`API server listening on http://localhost:${env.port}`);
});
