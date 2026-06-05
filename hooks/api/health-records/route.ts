import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logActivity } from '@/lib/utils';
import { z } from 'zod';

const createHealthRecordSchema = z.object({
  pet_id: z.number(),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
});

const createPrescriptionSchema = z.object({
  health_record_id: z.number(),
  pet_id: z.number(),
  medication_name: z.string().min(1, 'Medication name is required'),
  dosage: z.string().optional(),
  duration: z.string().optional(),
  notes: z.string().optional(),
});

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
      .from('health_records')
      .select('*, pets(name, species), staff(*, users(name))');

    // If PET_OWNER, only show their pets' health records
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
          return NextResponse.json({ records: [] });
        }
      }
    }

    const { data: records, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ records }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to fetch health records' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    // Only staff and admin can create health records
    if (user?.role === 'PET_OWNER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Check if it's a prescription or health record
    if (body.health_record_id) {
      // Create prescription
      const validation = createPrescriptionSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: validation.error.issues[0].message },
          { status: 400 }
        );
      }

      const { data: prescription, error } = await supabase
        .from('prescriptions')
        .insert([validation.data])
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }

      await logActivity(supabase, parseInt(userId), 'Created prescription', 'prescription', prescription.id);

      return NextResponse.json({ prescription }, { status: 201 });
    } else {
      // Create health record
      const validation = createHealthRecordSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: validation.error.issues[0].message },
          { status: 400 }
        );
      }

      // Get staff profile
      const { data: staffProfile } = await supabase
        .from('staff')
        .select('id')
        .eq('user_id', parseInt(userId))
        .single();

      const { data: record, error } = await supabase
        .from('health_records')
        .insert([
          {
            ...validation.data,
            recorded_by_staff_id: staffProfile?.id,
          },
        ])
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }

      await logActivity(supabase, parseInt(userId), 'Created health record', 'health_record', record.id);

      return NextResponse.json({ record }, { status: 201 });
    }
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to create health record' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    if (user?.role === 'PET_OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { id, diagnosis, treatment } = body;

    if (!id) {
      return NextResponse.json({ error: 'Record ID required' }, { status: 400 });
    }

    const updateData: any = {};
    if (diagnosis !== undefined) updateData.diagnosis = diagnosis;
    if (treatment !== undefined) updateData.treatment = treatment;

    const { data: record, error } = await supabase
      .from('health_records')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logActivity(supabase, parseInt(userId), 'Updated health record', 'health_record', id);

    return NextResponse.json({ record }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update health record' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
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

    if (user?.role === 'PET_OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Record ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('health_records')
      .update({ is_active: false })
      .eq('id', parseInt(id));

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logActivity(supabase, parseInt(userId), 'Archived health record', 'health_record', parseInt(id));

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to archive health record' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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

    if (user?.role === 'PET_OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Record ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('health_records')
      .update({ is_active: false })
      .eq('id', parseInt(id));

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logActivity(supabase, parseInt(userId), 'Archived health record', 'health_record', parseInt(id));

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to archive health record' }, { status: 500 });
  }
}