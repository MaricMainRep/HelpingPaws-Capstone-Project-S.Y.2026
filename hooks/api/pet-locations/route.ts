import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logActivity } from '@/lib/utils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value;
    const userRole = request.cookies.get('user_role')?.value;

    let query = supabase
      .from('pet_locations')
      .select('*, pets(*), rooms(name)')
      .order('updated_at', { ascending: false });

    if (userRole === 'PET_OWNER' && userId) {
      const { data: ownerProfile } = await supabase
        .from('pet_owners')
        .select('id')
        .eq('user_id', parseInt(userId))
        .single();

      if (ownerProfile) {
        const { data: petIds } = await supabase
          .from('pets')
          .select('id')
          .eq('owner_id', ownerProfile.id);

        if (petIds && petIds.length > 0) {
          query = query.in('pet_id', petIds.map(p => p.id));
        } else {
          return NextResponse.json({ locations: [] });
        }
      }
    }

    const { data: locations, error } = await query;

    if (error) {
      if (error.message.includes('relationship') || error.code === 'PGRST200') {
        const { data: locations, error: locError } = await query.select('*, pets(*)');
        
        if (locError) throw locError;
        return NextResponse.json({ locations: locations || [] });
      }
      throw error;
    }

    return NextResponse.json({ locations: locations || [] });
  } catch (error) {
    console.error('Error fetching pet locations:', error);
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { pet_id, room_id, status, notes } = body;

    if (!pet_id || !room_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('pet_locations')
      .upsert({ pet_id, room_id, status: status || 'CHECKED_IN', notes })
      .select()
      .single();

    if (error) throw error;

    await logActivity(supabase, parseInt(userId), `Updated pet location to ${status || 'CHECKED_IN'}`, 'pet_location', data.id);

    return NextResponse.json({ location: data });
  } catch (error) {
    console.error('Error saving location:', error);
    return NextResponse.json({ error: 'Failed to save location' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, pet_id, room_id, status, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing location ID' }, { status: 400 });
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    if (pet_id) updateData.pet_id = pet_id;
    if (room_id !== undefined) updateData.room_id = room_id;
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const { data, error } = await supabase
      .from('pet_locations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logActivity(supabase, parseInt(userId), `Updated pet location to ${status || 'location'}`, 'pet_location', id);

    return NextResponse.json({ location: data });
  } catch (error) {
    console.error('Error updating location:', error);
    return NextResponse.json({ error: 'Failed to update location' }, { status: 500 });
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
      return NextResponse.json({ error: 'Missing location ID' }, { status: 400 });
    }

    const { error } = await supabase
      .from('pet_locations')
      .delete()
      .eq('id', parseInt(id));

    if (error) throw error;

    await logActivity(supabase, parseInt(userId), 'Deleted pet location', 'pet_location', parseInt(id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting location:', error);
    return NextResponse.json({ error: 'Failed to delete location' }, { status: 500 });
  }
}
