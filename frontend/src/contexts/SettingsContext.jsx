import { createContext, useContext, useState, useEffect } from 'react';
import { settingsAPI } from '../lib/api';

const SettingsContext = createContext(null);

// Load cached settings from localStorage
function loadCachedSettings() {
  try {
    const cached = localStorage.getItem('appSettings');
    if (cached) return JSON.parse(cached);
  } catch (e) { /* ignore */ }
  return {
    app_name: 'RadiusBill',
    app_description: 'FreeRADIUS Billing System',
    app_logo: null,
    company_name: '',
  };
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(loadCachedSettings);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  // Apply dark mode class to <html>
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  // Fetch public settings on mount (no auth required)
  useEffect(() => {
    fetchPublicSettings();
  }, []);

  const fetchPublicSettings = async () => {
    try {
      const res = await settingsAPI.getPublic();
      const data = res.data.data || {};
      const newSettings = { ...settings, ...data };
      setSettings(newSettings);
      localStorage.setItem('appSettings', JSON.stringify(newSettings));
    } catch (e) {
      // Use cached/defaults silently
    }
  };

  // Full fetch (when logged in as admin, after saving settings)
  const refreshSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const res = await settingsAPI.getAll();
        const data = res.data.data || {};
        const flat = {};
        Object.values(data).forEach(group => {
          if (Array.isArray(group)) {
            group.forEach(s => { flat[s.key] = s.value; });
          }
        });
        const newSettings = { ...settings, ...flat };
        setSettings(newSettings);
        localStorage.setItem('appSettings', JSON.stringify(newSettings));
      } else {
        await fetchPublicSettings();
      }
    } catch (e) {
      await fetchPublicSettings();
    }
  };

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  return (
    <SettingsContext.Provider value={{ settings, darkMode, toggleDarkMode, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
