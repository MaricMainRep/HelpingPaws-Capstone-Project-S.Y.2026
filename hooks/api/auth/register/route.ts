import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/lib/auth';
import { logActivity } from '@/lib/utils';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['ADMIN', 'STAFF', 'PET_OWNER']),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password, name, role } = validation.data;

    const { user, error } = await registerUser(email, password, name, role);

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    // Log activity based on role
    if (role === 'STAFF') {
      await logActivity(supabase, user!.id, 'Created staff account', 'user', user!.id);
    } else if (role === 'PET_OWNER') {
      await logActivity(supabase, user!.id, 'Registered as pet owner', 'user', user!.id);
    } else if (role === 'ADMIN') {
      await logActivity(supabase, user!.id, 'Created admin account', 'user', user!.id);
    }

    // Create session (HTTP-only cookie)
    const response = NextResponse.json(
      { user, message: 'Registration successful' },
      { status: 201 }
    );

    response.cookies.set('user_id', user!.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    response.cookies.set('user_role', user!.role, {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('Registration error:', err);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
