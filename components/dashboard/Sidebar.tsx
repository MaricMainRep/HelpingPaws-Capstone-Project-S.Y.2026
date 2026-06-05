'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useUser } from '@/lib/context/UserContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { useUserRole, getRoleBadgeStyles } from '@/hooks/useRoleIndicator';
import * as React from 'react';
import { useState, useEffect, useRef } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

import {
  LayoutDashboard,
  Users,
  PawPrint,
  Calendar,
  Bell,
  Camera,
  Settings,
  LogOut,
  ClipboardList,
  Syringe,
  Pill,
  Menu,
  DoorOpen,
  Clipboard,
  Pencil,
  TrendingUp,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FieldGroup, FieldLabel } from '@/components/ui/field';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

interface SidebarProps {
  children: React.ReactNode;
}

const adminLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/analytics', label: 'Analytics', icon: TrendingUp },
  { href: '/admin/users', label: 'User Management', icon: Users },
  { href: '/admin/pets', label: 'Pet Registry', icon: PawPrint },
  { href: '/admin/appointments', label: 'All Appointments', icon: Calendar },
  { href: '/admin/rooms', label: 'Room Management', icon: DoorOpen },
  { href: '/admin/cameras', label: 'Camera Management', icon: Camera },
  { href: '/admin/filters', label: 'Filter Management', icon: Settings },
  { href: '/live', label: 'Live Monitoring', icon: Camera },
  { href: '/admin/activity-logs', label: 'Activity Logs', icon: Clipboard },
];

const staffLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/staff/appointments', label: 'Appointments', icon: Calendar },
  { href: '/staff/availability', label: 'My Availability', icon: Settings },
  { href: '/staff/health-records', label: 'Health Records', icon: ClipboardList },
  { href: '/staff/prescriptions', label: 'Prescriptions', icon: Pill },
  { href: '/staff/vaccinations', label: 'Vaccinations', icon: Syringe },
  { href: '/staff/pets', label: 'Pet Monitoring', icon: PawPrint },
  { href: '/live', label: 'Live Monitoring', icon: Camera },
];

const ownerLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/owner/pets', label: 'My Pets', icon: PawPrint },
  { href: '/owner/appointments', label: 'Appointments', icon: Calendar },
  { href: '/owner/records', label: 'Medical Records', icon: ClipboardList },
  { href: '/live', label: 'Live Monitoring', icon: Camera },
];

