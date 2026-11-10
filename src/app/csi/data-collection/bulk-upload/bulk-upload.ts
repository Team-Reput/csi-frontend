import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaletteToastService } from '../../../core/services/palette-toast.service';
import { CommonPageHeader } from '../../../common/cards/common-page-header/common-page-header';

@Component({
  selector: 'app-bulk-upload',
  standalone: true,
  imports: [CommonModule, CommonPageHeader],
  templateUrl: './bulk-upload.html'
})
export class BulkUpload {
  readonly toast = inject(PaletteToastService);
  readonly uploaded = signal<boolean>(false);

  readonly jobs = [
    ['Solomon_2026_Q3_sync.xlsx', '14 Sep 2026', '142,880', 'complete'],
    ['LabDip_batch_Aug26.csv', '28 Aug 2026', '1,240', 'complete'],
    ['Brand_class_map_2026.csv', '12 Aug 2026', '1,672', 'complete']
  ];

  simUpload(): void {
    this.uploaded.set(true);
    this.toast.showToast(
      'Batch ingested',
      '48,220 rows parsed · verified and added to intelligence graph',
      '⇪'
    );
  }
}
