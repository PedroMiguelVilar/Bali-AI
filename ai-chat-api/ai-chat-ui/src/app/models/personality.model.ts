export interface Personality {
  id: number;
  name: string;
  slug: string;
  basePrompt?: string;
  model?: string;
  description?: string | null;
  accentColor?: string | null;
  avatar?: string | null;
  traits?: string[] | null;
  appearancePreset?: string | null;
}
