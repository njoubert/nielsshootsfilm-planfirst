import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeManager } from './theme-manager';

describe('ThemeManager', () => {
  let themeManager: ThemeManager;

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    // Reset document attributes
    document.documentElement.removeAttribute('data-theme');
    // Create new theme manager instance
    themeManager = new ThemeManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should create theme manager instance', () => {
      expect(themeManager).toBeInstanceOf(ThemeManager);
    });

    it('should initialize with system mode by default', () => {
      expect(themeManager.getMode()).toBe('system');
    });

    it('should detect system theme on init', () => {
      const theme = themeManager.getCurrentTheme();
      expect(['light', 'dark']).toContain(theme);
    });

    it('should load theme preference from localStorage', () => {
      localStorage.setItem('theme_preference', 'dark');
      const newManager = new ThemeManager();
      expect(newManager.getMode()).toBe('dark');
      expect(newManager.getCurrentTheme()).toBe('dark');
    });
  });

  describe('theme mode management', () => {
    it('should get current theme mode', () => {
      const mode = themeManager.getMode();
      expect(['light', 'dark', 'system']).toContain(mode);
    });

    it('should set mode to light', () => {
      themeManager.setMode('light');
      expect(themeManager.getMode()).toBe('light');
      expect(themeManager.getCurrentTheme()).toBe('light');
    });

    it('should set mode to dark', () => {
      themeManager.setMode('dark');
      expect(themeManager.getMode()).toBe('dark');
      expect(themeManager.getCurrentTheme()).toBe('dark');
    });

    it('should set mode to system', () => {
      themeManager.setMode('system');
      expect(themeManager.getMode()).toBe('system');
      // Current theme should match system preference
      expect(['light', 'dark']).toContain(themeManager.getCurrentTheme());
    });

    it('should persist mode preference to localStorage', () => {
      themeManager.setMode('dark');
      expect(localStorage.getItem('theme_preference')).toBe('dark');
    });
  });

  describe('theme toggle', () => {
    it('should toggle from light to dark', () => {
      themeManager.setMode('light');
      themeManager.toggle();
      expect(themeManager.getMode()).toBe('dark');
      expect(themeManager.getCurrentTheme()).toBe('dark');
    });

    it('should toggle from dark to light', () => {
      themeManager.setMode('dark');
      themeManager.toggle();
      expect(themeManager.getMode()).toBe('light');
      expect(themeManager.getCurrentTheme()).toBe('light');
    });

    it('should toggle from system mode to opposite theme', () => {
      // Mock light system theme
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: false,
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      });

      const newManager = new ThemeManager();
      newManager.setMode('system');
      expect(newManager.getCurrentTheme()).toBe('light');

      newManager.toggle();
      expect(newManager.getMode()).toBe('dark');
      expect(newManager.getCurrentTheme()).toBe('dark');
    });
  });

  describe('subscribers', () => {
    it('should notify subscribers on mode change', () => {
      const subscriber = vi.fn();
      themeManager.subscribe(subscriber);

      themeManager.setMode('dark');

      expect(subscriber).toHaveBeenCalledWith('dark');
    });

    it('should unsubscribe', () => {
      const subscriber = vi.fn();
      const unsubscribe = themeManager.subscribe(subscriber);

      unsubscribe();
      themeManager.setMode('dark');

      expect(subscriber).not.toHaveBeenCalled();
    });

    it('should handle multiple subscribers', () => {
      const subscriber1 = vi.fn();
      const subscriber2 = vi.fn();

      themeManager.subscribe(subscriber1);
      themeManager.subscribe(subscriber2);

      themeManager.setMode('dark');

      expect(subscriber1).toHaveBeenCalledWith('dark');
      expect(subscriber2).toHaveBeenCalledWith('dark');
    });
  });

  describe('DOM updates', () => {
    it('should apply theme to document element', () => {
      themeManager.setMode('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('should update data-theme attribute when theme changes', () => {
      themeManager.setMode('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');

      themeManager.setMode('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('should apply system theme to DOM when in system mode', () => {
      // Mock light system theme
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: false,
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      });

      const newManager = new ThemeManager();
      newManager.setMode('system');

      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });
  });

  describe('theme colors', () => {
    it('should apply theme colors to CSS variables', () => {
      const colors = {
        background: '#ffffff',
        surface: '#f5f5f5',
        text_primary: '#000000',
        text_secondary: '#666666',
        border: '#e0e0e0',
      };

      themeManager.applyThemeColors(colors);

      const root = document.documentElement;
      expect(root.style.getPropertyValue('--color-background')).toBe('#ffffff');
      expect(root.style.getPropertyValue('--color-surface')).toBe('#f5f5f5');
      expect(root.style.getPropertyValue('--color-text-primary')).toBe('#000000');
      expect(root.style.getPropertyValue('--color-text-secondary')).toBe('#666666');
      expect(root.style.getPropertyValue('--color-border')).toBe('#e0e0e0');
    });
  });
});
