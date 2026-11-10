import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthRoleService } from '../../core/services/auth-role.service';
import { PaletteToastService } from '../../core/services/palette-toast.service';
import { CommonPageHeader } from '../../common/cards/common-page-header/common-page-header';
import { StepperHeader } from '../../common/cards/stepper-header/stepper-header';

@Component({
  selector: 'app-data-upload',
  standalone: true,
  imports: [CommonModule, CommonPageHeader, StepperHeader],
  templateUrl: './data-upload.html'
})
export class DataUpload implements OnInit {
  readonly auth = inject(AuthRoleService);
  readonly toast = inject(PaletteToastService);
  private readonly router = inject(Router);

  readonly uploadProgress = signal<number>(0);
  readonly uploadStepLabel = signal<string>('');

  readonly files = [
    { n: '2006-2026_Standard_Sales.xlsx', t: 'Order transactions', sz: '~205 MB', rows: '4,346,403 rows' },
    { n: 'Inventory_ID_w_LAB.xls', t: 'Color master with LAB', sz: '14.2 MB', rows: '48,491 colors' },
    { n: 'Customer_Class_Mapping.csv', t: 'Brand / account mapping', sz: '0.6 MB', rows: '1,672 brands' }
  ];

  ngOnInit(): void {
    this.auth.setupFlowStep.set(1);
  }

  simUploadFlow(): void {
    const steps = [
      { label: 'Uploading files', pct: 25 },
      { label: 'Reading sheets', pct: 50 },
      { label: 'Detecting schema', pct: 75 },
      { label: 'Files ready', pct: 100 }
    ];
    let i = 0;
    const nextStep = () => {
      if (i >= steps.length) {
        this.auth.uploaded.set(true);
        this.uploadProgress.set(100);
        this.toast.showToast('Upload complete', '3 files loaded · 4,346,403 rows', '⇪');
        return;
      }
      this.uploadStepLabel.set(steps[i].label);
      this.uploadProgress.set(steps[i].pct);
      i++;
      setTimeout(nextStep, 350);
    };
    nextStep();
  }

  goPreprocess(): void {
    this.auth.setupFlowStep.set(2);
    this.router.navigate(['/csi/setup/preprocessing']);
  }
}
