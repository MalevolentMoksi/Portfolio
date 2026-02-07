import { useEffect } from 'react';
import { useReadingTime } from '@/contexts/ReadingTimeContext.jsx';

const WORDS_PER_MINUTE = 200;

const countWords = (text) => {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return 0;
  return cleaned.split(' ').length;
};

const useReadingTimeEstimate = (contentRef) => {
  const { setReadingTime } = useReadingTime();

  useEffect(() => {
    if (!contentRef?.current) return undefined;

    const frame = window.requestAnimationFrame(() => {
      const text = contentRef.current?.textContent || '';
      const wordCount = countWords(text);
      const minutes = Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE));
      setReadingTime(minutes);
    });

    return () => {
      window.cancelAnimationFrame(frame);
      setReadingTime(null);
    };
  }, [contentRef, setReadingTime]);
};

export default useReadingTimeEstimate;
