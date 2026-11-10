import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CsiDataApiService } from '../../core/services/csi-data-api.service';
import { CommonPageHeader } from '../../common/cards/common-page-header/common-page-header';

export interface BenchmarkRow {
  f: string;
  nv: number;
  mv: number;
}

@Component({
  selector: 'app-benchmark',
  standalone: true,
  imports: [CommonModule, CommonPageHeader],
  template: `
    <app-common-page-header
      eyebrow="Network comparison &middot; Nike"
      title="Benchmark"
      desc="How Nike's palette composition compares against the anonymized 1,100-brand network average."
    />

    <div class="card">
      <div class="card-h">
        <h3>Palette Family Distribution: Nike vs Network</h3>
      </div>
      <div style="display:flex;flex-direction:column;gap:12px">
        @for (r of rows(); track r.f) {
          <div>
            <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
              <b>{{ r.f }}</b>
              <span style="font-family:var(--mono);color:var(--text-faint)">
                Nike {{ r.nv.toFixed(1) }}% &middot; Network {{ r.mv.toFixed(1) }}%
              </span>
            </div>
            <div
              style="display:flex;gap:4px;height:10px;border-radius:5px;overflow:hidden;background:var(--border)"
            >
              <div [style.width.%]="r.nv" style="background:var(--accent-2)"></div>
              <div [style.width.%]="r.mv" style="background:var(--slate);opacity:.5"></div>
            </div>
          </div>
        }
      </div>
      <div style="display:flex;gap:18px;margin-top:16px;font-size:11.5px;color:var(--text-soft)">
        <span><b style="color:var(--accent-2)">●</b> Nike palette share</span>
        <span><b style="color:var(--slate);opacity:.7">●</b> CSI network average</span>
      </div>
    </div>
  `
})
export class Benchmark {
  readonly api = inject(CsiDataApiService);

  readonly rows = computed<BenchmarkRow[]>(() => {
    const db = this.api.db();
    if (!db) return [];
    const nk = db.nike.familyMix;
    const totN = Object.values(nk).reduce((a, b) => a + b, 0) || 1;
    return db.families.map((f) => {
      const nv = ((nk[f.family] || 0) / totN) * 100;
      const mv = (f.colors / db.colors.length) * 100;
      return { f: f.family, nv, mv };
    });
  });
}
