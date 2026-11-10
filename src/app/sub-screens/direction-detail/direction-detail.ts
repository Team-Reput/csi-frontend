import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CsiDataApiService } from '../../core/services/csi-data-api.service';
import { PaletteToastService } from '../../core/services/palette-toast.service';
import { ForecastDetailCard } from '../../common/cards/forecast-detail-card/forecast-detail-card';
import { BrandAdoptionCard } from '../../common/cards/brand-adoption-card/brand-adoption-card';
import { BrandAdoption, ColorStandard, TrendDirection } from '../../core/models/csi.models';

@Component({
  selector: 'app-direction-detail',
  standalone: true,
  imports: [CommonModule, ForecastDetailCard, BrandAdoptionCard],
  templateUrl: './direction-detail.html'
})
export class DirectionDetail implements OnInit {
  readonly api = inject(CsiDataApiService);
  readonly toast = inject(PaletteToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly sanitizer = inject(DomSanitizer);

  readonly lens = signal<'emerging' | 'trending'>('emerging');
  readonly dirId = signal<number>(1);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const l = (params.get('lens') || 'emerging') as 'emerging' | 'trending';
      const id = Number(params.get('id') || 1);
      this.lens.set(l);
      this.dirId.set(id);
    });
  }

  readonly direction = computed<TrendDirection | undefined>(() => {
    return this.api.findDirection(this.lens(), this.dirId());
  });

  readonly memberDetails = computed<ColorStandard[]>(() => {
    const d = this.direction();
    const db = this.api.db();
    if (!d || !db) return [];
    return d.members.map(
      (m) =>
        db.colors.find((c) => c.id === m.id) || {
          ...m,
          fam: d.family,
          q: this.lens() === 'emerging' ? ('Emerging' as const) : ('Breakout' as const),
          vol: 0
        }
    );
  });

  readonly topBrands = computed<BrandAdoption[]>(() => {
    const brandMap: Record<string, number> = {};
    this.memberDetails().forEach((c) => {
      (c.topBrands || []).forEach((b) => {
        brandMap[b.name] = (brandMap[b.name] || 0) + b.vol;
      });
    });
    const list = Object.entries(brandMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
    const totB = list.reduce((s, x) => s + x[1], 0) || 1;
    return list.map(([name, vol]) => ({
      name,
      vol,
      share: Math.round((vol / totB) * 100),
      trend: 'up' as const
    }));
  });

  gaugeSvg(val: number, col = '#16a34a'): SafeHtml {
    const r = 30;
    const c = 2 * Math.PI * r;
    const p = Math.max(0, Math.min(100, val || 0)) / 100;
    const svg = `<svg width="76" height="76" viewBox="0 0 76 76"><circle cx="38" cy="38" r="${r}" fill="none" stroke="#e5ede7" stroke-width="7"/><circle cx="38" cy="38" r="${r}" fill="none" stroke="${col}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${(c * p).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 38 38)"/><text x="38" y="42" text-anchor="middle" font-family="JetBrains Mono" font-size="14" font-weight="700" fill="#0d1d14">${Math.round(val || 0)}%</text></svg>`;
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  goBack(): void {
    this.location.back();
  }

  openColor(id: string): void {
    this.router.navigate(['/color', id]);
  }
}

