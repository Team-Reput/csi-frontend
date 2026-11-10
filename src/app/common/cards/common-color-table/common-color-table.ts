import { Component, Input, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CsiDataApiService, QC } from '../../../core/services/csi-data-api.service';
import { PaletteToastService } from '../../../core/services/palette-toast.service';
import { ColorStandard } from '../../../core/models/csi.models';

@Component({
  selector: 'app-common-color-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="filters">
      <input
        placeholder="Search name, code, family…"
        [ngModel]="q()"
        (ngModelChange)="onFilterChange('q', $event)"
      />
      <select
        [ngModel]="fam()"
        (ngModelChange)="onFilterChange('fam', $event)"
      >
        <option value="ALL">All 13 families</option>
        @for (f of families(); track f.family) {
          <option [value]="f.family">{{ f.family }} ({{ f.colors }})</option>
        }
      </select>
      @for (k of ['ALL', 'Breakout', 'Emerging', 'Core', 'Dormant']; track k) {
        <button
          class="fchip"
          [class.on]="quad() === k"
          (click)="onFilterChange('quad', k)"
        >
          {{ k === 'ALL' ? 'All stages' : k }}
        </button>
      }
      <span style="margin-left:auto;font-family:var(--mono);font-size:11px;color:var(--text-faint)">
        Sort:
        <select
          class="hdr-sel"
          style="padding:5px 8px;font-size:11.5px"
          [ngModel]="sort()"
          (ngModelChange)="sort.set($event)"
        >
          <option value="e">Emergence score</option>
          <option value="t">Trend score</option>
          <option value="vol">Order volume</option>
        </select>
      </span>
    </div>

    <div class="card pad0">
      <table>
        <thead>
          <tr>
            <th>Shade</th>
            <th>Standard</th>
            <th>Family</th>
            <th>L* a* b*</th>
            <th>Stage</th>
            <th>Emergence</th>
            <th>Trend</th>
            <th>Volume</th>
            <th>24m sparkline</th>
            <th>Nearest external trend</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (c of pagedRows(); track c.id) {
            <tr (click)="openColor(c.id)">
              <td><span class="sw-sm" [style.background]="c.hex"></span></td>
              <td>
                <div class="cell-color">
                  <div>
                    <div class="nm">{{ c.n }}</div>
                    <div class="id">{{ c.id }} &middot; {{ c.hex }}</div>
                  </div>
                </div>
              </td>
              <td>{{ c.fam }}</td>
              <td class="mono" style="font-size:11px">{{ c.L }} &middot; {{ c.a }} &middot; {{ c.b }}</td>
              <td><span class="badge" [ngClass]="'b-' + c.q">{{ c.q }}</span></td>
              <td>
                <span class="score-bar" style="width:52px">
                  <i [style.width.%]="c.e" style="background:var(--q-emerging)"></i>
                </span>
                <span class="mono" style="font-size:11px;margin-left:6px;color:var(--q-emerging);font-weight:700">{{ c.e }}</span>
              </td>
              <td>
                <span class="score-bar" style="width:52px">
                  <i [style.width.%]="c.t" style="background:var(--q-breakout)"></i>
                </span>
                <span class="mono" style="font-size:11px;margin-left:6px;color:var(--q-breakout);font-weight:700">{{ c.t }}</span>
              </td>
              <td class="mono">{{ api.fmt(c.vol) }}</td>
              <td [innerHTML]="sparkSvg(c.spk, qcColor(c.q))"></td>
              <td>
                @if (c.nt) {
                  <span style="font-size:11.5px">{{ c.nt }}</span>
                  <span class="mono" style="font-size:10px;color:var(--text-faint);margin-left:4px">&Delta;E {{ c.nde }}</span>
                } @else {
                  &mdash;
                }
              </td>
              <td>
                <button
                  class="btn-ghost btn-xs"
                  (click)="$event.stopPropagation(); toast.addToPalette(c.id)"
                >
                  + Palette
                </button>
              </td>
            </tr>
          }
        </tbody>
      </table>
      <div
        style="padding:12px 16px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border);font-size:12px;color:var(--text-soft)"
      >
        <span>
          Showing {{ page() * per + 1 }}–{{ Math.min((page() + 1) * per, filteredRows().length) }} of
          <b>{{ filteredRows().length }}</b> standards
        </span>
        <div style="display:flex;gap:6px">
          <button
            class="btn-ghost btn-xs"
            [disabled]="page() === 0"
            (click)="page.set(Math.max(0, page() - 1))"
          >
            &larr; Prev
          </button>
          <button
            class="btn-ghost btn-xs"
            [disabled]="(page() + 1) * per >= filteredRows().length"
            (click)="page.set(page() + 1)"
          >
            Next &rarr;
          </button>
        </div>
      </div>
    </div>
  `
})
export class CommonColorTable {
  @Input() sourcePool?: ColorStandard[];

  readonly api = inject(CsiDataApiService);
  readonly toast = inject(PaletteToastService);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);

  readonly q = signal<string>('');
  readonly fam = signal<string>('ALL');
  readonly quad = signal<string>('ALL');
  readonly sort = signal<'e' | 't' | 'vol'>('e');
  readonly page = signal<number>(0);
  readonly per = 25;
  readonly Math = Math;

  readonly families = computed(() => this.api.db()?.families || []);

  readonly filteredRows = computed(() => {
    const pool = this.sourcePool || this.api.colorPool();
    const qVal = this.q().toLowerCase();
    const famVal = this.fam();
    const quadVal = this.quad();
    const sortKey = this.sort();

    return pool
      .filter((c) => {
        if (famVal !== 'ALL' && c.fam !== famVal) return false;
        if (quadVal !== 'ALL' && c.q !== quadVal) return false;
        if (
          qVal &&
          !(
            c.n.toLowerCase().includes(qVal) ||
            c.id.toLowerCase().includes(qVal) ||
            c.fam.toLowerCase().includes(qVal)
          )
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => (b[sortKey] || 0) - (a[sortKey] || 0));
  });

  readonly pagedRows = computed(() => {
    const start = this.page() * this.per;
    return this.filteredRows().slice(start, start + this.per);
  });

  onFilterChange(type: 'q' | 'fam' | 'quad', val: string): void {
    if (type === 'q') this.q.set(val);
    if (type === 'fam') this.fam.set(val);
    if (type === 'quad') this.quad.set(val);
    this.page.set(0);
  }

  qcColor(q: string): string {
    return QC[q] || '#16a34a';
  }

  sparkSvg(arr: number[] | undefined, col: string): SafeHtml {
    if (!arr || !arr.length) return '';
    const w = 88;
    const h = 24;
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    const rng = max - min || 1;
    const pts = arr
      .map((v, i) => {
        const x = (i / (arr.length - 1)) * (w - 4) + 2;
        const y = h - 3 - ((v - min) / rng) * (h - 6);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
    const svg = `<svg class="spark" width="${w}" height="${h}"><polyline fill="none" stroke="${col}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" points="${pts}"/></svg>`;
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  openColor(id: string): void {
    this.router.navigate(['/color', id]);
  }
}
