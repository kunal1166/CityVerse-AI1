import { create } from 'zustand';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'cityverse-theme';

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;

  // Fall back to the OS/browser preference on first-ever visit.
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyThemeToDocument(theme: Theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;

  // Keep the PWA/browser chrome color in sync with the active theme.
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#0B1120' : '#0F172A');
}

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const initial = getInitialTheme();
  // Apply immediately so the store's own creation keeps the DOM in sync,
  // even though index.html's inline script already avoided the initial flash.
  applyThemeToDocument(initial);

  return {
    theme: initial,
    setTheme: (theme) => {
      window.localStorage.setItem(STORAGE_KEY, theme);
      applyThemeToDocument(theme);
      set({ theme });
    },
    toggleTheme: () => {
      const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
      get().setTheme(next);
    },
  };
});