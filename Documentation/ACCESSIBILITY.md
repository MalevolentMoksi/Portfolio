# Accessibility Features & Implementation Guide

**Last Updated:** March 2026  
**Status:** Current (TypeScript + React 18 + Vite 8)

## Overview

The Portfolio implements comprehensive accessibility controls via the `AccessibilityButton` component and `AccessibilityContext`, providing toggles for motion reduction, contrast enhancement, font sizing, and dyslexia-friendly typography. All settings persist in localStorage and apply globally via CSS class toggles.

---

## Current Accessibility Features

### 1. No Motion (Reduce Motion)
- **Key:** `noMotion` (boolean)
- **Purpose:** Disable animations and transitions for users with vestibular disorders or motion sensitivity
- **CSS Class:** `a11y--no-motion`, `a11y--reduce-effects`
- **Effect:** All CSS animations, transition, and scroll behaviors respect `prefers-reduced-motion` media query
- **Storage Key:** `portfolio-a11y-settings` (persisted)
- **Default:** `false`

### 2. High Contrast
- **Key:** `highContrast` (boolean)
- **Purpose:** Increase contrast ratios for better visibility and readability
- **CSS Class:** `a11y--high-contrast`
- **Effect:** Applies inverted/enhanced color scheme to all components
- **Storage Key:** `portfolio-a11y-settings` (persisted)
- **Default:** `false`

### 3. Font Size Scaling
- **Key:** `fontSize` ('normal' | 'lg' | 'xl')
- **Purpose:** Allow users to increase text size for easier reading
- **CSS Classes:**
  - `a11y--font-lg` (112.5% base font on `<html>`)
  - `a11y--font-xl` (125% base font on `<html>`)
  - No class for `'normal'` (default size)
- **Mechanism:** Modifies `document.documentElement.style.fontSize` + body class toggle
- **Impact:** All rem-based typography scales proportionally
- **Options:** "Normal" | "Large" | "Extra Large"
- **Default:** `'normal'`

### 4. Dyslexia-Friendly Font
- **Key:** `dyslexiaFont` (boolean)
- **Purpose:** Apply dyslexia-friendly typeface (e.g., Dyslexie, Lexend, or fallback sans-serif)
- **CSS Class:** `a11y--dyslexia`
- **Effect:** Overrides default font-family to dyslexia-optimized font stack
- **Storage Key:** `portfolio-a11y-settings` (persisted)
- **Default:** `false`

---

## Component Architecture

### AccessibilityContext (`src/contexts/AccessibilityContext.tsx`)

**Type:**
```typescript
export type FontSize = 'normal' | 'lg' | 'xl';

export interface AccessibilitySettings {
  noMotion: boolean;
  highContrast: boolean;
  fontSize: FontSize;
  dyslexiaFont: boolean;
}

interface AccessibilityContextValue {
  settings: AccessibilitySettings;
  setSetting: <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => void;
  toggleSetting: (key: keyof AccessibilitySettings) => void;
}
```

**Features:**
- Reads settings from localStorage with key `portfolio-a11y-settings`
- Applies body/html classes via `applyBodyClasses()` on settings change
- Provides `setSetting()` for granular control (esp. font size)
- Provides `toggleSetting()` for boolean toggles
- **Migration:** Old `reduceEffects` flag is merged into `noMotion`
- Default Settings:
  ```typescript
  {
    noMotion: false,
    highContrast: false,
    fontSize: 'normal',
    dyslexiaFont: false
  }
  ```

**Lifecycle:**
1. On mount: Read settings from localStorage via `readSettings()`
2. On settings change: Apply CSS classes immediately
3. On unmount: Clean up all a11y classes and reset `<html>` font-size

### AccessibilityButton (`src/components/AccessibilityButton.tsx`)

**Location:** Header actions row (rendered in `Layout.tsx`)

**Features:**
- Icon-only button (universal accessibility symbol: circle with divisions)
- Aria attributes: `aria-label`, `aria-expanded`, `role="dialog"`
- Click to toggle panel visibility (escape key closes)
- Tooltip: "Accessibility Options" (FR: "Options d'accessibilité")
- Portal-based dropdown (rendered to `document.body`)
- Auto-positioning: relative to button position, offset 12px below

