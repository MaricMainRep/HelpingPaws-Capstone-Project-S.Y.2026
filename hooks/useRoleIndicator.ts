import { useState, useEffect } from 'react';
import { useUser } from '@/lib/context/UserContext';

const ROLE_COLORS = {
  ADMIN: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'Admin' },
  STAFF: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'Staff' },
  PET_OWNER: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: 'Pet Owner' },
};

const PET_COLORS = [
  { bg: 'bg-[#57aa95]/20', text: 'text-[#3a7d6c]' },
  { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400' },
  { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400' },
  { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-400' },
  { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-400' },
  { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400' },
  { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-400' },
  { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
];

export function useUserRole() {
  const { user, loading } = useUser();
  
  if (loading) return null;
  if (!user) return null;
  
  return user.role as keyof typeof ROLE_COLORS | null;
}

export function getRoleBadgeStyles(role: string | undefined | null) {
  if (!role) return null;
  return ROLE_COLORS[role as keyof typeof ROLE_COLORS] || null;
}

export function getPetColorStyles(petId: number) {
  const index = petId % PET_COLORS.length;
  return PET_COLORS[index];
}