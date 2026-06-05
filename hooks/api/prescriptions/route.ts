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

    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', parseInt(userId))
      .single();

    let query = supabase
      .from('prescriptions')
      .select('*, pets(name, species), health_records(diagnosis)')
      .order('created_at', { ascending: false });

    // If PET_OWNER, only show their pets' prescriptions
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
          return NextResponse.json({ prescriptions: [] });
        }
      }
    }

    const { data: prescriptions, error } = await query;

    if (error) throw error;

    return NextResponse.json({ prescriptions: prescriptions || [] });
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    return NextResponse.json({ error: 'Failed to fetch prescriptions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { health_record_id, pet_id, medication_name, dosage, duration, notes } = body;

    if (!health_record_id || !pet_id || !medication_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('prescriptions')
      .insert({
        health_record_id,
        pet_id,
        medication_name,
        dosage,
        duration,
        notes,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ prescription: data });
  } catch (error) {
    console.error('Error creating prescription:', error);
    return NextResponse.json({ error: 'Failed to create prescription' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, medication_name, dosage, duration, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Prescription ID required' }, { status: 400 });
    }

    const updateData: any = {};
    if (medication_name) updateData.medication_name = medication_name;
    if (dosage !== undefined) updateData.dosage = dosage;
    if (duration !== undefined) updateData.duration = duration;
    if (notes !== undefined) updateData.notes = notes;

    const { data, error } = await supabase
      .from('prescriptions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ prescription: data });
  } catch (error) {
    console.error('Error updating prescription:', error);
    return NextResponse.json({ error: 'Failed to update prescription' }, { status: 500 });
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
      return NextResponse.json({ error: 'Prescription ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('prescriptions')
      .delete()
      .eq('id', parseInt(id));

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting prescription:', error);
    return NextResponse.json({ error: 'Failed to delete prescription' }, { status: 500 });
  }
}
