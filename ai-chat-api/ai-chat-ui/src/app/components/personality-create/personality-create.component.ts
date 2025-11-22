import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { Personality } from '../../models/personality.model';

interface ModelOption {
  name: string;
  label?: string;
  provider?: string;
  description?: string | null;
}

interface TraitPreset {
  key: string;
  label: string;
  description: string;
  prompt: string;
}

interface AppearancePreset {
  id: string;
  label: string;
  description: string;
  avatar: string;
  accentColor?: string;
}

@Component({
  selector: 'app-personality-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './personality-create.component.html',
  styleUrl: './personality-create.component.scss',
})
export class PersonalityCreateComponent implements OnInit {
  creation = {
    name: '',
    model: '',
    basePrompt: '',
    description: '',
    traits: [] as string[],
    appearancePreset: '',
  };

  options: {
    models: ModelOption[];
    traitPresets: TraitPreset[];
    appearancePresets: AppearancePreset[];
  } = { models: [], traitPresets: [], appearancePresets: [] };

  creating = false;
  message = '';
  error = '';

  private readonly apiBase = 'http://localhost:3000';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.loadOptions();
  }

  loadOptions() {
    this.http
      .get<{
        models: ModelOption[];
        traitPresets: TraitPreset[];
        appearancePresets: AppearancePreset[];
      }>(`${this.apiBase}/personalities/options`)
      .subscribe({
        next: (opts) => {
          this.options =
            opts ?? ({ models: [], traitPresets: [], appearancePresets: [] } as any);
          if (this.options.models.length && !this.creation.model) {
            this.creation.model = this.options.models[0].name;
          }
          if (this.options.appearancePresets.length && !this.creation.appearancePreset) {
            this.creation.appearancePreset = this.options.appearancePresets[0].id;
          }
        },
        error: (err) => {
          console.error('Failed to load options', err);
          this.error = 'Could not load creation options.';
        },
      });
  }

  toggleTrait(key: string) {
    const idx = this.creation.traits.indexOf(key);
    if (idx >= 0) {
      this.creation.traits.splice(idx, 1);
    } else {
      this.creation.traits.push(key);
    }
  }

  selectAppearance(preset: AppearancePreset) {
    this.creation.appearancePreset = preset.id;
  }

  slugPreview(): string {
    const slug = this.slugify(this.creation.name);
    return slug || 'auto';
  }

  private slugify(value: string): string {
    return (value || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  submit() {
    this.message = '';
    this.error = '';

    if (!this.creation.name || !this.creation.basePrompt) {
      this.error = 'Name and base prompt are required.';
      return;
    }

    this.creating = true;

    const payload = {
      name: this.creation.name,
      model: this.creation.model,
      basePrompt: this.buildPrompt(),
      description: this.creation.description || undefined,
      traits: this.creation.traits,
      appearancePreset: this.creation.appearancePreset || undefined,
    };

    this.http.post<Personality>(`${this.apiBase}/personalities`, payload).subscribe({
      next: (created) => {
        this.message = `Created "${created?.name ?? 'personality'}".`;
        this.creating = false;
        this.router.navigate(['/chat', created.slug]);
      },
      error: (err) => {
        console.error('Failed to create personality', err);
        this.error =
          err?.error || 'Could not create personality. Please try again.';
        this.creating = false;
      },
    });
  }

  private buildPrompt(): string {
    const traitTexts = this.creation.traits
      .map((key) => this.options.traitPresets.find((t) => t.key === key)?.prompt)
      .filter(Boolean);
    const appearance = this.options.appearancePresets.find(
      (a) => a.id === this.creation.appearancePreset,
    );
    const appearanceText = appearance
      ? `Persona mood: Adopt the "${appearance.label}" vibe (${appearance.description}).`
      : '';

    return [
      this.creation.basePrompt.trim(),
      traitTexts.length ? `Style:\n${traitTexts.join('\n')}` : '',
      appearanceText,
    ]
      .filter(Boolean)
      .join('\n\n');
  }
}
