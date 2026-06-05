import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logActivity } from '@/lib/utils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    const { data: cameras, error } = await supabase
      .from('cameras')
      .select('*, rooms(name)')
      .order('id');

    if (error) throw error;

    return NextResponse.json({ cameras: cameras || [] });
  } catch (error) {
    console.error('Error fetching cameras:', error);
    return NextResponse.json({ error: 'Failed to fetch cameras' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { room_id, stream_url, is_active } = body;

    if (!room_id) {
      return NextResponse.json({ error: 'Room is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('cameras')
      .insert({ room_id, stream_url, is_active: is_active ?? true })
      .select()
      .single();

    if (error) throw error;

    await logActivity(supabase, parseInt(userId), 'Registered camera', 'camera', data.id);

    return NextResponse.json({ camera: data });
  } catch (error) {
    console.error('Error creating camera:', error);
    return NextResponse.json({ error: 'Failed to create camera' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Camera ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { room_id, stream_url, is_active } = body;

    const { data, error } = await supabase
      .from('cameras')
      .update({ 
        room_id, 
        stream_url, 
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) throw error;

    await logActivity(supabase, parseInt(userId), 'Updated camera', 'camera', parseInt(id));

    return NextResponse.json({ camera: data });
  } catch (error) {
    console.error('Error updating camera:', error);
    return NextResponse.json({ error: 'Failed to update camera' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Camera ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('cameras')
      .delete()
      .eq('id', parseInt(id));

    if (error) throw error;

    await logActivity(supabase, parseInt(userId), 'Deleted camera', 'camera', parseInt(id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting camera:', error);
    return NextResponse.json({ error: 'Failed to delete camera' }, { status: 500 });
  }
}
