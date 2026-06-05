import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value;
    const userRole = request.cookies.get('user_role')?.value;

    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    // Filter by user_id for non-admin users
    if (userRole !== 'ADMIN' && userId) {
      query = query.eq('user_id', parseInt(userId));
    }

    const { data: notifications, error } = await query;

    if (error) throw error;

    return NextResponse.json({ notifications: notifications || [] });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, message, type } = body;

    if (!user_id || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert({ user_id, type: type || 'INFO', message, is_read: false })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ notification: data });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, mark_all_read } = body;

    if (mark_all_read) {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', parseInt(userId));

      if (error) throw error;
    } else if (id) {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}
