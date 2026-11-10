import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ScoreFactorRow {
  label: string;
  weight: string;
  val: number;
  desc: string;
}

@Component({
  selector: 'app-score-breakdown-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card card-p">
      <div class="card-head">
        <div>
          <div class="card-title">{{ title }}</div>
          <div class="card-sub">{{ subtitle }}</div>
        </div>
        <span class="mono" style="font-size:20px;font-weight:800" [style.color]="accent">{{ total }}</span>
      </div>
      @for (r of rows; track r.label) {
        <div style="margin-bottom:11px">
          <div style="display:flex;justify-content:space-between;font-size:11.5px;margin-bottom:3px">
            <span>
              <b>{{ r.label }}</b>
              <span class="mono" style="color:var(--text-faint);font-size:10px">({{ r.weight }})</span>
            </span>
            <b class="mono" [style.color]="accent">{{ r.val }}</b>
          </div>
          <div class="pbar">
            <span [style.width.%]="r.val" [style.background]="accent"></span>
          </div>
          <div style="font-size:10.5px;color:var(--text-faint);margin-top:2px">{{ r.desc }}</div>
        </div>
      }
    </div>
  `
})
export class ScoreBreakdownCard {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() total: number | string = 0;
  @Input() accent = '#15803d';
  @Input() rows: ScoreFactorRow[] = [];
}

