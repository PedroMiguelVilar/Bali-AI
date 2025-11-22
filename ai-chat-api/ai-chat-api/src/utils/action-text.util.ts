const ACTION_PATTERN = /(?<!\*)\*(?!\*)([\s\S]*?)(?<!\*)\*(?!\*)/g;
const ACTION_PREFIX = '[[ACTION]]';
const ACTION_SUFFIX = '[[/ACTION]]';

export function annotateActionText(text?: string | null): string {
  if (!text) return '';
  if (!text.includes('*')) return text;

  return text.replace(ACTION_PATTERN, (_, action) => {
    const normalized = action.trim();
    const payload = normalized.length ? normalized : action;
    return `${ACTION_PREFIX} ${payload} ${ACTION_SUFFIX}`;
  });
}
