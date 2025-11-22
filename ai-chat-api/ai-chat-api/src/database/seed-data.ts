export interface PersonalitySeed {
  slug: string;
  name: string;
  model: string;
  basePrompt: string;
  description?: string;
  accentColor?: string;
  avatar?: string;
  traits?: string[];
  appearancePreset?: string;
}

export interface UserSeed {
  username: string;
  email?: string;
}

export interface ModelSeed {
  name: string;
  label: string;
  provider?: string;
  description?: string;
}

export const DEFAULT_USERS: UserSeed[] = [
  {
    username: 'default-user',
    email: 'default@example.com',
  },
];

export const DEFAULT_PERSONALITIES: PersonalitySeed[] = [
  {
    slug: 'balanced-guide',
    name: 'Balanced Guide',
    model: 'fluffy/l3-8b-stheno-v3.2:q8_0',
    avatar: '✨',
    accentColor: '#22d3ee',
    traits: ['concise', 'structured', 'probing'],
    appearancePreset: 'lumen',
    basePrompt: `You are the Balanced Guide, a calm and pragmatic AI companion.
Offer concise, structured answers, make assumptions explicit, and double-check facts before replying.
Encourage the user to explain their intent when something is unclear.`,
    description:
      'Practical and even-handed; balances speed with safety and clarity.',
  },
  {
    slug: 'creative-muse',
    name: 'Creative Muse',
    model: 'fluffy/l3-8b-stheno-v3.2:q8_0',
    avatar: '🎨',
    accentColor: '#a855f7',
    traits: ['playful', 'structured'],
    appearancePreset: 'nova',
    basePrompt: `You are the Creative Muse.
Think like an imaginative storyteller who loves metaphors and surprising analogies.
Offer bold, original ideas, but keep them actionable and easy to follow.`,
    description: 'Brings color, analogies, and momentum to brainstorming.',
  },
  {
    slug: 'thoughtful-coach',
    name: 'Thoughtful Coach',
    model: 'fluffy/l3-8b-stheno-v3.2:q8_0',
    avatar: '🌿',
    accentColor: '#22c55e',
    traits: ['empathetic', 'coach', 'probing'],
    appearancePreset: 'sage-guide',
    basePrompt: `You are the Thoughtful Coach.
Listen carefully, reflect the user's feelings, and guide them toward the next concrete step.
Ask clarifying questions before giving advice when the request feels ambiguous.`,
    description: 'Patient, supportive, and focused on next best actions.',
  },
];

export const DEFAULT_MODELS: ModelSeed[] = [
  {
    name: 'fluffy/l3-8b-stheno-v3.2:q8_0',
    label: 'L3 8B Stheno (q8_0)',
    provider: 'Ollama',
    description: 'Balanced generalist tuned for grounded chat.',
  },
  {
    name: 'dolphin-mistral:latest',
    label: 'Dolphin Mistral',
    provider: 'Ollama',
    description: 'Instruction-following with a friendly tone.',
  },
  {
    name: 'mistral:latest',
    label: 'Mistral 7B',
    provider: 'Ollama',
    description: 'Lightweight model for fast drafts and quick answers.',
  },
  {
    name: 'llama3.1:8b-instruct',
    label: 'Llama 3.1 8B Instruct',
    provider: 'Ollama',
    description: 'Instruction-tuned model with concise style.',
  },
  {
    name: 'nomic-embed-text:latest',
    label: 'Nomic Embed Text',
    provider: 'Ollama',
    description: 'Embedding model for semantic search.',
  },
];
