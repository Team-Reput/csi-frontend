import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface KpiItem {
  label: string;
  value: string | number;
  sub?: string;
  bar?: string;
  trend?: string;
  down?: boolean;
}

@Component({
  selector: 'app-common-kpi-row',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="kpi-row">
      @for (item of items; track item.label) {
        <div class="kpi" [style.--accent-bar]="item.bar || 'var(--grad-leaf)'">
          <div class="lbl">{{ item.label }}</div>
          @if (item.trend) {
            <span
              class="trend"
              [class.dn]="item.down || item.trend[0] === '-'"
              [class.up]="!item.down && item.trend[0] !== '-'"
            >
              {{ item.trend }}
            </span>
          }
          <div class="val">{{ item.value }}</div>
          <div class="sub">{{ item.sub }}</div>
        </div>
      }
    </div>
  `
})
export class CommonKpiRow {
  @Input() items: KpiItem[] = [];
}
