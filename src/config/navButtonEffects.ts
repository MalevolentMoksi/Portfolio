const NAV_BUTTON_FEATURES = [
  'spring',
  'click-burst',
  'icon-motion',
  'depth',
  'press-crush',
  'stagger',
] as const;

export type NavButtonFeature = (typeof NAV_BUTTON_FEATURES)[number];

export const NAV_BUTTON_PRESETS = {
  default: [],
  punchy: [...NAV_BUTTON_FEATURES],
} as const satisfies Record<string, readonly NavButtonFeature[]>;

export type NavButtonPreset = keyof typeof NAV_BUTTON_PRESETS;

// Switch this to 'default' to disable the enhancement layer globally.
export const ACTIVE_NAV_BUTTON_PRESET: NavButtonPreset = 'default';

// Add one or more features here to stack on top of the preset.
export const ACTIVE_NAV_BUTTON_EXTRA_FEATURES: readonly NavButtonFeature[] = ['stagger', 'depth', 'icon-motion', 'press-crush'];

const ACTIVE_NAV_BUTTON_FEATURES = Array.from(
  new Set<NavButtonFeature>([
    ...NAV_BUTTON_PRESETS[ACTIVE_NAV_BUTTON_PRESET],
    ...ACTIVE_NAV_BUTTON_EXTRA_FEATURES,
  ])
);

export const ACTIVE_NAV_BUTTON_EFFECT_BODY_CLASSES = [
  `nav-buttons--preset-${ACTIVE_NAV_BUTTON_PRESET}`,
  ...ACTIVE_NAV_BUTTON_FEATURES.map((feature) => `nav-buttons--feature-${feature}`),
];

export const ALL_NAV_BUTTON_EFFECT_BODY_CLASSES = [
  ...Object.keys(NAV_BUTTON_PRESETS).map((preset) => `nav-buttons--preset-${preset}`),
  ...NAV_BUTTON_FEATURES.map((feature) => `nav-buttons--feature-${feature}`),
];

export const isNavButtonFeatureEnabled = (feature: NavButtonFeature): boolean =>
  ACTIVE_NAV_BUTTON_FEATURES.includes(feature);
