'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DataTable } from '@/components/admin/DataTable';
import { PageHeader } from '@/components/admin/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUsers, updateUser } from '@/hooks/useAPI';
import { toast } from '@/lib/toast';
import type { User } from '@/lib/supabase';
import { Pencil } from 'lucide-react';
import { format } from 'date-fns';

export default function UsersPage() {
  const { users, isLoading, mutate } = useUsers();
  const [userToToggle, setUserToToggle] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('');
  const [isToggling, setIsToggling] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggleStatus = async () => {
    if (!userToToggle) return;
    setIsToggling(true);
    try {
      await updateUser(userToToggle.id, { is_active: !userToToggle.is_active });
      mutate();
      setUserToToggle(null);
      toast.success('User status updated', {
        description: `User has been ${userToToggle.is_active ? 'deactivated' : 'activated'} successfully.`,
      });
    } catch (error) {
      toast.error('Failed to update user', {
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsToggling(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setEditName(user.name || '');
    setEditEmail(user.email || '');
    setEditRole(user.role || '');
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    setIsSaving(true);
    try {
      await updateUser(editingUser.id, {
        name: editName,
        email: editEmail,
        role: editRole as 'ADMIN' | 'STAFF' | 'PET_OWNER',
      });
      mutate();
      setEditingUser(null);
      toast.success('User updated', {
        description: 'User information has been updated successfully.',
      });
    } catch (error) {
      toast.error('Failed to update user', {
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const columns = [
    { key: 'email' as const, label: 'Email' },
    { key: 'name' as const, label: 'Name' },
    {
      key: 'role' as const,
      label: 'Role',
      render: (value: string) => (
        <span className="inline-flex px-2 py-1 rounded-md bg-primary/10 text-primary text-sm font-medium">
          {value.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'is_active' as const,
      label: 'Status',
      render: (value: boolean) => (
        <span
          className={`inline-flex px-2 py-1 rounded-md text-sm font-medium ${
            value
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}
        >
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'created_at' as const,
      label: 'Date Created',
      sortable: true,
      render: (value: string) => (
        <span className="text-sm">{value ? format(new Date(value), 'MMM d, yyyy') : '-'}</span>
      ),
    },
  ];

  return (
    <Sidebar>
      <PageHeader 
        title="User Management" 
        description="Manage system users and their roles" 
      />

      <DataTable<User>
        data={users}
        columns={columns}
        loading={isLoading}
        actions={(user) => (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEdit(user)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUserToToggle(user)}
            >
              {user.is_active ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        )}
      />

      <ConfirmDialog
        open={!!userToToggle}
        title={userToToggle?.is_active ? 'Deactivate User' : 'Activate User'}
        description={
          userToToggle?.is_active
            ? `Are you sure you want to deactivate ${userToToggle?.email}? They will no longer be able to access the system.`
            : `Are you sure you want to activate ${userToToggle?.email}? They will regain access to the system.`
        }
        actionLabel={userToToggle?.is_active ? 'Deactivate' : 'Activate'}
        onConfirm={handleToggleStatus}
        onCancel={() => setUserToToggle(null)}
        isLoading={isToggling}
        variant={userToToggle?.is_active ? 'destructive' : 'default'}
      />

      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4 py-4">
            <FieldGroup>
              <FieldLabel>Name</FieldLabel>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="User name"
                className="border-border"
              />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>Email</FieldLabel>
              <Input
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                type="email"
                placeholder="user@email.com"
                className="border-border"
              />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>Role</FieldLabel>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="PET_OWNER">Pet Owner</option>
                <option value="STAFF">Staff</option>
                <option value="ADMIN">Admin</option>
              </select>
            </FieldGroup>
            <Button
              onClick={handleSaveEdit}
              disabled={isSaving}
              className="w-full"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}
