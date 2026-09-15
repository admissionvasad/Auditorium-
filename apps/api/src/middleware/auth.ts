import type { NextFunction, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import { failure } from '../utils/response.js';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authorization = req.header('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';

  if (env.supabaseUrl && env.supabaseServiceRoleKey) {
    if (!token) return res.status(401).json(failure('UNAUTHORIZED', 'Authentication is required.'));
    const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey);
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return res.status(401).json(failure('UNAUTHORIZED', 'Invalid or expired token.'));
    res.locals.user = data.user;
    return next();
  }

  if (env.nodeEnv !== 'production' && token === 'mock-admin-token') return next();
  return res.status(401).json(failure('UNAUTHORIZED', 'Authentication is required.'));
}