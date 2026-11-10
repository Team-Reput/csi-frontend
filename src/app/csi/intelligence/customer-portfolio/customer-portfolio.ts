import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CsiDataApiService } from '../../../core/services/csi-data-api.service';
import { CommonPageHeader } from '../../../common/cards/common-page-header/common-page-header';

export interface BrandCardData {
  code: string;
  name: string;
  colors: number;
  totalVolume: number;
  emergingCount: number;
  topColors: Array<{ name: string; hex: string; vol: number }>;
  topFamilies: Array<[string, number]>;
}

@Component({
  selector: 'app-customer-portfolio',
  standalone: true,
  imports: [CommonModule, CommonPageHeader],
  templateUrl: './customer-portfolio.html'
})
export class CustomerPortfolio {
  readonly api = inject(CsiDataApiService);
  private readonly router = inject(Router);

  readonly brandCards = computed<BrandCardData[]>(() => {
    const db = this.api.db();
    if (!db) return [];
    return (db.demoBrands || []).map((code) => {
      const s = db.brandSlices[code];
      const name = db.demoNames[code] || code;
      const fams = Object.entries(s.familyMix || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4);
      return {
        code,
        name,
        colors: s.colors,
        totalVolume: s.totalVolume,
        emergingCount: (s.emergingColors || []).length,
        topColors: (s.topColors || []).slice(0, 10),
        topFamilies: fams
      };
    });
  });

  openBrandPortal(code: string): void {
    this.router.navigate(['/csi/intelligence/customer-portfolio/portal', code]);
  }
}

