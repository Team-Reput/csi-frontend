import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CsiDataApiService } from '../../../core/services/csi-data-api.service';
import { CommonPageHeader } from '../../../common/cards/common-page-header/common-page-header';
import { TrendBridgeCompare } from './trend-bridge-compare/trend-bridge-compare';

@Component({
  selector: 'app-trend-bridge',
  standalone: true,
  imports: [CommonModule, CommonPageHeader, TrendBridgeCompare],
  templateUrl: './trend-bridge.html'
})
export class TrendBridge {
  readonly api = inject(CsiDataApiService);
  private readonly router = inject(Router);

  readonly showCompare = signal<boolean>(false);

  readonly filteredTrends = computed(() => this.api.db()?.trends || []);

  openColor(id?: string): void {
    if (id) this.router.navigate(['/color', id]);
  }
}
