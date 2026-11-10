import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaletteToastService } from '../../../core/services/palette-toast.service';

@Component({
  selector: 'app-common-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-head">
      <div>
        <div class="eyebrow">{{ eyebrow }}</div>
        <h2>{{ title }}</h2>
        @if (desc) {
          <p>{{ desc }}</p>
        }
      </div>
      <div style="display:flex;gap:9px;align-items:center;flex-wrap:wrap">
        <ng-content />
        @if (showExport) {
          <button
            class="btn-ghost"
            (click)="toast.showToast('Export queued', title + ' will download as CSV', '↓')"
          >
            ↓ Export
          </button>
        }
      </div>
    </div>
  `
})
export class CommonPageHeader {
  @Input() eyebrow = '';
  @Input() title = '';
  @Input() desc = '';
  @Input() showExport = true;
  readonly toast = inject(PaletteToastService);
}
