import { createContext, useContext, useMemo, useState } from 'react';

const ReadingTimeContext = createContext({
  readingTime: null,
  setReadingTime: () => {},
});

export const ReadingTimeProvider = ({ children }) => {
  const [readingTime, setReadingTime] = useState(null);
  const value = useMemo(() => ({ readingTime, setReadingTime }), [readingTime]);

  return (
    <ReadingTimeContext.Provider value={value}>
      {children}
    </ReadingTimeContext.Provider>
  );
};

export const useReadingTime = () => useContext(ReadingTimeContext);
