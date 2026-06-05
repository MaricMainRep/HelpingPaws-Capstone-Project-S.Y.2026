import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    const { data: staff, error } = await supabase
      .from('staff')
      .select(`
        *,
        users:user_id (name, email),
        staff_availability (*)
      `)
      .eq('is_available', true);

    if (error) throw error;

    return NextResponse.json({ staff: staff || [] });
  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
  }
}
