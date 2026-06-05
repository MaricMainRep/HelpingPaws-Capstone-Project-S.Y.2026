'use client';

import { Sidebar } from '@/components/dashboard/Sidebar';
import { StatCard } from '@/components/dashboard/StatCard';
import { PreviewCard, PreviewCardItem } from '@/components/dashboard/PreviewCard';
import { useUser } from '@/lib/context/UserContext';
import { Card } from '@/components/ui/card';
import { LoadingPage } from '@/components/ui/loading';
import Link from 'next/link';
import {
  BarChart3, Users, Clock, AlertCircle, Activity, Heart,
  Calendar, PawPrint, Video, ClipboardList, Syringe,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface DashboardStats {
  totalUsers?: number;
  totalPets?: number;
  appointmentsToday?: number;
  healthRecords?: number;
  upcomingAppointments?: number;
  monitoredPets?: number;
}

interface DashboardPreview {
  recentUsers?: Array<{ id: number; name: string; email: string; role: string; is_active: boolean; created_at: string }>;
  recentPets?: Array<{ id: number; name: string; species: string; breed: string | null; owner_name: string; created_at: string }>;
  todayAppointments?: Array<{ id: number; pet_name: string; owner_name: string; start_time: string; end_time: string; status: string }>;
  recentHealthRecords?: Array<{ id: number; pet_name: string; diagnosis: string | null; created_at: string }>;
  upcomingAppointments?: Array<{ id: number; pet_name: string; appointment_date: string; start_time: string; end_time: string; status: string }>;
  monitoredPets?: Array<{ id: number; pet_name: string; species: string; room_name: string | null; status: string }>;
  myPets?: Array<{ id: number; name: string; species: string; breed: string | null; created_at: string }>;
  stats?: DashboardStats;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(timeStr: string) {
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
}

function statusBadgeClass(status: string) {
  switch (status) {
    case 'PENDING': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30';
    case 'CONFIRMED': return 'text-blue-600 bg-blue-50 dark:bg-blue-950/30';
    case 'COMPLETED': return 'text-green-600 bg-green-50 dark:bg-green-950/30';
    case 'CANCELLED':
    case 'REJECTED': return 'text-red-600 bg-red-50 dark:bg-red-950/30';
    default: return 'text-muted-foreground bg-muted';
  }
}

export default function DashboardPage() {
  const { user, loading: userLoading } = useUser();
  const [preview, setPreview] = useState<DashboardPreview | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setLoading(true);
      fetch(`${API_URL}/api/dashboard/stats/`, {
        headers: { 'X-User-ID': String(user.id), 'X-User-Role': user.role },
      })
        .then((res) => res.json())
        .then((data) => setPreview(data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (userLoading) {
    return <LoadingPage />;
  }

  if (!user) {
    return <LoadingPage text="Redirecting to login..." />;
  }

  const getTitle = () => {
    switch (user?.role) {
      case 'ADMIN': return 'Admin Dashboard';
      case 'STAFF': return 'Staff Dashboard';
      case 'PET_OWNER': return `Welcome back, ${user?.name?.split(' ')[0] || 'User'}!`;
      default: return 'Dashboard';
    }
  };

  const getDescription = () => {
    switch (user?.role) {
      case 'ADMIN': return 'Manage the entire system';
      case 'STAFF': return 'Manage appointments and health records';
      case 'PET_OWNER': return 'Manage your pets and appointments';
      default: return 'Welcome';
    }
  };

  const stats = preview?.stats;

  const renderStatCards = () => {
    switch (user?.role) {
      case 'ADMIN':
        return (
          <>
            <StatCard label="Total Users" value={stats?.totalUsers ?? 0} icon={Users} color="indigo" loading={loading} />
            <StatCard label="Total Pets" value={stats?.totalPets ?? 0} icon={Heart} color="green" loading={loading} />
            <StatCard label="Appointments Today" value={stats?.appointmentsToday ?? 0} icon={Calendar} color="blue" loading={loading} />
            <StatCard label="Health Records" value={stats?.healthRecords ?? 0} icon={Activity} color="red" loading={loading} />
          </>
        );
      case 'STAFF':
        return (
          <>
            <StatCard label="Upcoming Appointments" value={stats?.upcomingAppointments ?? 0} icon={Calendar} color="blue" loading={loading} />
            <StatCard label="Monitored Pets" value={stats?.monitoredPets ?? 0} icon={PawPrint} color="green" loading={loading} />
          </>
        );
      case 'PET_OWNER':
        return (
          <>
            <StatCard label="My Pets" value={stats?.totalPets ?? 0} icon={Heart} color="green" loading={loading} />
            <StatCard label="Upcoming Appointments" value={stats?.upcomingAppointments ?? 0} icon={Calendar} color="blue" loading={loading} />
          </>
        );
      default:
        return null;
    }
  };

  const renderRecentUsers = () => {
    const items = preview?.recentUsers ?? [];
    return items.map((u) => (
      <PreviewCardItem
        key={u.id}
        label={u.name}
        subtitle={`${u.email} · ${u.role}`}
        href={`/admin/users`}
      />
    ));
  };

  const renderRecentPets = () => {
    const items = preview?.recentPets ?? [];
    return items.map((p) => (
      <PreviewCardItem
        key={p.id}
        label={p.name}
        subtitle={`${p.species}${p.breed ? ` · ${p.breed}` : ''} · Owner: ${p.owner_name}`}
        href={`/admin/pets`}
      />
    ));
  };

  const renderTodayAppointments = () => {
    const items = preview?.todayAppointments ?? [];
    if (items.length === 0) {
      return <p className="text-sm text-muted-foreground py-2">No appointments today</p>;
    }
    return items.map((a) => (
      <PreviewCardItem
        key={a.id}
        label={`${a.pet_name} — ${formatTime(a.start_time)}`}
        subtitle={`Owner: ${a.owner_name}`}
      />
    ));
  };

  const renderRecentHealthRecords = (link?: string) => {
    const items = preview?.recentHealthRecords ?? [];
    if (items.length === 0) {
      return <p className="text-sm text-muted-foreground py-2">No recent records</p>;
    }
    return items.slice(0, 4).map((r) => (
      <PreviewCardItem
        key={r.id}
        label={r.pet_name}
        subtitle={r.diagnosis ? r.diagnosis.slice(0, 60) + (r.diagnosis.length > 60 ? '...' : '') : 'No diagnosis'}
      />
    ));
  };

  const renderUpcomingAppointments = (role: string) => {
    const items = preview?.upcomingAppointments ?? [];
    if (items.length === 0) {
      return <p className="text-sm text-muted-foreground py-2">No upcoming appointments</p>;
    }
    const link = role === 'STAFF' ? '/staff/appointments' : '/owner/appointments';
    return items.slice(0, 4).map((a) => (
      <PreviewCardItem
        key={a.id}
        label={`${a.pet_name} — ${formatDate(a.appointment_date)} at ${formatTime(a.start_time)}`}
        subtitle={`Status: ${a.status}`}
        href={link}
      />
    ));
  };

  const renderMonitoredPets = () => {
    const items = preview?.monitoredPets ?? [];
    if (items.length === 0) {
      return <p className="text-sm text-muted-foreground py-2">No pets currently being monitored</p>;
    }
    return items.slice(0, 4).map((m) => (
      <PreviewCardItem
        key={m.id}
        label={m.pet_name}
        subtitle={`${m.species}${m.room_name ? ` · Room: ${m.room_name}` : ''} · ${m.status.replace(/_/g, ' ')}`}
      />
    ));
  };

  const renderMyPets = () => {
    const items = preview?.myPets ?? [];
    if (items.length === 0) {
      return <p className="text-sm text-muted-foreground py-2">No pets registered yet</p>;
    }
    return items.map((p) => (
      <PreviewCardItem
        key={p.id}
        label={p.name}
        subtitle={`${p.species}${p.breed ? ` · ${p.breed}` : ''}`}
        href={`/owner/pets`}
      />
    ));
  };

  const renderOwnerRecords = () => {
    const items = preview?.recentHealthRecords ?? [];
    if (items.length === 0) {
      return <p className="text-sm text-muted-foreground py-2">No medical records yet</p>;
    }
    return items.slice(0, 4).map((r) => (
      <PreviewCardItem
        key={r.id}
        label={r.pet_name}
        subtitle={r.diagnosis ? r.diagnosis.slice(0, 60) + (r.diagnosis.length > 60 ? '...' : '') : 'No diagnosis'}
      />
    ));
  };

  return (
    <Sidebar>
      {/* Header */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <div className="bg-gradient-to-r from-[#3a7d6c]/10 to-[#57aa95]/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-[#3a7d6c]/20">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">{getTitle()}</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">{getDescription()}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4 sm:mb-6 lg:mb-8 grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {renderStatCards()}
      </div>

      {/* Preview Cards */}
      {user?.role === 'ADMIN' && (
        <div className="mb-6">
          <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Recent Activity</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <PreviewCard title="Recent Users" icon={Users} href="/admin/users" loading={loading}>
              {renderRecentUsers()}
            </PreviewCard>
            <PreviewCard title="Recent Pets" icon={PawPrint} href="/admin/pets" loading={loading}>
              {renderRecentPets()}
            </PreviewCard>
            <PreviewCard title="Today's Appointments" icon={Calendar} href="/admin/appointments" loading={loading}>
              {renderTodayAppointments()}
            </PreviewCard>
            <PreviewCard title="Health Records" icon={Activity} href="/admin/pets" loading={loading}>
              {renderRecentHealthRecords()}
            </PreviewCard>
          </div>
        </div>
      )}

      {user?.role === 'STAFF' && (
        <div className="mb-6">
          <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <PreviewCard title="Upcoming Appointments" icon={Calendar} href="/staff/appointments" loading={loading}>
              {renderUpcomingAppointments('STAFF')}
            </PreviewCard>
            <PreviewCard title="Recent Health Records" icon={Activity} href="/staff/health-records" loading={loading}>
              {renderRecentHealthRecords()}
            </PreviewCard>
            <PreviewCard title="Monitored Pets" icon={PawPrint} href="/staff/pets" loading={loading}>
              {renderMonitoredPets()}
            </PreviewCard>
          </div>
        </div>
      )}

      {user?.role === 'PET_OWNER' && (
        <div className="mb-6">
          <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Your Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <PreviewCard title="My Pets" icon={Heart} href="/owner/pets" loading={loading}>
              {renderMyPets()}
            </PreviewCard>
            <PreviewCard title="Upcoming Appointments" icon={Calendar} href="/owner/appointments" loading={loading}>
              {renderUpcomingAppointments('PET_OWNER')}
            </PreviewCard>
            <PreviewCard title="Medical Records" icon={Activity} href="/owner/records" loading={loading}>
              {renderOwnerRecords()}
            </PreviewCard>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="mt-4">
        <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {getQuickLinks(user?.role).map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href}>
                <Card className="p-4 sm:p-5 border border-border hover:border-[#3a7d6c]/50 hover:shadow-lg hover:shadow-[#3a7d6c]/10 transition-all cursor-pointer group h-full">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 bg-gradient-to-br from-[#3a7d6c]/10 to-[#57aa95]/10 rounded-lg sm:rounded-xl group-hover:from-[#3a7d6c]/20 group-hover:to-[#57aa95]/20 transition-all">
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-[#3a7d6c]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm sm:text-base group-hover:text-[#3a7d6c] transition-colors">
                        {link.label}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        {link.desc}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </Sidebar>
  );
}

function getQuickLinks(role?: string) {
  switch (role) {
    case 'ADMIN':
      return [
        { href: '/admin/users', label: 'User Management', icon: Users, desc: 'View and manage all users' },
        { href: '/admin/pets', label: 'Pet Registry', icon: PawPrint, desc: 'View and manage all pets' },
        { href: '/admin/appointments', label: 'Appointments', icon: Calendar, desc: 'View all appointments' },
        { href: '/admin/cameras', label: 'Cameras', icon: Video, desc: 'Manage camera monitoring' },
        { href: '/admin/rooms', label: 'Room Management', icon: Clock, desc: 'Manage clinic rooms' },
        { href: '/admin/activity-logs', label: 'Activity Logs', icon: ClipboardList, desc: 'View system activity' },
      ];
    case 'STAFF':
      return [
        { href: '/staff/appointments', label: 'Appointments', icon: Calendar, desc: 'View and manage appointments' },
        { href: '/staff/availability', label: 'Availability', icon: Clock, desc: 'Set your working schedule' },
        { href: '/staff/health-records', label: 'Health Records', icon: Activity, desc: 'View and create health records' },
        { href: '/staff/prescriptions', label: 'Prescriptions', icon: AlertCircle, desc: 'Manage prescriptions' },
        { href: '/staff/vaccinations', label: 'Vaccinations', icon: Syringe, desc: 'Manage vaccinations' },
        { href: '/staff/pets', label: 'Pet Monitoring', icon: PawPrint, desc: 'Monitor pets at clinic' },
        { href: '/live', label: 'Live Monitoring', icon: Video, desc: 'Watch live camera feeds' },
      ];
    case 'PET_OWNER':
      return [
        { href: '/owner/pets', label: 'My Pets', icon: PawPrint, desc: 'View your pets' },
        { href: '/owner/appointments', label: 'Appointments', icon: Calendar, desc: 'Book and manage appointments' },
        { href: '/owner/records', label: 'Medical Records', icon: Activity, desc: 'View medical history' },
        { href: '/live', label: 'Live Monitoring', icon: Video, desc: 'Watch your pet live' },
      ];
    default:
      return [];
  }
}
