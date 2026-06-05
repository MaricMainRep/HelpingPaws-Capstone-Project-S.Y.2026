import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logActivity } from '@/lib/utils';
import { z } from 'zod';

const createPetSchema = z.object({
  name: z.string().min(1, 'Pet name is required'),
  species: z.string().min(1, 'Species is required'),
  breed: z.string().optional(),
  age: z.number().optional(),
  weight: z.number().optional(),
  medical_history_notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's role
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', parseInt(userId))
      .single();

    let query = supabase.from('pets').select('*');

    // If PET_OWNER, only show their pets
    if (user?.role === 'PET_OWNER') {
      const { data: ownerProfile } = await supabase
        .from('pet_owners')
        .select('id')
        .eq('user_id', parseInt(userId))
        .single();

      if (ownerProfile) {
        query = query.eq('owner_id', ownerProfile.id);
      }
    }

    const { data: pets, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ pets }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to fetch pets' },
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
    const validation = createPetSchema.safeParse(body);

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

    const { data: pet, error } = await supabase
      .from('pets')
      .insert([
        {
          owner_id: ownerProfile.id,
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

    await logActivity(supabase, parseInt(userId), 'Created pet', 'pet', pet.id);

    return NextResponse.json({ pet }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to create pet' },
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
      return NextResponse.json({ error: 'Pet ID is required' }, { status: 400 });
    }

    const { data: pet, error } = await supabase
      .from('pets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logActivity(supabase, parseInt(userId), 'Updated pet', 'pet', id);

    return NextResponse.json({ pet });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update pet' }, { status: 500 });
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
      return NextResponse.json({ error: 'Pet ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('pets')
      .delete()
      .eq('id', parseInt(id));

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logActivity(supabase, parseInt(userId), 'Deleted pet', 'pet', parseInt(id));

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete pet' }, { status: 500 });
  }
}
