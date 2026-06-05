import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logActivity, createNotification } from '@/lib/utils';
import { z } from 'zod';

const createAppointmentSchema = z.object({
  pet_id: z.number(),
  staff_id: z.number().optional(),
  appointment_date: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  notes: z.string().optional(),
});

const updateAppointmentSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'REJECTED', 'COMPLETED', 'CANCELLED']),
  staff_id: z.number().optional(),
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
      .from('appointments')
      .select('*, pets(name, species), staff(*, users(name))', { count: 'exact' });

    // Filter by role
    if (user?.role === 'PET_OWNER') {
      const { data: ownerProfile } = await supabase
        .from('pet_owners')
        .select('id')
        .eq('user_id', parseInt(userId))
        .single();

      if (ownerProfile) {
        query = query.eq('owner_id', ownerProfile.id);
      }
    } else if (user?.role === 'STAFF') {
      const { data: staffProfile } = await supabase
        .from('staff')
        .select('id')
        .eq('user_id', parseInt(userId))
        .single();

      if (staffProfile) {
        query = query.or(`staff_id.eq.${staffProfile.id},staff_id.is.null`);
      }
    }

    const { data: appointments, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ appointments }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
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

    const body = await request.json();
    const validation = createAppointmentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    // Get pet owner profile
    const { data: ownerProfile } = await supabase
      .from('pet_owners')
      .select('id')
      .eq('user_id', parseInt(userId))
      .single();

    if (!ownerProfile) {
      return NextResponse.json(
        { error: 'Owner profile not found' },
        { status: 404 }
      );
    }

    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert([
        {
          owner_id: ownerProfile.id,
          status: 'PENDING',
          ...validation.data,
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

    await logActivity(supabase, parseInt(userId), 'Booked appointment', 'appointment', appointment.id);

    // Notify staff about new appointment
    const { data: staff } = await supabase
      .from('staff')
      .select('user_id')
      .limit(1)
      .single();
    
    if (staff) {
      await createNotification(
        supabase,
        staff.user_id,
        `New appointment booked for ${appointment.appointment_date} at ${appointment.start_time}`,
        'APPOINTMENT'
      );
    }

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Appointment ID is required' }, { status: 400 });
    }

    const { data: appointment, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const action = updateData.status 
      ? `Updated appointment status to ${updateData.status}`
      : 'Updated appointment';
    await logActivity(supabase, parseInt(userId), action, 'appointment', id);

    // Notify owner about status change
    if (updateData.status && appointment) {
      await createNotification(
        supabase,
        appointment.owner_id,
        `Your appointment has been ${updateData.status.toLowerCase()}`,
        'APPOINTMENT'
      );
    }

    return NextResponse.json({ appointment });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 });
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
      return NextResponse.json({ error: 'Appointment ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', parseInt(id));

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logActivity(supabase, parseInt(userId), 'Cancelled appointment', 'appointment', parseInt(id));

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete appointment' }, { status: 500 });
  }
}
