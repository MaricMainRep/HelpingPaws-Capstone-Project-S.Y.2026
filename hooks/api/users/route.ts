import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logActivity } from '@/lib/utils';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const updateUserSchema = z.object({
  name: z.string().optional(),
  is_active: z.boolean().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value;
    const userRole = request.cookies.get('user_role')?.value;

    if (!userId || userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const role = request.nextUrl.searchParams.get('role');

    let query = supabase.from('users').select('id, email, name, role, is_active, created_at');

    if (role) {
      query = query.eq('role', role);
    }

    const { data: users, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ users }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value;
    const userRole = request.cookies.get('user_role')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, currentPassword, newPassword, ...updates } = body;
    
    const isOwnProfile = parseInt(userId) === id;
    const isAdmin = userRole === 'ADMIN';

    if (!isOwnProfile && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (currentPassword && newPassword) {
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('password_hash')
        .eq('id', id)
        .single();

      if (fetchError || !existingUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const isValidPassword = await bcrypt.compare(currentPassword, existingUser.password_hash);
      if (!isValidPassword) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      const { data: user, error } = await supabase
        .from('users')
        .update({
          password_hash: hashedPassword,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      await logActivity(supabase, parseInt(userId), 'Changed password', 'user', id);

      return NextResponse.json({ user, message: 'Password changed successfully' }, { status: 200 });
    }

    const validation = updateUserSchema.safeParse(updates);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { data: user, error } = await supabase
      .from('users')
      .update({
        ...validation.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    const action = validation.data.is_active === false 
      ? 'Deactivated user' 
      : 'Updated user profile';
    await logActivity(supabase, parseInt(userId), action, 'user', id);

    return NextResponse.json({ user }, { status: 200 });
  } catch (err) {
    console.error('Update user error:', err);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
