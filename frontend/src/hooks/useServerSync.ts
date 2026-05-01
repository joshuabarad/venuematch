import { useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { api } from '../lib/api';
import { useStore } from '../store/index';
import { isSupabaseEnabled } from '../lib/supabase';

// On login, pull the user's server state and hydrate the Zustand store.
// All subsequent mutations update Zustand optimistically and fire API calls in the background.
export function useServerSync(authUser: User | null) {
  const { setUser, syncFromServer } = useStore();

  useEffect(() => {
    if (!authUser || !isSupabaseEnabled) return;

    async function sync() {
      const [userRes, ratingsRes, savedRes, rejectionsRes] = await Promise.all([
        api.users.me(),
        api.ratings.list(),
        api.saved.list(),
        api.rejections.list(),
      ]);

      if (authUser) {
        setUser({ id: authUser.id, email: authUser.email ?? '', name: authUser.user_metadata?.name ?? '' });
      }

      syncFromServer({
        userData: userRes.data,
        ratings: ratingsRes.data ?? [],
        saved: savedRes.data ?? [],
        rejections: rejectionsRes.data ?? [],
      });
    }

    sync();
  }, [authUser?.id]);
}
