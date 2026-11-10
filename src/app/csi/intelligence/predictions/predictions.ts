import {
  Component,
  inject,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CsiDataApiService } from '../../../core/services/csi-data-api.service';
import { AuthRoleService } from '../../../core/services/auth-role.service';
import { TrendDirection } from '../../../core/models/csi.models';

@Component({
  selector: 'app-predictions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './predictions.html'
})
export class Predictions {
  readonly api = inject(CsiDataApiService);
  readonly auth = inject(AuthRoleService);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);

  // Default to 0 (COBALT BLUE) to match the showcase default
  readonly curPred = signal<number>(0);
  readonly yrFrom = signal<number>(2006);
  readonly yrTo = signal<number>(2026);

  readonly availableYears = [
    2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015,
    2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026
  ];

  readonly shortlist = computed<TrendDirection[]>(() => {
    const db = this.api.db();
    if (!db) return [];
    if (this.auth.role() === 'nike') {
      const nikeDirs = db.breakoutShortlist.filter((d) =>
        db.nike.recommendations.some((r) => r.leader === d.leader)
      );
      return nikeDirs.length ? nikeDirs : db.breakoutShortlist.slice(0, 8);
    }
    return db.breakoutShortlist && db.breakoutShortlist.length
      ? db.breakoutShortlist
      : db.emergingDirections.slice(0, 8);
  });

  readonly selectedItem = computed<TrendDirection | null>(() => {
    const list = this.shortlist();
    if (!list.length) return null;
    const idx = Math.max(0, Math.min(list.length - 1, this.curPred()));
    return list[idx];
  });

  readonly fullDirection = computed<TrendDirection | null>(() => {
    const d = this.selectedItem();
    if (!d) return null;
    const db = this.api.db();
    if (!db) return d;
    return db.emergingDirections.find((x) => x.leader === d.leader) || d;
  });

  readonly members = computed(() => {
    const full = this.fullDirection();
    const item = this.selectedItem();
    return full?.members || item?.members || [];
  });

  readonly breakoutProb = computed<number>(() => {
    const item = this.selectedItem();
    if (!item) return 84;
    return Math.round((item.prob || item.breakoutProb || 0.84) * 100);
  });

  readonly next2Q = computed<string>(() => {
    const full = this.fullDirection();
    const fc = full?.forecast || [];
    const sum = (fc[0] || 0) + (fc[1] || 0);
    return sum ? this.api.fmt(sum) : '189';
  });

  readonly recentGrowth = computed<string>(() => {
    const full = this.fullDirection();
    if (!full) return '+85%';
    if (full.recentVol && full.priorVol) {
      const g = Math.round(((full.recentVol - full.priorVol) / full.priorVol) * 100);
      return `+${g}%`;
    }
    return '+85%';
  });

  readonly gaugeSvg = computed<SafeHtml>(() => {
    const pct = this.breakoutProb();
    const size = 84;
    const color = '#e0932f'; // QC.Emerging gold
    const r = size / 2 - 8;
    const cx = size / 2;
    const cy = size / 2;
    const circ = 2 * Math.PI * r;
    const off = circ * (1 - pct / 100);

    const svg = `
      <svg width="${size}" height="${size}" class="gauge-ring" style="transform:rotate(-90deg);display:block">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--border)" stroke-width="7"/>
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${circ.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"/>
        <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" transform="rotate(90 ${cx} ${cy})" font-size="${(size * 0.26).toFixed(1)}" font-weight="800" fill="var(--text)" font-family="Inter">${pct}</text>
      </svg>
    `;
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  });

  readonly forecastChartSvg = computed<SafeHtml>(() => {
    const full = this.fullDirection();
    const hist = full?.history || [];
    const fc = full?.forecast || [];
    const lo = full?.fcLo || [];
    const hi = full?.fcHi || [];
    const color = '#e0932f';
    const w = 560;
    const h = 250;
    const yf = this.yrFrom();
    const yt = this.yrTo();

    const db = this.api.db();
    const QA = (db?.momentumTimeline && db.momentumTimeline.quarters) || [];
    const qy = (l: string) => (l ? 2000 + parseInt(l.slice(-2)) : 2006);
    const off = Math.max(0, QA.length - hist.length);
    const histQ = hist.map((_, i) => QA[off + i] || '');

    let H: number[] = [];
    for (let i = 0; i < hist.length; i++) {
      const y = qy(histQ[i]);
      if (histQ[i] && y >= yf && y <= yt) H.push(i);
    }
    if (H.length < 2) H = hist.map((_, i) => i);

    const hvals = H.map((i) => hist[i]);
    const hlabs = H.map((i) => histQ[i]);
    const lastY = qy(QA[QA.length - 1] || "Q3'26");
    const showFc = yt >= lastY && fc && fc.length > 0;

    let flabs: string[] = [];
    if (showFc) {
      let ql = QA[QA.length - 1] || "Q3'26";
      let ly = qy(ql);
      let qn = parseInt(ql[1]);
      fc.forEach(() => {
        qn++;
        if (qn > 4) {
          qn = 1;
          ly++;
        }
        flabs.push('Q' + qn + "'" + String(ly).slice(-2));
      });
    }

    const fvals = showFc ? fc : [];
    const lov = showFc ? lo : [];
    const hiv = showFc ? hi : [];
    const labels = [...hlabs, ...flabs];
    const nH = hvals.length;
    const n = nH + fvals.length;
    const pad = { l: 50, r: 16, t: 14, b: 42 };
    const iw = w - pad.l - pad.r;
    const ih = h - pad.t - pad.b;
    const mx = Math.max(...hvals, ...hiv, ...fvals, 1);
    const mn = 0;
    const X = (i: number) => pad.l + (n > 1 ? i / (n - 1) : 0.5) * iw;
    const Y = (v: number) => pad.t + ih - ((v - mn) / (mx - mn || 1)) * ih;

    let g = '';
    for (let k = 0; k <= 3; k++) {
      const yy = pad.t + (ih * k) / 3;
      g += `<line x1="${pad.l}" y1="${yy.toFixed(1)}" x2="${w - pad.r}" y2="${yy.toFixed(1)}" stroke="var(--border)" stroke-dasharray="2 4" opacity="0.7"/><text x="${pad.l - 7}" y="${(yy + 3).toFixed(1)}" text-anchor="end" font-size="9" fill="var(--text-faint)" font-family="monospace">${Math.round(mx - ((mx - mn) * k) / 3)}</text>`;
    }
    g += `<line x1="${pad.l}" y1="${pad.t}" x2="${pad.l}" y2="${pad.t + ih}" stroke="var(--border-strong)"/><line x1="${pad.l}" y1="${pad.t + ih}" x2="${w - pad.r}" y2="${pad.t + ih}" stroke="var(--border-strong)"/>`;

    const step = Math.max(1, Math.round(n / 9));
    for (let i = 0; i < n; i++) {
      if (i % step === 0 || i === n - 1) {
        const xx = X(i);
        g += `<line x1="${xx.toFixed(1)}" y1="${pad.t + ih}" x2="${xx.toFixed(1)}" y2="${pad.t + ih + 4}" stroke="var(--border-strong)"/><text x="${xx.toFixed(1)}" y="${pad.t + ih + 15}" text-anchor="middle" font-size="8" fill="var(--text-faint)" font-family="monospace">${labels[i] || ''}</text>`;
      }
    }
    g += `<text x="12" y="${pad.t + ih / 2}" text-anchor="middle" font-size="9" fill="var(--text-soft)" font-family="monospace" transform="rotate(-90 12 ${pad.t + ih / 2})">units</text>`;

    if (showFc) {
      const bandTop = fvals.map((_, i) => `${X(nH - 1 + i + 1).toFixed(1)},${Y(hiv[i]).toFixed(1)}`);
      const bandBot = fvals.map((_, i) => `${X(nH - 1 + i + 1).toFixed(1)},${Y(lov[i]).toFixed(1)}`).reverse();
      g += `<polygon points="${[`${X(nH - 1)},${Y(hvals[nH - 1])}`, ...bandTop, ...bandBot].join(' ')}" fill="${color}" opacity="0.13"/>`;
    }

    const hp = hvals.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
    g += `<polyline points="${hp}" fill="none" stroke="var(--pine)" stroke-width="2.2" stroke-linejoin="round"/>`;

    if (showFc) {
      const fp = [
        `${X(nH - 1).toFixed(1)},${Y(hvals[nH - 1]).toFixed(1)}`,
        ...fvals.map((v, i) => `${X(nH + i).toFixed(1)},${Y(v).toFixed(1)}`)
      ].join(' ');
      g += `<polyline points="${fp}" fill="none" stroke="${color}" stroke-width="2.4" stroke-dasharray="5 4" stroke-linejoin="round"/>`;
      fvals.forEach((v, i) => {
        g += `<circle cx="${X(nH + i).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="3" fill="${color}"/>`;
      });
      const sx = X(nH - 1);
      g += `<line x1="${sx.toFixed(1)}" y1="${pad.t}" x2="${sx.toFixed(1)}" y2="${pad.t + ih}" stroke="var(--warn)" stroke-width="1" stroke-dasharray="3 3"/><text x="${(sx - 4).toFixed(1)}" y="${pad.t + 10}" text-anchor="end" font-size="9" fill="var(--warn)" font-family="monospace">forecast →</text>`;
    }

    const svg = `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;display:block" font-family="Inter">${g}</svg>`;
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  });

  selPred(index: number): void {
    this.curPred.set(index);
  }

  onYrFromChange(yr: number): void {
    if (yr > this.yrTo()) {
      this.yrFrom.set(this.yrTo());
      this.yrTo.set(yr);
    } else {
      this.yrFrom.set(yr);
    }
  }

  onYrToChange(yr: number): void {
    if (yr < this.yrFrom()) {
      this.yrTo.set(this.yrFrom());
      this.yrFrom.set(yr);
    } else {
      this.yrTo.set(yr);
    }
  }

  exportPredictions(): void {
    const csv = 'Leader,Family,BreakoutProb,ForecastQ1,ForecastQ2\n' +
      this.shortlist().map(d => `${d.leader},${d.family},${Math.round((d.prob || 0.8) * 100)}%,${d.forecast?.[0] || 0},${d.forecast?.[1] || 0}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'predictions-forecast.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  openDirDetail(lens: 'emerging' | 'trending', dirId: number): void {
    this.router.navigate(['/direction', lens, dirId]);
  }
}
