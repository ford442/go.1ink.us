import { useCallback, useEffect, useState } from 'react';
import {
  ANALYTICS_UPDATED_EVENT,
  getOperatorStats,
  type OperatorStats,
} from '../lib/analytics';

export default function useOperatorStats(): OperatorStats {
  const [stats, setStats] = useState(() => getOperatorStats());

  const refresh = useCallback(() => {
    setStats(getOperatorStats());
  }, []);

  useEffect(() => {
    window.addEventListener(ANALYTICS_UPDATED_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(ANALYTICS_UPDATED_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);

  return stats;
}
