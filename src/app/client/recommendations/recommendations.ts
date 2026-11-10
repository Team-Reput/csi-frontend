import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CsiDataApiService } from '../../core/services/csi-data-api.service';
import { CommonPageHeader } from '../../common/cards/common-page-header/common-page-header';

@Component({
  selector: 'app-recommendations',
  standalone: true,
  imports: [CommonModule, CommonPageHeader],
  template: `
    <app-common-page-header
      eyebrow="Recommended for Nike"
      title="Recommendations"
      desc="Directions where network demand is surging but Nike has low adoption · prime white-space opportunities."
    />

    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:12px">
      @for (d of recs(); track d.dir_id) {
        <div
          class="card"
          style="cursor:pointer;margin-bottom:0"
          (click)="openDir(d.dir_id)"
        >
          <div class="sw-stack" style="margin-bottom:12px">
            @for (m of d.members.slice(0, 5); track m.id) {
              <div [style.background]="m.hex"></div>
            }
          </div>
          <div style="display:flex;justify-content:space-between">
            <div>
              <div style="font-weight:700;font-size:14px">{{ d.leader }}</div>
              <div style="font-size:11px;color:var(--text-faint)">
                {{ d.size }} colors &middot; {{ d.family }}
              </div>
            </div>
            <span style="font-weight:800;font-size:16px;color:var(--q-emerging)">{{ d.avg }}</span>
          </div>
          <div
            style="margin-top:10px;padding-top:8px;border-top:1px solid var(--border);font-size:11px;color:var(--text-soft)"
          >
            Nike overlap: <b>0 colors</b> &middot; Network volume: <b>{{ api.fmt(d.vol) }}</b>
          </div>
        </div>
      }
    </div>
  `
})
export class Recommendations {
  readonly api = inject(CsiDataApiService);
  private readonly router = inject(Router);

  readonly recs = computed(() => {
    const db = this.api.db();
    if (!db) return [];
    const nk = db.nike;
    return nk.recommendations?.length ? nk.recommendations : db.emergingDirections.slice(0, 12);
  });

  openDir(dirId: number): void {
    this.router.navigate(['/direction', 'emerging', dirId]);
  }
}
