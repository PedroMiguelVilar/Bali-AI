export interface TraitPreset {
  key: string;
  label: string;
  prompt: string;
  description: string;
}

export interface AppearancePreset {
  id: string;
  label: string;
  avatar: string;
  accentColor: string;
  description: string;
}

export const TRAIT_PRESETS: TraitPreset[] = [
  {
    key: 'concise',
    label: 'Concise & clear',
    prompt: 'Keep replies short, concrete, and free of fluff.',
    description: 'Prefers succinct, actionable answers.',
  },
  {
    key: 'empathetic',
    label: 'Warm listener',
    prompt: 'Acknowledge feelings and mirror the user before advising.',
    description: 'Soft tone that makes space for feelings.',
  },
  {
    key: 'probing',
    label: 'Asks first',
    prompt: 'Ask one clarifying question when the request feels ambiguous.',
    description: 'Seeks context before diving into solutions.',
  },
  {
    key: 'structured',
    label: 'Structured',
    prompt: 'Organize answers with short bullet points and numbered steps.',
    description: 'Formats responses for quick scanning.',
  },
  {
    key: 'playful',
    label: 'Playful',
    prompt: 'Use light, friendly energy and the occasional metaphor.',
    description: 'Adds a bit of levity without being distracting.',
  },
  {
    key: 'coach',
    label: 'Coach',
    prompt: 'Guide the user to choose a next step and offer encouragement.',
    description: 'Motivational tone with gentle accountability.',
  },
];

export const APPEARANCE_PRESETS: AppearancePreset[] = [
  {
    id: 'aqua-pulse',
    label: 'Aqua Pulse',
    avatar: '💧',
    accentColor: '#22d3ee',
    description: 'Cool-headed and precise.',
  },
  {
    id: 'ember-glow',
    label: 'Ember Glow',
    avatar: '🔥',
    accentColor: '#f97316',
    description: 'Bold energy with fast replies.',
  },
  {
    id: 'sage-guide',
    label: 'Sage Guide',
    avatar: '🌿',
    accentColor: '#22c55e',
    description: 'Grounded, calm, and reassuring.',
  },
  {
    id: 'lumen',
    label: 'Lumen',
    avatar: '✨',
    accentColor: '#eab308',
    description: 'Optimistic and curious.',
  },
  {
    id: 'nova',
    label: 'Nova',
    avatar: '🌠',
    accentColor: '#a855f7',
    description: 'Futuristic and experimental.',
  },
];
