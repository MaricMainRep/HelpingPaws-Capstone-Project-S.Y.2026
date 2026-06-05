import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logActivity } from '@/lib/utils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    const { data: rooms, error } = await supabase
      .from('rooms')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ rooms: rooms || [] });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'Room name is required' }, { status: 400 });
    }

    const { data: room, error } = await supabase
      .from('rooms')
      .insert({ name, description })
      .select()
      .single();

    if (error) throw error;

    await logActivity(supabase, parseInt(userId), 'Created room', 'room', room.id);

    return NextResponse.json({ room }, { status: 201 });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id') || '');
    const { name, description } = body;

    if (!id) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }

    if (!name) {
      return NextResponse.json({ error: 'Room name is required' }, { status: 400 });
    }

    const { data: room, error } = await supabase
      .from('rooms')
      .update({ name, description })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logActivity(supabase, parseInt(userId), 'Updated room', 'room', id);

    return NextResponse.json({ room });
  } catch (error) {
    console.error('Error updating room:', error);
    return NextResponse.json({ error: 'Failed to update room' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id') || '');

    if (!id) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await logActivity(supabase, parseInt(userId), 'Deleted room', 'room', id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting room:', error);
    return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 });
  }
}
