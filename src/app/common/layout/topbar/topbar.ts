import { Component, inject, signal, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthRoleService } from '../../../core/services/auth-role.service';
import { CsiDataApiService } from '../../../core/services/csi-data-api.service';
import { ColorStandard, TrendDirection } from '../../../core/models/csi.models';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss'
})
export class Topbar {
  readonly auth = inject(AuthRoleService);
  readonly api = inject(CsiDataApiService);
  private readonly router = inject(Router);
  private readonly elRef = inject(ElementRef);

  readonly crumbSection = signal<string>('Intelligence');
  readonly crumbPage = signal<string>('Command Center');
  readonly searchQuery = signal<string>('');
  readonly searchOpen = signal<boolean>(false);
  readonly matchedDirections = signal<Array<TrendDirection & { lens: 'emerging' | 'trending' }>>([]);
  readonly matchedColors = signal<ColorStandard[]>([]);

  constructor() {
    this.updateBreadcrumbs(this.router.url);
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.updateBreadcrumbs(e.urlAfterRedirects);
        this.searchOpen.set(false);
      });
  }

  private updateBreadcrumbs(url: string): void {
    if (url.startsWith('/color/')) {
      const id = decodeURIComponent(url.replace('/color/', ''));
      const c = this.api.findColorById(id);
      this.crumbSection.set('Color standard');
      this.crumbPage.set(c ? `${c.n} (${c.id})` : id);
      return;
    }
    if (url.startsWith('/direction/')) {
      const parts = url.split('/');
      const lens = parts[2] === 'emerging' ? 'Emerging' : 'Trending';
      const id = Number(parts[3]);
      const d = this.api.findDirection(parts[2] as 'emerging' | 'trending', id);
      this.crumbSection.set(`${lens} Direction`);
      this.crumbPage.set(d ? d.leader : `Direction #${id}`);
      return;
    }
    if (url.includes('/customer-portfolio/portal/')) {
      const code = url.split('/portal/')[1];
      const name = this.api.db()?.demoNames?.[code] || code;
      this.crumbSection.set('Brand Portal Preview');
      this.crumbPage.set(`${name} (${code})`);
      return;
    }

    for (const g of [...this.auth.csiNavGroups, ...this.auth.clientNavGroups]) {
      for (const item of g.items) {
        if (url.startsWith(item.route)) {
          this.crumbSection.set(g.label);
          this.crumbPage.set(item.t);
          return;
        }
      }
    }

    for (const s of this.auth.setupSteps) {
      if (url.startsWith(s.route)) {
        this.crumbSection.set('Setup');
        this.crumbPage.set(s.t);
        return;
      }
    }
  }

  onSearchInput(val: string): void {
    this.searchQuery.set(val);
    const s = val.trim().toLowerCase();
    if (!s) {
      this.searchOpen.set(false);
      return;
    }
    const db = this.api.db();
    if (!db) return;

    const dirs = [
      ...db.emergingDirections.map((d) => ({ ...d, lens: 'emerging' as const })),
      ...db.trendingDirections.map((d) => ({ ...d, lens: 'trending' as const }))
    ]
      .filter((d) => d.leader.toLowerCase().includes(s) || d.family.toLowerCase().includes(s))
      .slice(0, 4);

    const cols = this.api
      .colorPool()
      .filter(
        (c) =>
          c.n.toLowerCase().includes(s) ||
          c.id.toLowerCase().includes(s) ||
          c.fam.toLowerCase().includes(s) ||
          c.hex.toLowerCase().includes(s)
      )
      .slice(0, 8);

    this.matchedDirections.set(dirs);
    this.matchedColors.set(cols);
    this.searchOpen.set(true);
  }

  selectDirection(lens: 'emerging' | 'trending', dirId: number): void {
    this.searchOpen.set(false);
    this.searchQuery.set('');
    this.router.navigate(['/direction', lens, dirId]);
  }

  selectColor(id: string): void {
    this.searchOpen.set(false);
    this.searchQuery.set('');
    this.router.navigate(['/color', id]);
  }

  @HostListener('document:click', ['$event'])
  onDocClick(ev: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(ev.target)) {
      this.searchOpen.set(false);
    }
  }
}

