import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CsiDataApiService, QC } from '../../core/services/csi-data-api.service';
import { PaletteToastService } from '../../core/services/palette-toast.service';
import { ForecastDetailCard } from '../../common/cards/forecast-detail-card/forecast-detail-card';
import { ScoreBreakdownCard, ScoreFactorRow } from '../../common/cards/score-breakdown-card/score-breakdown-card';
import { BrandAdoptionCard } from '../../common/cards/brand-adoption-card/brand-adoption-card';
import { ColorStandard } from '../../core/models/csi.models';

@Component({
  selector: 'app-color-detail',
  standalone: true,
  imports: [CommonModule, ForecastDetailCard, ScoreBreakdownCard, BrandAdoptionCard],
  templateUrl: './color-detail.html'
})
export class ColorDetail implements OnInit {
  readonly api = inject(CsiDataApiService);
  readonly toast = inject(PaletteToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  readonly colorId = signal<string>('');

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.colorId.set(decodeURIComponent(id));
      }
    });
  }

  readonly color = computed<ColorStandard | undefined>(() => {
    return this.api.findColorById(this.colorId());
  });

  readonly neighbors = computed<Array<ColorStandard & { de: number }>>(() => {
    const c = this.color();
    if (!c) return [];
    return this.api
      .colorPool()
      .filter((x) => x.id !== c.id)
      .map((x) => ({
        ...x,
        de: this.api.cmcDE([c.L, c.a, c.b], [x.L, x.a, x.b])
      }))
      .sort((a, b) => a.de - b.de)
      .slice(0, 6);
  });

  readonly emergenceRows = computed<ScoreFactorRow[]>(() => {
    const c = this.color();
    const ef = c?.eF || { velocity: 72, acceleration: 68, adoption: 74, recency: 79 };
    return [
      { label: 'Demand Velocity', weight: '35%', val: ef.velocity, desc: 'Recent 12m order growth vs prior 12m baseline' },
      { label: 'Acceleration', weight: '25%', val: ef.acceleration, desc: '2nd derivative — Q-over-Q slope steepening' },
      { label: 'New Brand Adoption', weight: '25%', val: ef.adoption, desc: 'Distinct brands ordering this shade for the first time' },
      { label: 'Recency Activity', weight: '15%', val: ef.recency, desc: 'Order concentration in most recent 2 quarters' }
    ];
  });

  readonly trendRows = computed<ScoreFactorRow[]>(() => {
    const c = this.color();
    const tf = c?.tF || { size: 70, sustained: 66, breadth: 75, consistency: 78 };
    return [
      { label: 'Volume Scale', weight: '35%', val: tf.size, desc: 'Percentile rank of total dyed yardage across catalog' },
      { label: 'Sustained Momentum', weight: '25%', val: tf.sustained, desc: 'Positive growth maintained across consecutive quarters' },
      { label: 'Customer Breadth', weight: '25%', val: tf.breadth, desc: 'Number of active global brands ordering this standard' },
      { label: 'Order Consistency', weight: '15%', val: tf.consistency, desc: 'Low coefficient of variation across seasonal cycles' }
    ];
  });

  readonly directionFooterHtml = computed<string>(() => {
    const c = this.color();
    if (!c?.dir) return '';
    return `<div style="margin-top:12px;padding:10px 12px;border-radius:8px;background:var(--accent-soft);border:1px solid var(--accent-line);display:flex;justify-content:space-between;align-items:center">
      <div><div style="font-size:10px;font-family:var(--mono);color:var(--accent);font-weight:700">MEMBER OF ${c.dir.lens.toUpperCase()} DIRECTION</div><b>${c.dir.leader}</b> · Breakout probability <b>${c.dir.prob}%</b></div>
    </div>`;
  });

  qcColor(q: string): string {
    return QC[q] || '#16a34a';
  }

  goBack(): void {
    this.location.back();
  }

  openDirection(lens: 'emerging' | 'trending', dirId: number): void {
    this.router.navigate(['/direction', lens, dirId]);
  }

  openNearby(id: string): void {
    this.router.navigate(['/csi/tools/nearby-explorer'], { queryParams: { anchor: id } });
  }

  openColor(id: string): void {
    this.router.navigate(['/color', id]);
  }
}

