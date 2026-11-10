import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CsiDataApiService } from '../../core/services/csi-data-api.service';
import { CommonPageHeader } from '../../common/cards/common-page-header/common-page-header';
import { CommonColorTable } from '../../common/cards/common-color-table/common-color-table';

@Component({
  selector: 'app-my-colors',
  standalone: true,
  imports: [CommonModule, CommonPageHeader, CommonColorTable],
  template: `
    <app-common-page-header
      eyebrow="Brand(Nike) · Approved Shade Library"
      title="My Colors — 1,001 Approved Standards"
      desc="Every CSI shade standard historically ordered by Brand(Nike), scored with live network Emergence and Trend signals."
    />

    <app-common-color-table [sourcePool]="nikeColors()" />
  `
})
export class MyColors {
  readonly api = inject(CsiDataApiService);
  readonly nikeColors = computed(() => this.api.db()?.nike?.colors || []);
}

