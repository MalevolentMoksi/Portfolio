import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

interface ReadingTimeContextValue {
  readingTime: number | null;
  setReadingTime: (minutes: number | null) => void;
}

const ReadingTimeContext = createContext<ReadingTimeContextValue>({
  readingTime: null,
  setReadingTime: () => {},
});

interface ReadingTimeProviderProps {
  children: ReactNode;
}

export const ReadingTimeProvider = ({ children }: ReadingTimeProviderProps) => {
  const [readingTime, setReadingTime] = useState<number | null>(null);
  const value = useMemo(() => ({ readingTime, setReadingTime }), [readingTime]);

  return <ReadingTimeContext.Provider value={value}>{children}</ReadingTimeContext.Provider>;
};

export const useReadingTime = () => useContext(ReadingTimeContext);

export default ReadingTimeContext;
