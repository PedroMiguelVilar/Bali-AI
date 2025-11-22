import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
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
  selector: 'app-personality-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './personality-edit.component.html',
  styleUrl: './personality-edit.component.scss',
})
export class PersonalityEditComponent implements OnInit {
  slug = '';
  form: Personality | null = null;
  loading = true;
  saving = false;
  error = '';
  message = '';

  options: {
    models: ModelOption[];
    traitPresets: TraitPreset[];
    appearancePresets: AppearancePreset[];
  } = { models: [], traitPresets: [], appearancePresets: [] };

  private readonly apiBase = 'http://localhost:3000';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    public router: Router,
  ) {}

  ngOnInit(): void {
    this.slug = this.route.snapshot.paramMap.get('slug') || '';
    this.loadOptions();
    this.loadPersonality();
  }

  loadPersonality() {
    this.http.get<Personality>(`${this.apiBase}/personalities/${this.slug}`).subscribe({
      next: (p) => {
        this.form = { ...p };
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load personality', err);
        this.error = 'Could not load personality.';
        this.loading = false;
      },
    });
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
        },
        error: (err) => {
          console.error('Failed to load options', err);
        },
      });
  }

  toggleTrait(key: string) {
    if (!this.form) return;
    const list = this.form.traits || [];
    const idx = list.indexOf(key);
    if (idx >= 0) {
      list.splice(idx, 1);
    } else {
      list.push(key);
    }
    this.form.traits = [...list];
  }

  selectAppearance(id: string) {
    if (!this.form) return;
    this.form.appearancePreset = id;
  }

  save() {
    if (!this.form) return;
    if (!this.form.name || !this.form.basePrompt) {
      this.error = 'Name and base prompt are required.';
      return;
    }
    this.error = '';
    this.message = '';
    this.saving = true;

    const payload = {
      name: this.form.name,
      model: this.form.model,
      basePrompt: this.form.basePrompt,
      description: this.form.description,
      traits: this.form.traits || [],
      avatar: this.form.avatar,
      appearancePreset: this.form.appearancePreset,
    };

    this.http.put<Personality>(`${this.apiBase}/personalities/${this.slug}`, payload).subscribe({
      next: () => {
        this.message = 'Saved changes.';
        this.saving = false;
      },
      error: (err) => {
        console.error('Failed to save personality', err);
        this.error = 'Could not save personality.';
        this.saving = false;
      },
    });
  }

  openChat() {
    this.router.navigate(['/chat', this.slug]);
  }
}
