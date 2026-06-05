import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { SupabaseClient } from '@supabase/supabase-js'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function logActivity(
  supabase: SupabaseClient<any>,
  userId: number,
  action: string,
  entityType?: string,
  entityId?: number
) {
  try {
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

export async function createNotification(
  supabase: SupabaseClient<any>,
  userId: number,
  message: string,
  type: string = 'INFO'
) {
  try {
    await supabase.from('notifications').insert({
      user_id: userId,
      message,
      type,
      is_read: false,
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}
