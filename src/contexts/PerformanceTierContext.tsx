import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { PerformanceTier } from '@/types';
import { getPerformanceTier, subscribePerformanceTierChanges } from '@/utils/performanceTier';

interface PerformanceTierContextValue {
  tier: PerformanceTier;
}

const PerformanceTierContext = createContext<PerformanceTierContextValue>({
  tier: 'high',
});

interface PerformanceTierProviderProps {
  children: ReactNode;
}

export const PerformanceTierProvider = ({ children }: PerformanceTierProviderProps) => {
  const [tier, setTier] = useState<PerformanceTier>(() => getPerformanceTier());

  useEffect(() => {
    // Ensure context stays synchronized with current storage/cache state on mount.
    setTier(getPerformanceTier());

    return subscribePerformanceTierChanges(({ nextTier }) => {
      setTier(nextTier);
    });
  }, []);

  const value = useMemo(() => ({ tier }), [tier]);

  return <PerformanceTierContext.Provider value={value}>{children}</PerformanceTierContext.Provider>;
};

export const usePerformanceTierContext = (): PerformanceTierContextValue =>
  useContext(PerformanceTierContext);

export const usePerformanceTierValue = (): PerformanceTier => {
  const { tier } = usePerformanceTierContext();
  return tier;
};

export default PerformanceTierContext;
