import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface StatusAcc {
  [key: string]: number;
}

interface TrendAcc {
  [key: string]: { date: string; total: number; completed: number; pending: number };
}

interface SpeciesAcc {
  [key: string]: number;
}

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

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const format = searchParams.get('format');

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        gte: startDate,
        lte: endDate,
      };
    }

    const [
      totalPets,
      totalAppointments,
      todayAppointments,
      activeStaff,
      petsMonitoring,
      appointmentsByStatus,
      appointmentsTrend,
      petsBySpecies,
      staffPerformance,
      roomsUtilization,
    ] = await Promise.all([
      supabase.from('pets').select('id', { count: 'exact', head: true }),
      supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .gte('appointment_date', startDate || '2000-01-01')
        .lte('appointment_date', endDate || '2100-12-31'),
      supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('appointment_date', new Date().toISOString().split('T')[0]),
      supabase
        .from('staff')
        .select('id', { count: 'exact', head: true })
        .eq('is_available', true),
      supabase
        .from('pet_locations')
        .select('id', { count: 'exact', head: true })
        .neq('status', 'DISCHARGED'),
      supabase
        .from('appointments')
        .select('status')
        .gte('appointment_date', startDate || '2000-01-01')
        .lte('appointment_date', endDate || '2100-12-31'),
      getAppointmentsTrend(supabase, startDate, endDate),
      getPetsBySpecies(supabase),
      getStaffPerformance(supabase, startDate, endDate),
      getRoomsUtilization(supabase),
    ]);

    const statusCounts = (appointmentsByStatus.data || []).reduce(
      (acc: StatusAcc, apt: { status: string }) => {
        acc[apt.status] = (acc[apt.status] || 0) + 1;
        return acc;
      },
      {} as StatusAcc
    );

    const analyticsData = {
      overview: {
        totalPets: totalPets.count || 0,
        totalAppointments: totalAppointments.count || 0,
        todayAppointments: todayAppointments.count || 0,
        activeStaff: activeStaff.count || 0,
        petsMonitoring: petsMonitoring.count || 0,
      },
      charts: {
        appointmentsByStatus: Object.entries(statusCounts).map(
          ([status, count]) => ({ status, count })
        ),
        appointmentsTrend: appointmentsTrend || [],
        petsBySpecies: petsBySpecies || [],
        staffPerformance: staffPerformance || [],
        roomsUtilization: roomsUtilization || [],
      },
      dateRange: {
        startDate: startDate || 'All Time',
        endDate: endDate || 'All Time',
      },
    };

    if (format === 'csv') {
      return exportCSV(analyticsData);
    }

    return NextResponse.json(analyticsData, { status: 200 });
  } catch (err) {
    console.error('Analytics error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

function exportCSV(data: any) {
  const lines: string[] = [];
  
  lines.push('HelpingPaws Analytics Report');
  lines.push(`Date Range: ${data.dateRange.startDate} to ${data.dateRange.endDate}`);
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  
  lines.push('OVERVIEW');
  lines.push('Metric,Value');
  lines.push(`Total Pets,${data.overview.totalPets}`);
  lines.push(`Total Appointments,${data.overview.totalAppointments}`);
  lines.push(`Today's Appointments,${data.overview.todayAppointments}`);
  lines.push(`Active Staff,${data.overview.activeStaff}`);
  lines.push(`Pets Under Monitoring,${data.overview.petsMonitoring}`);
  lines.push('');
  
  lines.push('APPOINTMENTS BY STATUS');
  lines.push('Status,Count');
  data.charts.appointmentsByStatus.forEach((item: { status: string; count: number }) => {
    lines.push(`${item.status},${item.count}`);
  });
  lines.push('');
  
  lines.push('APPOINTMENTS TREND');
  lines.push('Date,Total,Completed,Pending');
  data.charts.appointmentsTrend.forEach((item: { date: string; total: number; completed: number; pending: number }) => {
    lines.push(`${item.date},${item.total},${item.completed},${item.pending}`);
  });
  lines.push('');
  
  lines.push('PETS BY SPECIES');
  lines.push('Species,Count');
  data.charts.petsBySpecies.forEach((item: { species: string; count: number }) => {
    lines.push(`${item.species},${item.count}`);
  });
  lines.push('');
  
  lines.push('STAFF PERFORMANCE');
  lines.push('Name,Specialty,Total Appointments,Completed Appointments');
  data.charts.staffPerformance.forEach((item: { name: string; specialty: string; totalAppointments: number; completedAppointments: number }) => {
    lines.push(`${item.name},${item.specialty},${item.totalAppointments},${item.completedAppointments}`);
  });
  lines.push('');
  
  lines.push('ROOM UTILIZATION');
  lines.push('Room,Active Pets');
  data.charts.roomsUtilization.forEach((item: { name: string; activePets: number }) => {
    lines.push(`${item.name},${item.activePets}`);
  });

  const csvContent = lines.join('\n');
  
  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="analytics-report-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}

async function getAppointmentsTrend(
  supabase: any,
  startDate?: string | null,
  endDate?: string | null
) {
  const { data, error } = await supabase
    .from('appointments')
    .select('appointment_date, status')
    .gte('appointment_date', startDate || '2000-01-01')
    .lte('appointment_date', endDate || '2100-12-31')
    .order('appointment_date');

  if (error || !data) return [];

  const trendMap = data.reduce((acc: TrendAcc, apt: { appointment_date: string; status: string }) => {
    const date = apt.appointment_date;
    if (!acc[date]) {
      acc[date] = { date, total: 0, completed: 0, pending: 0 };
    }
    acc[date].total++;
    if (apt.status === 'COMPLETED') acc[date].completed++;
    if (apt.status === 'PENDING') acc[date].pending++;
    return acc;
  }, {} as TrendAcc);

  return Object.values(trendMap).slice(-30);
}

async function getPetsBySpecies(supabase: any) {
  const { data, error } = await supabase
    .from('pets')
    .select('species')
    .order('species');

  if (error || !data) return [];

  const speciesCounts = data.reduce((acc: SpeciesAcc, pet: { species: string }) => {
    acc[pet.species] = (acc[pet.species] || 0) + 1;
    return acc;
  }, {} as SpeciesAcc);

  return Object.entries(speciesCounts).map(([species, count]) => ({
    species,
    count,
  }));
}

async function getStaffPerformance(
  supabase: any,
  startDate?: string | null,
  endDate?: string | null
) {
  const { data, error } = await supabase
    .from('staff')
    .select('id, specialty, users(name)')
    .order('id');

  if (error || !data) return [];

  const staffWithCounts = await Promise.all(
    data.map(async (staff: any) => {
      const { count } = await supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('staff_id', staff.id)
        .gte('appointment_date', startDate || '2000-01-01')
        .lte('appointment_date', endDate || '2100-12-31');

      const { count: completed } = await supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('staff_id', staff.id)
        .eq('status', 'COMPLETED')
        .gte('appointment_date', startDate || '2000-01-01')
        .lte('appointment_date', endDate || '2100-12-31');

      return {
        staffId: staff.id,
        name: staff.users?.name || 'Unknown',
        specialty: staff.specialty || 'General',
        totalAppointments: count || 0,
        completedAppointments: completed || 0,
      };
    })
  );

  return staffWithCounts;
}

async function getRoomsUtilization(supabase: any) {
  const { data, error } = await supabase
    .from('rooms')
    .select('id, name')
    .order('name');

  if (error || !data) return [];

  const roomsWithPets = await Promise.all(
    data.map(async (room: any) => {
      const { count } = await supabase
        .from('pet_locations')
        .select('id', { count: 'exact', head: true })
        .eq('room_id', room.id)
        .neq('status', 'DISCHARGED');

      return {
        roomId: room.id,
        name: room.name,
        activePets: count || 0,
      };
    })
  );

  return roomsWithPets;
}
