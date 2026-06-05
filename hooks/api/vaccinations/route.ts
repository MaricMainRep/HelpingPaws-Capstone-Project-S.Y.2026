import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logActivity } from '@/lib/utils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', parseInt(userId))
      .single();

    let query = supabase
      .from('vaccinations')
      .select('*, pets(name, species)')
      .order('administered_date', { ascending: false });

    // If PET_OWNER, only show their pets' vaccinations
    if (user?.role === 'PET_OWNER') {
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
          return NextResponse.json({ vaccinations: [] });
        }
      }
    }

    const { data: vaccinations, error } = await query;

    if (error) throw error;

    return NextResponse.json({ vaccinations: vaccinations || [] });
  } catch (error) {
    console.error('Error fetching vaccinations:', error);
    return NextResponse.json({ error: 'Failed to fetch vaccinations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { pet_id, vaccine_name, administered_date, next_due_date, notes } = body;

    if (!pet_id || !vaccine_name || !administered_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('vaccinations')
      .insert({ pet_id, vaccine_name, administered_date, next_due_date, notes })
      .select()
      .single();

    if (error) throw error;

    await logActivity(supabase, parseInt(userId), 'Added vaccination record', 'vaccination', data.id);

    return NextResponse.json({ vaccination: data });
  } catch (error) {
    console.error('Error creating vaccination:', error);
    return NextResponse.json({ error: 'Failed to create vaccination' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, vaccine_name, administered_date, next_due_date, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Vaccination ID required' }, { status: 400 });
    }

    const updateData: any = {};
    if (vaccine_name) updateData.vaccine_name = vaccine_name;
    if (administered_date) updateData.administered_date = administered_date;
    if (next_due_date !== undefined) updateData.next_due_date = next_due_date;
    if (notes !== undefined) updateData.notes = notes;

    const { data, error } = await supabase
      .from('vaccinations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logActivity(supabase, parseInt(userId), 'Updated vaccination', 'vaccination', id);

    return NextResponse.json({ vaccination: data });
  } catch (error) {
    console.error('Error updating vaccination:', error);
    return NextResponse.json({ error: 'Failed to update vaccination' }, { status: 500 });
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
      return NextResponse.json({ error: 'Vaccination ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('vaccinations')
      .delete()
      .eq('id', parseInt(id));

    if (error) throw error;

    await logActivity(supabase, parseInt(userId), 'Deleted vaccination', 'vaccination', parseInt(id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting vaccination:', error);
    return NextResponse.json({ error: 'Failed to delete vaccination' }, { status: 500 });
  }
}