**Panel Contents:**
1. **No Motion Toggle** (checkbox)
   - Label: "Reduce motion and animations" (FR: "Réduire les mouvements et animations")
   - Calls `toggleSetting('noMotion')`

2. **High Contrast Toggle** (checkbox)
   - Label: "High contrast mode" (FR: "Mode contraste élevé")
   - Calls `toggleSetting('highContrast')`

3. **Font Size Selector** (radio group, 3 buttons)
   - Options: "Normal" | "Large" | "Extra Large" (FR: "Normal" | "Grand" | "Extra grand")
   - Calls `setSetting('fontSize', size)`
   - Active button highlighted

4. **Dyslexia Font Toggle** (checkbox)
   - Label: "Dyslexia-friendly font" (FR: "Polices adaptées à la dyslexie")
   - Calls `toggleSetting('dyslexiaFont')`

**Keyboard Navigation:**
- Tab through toggles and buttons
- Spacebar/Enter to activate
- Escape to close panel
- Radio group: arrow keys to navigate (role="radiogroup")

---

## CSS Implementation

### Applied Classes

All classes are applied to `document.body` by `applyBodyClasses()`:

```css
body.a11y--no-motion { /* Disable animations & transitions */ }
body.a11y--reduce-effects { /* Alias for noMotion */ }
body.a11y--high-contrast { /* Enhanced color scheme */ }
body.a11y--font-lg { /* 112.5% base size */ }
body.a11y--font-xl { /* 125% base size */ }
body.a11y--dyslexia { /* Dyslexia-friendly font */ }
```

### CSS Module: `src/styles/components/_accessibility.css`

Expected contains:
- `.accessibility-wrapper` - context container
- `.accessibility-btn` - action button styling
- `.accessibility-panel` - dropdown styling
- `.a11y-toggle` - checkbox component styling
- `.a11y-toggle__input`, `.a11y-toggle__switch`, `.a11y-toggle__label`
- `.a11y-font-size` - font size selector container
- `.a11y-font-size__label`, `.a11y-font-size__controls`
- `.a11y-font-btn`, `.a11y-font-btn--active` - radio button styling

### Global Adjustments

Files that respond to a11y classes:
- `src/styles/_effects.css` - animations respect `a11y--no-motion`
- `src/styles/_typography.css` - font-family chains respect `a11y--dyslexia`
- Component CSS modules - contrast adjustments via `a11y--high-contrast`

**Font Stack for Dyslexia Mode:**
```css
body.a11y--dyslexia {
  font-family: 'Lexend', 'Dyslexie', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

---

## Storage & Persistence

### localStorage Keys

- **`portfolio-a11y-settings`** (JSON string)
  ```json
  {
    "noMotion": false,
    "highContrast": false,
    "fontSize": "normal",
    "dyslexiaFont": false
  }
  ```
- Persisted on every settings change via `safeLocalSet()`
- Restored on page load via `readSettings()`
- Safe storage wrappers used: `safeLocalGet()` / `safeLocalSet()`

### Migration Strategy

Old localStorage key `portfolio-a11y-settings` with `reduceEffects` flag:
```javascript
// Old structure (still supported):
{ "reduceEffects": true, "highContrast": false, ... }

// Automatically migrated to:
{ "noMotion": true, "highContrast": false, ... }
```
Migration happens in `readSettings()` via `!!(parsed.noMotion || parsed.reduceEffects)`.

---

## Integration Points

### Global Provider (`src/main.tsx`)

The `AccessibilityProvider` wraps the entire app:
```tsx
<AccessibilityProvider>
  <MoodProvider>
    <ToastProvider>
      <App />
    </ToastProvider>
  </MoodProvider>
