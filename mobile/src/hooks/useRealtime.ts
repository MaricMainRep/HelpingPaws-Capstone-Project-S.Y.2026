import { useEffect, useState, useCallback } from 'react';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { config } from '../lib/config';

let realtime: any = null;

function getRealtime() {
  if (!realtime) {
    realtime = createClient(config.supabase.url, config.supabase.anonKey, {
      realtime: {
        params: { apikey: config.supabase.anonKey },
      },
    });
  }
  return realtime;
}

export function useRealtimeSubscription(
  table: 'appointments' | 'pets' | 'notifications' | 'pet_locations',
  callback: (payload: any) => void
) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    const rt = getRealtime();
    const ch = rt.channel(`public:${table}`);

    ch.on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      callback
    );

    ch.subscribe();
    setChannel(ch);

    return () => {
      ch.unsubscribe();
    };
  }, [table, callback]);

  return channel;
}

export function useAppointmentsRealtime(onUpdate: () => void) {
  return useRealtimeSubscription('appointments', onUpdate);
}

export function usePetsRealtime(onUpdate: () => void) {
  return useRealtimeSubscription('pets', onUpdate);
}

export function useNotificationsRealtime(onUpdate: () => void) {
  return useRealtimeSubscription('notifications', onUpdate);
}