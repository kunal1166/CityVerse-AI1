import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../store/useThemeStore';

interface ThemeToggleProps {
  /** Compact renders just the pill switch (for tight header spaces). */
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      onClick={toggleTheme}
      className={`relative inline-flex h-7 w-14 shrink-0 items-center rounded-full border transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 focus-visible:ring-blue-500 cursor-pointer overflow-hidden ${
        isDark
          ? 'bg-gradient-to-r from-indigo-900 via-slate-800 to-slate-900 border-indigo-700'
          : 'bg-gradient-to-r from-sky-200 via-sky-100 to-amber-100 border-amber-200'
      } ${className}`}
    >
      {/* Twinkling stars, only visible in dark mode */}
      <AnimatePresence>
        {isDark && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <span className="absolute left-2 top-1.5 w-[3px] h-[3px] rounded-full bg-white theme-glow" />
            <span className="absolute left-4 top-4 w-[2px] h-[2px] rounded-full bg-white theme-glow [animation-delay:0.6s]" />
            <span className="absolute left-2.5 top-4.5 w-[2px] h-[2px] rounded-full bg-white theme-glow [animation-delay:1.2s]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sun rays glow, only visible in light mode */}
      <AnimatePresence>
        {!isDark && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-amber-300/60 blur-[3px] theme-glow"
          />
        )}
      </AnimatePresence>

      {/* Sliding thumb */}
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        animate={{ x: isDark ? 30 : 4 }}
        className="relative z-10 flex items-center justify-center w-5 h-5 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.35)]"
      >
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.div
              key="moon"
              initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.25 }}
            >
              <Moon className="w-3 h-3 text-indigo-700" fill="currentColor" strokeWidth={0} />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.25 }}
            >
              <Sun className="w-3 h-3 text-amber-500" fill="currentColor" strokeWidth={0} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </button>
  );
};