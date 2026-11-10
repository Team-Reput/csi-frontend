import {
  Component,
  Input,
  inject,
  signal,
  computed,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CsiDataApiService } from '../../../core/services/csi-data-api.service';

declare const Highcharts: any;

@Component({
  selector: 'app-market-momentum-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card" style="margin-bottom:0">
      <div class="card-h">
        <h3>◔ {{ title }}</h3>
        <span style="display:flex;align-items:center;gap:6px;font-size:10.5px;color:var(--text-faint);font-family:var(--mono)">
          YEARS
          <select
            class="hdr-sel"
            style="padding:3px 6px;font-size:11px;font-family:var(--mono)"
            [ngModel]="api.yrFrom()"
            (ngModelChange)="api.setYearRange(+$event, null)"
          >
            @for (y of api.availableYears(); track y) {
              <option [ngValue]="y">{{ y }}</option>
            }
          </select>
          <span>–</span>
          <select
            class="hdr-sel"
            style="padding:3px 6px;font-size:11px;font-family:var(--mono)"
            [ngModel]="api.yrTo()"
            (ngModelChange)="api.setYearRange(null, +$event)"
          >
            @for (y of api.availableYears(); track y) {
              <option [ngValue]="y">{{ y }}</option>
            }
          </select>
        </span>
      </div>

      <div #chartContainer style="width:100%;height:300px"></div>

      <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;margin-top:10px">
        <span style="font-size:11px;color:var(--text-soft);display:flex;align-items:center;gap:6px">
          <span style="width:10px;height:10px;border-radius:3px;background:#16a34a"></span>Breakout
        </span>
        <span style="font-size:11px;color:var(--text-soft);display:flex;align-items:center;gap:6px">
          <span style="width:10px;height:10px;border-radius:3px;background:#e0932f"></span>Emerging
        </span>
        <span style="font-size:11px;color:var(--text-soft);display:flex;align-items:center;gap:6px">
          <span style="width:10px;height:10px;border-radius:3px;background:#2f81c9"></span>Core
        </span>
        <span style="font-size:11px;color:var(--text-soft);display:flex;align-items:center;gap:6px">
          <span style="width:10px;height:10px;border-radius:3px;background:#c3d0c8"></span>Dormant
        </span>
      </div>
      <div
        style="margin-top:10px;padding-top:12px;border-top:1px solid var(--border);font-size:11.5px;color:var(--text-soft);text-align:center;font-family:var(--mono)"
      >
        Quarterly order volume by lifecycle stage. Breakout and emerging demand rising; dormant volume contracting over the selected range.
      </div>
    </div>
  `
})
export class MarketMomentumCard implements AfterViewInit, OnDestroy {
  @Input() title = 'Market Momentum';
  @ViewChild('chartContainer') chartContainer?: ElementRef<HTMLDivElement>;

  readonly api = inject(CsiDataApiService);
  private chartInstance: any = null;

  private readonly order = ['Breakout', 'Core', 'Emerging', 'Dormant'];
  private readonly cols: Record<string, string> = {
    Breakout: '#16a34a',
    Emerging: '#e0932f',
    Core: '#2f81c9',
    Dormant: '#c3d0c8'
  };

  readonly filteredData = computed(() => {
    const db = this.api.db();
    if (!db?.momentumTimeline) return null;
    const allQ = db.momentumTimeline.quarters;
    const qy = (l: string) => 2000 + parseInt(l.slice(-2), 10);
    const yrs = this.api.availableYears();
    const y0 = this.api.yrFrom() || yrs[0];
    const y1 = this.api.yrTo() || yrs[yrs.length - 1];
    const idxs: number[] = [];
    allQ.forEach((l, i) => {
      const y = qy(l);
      if (y >= y0 && y <= y1) idxs.push(i);
    });
    if (idxs.length < 2) {
      allQ.forEach((_, i) => idxs.push(i));
    }
    const quarters = idxs.map((i) => allQ[i]);
    const seriesData = this.order.map((k) => ({
      name: k,
      color: this.cols[k],
      data: idxs.map((i) => db.momentumTimeline.series[k as 'Breakout' | 'Core' | 'Emerging' | 'Dormant'][i])
    }));
    return { quarters, seriesData };
  });

  constructor() {
    effect(() => {
      const data = this.filteredData();
      if (data && this.chartContainer?.nativeElement) {
        this.renderHighchart(data);
      }
    });
  }

  ngAfterViewInit(): void {
    const data = this.filteredData();
    if (data) {
      this.renderHighchart(data);
    }
  }

  renderHighchart(data: { quarters: string[]; seriesData: any[] }): void {
    if (typeof Highcharts === 'undefined' || !this.chartContainer?.nativeElement) return;

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    this.chartInstance = Highcharts.chart(this.chartContainer.nativeElement, {
      chart: {
        type: 'areaspline',
        backgroundColor: 'transparent',
        spacing: [10, 10, 15, 10],
        style: { fontFamily: "'Inter', -apple-system, sans-serif" }
      },
      title: { text: null },
      credits: { enabled: false },
      legend: { enabled: false },
      xAxis: {
        categories: data.quarters,
        tickInterval: Math.max(1, Math.round(data.quarters.length / 8)),
        lineColor: '#e8eaee',
        tickColor: '#e8eaee',
        labels: {
          style: {
            color: '#8b95a1',
            fontSize: '9.5px',
            fontFamily: "'JetBrains Mono', monospace"
          }
        }
      },
      yAxis: {
        title: { text: null },
        gridLineColor: '#e8eaee',
        gridLineDashStyle: 'Dash',
        labels: {
          formatter: function (this: any) {
            const v = this.value;
            if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
            if (v >= 1e3) return (v / 1e3).toFixed(0) + 'k';
            return v;
          },
          style: {
            color: '#8b95a1',
            fontSize: '9.5px',
            fontFamily: "'JetBrains Mono', monospace"
          }
        }
      },
      tooltip: {
        shared: true,
        backgroundColor: 'rgba(13, 17, 23, 0.94)',
        borderColor: '#2d3643',
        borderRadius: 8,
        style: { color: '#fff', fontSize: '11.5px', fontFamily: "'JetBrains Mono', monospace" },
        pointFormat:
          '<span style="color:{point.color}">●</span> {series.name}: <b>{point.y:,.0f}</b> ({point.percentage:.0f}%)<br/>'
      },
      plotOptions: {
        areaspline: {
          stacking: 'normal',
          lineWidth: 1.5,
          marker: { enabled: false },
          fillOpacity: 0.78
        }
      },
      series: data.seriesData
    });
  }

  ngOnDestroy(): void {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
  }
}
