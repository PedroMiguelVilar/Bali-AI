export type ThemeMode = 'light' | 'dark';

export interface ThemePalette {
  background: string;
  surface: string;
  panel: string;
  text: string;
  mutedText: string;
  border: string;
  accent: string;
  accentMuted: string;
  accentContrast: string;
  input: string;
  success: string;
  warning: string;
  danger: string;
}

export interface ThemeDefinition {
  slug: string;
  name: string;
  mode: ThemeMode;
  gradient?: string;
  palette: ThemePalette;
}
