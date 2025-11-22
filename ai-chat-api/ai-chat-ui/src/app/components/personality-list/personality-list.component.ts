import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { Personality } from '../../models/personality.model';
import { ThemeMenuComponent } from '../theme-menu/theme-menu.component';

@Component({
  selector: 'app-personality-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ThemeMenuComponent],
  templateUrl: './personality-list.component.html',
  styleUrl: './personality-list.component.scss',
})
export class PersonalityListComponent implements OnInit {
  personalities: Personality[] = [];
  isLoading = false;
  errorMessage = '';
  resetMessage = '';
  isResetting = false;
  deletingSlug: string | null = null;
  flipped = new Set<string>();

  private readonly apiBase = 'http://localhost:3000';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.loadPersonalities();
  }

  loadPersonalities() {
    this.isLoading = true;
    this.resetMessage = '';
    this.errorMessage = '';

    this.http
      .get<Personality[]>(`${this.apiBase}/personalities`)
      .subscribe({
        next: (list) => {
          this.personalities = (list ?? []).sort((a, b) =>
            a.name.localeCompare(b.name),
          );
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Failed to load personalities', err);
          this.errorMessage =
            'We could not load the personalities. Please try again.';
          this.isLoading = false;
        },
      });
  }

  trackBySlug(_index: number, personality: Personality) {
    return personality.slug;
  }

  goToChat(personality: Personality) {
    if (!personality?.slug) {
      return;
    }

    this.router.navigate(['/chat', personality.slug]);
  }

  getPromptPreview(personality: Personality): string {
    const prompt = (personality.basePrompt ?? '').replace(/\s+/g, ' ').trim();
    if (!prompt) {
      return 'No description has been added yet.';
    }

    return prompt.length > 200 ? `${prompt.slice(0, 197)}...` : prompt;
  }

  isFlipped(personality: Personality): boolean {
    return this.flipped.has(personality.slug);
  }

  toggleFlip(personality: Personality, event?: Event) {
    event?.stopPropagation();
    if (this.flipped.has(personality.slug)) {
      this.flipped.delete(personality.slug);
    } else {
      this.flipped.add(personality.slug);
    }
  }

  goToEdit(personality: Personality, event?: Event) {
    event?.stopPropagation();
    this.router.navigate(['/personalities', personality.slug, 'edit']);
  }

  confirmDelete(personality: Personality, event?: Event) {
    event?.stopPropagation();
    const ok = window.confirm(`Delete "${personality.name}"? This cannot be undone.`);
    if (!ok) return;
    this.deletingSlug = personality.slug;
    this.http.delete(`${this.apiBase}/personalities/${personality.slug}`).subscribe({
      next: () => {
        this.personalities = this.personalities.filter(
          (p) => p.slug !== personality.slug,
        );
        this.deletingSlug = null;
        this.flipped.delete(personality.slug);
      },
      error: (err) => {
        console.error('Failed to delete personality', err);
        this.errorMessage = 'Could not delete personality.';
        this.deletingSlug = null;
      },
    });
  }

  resetEverything() {
    const confirmed = window.confirm(
      'This will delete all personalities, conversations, messages, and long-term memories. Users will stay intact. Continue?',
    );
    if (!confirmed) {
      return;
    }

    this.isResetting = true;
    this.errorMessage = '';
    this.resetMessage = '';

    this.http
      .post<{ ok: boolean }>(`${this.apiBase}/maintenance/reset`, {})
      .subscribe({
        next: () => {
          this.isResetting = false;
          this.personalities = [];
          this.resetMessage =
            'All personalities, conversations, and long-term memories were deleted. Users were kept.';
        },
        error: (err) => {
          console.error('Failed to reset data', err);
          this.errorMessage =
            'Reset failed. Please try again or check the server logs.';
          this.isResetting = false;
        },
      });
  }
}
