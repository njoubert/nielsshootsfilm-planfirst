**Theme System Integration**:
The theme system (dark/light mode) is initialized early in the page load process to prevent color flashing. See Phase 8 for complete theme implementation details.



**Album Editor** - Edit Single Album:

  - Theme override selector (System/Light/Dark) - see Phase 2.5



**Settings**
  - [ ] Theme settings (see Phase 2.5 for complete implementation)
  - Default theme mode selector (System/Light/Dark)
  - Light theme color customization (background, surface, text, border)
  - Dark theme color customization (background, surface, text, border)
  - Live preview of both light and dark themes
  - Explanation of how system theme detection works


**Lit Component**
- [ ] `<theme-toggle>` - Theme switcher button (see Phase 2.5)
  - Displays current theme mode (light/dark/system)
  - Toggles between light and dark mode
  - Keyboard accessible with proper ARIA labels
  - Shows appropriate icon (sun/moon) based on current theme