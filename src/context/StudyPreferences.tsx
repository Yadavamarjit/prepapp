import React, { createContext, useContext, useEffect, useState } from 'react';

export type StudyExam = 'BOTH' | 'UPSC_CAPF' | 'SSC_CPO';
const Preferences = createContext({ exam: 'UPSC_CAPF' as StudyExam, dark: false, setDark: (_dark: boolean) => {} });
export function StudyPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(() => { try { return localStorage.getItem('dutydeck_theme') === 'dark'; } catch { return false; } });
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try { localStorage.setItem('dutydeck_theme', dark ? 'dark' : 'light'); } catch {}
  }, [dark]);
  return <Preferences.Provider value={{ exam: 'UPSC_CAPF', dark, setDark }}>{children}</Preferences.Provider>;
}
export const useStudyPreferences = () => useContext(Preferences);
