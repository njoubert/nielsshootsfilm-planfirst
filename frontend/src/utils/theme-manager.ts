/**
 * Theme manager for dark/light mode handling.
 * Supports system preference detection, manual toggle, and per-album overrides.
 */

import type { ThemeColorSet, ThemeMode } from '../types/data-models';

const THEME_STORAGE_KEY = 'theme_preference';

export class ThemeManager {
  private currentTheme: 'light' | 'dark' = 'light';
  private mode: ThemeMode = 'system';
  private listeners: Array<(theme: 'light' | 'dark') => void> = [];

  constructor() {
    this.loadThemePreference();
    this.initializeTheme();
    this.setupSystemThemeListener();
  }

  /**
   * Get the current active theme (light or dark).
   */
  getCurrentTheme(): 'light' | 'dark' {
    return this.currentTheme;
  }

  /**
   * Get the current theme mode (system, light, or dark).
   */
  getMode(): ThemeMode {
    return this.mode;
  }

  /**
   * Set theme mode and apply it.
   */
  setMode(mode: ThemeMode): void {
    this.mode = mode;
    this.saveThemePreference();
    this.applyTheme();
  }

  /**
   * Toggle between light and dark themes.
   */
  toggle(): void {
    if (this.mode === 'system') {
      // If in system mode, switch to opposite of current system theme.
      this.setMode(this.currentTheme === 'light' ? 'dark' : 'light');
    } else {
      // Toggle between light and dark.
      this.setMode(this.mode === 'light' ? 'dark' : 'light');
    }
  }

  /**
   * Apply theme colors to CSS custom properties.
   */
  applyThemeColors(colors: ThemeColorSet): void {
    const root = document.documentElement;
    root.style.setProperty('--color-background', colors.background);
    root.style.setProperty('--color-surface', colors.surface);
    root.style.setProperty('--color-text-primary', colors.text_primary);
    root.style.setProperty('--color-text-secondary', colors.text_secondary);
    root.style.setProperty('--color-border', colors.border);
  }

  /**
   * Subscribe to theme changes.
   */
  subscribe(callback: (theme: 'light' | 'dark') => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  /**
   * Load theme preference from localStorage.
   */
  private loadThemePreference(): void {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      this.mode = stored;
    }
  }

  /**
   * Save theme preference to localStorage.
   */
  private saveThemePreference(): void {
    localStorage.setItem(THEME_STORAGE_KEY, this.mode);
  }

  /**
   * Initialize theme on page load.
   */
  private initializeTheme(): void {
    this.applyTheme();
  }

  /**
   * Apply the current theme mode.
   */
  private applyTheme(): void {
    let resolvedTheme: 'light' | 'dark';

    if (this.mode === 'system') {
      resolvedTheme = this.getSystemTheme();
    } else {
      resolvedTheme = this.mode;
    }

    this.currentTheme = resolvedTheme;
    document.documentElement.setAttribute('data-theme', resolvedTheme);

    // Notify listeners.
    this.listeners.forEach((callback) => callback(resolvedTheme));
  }

  /**
   * Get system theme preference.
   */
  private getSystemTheme(): 'light' | 'dark' {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  /**
   * Setup listener for system theme changes.
   */
  private setupSystemThemeListener(): void {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
      if (this.mode === 'system') {
        this.applyTheme();
      }
    });
  }
}

// Singleton instance.
export const themeManager = new ThemeManager();
