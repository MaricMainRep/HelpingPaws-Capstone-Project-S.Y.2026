import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [usersCount, petsCount, appointmentsToday, healthRecordsCount] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('pets').select('id', { count: 'exact', head: true }),
      supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .gte('appointment_date', today)
        .lt('appointment_date', today + 'T23:59:59'),
      supabase.from('health_records').select('id', { count: 'exact', head: true }),
    ]);

    return NextResponse.json({
      totalUsers: usersCount.count || 0,
      totalPets: petsCount.count || 0,
      appointmentsToday: appointmentsToday.count || 0,
      healthRecords: healthRecordsCount.count || 0,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
