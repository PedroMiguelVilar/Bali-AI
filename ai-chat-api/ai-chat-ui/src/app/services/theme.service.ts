import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { ThemeDefinition } from '../models/theme.model';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly storageKey = 'ai-chat-theme';
  private readonly fallbackTheme: ThemeDefinition = {
    slug: 'pink',
    name: 'Pink Bloom',
    mode: 'light',
    gradient: 'linear-gradient(135deg, #ffe7f1 0%, #ffd4e7 100%)',
    palette: {
      background: '#fff7fb',
      surface: '#ffeaf3',
      panel: '#ffd8e8',
      text: '#2c0f24',
      mutedText: '#7a3b5c',
      border: '#f7c0d8',
      accent: '#ff5fa2',
      accentMuted: '#ffc3de',
      accentContrast: '#290a18',
      input: '#ffeef6',
      success: '#16a34a',
      warning: '#f59e0b',
      danger: '#ef4444',
    },
  };

  private themes$ = new BehaviorSubject<ThemeDefinition[]>([
    this.fallbackTheme,
  ]);
  private activeTheme$ = new BehaviorSubject<ThemeDefinition>(
    this.fallbackTheme,
  );
  private loaded = false;

  constructor(private http: HttpClient) {}

  get themes() {
    return this.themes$.asObservable();
  }

  get activeTheme() {
    return this.activeTheme$.asObservable();
  }

  get activeThemeSnapshot() {
    return this.activeTheme$.value;
  }

  /**
   * Fetch themes from the API once and apply the stored or default theme.
   */
  async init(): Promise<void> {
    if (this.loaded) return;
    this.loaded = true;

    try {
      const [themes, defaultTheme] = await Promise.all([
        firstValueFrom(
          this.http.get<ThemeDefinition[]>('http://localhost:3000/themes'),
        ),
        firstValueFrom(
          this.http.get<ThemeDefinition>('http://localhost:3000/themes/default'),
        ),
      ]);

      const list = Array.isArray(themes) && themes.length ? themes : [];
      this.themes$.next(list.length ? list : [this.fallbackTheme]);

      const storedSlug = this.getStoredSlug();
      const defaultSlug =
        storedSlug && list.find((t) => t.slug === storedSlug)
          ? storedSlug
          : defaultTheme?.slug ?? list[0]?.slug;

      if (defaultSlug) {
        this.applyThemeBySlug(defaultSlug);
      } else {
        this.applyTheme(this.fallbackTheme);
      }
    } catch (err) {
      console.warn('Using fallback theme because loading failed', err);
      this.themes$.next([this.fallbackTheme]);
      this.applyTheme(this.fallbackTheme);
    }
  }

  async applyThemeBySlug(slug: string) {
    const theme =
      this.themes$.value.find((t) => t.slug === slug) ?? this.fallbackTheme;
    this.applyTheme(theme);
  }

  private applyTheme(theme: ThemeDefinition) {
    this.activeTheme$.next(theme);
    this.persistSlug(theme.slug);
    this.setCssVariables(theme);
  }

  private setCssVariables(theme: ThemeDefinition) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const p = theme.palette;
    const accentEncoded = (p.accent || '').replace('#', '%23');

    root.style.setProperty('--theme-background', p.background);
    root.style.setProperty('--theme-surface', p.surface);
    root.style.setProperty('--theme-panel', p.panel);
    root.style.setProperty('--theme-text', p.text);
    root.style.setProperty('--theme-muted', p.mutedText);
    root.style.setProperty('--theme-border', p.border);
    root.style.setProperty('--theme-accent', p.accent);
    root.style.setProperty('--theme-accent-muted', p.accentMuted);
    root.style.setProperty('--theme-accent-contrast', p.accentContrast);
    root.style.setProperty('--theme-input', p.input);
    root.style.setProperty('--theme-success', p.success);
    root.style.setProperty('--theme-warning', p.warning);
    root.style.setProperty('--theme-danger', p.danger);
    root.style.setProperty(
      '--theme-gradient',
      theme.gradient || `linear-gradient(135deg, ${p.accent}, ${p.accentMuted})`,
    );
    root.style.setProperty(
      '--theme-cursor',
      `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='48' viewBox='0 0 24 24'><path fill='${accentEncoded}' stroke='%23000' stroke-width='2' d='M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.35Z'/></svg>"), auto`,
    );
  }

  private getStoredSlug(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(this.storageKey);
  }

  private persistSlug(slug: string) {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(this.storageKey, slug);
  }
}
