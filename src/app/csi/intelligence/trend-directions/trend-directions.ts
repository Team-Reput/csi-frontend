import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CsiDataApiService } from '../../../core/services/csi-data-api.service';
import { CommonPageHeader } from '../../../common/cards/common-page-header/common-page-header';

@Component({
  selector: 'app-trend-directions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CommonPageHeader],
  templateUrl: './trend-directions.html'
})
export class TrendDirections {
  readonly api = inject(CsiDataApiService);
  private readonly router = inject(Router);

  readonly dirLens = signal<'emerging' | 'trending'>('emerging');
  readonly dirFam = signal<string>('ALL');

  readonly families = computed(() => this.api.db()?.families || []);

  readonly filteredDirections = computed(() => {
    const db = this.api.db();
    if (!db) return [];
    const list = this.dirLens() === 'emerging' ? db.emergingDirections : db.trendingDirections;
    const fam = this.dirFam();
    return fam === 'ALL' ? list : list.filter((d) => d.family === fam);
  });

  openDir(dirId: number): void {
    this.router.navigate(['/direction', this.dirLens(), dirId]);
  }
}
