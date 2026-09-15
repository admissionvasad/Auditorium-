import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import { normalizePhone } from '../utils/normalize.js';

export interface ContactInput {
  fullName?: string;
  mobile: string;
  whatsapp?: string;
  email?: string;
  department?: string;
  course?: string;
  semester?: string;
  batch?: string;
  group?: string;
}

export interface Contact {
  id: string;
  fullName: string;
  mobile: string;
  whatsapp: string;
  email: string;
  department: string;
  course: string;
  semester: string;
  batch: string;
  group: string;
  active: boolean;
}

export class ContactService {
  private readonly supabase: SupabaseClient | null;
  private readonly memoryContacts: Contact[] = [
    {
      id: 'contact_1',
      fullName: 'Rahul Patel',
      mobile: '+919876543210',
      whatsapp: '+919876543210',
      email: '',
      department: 'Computer Science',
      course: 'B.Tech',
      semester: 'Sem 7',
      batch: '',
      group: 'Students',
      active: true,
    },
  ];

  constructor() {
    this.supabase = env.supabaseUrl && env.supabaseServiceRoleKey
      ? createClient(env.supabaseUrl, env.supabaseServiceRoleKey)
      : null;
  }

  async listContacts(): Promise<Contact[]> {
    if (!this.supabase || !env.supabaseOrganizationId) {
      return this.memoryContacts;
    }

    const { data, error } = await this.supabase
      .from('contacts')
      .select('*')
      .eq('organization_id', env.supabaseOrganizationId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Unable to load contacts: ${error.message}`);
    }

    return (data ?? []).map((contact) => this.toContact(contact));
  }

  async createContact(input: ContactInput): Promise<Contact> {
    const mobile = normalizePhone(input.mobile);
    const whatsapp = input.whatsapp ? normalizePhone(input.whatsapp) : mobile;
    const contact = {
      fullName: input.fullName || mobile,
      mobile,
      whatsapp,
      email: input.email ?? '',
      department: input.department ?? '',
      course: input.course ?? '',
      semester: input.semester ?? '',
      batch: input.batch ?? '',
      group: input.group ?? '',
      active: true,
    };

    if (this.supabase && env.supabaseOrganizationId) {
      const { data, error } = await this.supabase
        .from('contacts')
        .insert({
          organization_id: env.supabaseOrganizationId,
          full_name: contact.fullName,
          mobile_e164: contact.mobile,
          whatsapp_e164: contact.whatsapp,
          email: contact.email || null,
          department: contact.department || null,
          course: contact.course || null,
          semester: contact.semester || null,
          batch: contact.batch || null,
          category: contact.group || null,
          active: contact.active,
        })
        .select('*')
        .single();

      if (error) {
        throw new Error(`Unable to create contact: ${error.message}`);
      }

      return this.toContact(data);
    }

    const created = {
      id: `contact_${Date.now()}`,
      ...contact,
    };

    this.memoryContacts.unshift(created);
    return created;
  }

  async updateContact(id: string, input: Partial<ContactInput> & { active?: boolean }): Promise<Contact> {
    if (this.supabase && env.supabaseOrganizationId) {
      const updates: Record<string, unknown> = {};
      if (input.fullName !== undefined) updates.full_name = input.fullName;
      if (input.mobile !== undefined) updates.mobile_e164 = normalizePhone(input.mobile);
      if (input.whatsapp !== undefined) updates.whatsapp_e164 = input.whatsapp ? normalizePhone(input.whatsapp) : null;
      if (input.email !== undefined) updates.email = input.email || null;
      if (input.department !== undefined) updates.department = input.department || null;
      if (input.course !== undefined) updates.course = input.course || null;
      if (input.semester !== undefined) updates.semester = input.semester || null;
      if (input.batch !== undefined) updates.batch = input.batch || null;
      if (input.group !== undefined) updates.category = input.group || null;
      if (input.active !== undefined) updates.active = input.active;

      const { data, error } = await this.supabase
        .from('contacts')
        .update(updates)
        .eq('id', id)
        .eq('organization_id', env.supabaseOrganizationId)
        .select('*')
        .single();

      if (error) throw new Error(`Unable to update contact: ${error.message}`);
      return this.toContact(data);
    }

    const contact = this.memoryContacts.find((item) => item.id === id);
    if (!contact) throw new Error('Contact not found');
    Object.assign(contact, {
      ...input,
      ...(input.mobile !== undefined ? { mobile: normalizePhone(input.mobile) } : {}),
      ...(input.whatsapp !== undefined ? { whatsapp: input.whatsapp ? normalizePhone(input.whatsapp) : contact.mobile } : {}),
    });
    return contact;
  }

  private toContact(contact: Record<string, unknown>): Contact {
    return {
      id: String(contact.id),
      fullName: String(contact.full_name ?? ''),
      mobile: String(contact.mobile_e164 ?? ''),
      whatsapp: String(contact.whatsapp_e164 ?? contact.mobile_e164 ?? ''),
      email: String(contact.email ?? ''),
      department: String(contact.department ?? ''),
      course: String(contact.course ?? ''),
      semester: String(contact.semester ?? ''),
      batch: String(contact.batch ?? ''),
      group: String(contact.category ?? ''),
      active: Boolean(contact.active),
    };
  }
}
