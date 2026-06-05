import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const { data: logs, error } = await supabase
      .from('activity_logs')
      .select('*, users(name, email)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    return NextResponse.json({ logs: logs || [] });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, entity_type, entity_id } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    const { data: log, error } = await supabase
      .from('activity_logs')
      .insert({
        user_id: parseInt(userId),
        action,
        entity_type,
        entity_id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ log });
  } catch (error) {
    console.error('Error creating activity log:', error);
    return NextResponse.json({ error: 'Failed to create activity log' }, { status: 500 });
  }
}
