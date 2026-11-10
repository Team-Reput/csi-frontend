import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CsiDataApiService } from '../../core/services/csi-data-api.service';
import { CommonPageHeader } from '../../common/cards/common-page-header/common-page-header';
import { CommonKpiRow, KpiItem } from '../../common/cards/common-kpi-row/common-kpi-row';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CommonPageHeader, CommonKpiRow],
  template: `
    @if (api.db()?.nike; as nk) {
      <app-common-page-header
        eyebrow="Brand Workspace &middot; Nike"
        title="Nike Palette Dashboard"
        desc="Scoped to Nike's 1,001 color standards and committed orders, benchmarked against network demand."
      />

      <app-common-kpi-row [items]="kpis()" />

      <div class="grid-2">
        <div class="card">
          <div class="card-h">
            <h3>Fastest-Accelerating Colors in Nike's Palette</h3>
            <button class="btn-ghost" (click)="goTo('/client/my-colors')">
              All 1,001 colors &rarr;
            </button>
          </div>
          @for (c of nk.colors.slice(0, 6); track c.id) {
            <div
              class="list-row"
              (click)="openColor(c.id)"
            >
              <div class="sw" [style.background]="c.hex"></div>
              <div style="flex:1">
                <div style="font-weight:600">{{ c.n }}</div>
                <div style="font-size:11px;color:var(--text-faint)">
                  {{ c.id }} &middot; {{ c.fam }}
                </div>
              </div>
              <span class="badge" [ngClass]="'b-' + c.q">{{ c.q }}</span>
              <div
                style="font-family:var(--mono);font-size:12px;font-weight:700;margin-left:8px;color:var(--q-emerging)"
              >
                {{ c.e }}
              </div>
            </div>
          }
        </div>

        <div class="card">
          <div class="card-h">
            <h3>Top White-Space Recommendations</h3>
            <button class="btn-ghost" (click)="goTo('/client/recommendations')">
              View all &rarr;
            </button>
          </div>
          @for (d of nk.recommendations.slice(0, 5); track d.dir_id) {
            <div
              class="list-row"
              (click)="openDir(d.dir_id)"
            >
              <div class="sw-stack">
                @for (m of d.members.slice(0, 4); track m.id) {
                  <div [style.background]="m.hex"></div>
                }
              </div>
              <div style="flex:1;min-width:0">
                <div style="font-weight:700;font-size:13px">{{ d.leader }}</div>
                <div style="font-size:11px;color:var(--text-faint)">
                  {{ d.family }} &middot; {{ api.fmt(d.vol) }} units
                </div>
              </div>
              <div style="text-align:right">
                <div style="font-weight:800;font-size:14px;color:var(--q-emerging)">
                  {{ d.avg }}
                </div>
                <div style="font-size:9px;color:var(--text-faint);font-family:var(--mono)">
                  EMERGENCE
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    }
  `
})
export class Dashboard {
  readonly api = inject(CsiDataApiService);
  private readonly router = inject(Router);

  readonly kpis = computed<KpiItem[]>(() => {
    const nk = this.api.db()?.nike;
    if (!nk) return [];
    return [
      {
        label: 'Active Colors',
        value: nk.colorCount.toLocaleString(),
        sub: 'in Nike palette',
        bar: 'var(--grad-leaf)'
      },
      {
        label: 'Emerging in Palette',
        value: nk.emergingCount,
        sub: 'surging across the market',
        bar: 'var(--grad-gold)'
      },
      {
        label: 'Total Volume',
        value: this.api.fmt(nk.totalVolume),
        sub: 'units Jan 2006 – Sep 2026',
        bar: 'var(--grad-forest)'
      },
      {
        label: 'White-Space Directions',
        value: nk.recommendations.length,
        sub: 'recommendations ready',
        bar: 'linear-gradient(135deg,#2f81c9,#5aa5e0)'
      }
    ];
  });

  goTo(route: string): void {
    this.router.navigateByUrl(route);
  }

  openColor(id: string): void {
    this.router.navigate(['/color', id]);
  }

  openDir(dirId: number): void {
    this.router.navigate(['/direction', 'emerging', dirId]);
  }
}
