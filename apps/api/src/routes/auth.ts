import { Router } from 'express';
import { z } from 'zod';
import { failure, success } from '../utils/response.js';
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post('/login', (req, res) => {
  try {
    const payload = loginSchema.parse(req.body);

    if (env.supabaseUrl && env.supabaseAnonKey) {
      const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey);
      return supabase.auth.signInWithPassword({ email: payload.email, password: payload.password })
        .then(({ data, error }) => {
          if (error || !data.session || !data.user) {
            return res.status(401).json(failure('INVALID_CREDENTIALS', error?.message || 'Email or password is incorrect.'));
          }

          return res.json(success({
            token: data.session.access_token,
            refreshToken: data.session.refresh_token,
            user: { id: data.user.id, fullName: String(data.user.user_metadata?.full_name ?? data.user.email ?? ''), email: data.user.email, role: 'ADMIN' },
          }));
        })
        .catch(() => res.status(401).json(failure('INVALID_CREDENTIALS', 'Email or password is incorrect.')));
    }

    if (env.nodeEnv !== 'production' && payload.email.toLowerCase() === 'admin@svit.edu' && payload.password === 'admin123') {
      return res.json(success({
        token: 'mock-admin-token',
        user: {
          id: 'user_1',
          fullName: 'SVIT Admin',
          email: payload.email,
          role: 'ADMIN',
        },
      }));
    }

    return res.status(401).json(failure('INVALID_CREDENTIALS', 'Email or password is incorrect.'));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid login payload';
    return res.status(400).json(failure('INVALID_LOGIN', message));
  }
});

router.get('/me', async (req, res) => {
  if (env.supabaseUrl && env.supabaseServiceRoleKey) {
    const authorization = req.header('authorization');
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
    if (!token) return res.status(401).json(failure('UNAUTHORIZED', 'Authentication is required.'));
    const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey);
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return res.status(401).json(failure('UNAUTHORIZED', 'Invalid or expired token.'));
    return res.json(success({ id: data.user.id, fullName: String(data.user.user_metadata?.full_name ?? data.user.email ?? ''), email: data.user.email, role: 'ADMIN' }));
  }

  if (env.nodeEnv === 'production' && req.header('authorization') !== 'Bearer mock-admin-token') {
    return res.status(401).json(failure('UNAUTHORIZED', 'Authentication is required.'));
  }

  return res.json(success({
    id: 'user_1',
    fullName: 'SVIT Admin',
    email: 'admin@svit.edu',
    role: 'ADMIN',
  }));
});

export default router;
