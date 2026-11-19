import React, { createContext, useContext, useEffect, useState } from 'react';

export type StudyExam = 'BOTH' | 'UPSC_CAPF' | 'SSC_CPO';
const Preferences = createContext({ exam: 'BOTH' as StudyExam, setExam: (_exam: StudyExam) => {}, dark: false, setDark: (_dark: boolean) => {} });
export function StudyPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [exam, setExam] = useState<StudyExam>(() => {
    try { const value = localStorage.getItem('dutydeck_exam'); return value === 'UPSC_CAPF' || value === 'SSC_CPO' ? value : 'BOTH'; } catch { return 'BOTH'; }
  });
  const [dark, setDark] = useState(() => { try { return localStorage.getItem('dutydeck_theme') === 'dark'; } catch { return false; } });
  useEffect(() => { try { localStorage.setItem('dutydeck_exam', exam); } catch {} }, [exam]);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try { localStorage.setItem('dutydeck_theme', dark ? 'dark' : 'light'); } catch {}
  }, [dark]);
  return <Preferences.Provider value={{ exam, setExam, dark, setDark }}>{children}</Preferences.Provider>;
}
export const useStudyPreferences = () => useContext(Preferences);
