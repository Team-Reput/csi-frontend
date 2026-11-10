import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CsiDataApiService } from '../../../../core/services/csi-data-api.service';
import { AuthRoleService } from '../../../../core/services/auth-role.service';
import { CommonKpiRow, KpiItem } from '../../../../common/cards/common-kpi-row/common-kpi-row';

@Component({
  selector: 'app-brand-portal-preview',
  standalone: true,
  imports: [CommonModule, CommonKpiRow],
  templateUrl: './brand-portal-preview.html'
})
export class BrandPortalPreview implements OnInit {
  readonly api = inject(CsiDataApiService);
  readonly auth = inject(AuthRoleService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly portalBrand = signal<string>('NKE');

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const code = params.get('code');
      if (code) {
        this.portalBrand.set(code);
      }
    });
  }

  readonly demoBrands = computed(() => {
    const db = this.api.db();
    if (!db) return [];
    return (db.demoBrands || []).map((c) => ({
      code: c,
      name: db.demoNames[c] || c
    }));
  });

  readonly activeSlice = computed(() => {
    const db = this.api.db();
    if (!db) return null;
    const code = this.portalBrand();
    return db.brandSlices[code] || db.brandSlices[db.demoBrands[0]];
  });

  readonly brandName = computed(() => {
    const db = this.api.db();
    return db?.demoNames?.[this.portalBrand()] || this.portalBrand();
  });

  readonly kpis = computed<KpiItem[]>(() => {
    const s = this.activeSlice();
    if (!s) return [];
    const fams = Object.entries(s.familyMix || {}).sort((a, b) => b[1] - a[1]);
    return [
      { label: 'Active Brand Colors', value: s.colors, sub: 'In CSI dye library', bar: '#16a34a' },
      { label: 'Historical Volume', value: this.api.fmt(s.totalVolume), sub: 'Units dyed', bar: '#2f81c9' },
      { label: 'Emerging Shades Used', value: (s.emergingColors || []).length, sub: 'Accelerating now', bar: '#e0932f' },
      { label: 'Top Family', value: fams[0]?.[0] || '—', sub: this.api.fmt(fams[0]?.[1] || 0) + ' units', bar: '#6d5bd0' }
    ];
  });

  readonly familyMixSorted = computed(() => {
    const s = this.activeSlice();
    if (!s) return [];
    const entries = Object.entries(s.familyMix || {}).sort((a, b) => b[1] - a[1]);
    const maxF = Math.max(...entries.map((x) => x[1]), 1);
    return entries.slice(0, 10).map(([f, v]) => ({
      family: f,
      vol: v,
      pct: Math.round((v / maxF) * 100)
    }));
  });

  readonly marketRecommendations = computed(() => (this.api.db()?.emergingDirections || []).slice(0, 4));

  selectBrand(code: string): void {
    this.portalBrand.set(code);
    this.router.navigate(['/csi/intelligence/customer-portfolio/portal', code]);
  }

  backToPortfolio(): void {
    this.router.navigate(['/csi/intelligence/customer-portfolio']);
  }

  openColor(id?: string): void {
    if (id) this.router.navigate(['/color', id]);
  }

  openDir(dirId: number): void {
    this.router.navigate(['/direction', 'emerging', dirId]);
  }
}

