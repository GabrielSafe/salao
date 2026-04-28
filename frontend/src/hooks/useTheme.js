import { useState, useEffect } from 'react';

export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('rb-theme') === 'dark';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('rb-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggle = () => setIsDark(p => !p);

  return { isDark, toggle };
}
