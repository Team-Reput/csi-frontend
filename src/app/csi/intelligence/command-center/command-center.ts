import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CsiDataApiService } from '../../../core/services/csi-data-api.service';
import { CommonPageHeader } from '../../../common/cards/common-page-header/common-page-header';
import { CommonKpiRow, KpiItem } from '../../../common/cards/common-kpi-row/common-kpi-row';
import { MarketMomentumCard } from '../../../common/cards/market-momentum-card/market-momentum-card';

@Component({
  selector: 'app-command-center',
  standalone: true,
  imports: [CommonModule, CommonPageHeader, CommonKpiRow, MarketMomentumCard],
  templateUrl: './command-center.html'
})
export class CommandCenter {
  readonly api = inject(CsiDataApiService);
  private readonly router = inject(Router);
  readonly Math = Math;

  readonly kpis = computed<KpiItem[]>(() => {
    const db = this.api.db();
    if (!db) return [];
    const m = db.meta;
    const qc = db.quadrantCounts;
    return [
      {
        label: 'Colors Scored',
        value: m.colorsScored.toLocaleString(),
        sub: `${m.familyCount} color families`,
        bar: '#1f7a45',
        trend: '100% LAB'
      },
      {
        label: 'Breakout Directions',
        value: qc.Breakout,
        sub: 'High trend + high velocity',
        bar: '#16a34a',
        trend: '+18.4%'
      },
      {
        label: 'Emerging Shades',
        value: qc.Emerging,
        sub: 'Early-stage acceleration',
        bar: '#e0932f',
        trend: '+24.1%'
      },
      {
        label: 'Order Transactions',
        value: this.api.fmt(m.transactions),
        sub: `${m.brandCount}+ brand customers`,
        bar: '#2f81c9',
        trend: '20yr span'
      }
    ];
  });

  readonly topEmerging = computed(() => (this.api.db()?.emergingDirections || []).slice(0, 5));
  readonly topTrending = computed(() => (this.api.db()?.trendingDirections || []).slice(0, 5));
  readonly breakoutShortlist = computed(() => (this.api.db()?.breakoutShortlist || []).slice(0, 8));

  goTo(route: string): void {
    this.router.navigateByUrl(route);
  }

  openDir(lens: 'emerging' | 'trending', dirId: number): void {
    this.router.navigate(['/direction', lens, dirId]);
  }
}

