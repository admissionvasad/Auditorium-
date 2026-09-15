import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

export interface GroupInput {
  name: string;
  description?: string;
}

export interface Group extends GroupInput {
  id: string;
  memberCount: number;
}

export class GroupService {
  private readonly supabase: SupabaseClient | null;
  private readonly memoryGroups: Group[] = [
    { id: 'group_1', name: 'First Year Students', description: 'FY students', memberCount: 0 },
    { id: 'group_2', name: 'Faculty', description: 'Teaching staff', memberCount: 0 },
  ];

  constructor() {
    this.supabase = env.supabaseUrl && env.supabaseServiceRoleKey
      ? createClient(env.supabaseUrl, env.supabaseServiceRoleKey)
      : null;
  }

  async listGroups(): Promise<Group[]> {
    if (!this.supabase || !env.supabaseOrganizationId) {
      return this.memoryGroups;
    }

    const [groupsResult, countsResult] = await Promise.all([
      this.supabase
        .from('contact_groups')
        .select('id, name, description')
        .or(`organization_id.eq.${env.supabaseOrganizationId},organization_id.is.null`)
        .order('created_at', { ascending: false }),
      this.supabase
        .from('group_members')
        .select('group_id', { count: 'exact', head: true }),
    ]);

    if (groupsResult.error) {
      throw new Error(`Unable to load groups: ${groupsResult.error.message}`);
    }

    const groupCounts = await this.countMembers();

    return (groupsResult.data ?? []).map((group) => ({
      id: String(group.id),
      name: String(group.name ?? ''),
      description: String(group.description ?? ''),
      memberCount: groupCounts.get(String(group.id)) ?? 0,
    }));
  }

  private async countMembers(): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    if (!this.supabase) return counts;
    const { data, error } = await this.supabase
      .from('group_members')
      .select('group_id');
    if (error) return counts;
    for (const row of data ?? []) {
      const groupId = String(row.group_id);
      counts.set(groupId, (counts.get(groupId) ?? 0) + 1);
    }
    return counts;
  }

  async createGroup(input: GroupInput): Promise<Group> {
    if (this.supabase && env.supabaseOrganizationId) {
      const { data, error } = await this.supabase
        .from('contact_groups')
        .insert({
          organization_id: env.supabaseOrganizationId,
          name: input.name,
          description: input.description ?? null,
          active: true,
        })
        .select('*')
        .single();

      if (error) {
        throw new Error(`Unable to create group: ${error.message}`);
      }

      return {
        id: String(data.id),
        name: String(data.name ?? ''),
        description: String(data.description ?? ''),
        memberCount: 0,
      };
    }

    const created: Group = {
      id: `group_${Date.now()}`,
      ...input,
      memberCount: 0,
    };
    this.memoryGroups.unshift(created);
    return created;
  }

  async updateGroup(id: string, input: Partial<GroupInput>): Promise<Group> {
    if (this.supabase) {
      const updates: Record<string, unknown> = {};
      if (input.name !== undefined) updates.name = input.name;
      if (input.description !== undefined) updates.description = input.description ?? null;

      const { data, error } = await this.supabase
        .from('contact_groups')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw new Error(`Unable to update group: ${error.message}`);
      return {
        id: String(data.id),
        name: String(data.name ?? ''),
        description: String(data.description ?? ''),
        memberCount: 0,
      };
    }

    const group = this.memoryGroups.find((item) => item.id === id);
    if (!group) throw new Error('Group not found');
    Object.assign(group, input);
    return group;
  }

  async deleteGroup(id: string): Promise<void> {
    if (this.supabase) {
      const { error } = await this.supabase
        .from('contact_groups')
        .delete()
        .eq('id', id);
      if (error) throw new Error(`Unable to delete group: ${error.message}`);
      return;
    }

    const index = this.memoryGroups.findIndex((item) => item.id === id);
    if (index === -1) throw new Error('Group not found');
    this.memoryGroups.splice(index, 1);
  }

  async membersOf(id: string): Promise<string[]> {
    if (!this.supabase) return [];
    const { data, error } = await this.supabase
      .from('group_members')
      .select('contact_id')
      .eq('group_id', id);
    if (error) throw new Error(`Unable to load group members: ${error.message}`);
    return (data ?? []).map((row) => String(row.contact_id));
  }

  async setMembers(id: string, contactIds: string[]): Promise<void> {
    if (!this.supabase) return;
    await this.supabase.from('group_members').delete().eq('group_id', id);
    if (contactIds.length === 0) return;
    const { error } = await this.supabase
      .from('group_members')
      .insert(contactIds.map((contactId) => ({ group_id: id, contact_id: contactId })));
    if (error) throw new Error(`Unable to update group members: ${error.message}`);
  }
}