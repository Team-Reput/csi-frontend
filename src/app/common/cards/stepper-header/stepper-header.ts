import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stepper-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="display:flex;align-items:center;gap:0;margin-bottom:24px;flex-wrap:wrap">
      @for (s of steps; track s.n; let i = $index) {
        <div style="display:flex;align-items:center;gap:11px">
          <div
            style="width:34px;height:34px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px"
            [style.background]="s.n < activeStep ? 'var(--grad-leaf)' : s.n === activeStep ? 'var(--grad-forest)' : 'var(--card)'"
            [style.color]="s.n <= activeStep ? '#fff' : 'var(--text-faint)'"
            [style.box-shadow]="s.n === activeStep ? '0 3px 12px rgba(15,42,28,.28)' : 'none'"
            [style.border]="s.n > activeStep ? '1px solid var(--border-2)' : 'none'"
          >
            {{ s.n < activeStep ? '✓' : s.n }}
          </div>
          <div style="margin-right:14px">
            <div
              style="font-size:12.5px"
              [style.font-weight]="s.n === activeStep ? '700' : '500'"
              [style.color]="s.n <= activeStep ? 'var(--text)' : 'var(--text-faint)'"
            >
              {{ s.t }}
            </div>
          </div>
          @if (i < steps.length - 1) {
            <div
              style="width:52px;height:2px;border-radius:2px;margin-right:14px"
              [style.background]="s.n < activeStep ? 'var(--accent-2)' : 'var(--border-2)'"
            ></div>
          }
        </div>
      }
    </div>
  `
})
export class StepperHeader {
  @Input() activeStep = 1;
  readonly steps = [
    { n: 1, t: 'Data Upload' },
    { n: 2, t: 'Preprocessing' },
    { n: 3, t: 'Data Validation' }
  ];
}
