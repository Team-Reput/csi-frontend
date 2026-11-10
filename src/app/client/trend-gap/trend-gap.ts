import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CsiDataApiService } from '../../core/services/csi-data-api.service';
import { CommonPageHeader } from '../../common/cards/common-page-header/common-page-header';

@Component({
  selector: 'app-trend-gap',
  standalone: true,
  imports: [CommonModule, CommonPageHeader],
  template: `
    <app-common-page-header
      eyebrow="Agency forecast coverage &middot; Nike"
      title="Trend Gap"
      desc="External trends from WGSN, Pantone, Coloro, and PV matched against Nike's active 1,001 color standards."
    />

    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:12px">
      @for (t of trends(); track (t.trend || t.name) + t.source) {
        <div class="card" style="margin-bottom:0">
          <div style="display:flex;align-items:center;gap:12px">
            <div class="sw" [style.background]="t.hex"></div>
            <div style="flex:1">
              <div style="font-size:11px;color:var(--text-faint);text-transform:uppercase;font-family:var(--mono)">
                {{ t.source }}
              </div>
              <div style="font-weight:700;font-size:13.5px">{{ t.trend || t.name }}</div>
            </div>
            <span
              class="badge"
              [ngClass]="isCovered(t.trend) ? 'b-Breakout' : 'b-Dormant'"
            >
              {{ isCovered(t.trend) ? 'covered' : 'gap' }}
            </span>
          </div>
          <div style="font-size:11px;color:var(--text-soft);margin-top:10px">
            {{ isCovered(t.trend) ? 'In Nike palette · orders active' : 'Not in palette · candidate standard' }}
          </div>
        </div>
      }
    </div>
  `
})
export class TrendGap {
  readonly api = inject(CsiDataApiService);

  readonly trends = computed(() => this.api.db()?.trends || []);
  readonly coveredList = computed(() => this.api.db()?.nike?.gap?.covered || []);

  isCovered(trendName: string): boolean {
    return this.coveredList().includes(trendName);
  }
}
