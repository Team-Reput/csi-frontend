import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrandAdoption } from '../../../core/models/csi.models';
import { CsiDataApiService } from '../../../core/services/csi-data-api.service';

@Component({
  selector: 'app-brand-adoption-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card card-p">
      <div class="card-head">
        <div>
          <div class="card-title">{{ title }}</div>
          <div class="card-sub">{{ subtitle }}</div>
        </div>
        <span class="pill pill-info">{{ badgeText }}</span>
      </div>
      @if (brands.length) {
        @for (b of brands; track b.name) {
          <div style="margin-bottom:10px">
            <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
              <b>{{ b.name }}</b>
              <span class="mono" style="font-size:11px;color:var(--text-soft)">
                {{ api.fmt(b.vol) }} units · <b>{{ b.share }}%</b>
                <span [style.color]="b.trend === 'up' ? 'var(--accent)' : b.trend === 'down' ? 'var(--danger)' : 'var(--text-faint)'">
                  {{ b.trend === 'up' ? '▲' : b.trend === 'down' ? '▼' : '·' }}
                </span>
              </span>
            </div>
            <div class="pbar">
              <span [style.width.%]="Math.min(100, b.share * 2.2)" style="background:var(--ink)"></span>
            </div>
          </div>
        }
      } @else {
        <div style="color:var(--text-faint);font-size:12px">Limited historical brand records</div>
      }
      @if (footerHtml) {
        <div [innerHTML]="footerHtml"></div>
      }
    </div>
  `
})
export class BrandAdoptionCard {
  @Input() title = 'Top Adopting Brands';
  @Input() subtitle = 'Share of shade volume across network customers';
  @Input() badgeText = '';
  @Input() brands: BrandAdoption[] = [];
  @Input() footerHtml = '';

  readonly api = inject(CsiDataApiService);
  readonly Math = Math;
}

