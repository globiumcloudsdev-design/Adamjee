'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { THEMES } from '@/constants/themes';

const ThemeContext = createContext({
  theme: THEMES.LIGHT,
  toggleTheme: () => {},
  setTheme: (theme) => {},
});

export function ThemeProvider({ children, defaultTheme = THEMES.LIGHT }) {
  const [theme, setTheme] = useState(defaultTheme);
  const [mounted, setMounted] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme && Object.values(THEMES).includes(storedTheme)) {
      setTheme(storedTheme);
    }
  }, []);

  // Update theme in localStorage and document
  useEffect(() => {
    if (!mounted) return;

    localStorage.setItem('theme', theme);
    
    // Remove existing theme classes
    document.documentElement.classList.remove(THEMES.LIGHT, THEMES.DARK);
    
    // Add current theme class
    document.documentElement.classList.add(theme);
    
    // Set data attribute for CSS
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme((prevTheme) =>
      prevTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT
    );
  };

  const value = {
    theme,
    toggleTheme,
    setTheme,
  };

  // Prevent flash of incorrect theme
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}

export default ThemeProvider;
