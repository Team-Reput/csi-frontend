import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CsiDatabase, ColorStandard, TrendDirection } from '../models/csi.models';
import { AuthRoleService } from './auth-role.service';

export const QC: Record<string, string> = {
  Emerging: '#e0932f',
  Breakout: '#16a34a',
  Core: '#2f81c9',
  Dormant: '#9fb3a6'
};

@Injectable({ providedIn: 'root' })
export class CsiDataApiService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthRoleService);

  readonly db = signal<CsiDatabase | null>(null);
  readonly loading = signal<boolean>(true);
  readonly yrFrom = signal<number>(2006);
  readonly yrTo = signal<number>(2026);
  readonly scanHistory = signal<ColorStandard[]>([]);

  readonly colorPool = computed<ColorStandard[]>(() => {
    const data = this.db();
    if (!data) return [];
    return this.auth.role() === 'nike' ? data.nike.colors : data.colors;
  });

  readonly availableYears = computed<number[]>(() => {
    const data = this.db();
    if (!data?.momentumTimeline?.quarters) return [2006, 2026];
    const qy = (l: string) => 2000 + parseInt(l.slice(-2), 10);
    return [...new Set(data.momentumTimeline.quarters.map(qy))];
  });

  loadDatabase(): void {
    if (this.db()) return;
    this.loading.set(true);
    // Mock JSON endpoint — drop-in replaceable with backend REST API URL
    this.http.get<CsiDatabase>('/assets/mock-data/csi-showcase-data.json').subscribe({
      next: (data) => {
        this.db.set(data);
        const yrs = this.availableYears();
        if (yrs.length) {
          this.yrFrom.set(yrs[0]);
          this.yrTo.set(yrs[yrs.length - 1]);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load CSI data:', err);
        this.loading.set(false);
      }
    });
  }

  setYearRange(from: number | null, to: number | null): void {
    const yrs = this.availableYears();
    let f = from ?? this.yrFrom() ?? yrs[0];
    let t = to ?? this.yrTo() ?? yrs[yrs.length - 1];
    if (f > t) {
      const tmp = f;
      f = t;
      t = tmp;
    }
    this.yrFrom.set(f);
    this.yrTo.set(t);
  }

  fmt(n: number | null | undefined): string {
    if (n == null) return '·';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k';
    return Math.round(n).toLocaleString();
  }

  findColorById(id: string): ColorStandard | undefined {
    const data = this.db();
    if (!data) return undefined;
    return this.colorPool().find((c) => c.id === id) || data.colors.find((c) => c.id === id);
  }

  findDirection(lens: 'emerging' | 'trending', dirId: number): TrendDirection | undefined {
    const data = this.db();
    if (!data) return undefined;
    const list = lens === 'emerging' ? data.emergingDirections : data.trendingDirections;
    return list.find((d) => d.dir_id === dirId);
  }

  cmcDE(c1: [number, number, number], c2: [number, number, number], l = 2, c = 1): number {
    const [L1, a1, b1] = c1;
    const [L2, a2, b2] = c2;
    const C1 = Math.hypot(a1, b1);
    const C2 = Math.hypot(a2, b2);
    const dL = L1 - L2;
    const dC = C1 - C2;
    const dH = Math.sqrt(Math.max(0, (a1 - a2) ** 2 + (b1 - b2) ** 2 - dC * dC));
    let h1 = (Math.atan2(b1, a1) * 180) / Math.PI;
    if (h1 < 0) h1 += 360;
    const T =
      h1 >= 164 && h1 <= 345
        ? 0.56 + Math.abs(0.2 * Math.cos(((h1 + 168) * Math.PI) / 180))
        : 0.36 + Math.abs(0.4 * Math.cos(((h1 + 35) * Math.PI) / 180));
    const F = Math.sqrt(C1 ** 4 / (C1 ** 4 + 1900));
    const SL = L1 < 16 ? 0.511 : (0.040975 * L1) / (1 + 0.01765 * L1);
    const SC = (0.0638 * C1) / (1 + 0.0131 * C1) + 0.638;
    const SH = SC * (F * T + 1 - F);
    return Math.sqrt((dL / (l * SL)) ** 2 + (dC / (c * SC)) ** 2 + (dH / SH) ** 2);
  }

  hex2lab(hex: string): [number, number, number] {
    hex = hex.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const bl = parseInt(hex.slice(4, 6), 16) / 255;
    const f = (v: number) => (v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92);
    const R = f(r);
    const G = f(g);
    const B = f(bl);
    let X = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
    let Y = R * 0.2126 + G * 0.7152 + B * 0.0722;
    let Z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
    const h = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
    X = h(X);
    Y = h(Y);
    Z = h(Z);
    return [116 * Y - 16, 500 * (X - Y), 200 * (Y - Z)];
  }
}