export function Sidebar({ children }: SidebarProps) {
  const { user, logout, updateProfile } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const role = useUserRole();
  const roleStyles = role ? getRoleBadgeStyles(role) : null;

  useEffect(() => {
    setProfileName(user?.name || '');
    setProfileEmail(user?.email || '');
  }, [user]);

  useEffect(() => {
    fetch(`${API_URL}/api/notifications/`)
      .then(res => {
        if (res.status === 401) return { notifications: [] };
        return res.json();
      })
      .then(data => setNotifications(data.notifications || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: number) => {
    await fetch(`${API_URL}/api/notifications/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    await fetch(`${API_URL}/api/notifications/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mark_all_read: true }),
    });
    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
  };

  const links = user?.role === 'ADMIN' 
    ? adminLinks 
    : user?.role === 'STAFF' 
      ? staffLinks 
      : ownerLinks;

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch(`${API_URL}/api/auth/logout/`, { method: 'POST', credentials: 'include' });
    logout();
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      if (currentPassword && newPassword) {
        if (newPassword !== confirmPassword) {
          toast.error('Passwords do not match', {
            description: 'Please make sure your new passwords match.',
          });
          setSaving(false);
          return;
        }
        if (newPassword.length < 8) {
          toast.error('Password too short', {
            description: 'Password must be at least 8 characters.',
          });
          setSaving(false);
          return;
        }
        await fetch(`${API_URL}/api/users/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            id: user.id, 
            currentPassword, 
            newPassword 
          }),
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        toast.success('Password changed', {
          description: 'Your password has been updated successfully.',
        });
      }
      
      if (profileName !== user.name || profileEmail !== user.email) {
        await updateProfile({ name: profileName, email: profileEmail });
      }
      
      setProfileOpen(false);
      toast.success('Profile updated', {
        description: 'Your profile has been updated successfully.',
      });
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Update failed', {
        description: 'Failed to update profile. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <>
      <LoadingScreen show={loggingOut} message="Logging out..." />
      <div className="min-h-screen bg-background flex">
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="fixed top-3 left-3 sm:top-4 sm:left-4 z-50 hover:bg-[#3a7d6c] hover:text-white transition-colors h-9 w-9 sm:h-10 sm:w-10"
          >
            <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 sm:w-80 p-0 flex flex-col bg-background">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          
          {/* Logo */}
          <div className="p-3 sm:p-4 border-b border-border bg-muted/30">
            <Link href="/dashboard" className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
              <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden bg-[#3a7d6c] flex items-center justify-center shadow-sm">
                <Image
                  src="/icon.png"
                  alt="HelpingPaws Logo"
                  fill
                  className="object-contain p-1"
                />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-foreground">HelpingPaws</h1>
                <p className="text-xs text-[#3a7d6c] font-medium">Veterinary Clinic</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 sm:p-4 space-y-1 overflow-y-auto">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-[#3a7d6c] text-white shadow-md shadow-[#3a7d6c]/20'
                      : 'text-muted-foreground hover:bg-[#3a7d6c]/10 hover:text-[#3a7d6c]'
                  )}
                >
                  <Icon className={cn('h-4 w-4 sm:h-5 sm:w-5', isActive && 'text-white')} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="p-3 sm:p-4 border-t border-border bg-muted/30">
            <div className="flex items-center gap-3 mb-3 sm:mb-4 p-2 rounded-lg bg-[#3a7d6c]/10">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#3a7d6c] flex items-center justify-center shadow-sm">
                <span className="text-white font-semibold text-sm">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-[#3a7d6c] font-medium capitalize">
                  {user?.role?.toLowerCase().replace('_', ' ')}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setProfileOpen(true);
                }}
                className="h-8 w-8 text-muted-foreground hover:text-[#3a7d6c] hover:bg-[#3a7d6c]/10"
                aria-label="Edit profile"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-[#3a7d6c] hover:bg-[#3a7d6c]/10"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Top Bar */}
        <header className="h-14 sm:h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center px-3 sm:px-6 sticky top-0 z-10 shadow-sm">
          {/* Logo & Title - Centered */}
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-2">
              <div className="relative w-6 h-6 sm:w-7 sm:h-7 rounded overflow-hidden">
                <Image
                  src="/icon.png"
                  alt="HelpingPaws Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="font-semibold text-foreground text-sm sm:text-base">HelpingPaws</span>
            </div>
          </div>

{/* Notifications & Role Badge */}
          <div className="flex items-center gap-2">
            {roleStyles && (
              <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', roleStyles.bg, roleStyles.text)}>
                {roleStyles.label}
              </span>
            )}
            <div className="relative" ref={notificationRef}>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative hover:bg-[#3a7d6c]/10 h-9 w-9" 
                aria-label="Notifications"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#3a7d6c] rounded-full" />
                )}
              </Button>
              
              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden max-h-[80vh]">
                  <div className="p-3 border-b border-border flex justify-between items-center bg-muted/30">
                    <span className="font-semibold text-sm">Notifications</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllRead}
                        className="text-xs text-[#3a7d6c] hover:underline font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-60 md:max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-sm text-muted-foreground text-center">No notifications</p>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <div 
                          key={n.id} 
                          className={cn(
                            'p-3 border-b border-border/50 last:border-0 cursor-pointer transition-colors',
                            !n.is_read ? 'bg-[#3a7d6c]/5 hover:bg-[#3a7d6c]/10' : 'hover:bg-muted/50'
                          )}
                          onClick={() => markAsRead(n.id)}
                        >
                          <p className="text-sm">{n.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(n.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                  <a href="/admin/notifications" className="block p-3 text-center text-sm text-[#3a7d6c] hover:bg-[#3a7d6c]/10 border-t border-border font-medium">
                    View all notifications
                  </a>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-3 sm:p-4 md:p-6">
          {children}
        </div>
      </main>
      </div>

      {/* Profile Modal */}
      <Dialog open={profileOpen} onOpenChange={(open) => {
            setProfileOpen(open);
            if (!open) {
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
            }
          }}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <FieldGroup>
              <FieldLabel>Name</FieldLabel>
              <Input
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Your name"
                className="border-border"
              />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>Email</FieldLabel>
              <Input
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                type="email"
                placeholder="your@email.com"
                className="border-border"
              />
            </FieldGroup>
            <div className="border-t border-border pt-4">
              <p className="text-sm font-medium mb-3">Change Password (optional)</p>
              <FieldGroup>
                <FieldLabel>Current Password</FieldLabel>
                <div className="relative">
                  <Input
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    type={showPasswords ? "text" : "password"}
                    placeholder="Enter current password"
                    className="border-border pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FieldGroup>
              <FieldGroup className="mt-3">
                <FieldLabel>New Password</FieldLabel>
                <Input
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  type={showPasswords ? "text" : "password"}
                  placeholder="Enter new password"
                  className="border-border"
                />
              </FieldGroup>
              <FieldGroup className="mt-3">
                <FieldLabel>Confirm New Password</FieldLabel>
                <Input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  type={showPasswords ? "text" : "password"}
                  placeholder="Confirm new password"
                  className="border-border"
                />
              </FieldGroup>
            </div>
            <Button
              onClick={handleSaveProfile}
              disabled={saving}
              className="w-full"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
