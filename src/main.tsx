import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import './index.css';
import { StudyPreferencesProvider } from './context/StudyPreferences';

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <AuthProvider>
      <StudyPreferencesProvider><App /></StudyPreferencesProvider>
    </AuthProvider>
  </BrowserRouter>
);

