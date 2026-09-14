import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

export interface TemplateInput {
  name: string;
  channel: 'WHATSAPP' | 'SMS';
  body: string;
  variables: string[];
}

export interface Template extends TemplateInput {
  id: string;
  approvalStatus: string;
}

export class TemplateService {
  private readonly supabase: SupabaseClient | null;
  private readonly memoryTemplates: Template[] = [
    {
      id: 'tpl_1',
      name: 'Admission Confirmation',
      channel: 'WHATSAPP',
      body: 'Dear {{name}}, your admission is confirmed.',
      variables: ['name'],
      approvalStatus: 'APPROVED',
    },
  ];

  constructor() {
    this.supabase = env.supabaseUrl && env.supabaseServiceRoleKey
      ? createClient(env.supabaseUrl, env.supabaseServiceRoleKey)
      : null;
  }

  async listTemplates(): Promise<Template[]> {
    if (!this.supabase || !env.supabaseOrganizationId) {
      return this.memoryTemplates;
    }

    const { data, error } = await this.supabase
      .from('message_templates')
      .select('*')
      .eq('organization_id', env.supabaseOrganizationId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Unable to load templates: ${error.message}`);
    }

    return (data ?? []).map((template) => this.toTemplate(template));
  }

  async createTemplate(input: TemplateInput): Promise<Template> {
    if (this.supabase && env.supabaseOrganizationId) {
      const { data, error } = await this.supabase
        .from('message_templates')
        .insert({
          organization_id: env.supabaseOrganizationId,
          name: input.name,
          channel: input.channel,
          body: input.body,
          variables: input.variables,
          approval_status: 'PENDING',
        })
        .select('*')
        .single();

      if (error) {
        throw new Error(`Unable to create template: ${error.message}`);
      }

      return this.toTemplate(data);
    }

    const created: Template = {
      id: `tpl_${Date.now()}`,
      ...input,
      approvalStatus: 'PENDING',
    };
    this.memoryTemplates.unshift(created);
    return created;
  }

  private toTemplate(template: Record<string, unknown>): Template {
    return {
      id: String(template.id),
      name: String(template.name ?? ''),
      channel: template.channel === 'SMS' ? 'SMS' : 'WHATSAPP',
      body: String(template.body ?? ''),
      variables: Array.isArray(template.variables)
        ? template.variables.map(String)
        : [],
      approvalStatus: String(template.approval_status ?? 'PENDING'),
    };
  }
}