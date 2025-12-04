import { useEffect } from 'react';
import { refreshAccessToken } from '../lib/api/client';
import { useAuthStore } from '../lib/store/auth';

const REFRESH_INTERVAL_MS = 12 * 60 * 1000; // 12 minutes

export const useAutoRefreshToken = () => {
  const refreshToken = useAuthStore((state) => state.refreshToken);

  useEffect(() => {
    if (!refreshToken) return undefined;

    const interval = setInterval(() => {
      refreshAccessToken().catch(() => {
        // errors handled in store (session cleared)
      });
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [refreshToken]);
};
