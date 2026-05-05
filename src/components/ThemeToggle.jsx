"use client";

import { useTheme } from '@/components/ThemeProvider';
import { Button } from '@/components/ui/button';
import { THEMES } from '@/constants/themes';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="h-10 w-10 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all"
    >
      {theme === THEMES.LIGHT ? (
        <Moon className="w-5 h-5 transition-all animate-in zoom-in duration-300" />
      ) : (
        <Sun className="w-5 h-5 transition-all animate-in zoom-in duration-300" />
      )}
    </Button>
  );
}

export default ThemeToggle;
