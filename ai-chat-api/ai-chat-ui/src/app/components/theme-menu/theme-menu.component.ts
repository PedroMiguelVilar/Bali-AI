import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ThemeDefinition } from '../../models/theme.model';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-theme-menu',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './theme-menu.component.html',
  styleUrls: ['./theme-menu.component.scss'],
})
export class ThemeMenuComponent implements OnInit, OnDestroy {
  themes: ThemeDefinition[] = [];
  activeSlug = '';
  isLoading = true;
  menuOpen = false;
  private closeTimer?: ReturnType<typeof setTimeout>;

  private listSub?: Subscription;
  private activeSub?: Subscription;

  constructor(private readonly themeService: ThemeService) {}

  async ngOnInit(): Promise<void> {
    await this.themeService.init();

    this.listSub = this.themeService.themes.subscribe((list) => {
      this.themes = list;
      if (!this.activeSlug && list.length) {
        this.activeSlug = this.themeService.activeThemeSnapshot.slug;
      }
      this.isLoading = false;
    });

    this.activeSub = this.themeService.activeTheme.subscribe(
      (theme) => (this.activeSlug = theme.slug),
    );
  }

  ngOnDestroy(): void {
    this.listSub?.unsubscribe();
    this.activeSub?.unsubscribe();
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
    }
  }

  async select(slug: string) {
    this.activeSlug = slug;
    await this.themeService.applyThemeBySlug(slug);
  }

  get currentThemeLabel(): string {
    const theme = this.themes.find((item) => item.slug === this.activeSlug);
    if (theme) return theme.name;
    if (this.activeSlug) return this.activeSlug;
    return 'Pick theme';
  }

  onHoverEnter() {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
    }
    this.menuOpen = true;
  }

  onHoverLeave() {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
    }
    this.closeTimer = setTimeout(() => {
      this.menuOpen = false;
    }, 120);
  }
}