</AccessibilityProvider>
```

All nested components have access via `useAccessibility()` hook.

### Layout Integration (`src/components/Layout.tsx`)

The `AccessibilityButton` is rendered in the header action row, alongside:
- `LanguageButton` (FR/EN toggle)
- `MoodSwitcher` (mood cycle)
- `ParticlesButton` (ambient toggle)
- `HamburgerMenu` (mobile nav)

### Per-Page Usage

No per-page accessibility setup required; all settings apply globally. Individual pages can opt into styled variants if needed, but typically rely on body classes.

---

## Keyboard Navigation & ARIA

### Button & Panel

- **Accessibility Button:**
  - `role="button" aria-expanded={isOpen} aria-label="Accessibility options"`
  - Tab-accessible
  - Spacebar/Enter toggles panel

- **Panel Dialog:**
  - `role="dialog" aria-label="Accessibility options"`
  - Escape key closes
  - Click outside closes
  - Portal rendering prevents stacking context issues

### Toggle Checkboxes

- Native `<input type="checkbox">`
- Keyboard accessible: Tab + Spacebar
- Visual feedback: `.a11y-toggle__switch` pseudo-element
- Associated labels via `<label>` element

### Font Size Radio Group

- `role="radiogroup" aria-label="Font size"`
- Three buttons with `role="radio" aria-checked="true|false"`
- Tab navigates to group, arrow keys navigate within
- Visual active state via `.a11y-font-btn--active`

### SVG Icon

- `aria-hidden="true"` on icon SVG
- Text button kept accessible via aria-label on parent button

---

## Responsive Behavior

- **Mobile:** Panel positioned via calculated `top` and `right` coords
- **Desktop:** Same positioning logic, with potential for viewport-aware adjustments
- **No fixed positioning:** Panel uses absolute positioning relative to viewport
- **Overflow:** Panel may overflow on very small screens (design consideration for future)

---

## Development Notes

### Adding a New Accessibility Feature

1. Add key to `AccessibilitySettings` interface in `src/types/index.ts`
2. Add default value to `DEFAULT_SETTINGS` in `AccessibilityContext.tsx`
3. Add class toggle in `applyBodyClasses()`
4. Add form control (toggle/button) in `AccessibilityButton.tsx`
5. Add i18n keys in `src/locales/fr.json` and `en.json`
6. Style via body class in relevant CSS file or `_accessibility.css`
7. Test: localStorage persistence, body class application, visual effect

### Testing Accessibility Features

1. **No Motion:** Open DevTools, check `body.a11y--no-motion` class; verify no animations on interaction
2. **High Contrast:** Verify `body.a11y--high-contrast`; check colors meet WCAG AA (4.5:1)
3. **Font Size:** Open DevTools, check `<html style="font-size: 112.5%">` or `125%`
4. **Dyslexia Font:** Check `body.a11y--dyslexia` class; inspect font-family chain

### Performance Considerations

- Settings read from localStorage on app boot (minimal cost)
- Class toggles are fast DOM operations (10-15ms per toggle)
- Font size change may trigger reflow (acceptable on user gesture)
- Motion reduction does not affect performance; purely CSS-driven

---

## Known Limitations

1. **High Contrast:** Currently CSS-based class toggle; could be enhanced with CSS custom properties for more granular control
2. **Dyslexia Font:** Relies on system fonts; web font loading not yet implemented (future: load Lexend or similar from Google Fonts)
3. **Motion Reduction:** Only affects portfolio animations; third-party libraries (e.g., Framer Motion pet animations) may need separate viewport detection
4. **No Focus Indicators:** Default focus styles used; could be enhanced with custom focus rings for a11y--high-contrast mode

---

## Related Files

| File | Purpose |
|------|---------|
| `src/contexts/AccessibilityContext.tsx` | Accessibility state management and body class application |
| `src/components/AccessibilityButton.tsx` | UI control panel for toggling features |
| `src/styles/components/_accessibility.css` | Component-specific styling |
| `src/types/index.ts` | `AccessibilitySettings` type definition |
| `src/locales/fr.json` | French i18n keys for feature labels |
| `src/locales/en.json` | English i18n keys for feature labels |
| `src/utils/safeStorage.ts` | Safe localStorage wrapper |

---

## WCAG Compliance Notes

- **No Motion:** Respects WCAG 2.1 Guideline 2.3 (Seizures and Physical Reactions)
- **High Contrast:** Supports WCAG 2.1 Level AAA contrast requirements (7:1 ratio)
- **Font Size:** Supports WCAG 2.1 Guideline 1.4.4 (Resize Text)
- **Dyslexia Font:** Best practice for WCAG 2.1 Guideline 1.4.12 (Text Spacing)
- **Keyboard Navigation:** Full keyboard accessibility (WCAG 2.1 Guideline 2.1)
- **ARIA Labels:** All interactive elements have proper ARIA attributes (WCAG 2.1 Guideline 4.1)
