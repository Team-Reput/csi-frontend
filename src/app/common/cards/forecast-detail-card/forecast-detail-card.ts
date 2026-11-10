import {
  Component,
  Input,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';

declare const Highcharts: any;

@Component({
  selector: 'app-forecast-detail-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div #chartContainer [style.height.px]="height" style="width:100%"></div>
  `
})
export class ForecastDetailCard implements AfterViewInit, OnChanges, OnDestroy {
  @Input() history: number[] = [];
  @Input() forecast: number[] = [];
  @Input() lo: number[] = [];
  @Input() hi: number[] = [];
  @Input() color = '#16a34a';
  @Input() height = 210;

  @ViewChild('chartContainer') chartContainer?: ElementRef<HTMLDivElement>;

  private chartInstance: any = null;

  ngAfterViewInit(): void {
    this.renderHighchart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.chartContainer?.nativeElement) {
      this.renderHighchart();
    }
  }

  renderHighchart(): void {
    if (typeof Highcharts === 'undefined' || !this.chartContainer?.nativeElement) return;

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    const h = this.history?.length ? this.history : [10, 12, 14, 15, 18, 22, 25, 28];
    const f = this.forecast?.length ? this.forecast : [30, 33, 36, 40];
    const l = this.lo?.length ? this.lo : f.map((v) => Math.round(v * 0.82));
    const u = this.hi?.length ? this.hi : f.map((v) => Math.round(v * 1.18));

    const nH = h.length;
    const nF = f.length;

    // Categories: Q-7, Q-6 ... Q-0, Q+1, Q+2, Q+3, Q+4
    const categories: string[] = [];
    for (let i = nH; i >= 1; i--) {
      categories.push(i === 1 ? 'Actual' : `Q-${i - 1}`);
    }
    for (let i = 1; i <= nF; i++) {
      categories.push(`Q+${i}`);
    }

    // Historical data: [y0, y1, ... yLast, null, null, null, null]
    const historySeries = [...h, ...Array(nF).fill(null)];

    // Forecast data connects from the last actual point: [null, null, ... lastActual, f0, f1, f2, f3]
    const forecastSeries: Array<number | null> = Array(nH - 1).fill(null);
    forecastSeries.push(h[nH - 1]);
    f.forEach((v) => forecastSeries.push(v));

    // CI range data: [null, ... [lastActual, lastActual], [l0, u0], [l1, u1], ...]
    const rangeData: any[] = Array(nH - 1).fill(null);
    rangeData.push([h[nH - 1], h[nH - 1]]);
    f.forEach((_, i) => rangeData.push([l[i], u[i]]));

    const series: any[] = [
      {
        name: 'Actual Demand',
        type: 'spline',
        data: historySeries,
        color: '#13171d',
        lineWidth: 2.2,
        marker: { enabled: false }
      },
      {
        name: 'AI Forecast',
        type: 'spline',
        data: forecastSeries,
        color: this.color,
        lineWidth: 2.4,
        dashStyle: 'ShortDash',
        marker: {
          enabled: true,
          radius: 4,
          fillColor: '#ffffff',
          lineWidth: 2,
          lineColor: this.color
        }
      }
    ];

    // If arearange is supported by Highcharts-more:
    if (Highcharts.seriesTypes && Highcharts.seriesTypes.arearange) {
      series.unshift({
        name: '80% Confidence Band',
        type: 'arearange',
        data: rangeData,
        lineWidth: 0,
        linkedTo: ':previous',
        color: this.color,
        fillOpacity: 0.16,
        zIndex: 0,
        marker: { enabled: false }
      });
    }

    this.chartInstance = Highcharts.chart(this.chartContainer.nativeElement, {
      chart: {
        backgroundColor: 'transparent',
        spacing: [10, 10, 10, 10],
        style: { fontFamily: "'Inter', -apple-system, sans-serif" }
      },
      title: { text: null },
      credits: { enabled: false },
      legend: { enabled: false },
      xAxis: {
        categories,
        lineColor: '#e8eaee',
        tickColor: '#e8eaee',
        plotBands: [
          {
            from: nH - 0.5,
            to: nH + nF - 0.5,
            color: 'rgba(21, 128, 61, 0.04)',
            label: {
              text: 'AI FORECAST →',
              style: {
                color: this.color,
                fontSize: '9px',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: '700'
              },
              y: 12
            }
          }
        ],
        plotLines: [
          {
            value: nH - 1,
            color: this.color,
            dashStyle: 'Dash',
            width: 1.2
          }
        ],
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
        style: { color: '#fff', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace" }
      },
      series
    });
  }

  ngOnDestroy(): void {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
  }
}
