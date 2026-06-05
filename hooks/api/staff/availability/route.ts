import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: staff } = await supabase
      .from('staff')
      .select('*')
      .eq('user_id', parseInt(userId))
      .single();

    if (!staff) {
      return NextResponse.json({ availability: [], staff: null });
    }

    const { data: availability } = await supabase
      .from('staff_availability')
      .select('*')
      .eq('staff_id', staff.id)
      .order('day_of_week');

    return NextResponse.json({ availability: availability || [], staff });
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: staff } = await supabase
      .from('staff')
      .select('id')
      .eq('user_id', parseInt(userId))
      .single();

    if (!staff) {
      return NextResponse.json({ error: 'Staff profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const { availability } = body;

    if (availability && Array.isArray(availability)) {
      const { error: deleteError } = await supabase
        .from('staff_availability')
        .delete()
        .eq('staff_id', staff.id);

      if (deleteError) throw deleteError;

      const validAvailability = availability
        .filter((slot: any) => slot.day_of_week !== undefined && slot.start_time && slot.end_time)
        .map((slot: any) => ({
          staff_id: staff.id,
          day_of_week: slot.day_of_week,
          start_time: slot.start_time.length === 5 ? slot.start_time + ':00' : slot.start_time,
          end_time: slot.end_time.length === 5 ? slot.end_time + ':00' : slot.end_time,
          is_available: slot.is_available !== false,
        }));

      if (validAvailability.length > 0) {
        const { error } = await supabase
          .from('staff_availability')
          .insert(validAvailability);

        if (error) throw error;
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Error saving availability:', error);
    return NextResponse.json({ error: 'Failed to save availability' }, { status: 500 });
  }
}
