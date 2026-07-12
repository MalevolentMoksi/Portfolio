/* ══════════════════════════════════════════════
   Shared domain types
   ══════════════════════════════════════════════ */

/* ── Performance ── */
export type PerformanceTier = 'high' | 'mid' | 'low';

/* ── Mood system ── */
export type MoodKey = 'default' | 'hacker' | 'vaporwave' | 'europa' | 'industrial' | 'nightshade';

export interface MoodConfig {
  label: string;
  emoji: string;
  color: string;
  rgb: string;
}

export type MoodMap = Record<MoodKey, MoodConfig>;

/* ── Toast ── */
export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'music';

/* ── Accessibility ── */
export type FontSize = 'normal' | 'lg' | 'xl';

export interface AccessibilitySettings {
  noMotion: boolean;
  highContrast: boolean;
  fontSize: FontSize;
  dyslexiaFont: boolean;
}

/* ── Projects ── */
export interface Technology {
  name: string;
  icon: string;
}

export interface AcademicProjectBase {
  id: string;
  path: string;
  typeKey: string;
  titleKey: string;
  categoryKey: string;
  descriptionKey: string;
  teamSizeKey: string;
  image: string;
  video?: string;
  tagKeys: string[];
  technologies: Technology[];
  featured?: boolean;
  badgeKey?: string;
}

export interface AcademicProject {
  id: string;
  path: string;
  image: string;
  video?: string;
  tagKeys: string[];
  technologies: Technology[];
  featured?: boolean;
  badgeKey?: string;
  type: string;
  title: string;
  category: string;
  description: string;
  teamSize: string;
  tags: string[];
}

export interface PersonalProjectBase {
  id: string;
  titleKey: string;
  descriptionKey: string;
  tagKeys: string[];
  image: string;
  link?: string;
}

export interface PersonalProject {
  id: string;
  tagKeys: string[];
  image: string;
  link?: string;
  title: string;
  description: string;
  tags: string[];
}

/* ── Pet ── */
export type PetMood = 'happy' | 'content' | 'sad';

export interface Achievement {
  id: string;
  key: string;
  label: string;
  desc: string;
  hint: string;
}
