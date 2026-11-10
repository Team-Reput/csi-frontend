import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CsiDataApiService } from '../../../core/services/csi-data-api.service';
import { CommonPageHeader } from '../../../common/cards/common-page-header/common-page-header';
import { CommonKpiRow, KpiItem } from '../../../common/cards/common-kpi-row/common-kpi-row';
import { InventoryReorder } from './inventory-reorder/inventory-reorder';
import { InventoryDeadStock } from './inventory-dead-stock/inventory-dead-stock';
import { InventoryAiPlan } from './inventory-ai-plan/inventory-ai-plan';
import { InventoryByFamily } from './inventory-by-family/inventory-by-family';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    CommonModule,
    CommonPageHeader,
    CommonKpiRow,
    InventoryReorder,
    InventoryDeadStock,
    InventoryAiPlan,
    InventoryByFamily
  ],
  templateUrl: './inventory.html'
})
export class Inventory {
  readonly api = inject(CsiDataApiService);
  readonly invTab = signal<'reorder' | 'dead' | 'plan' | 'family'>('reorder');

  readonly kpis = computed<KpiItem[]>(() => {
    const s = this.api.db()?.inventoryOps?.summary;
    if (!s) return [];
    return [
      {
        label: 'Reorder Alerts',
        value: s.reorderNow,
        sub: `${this.api.fmt(s.reorderUnits)} units to dye`,
        bar: '#dc2626',
        trend: '< 4 wks cover',
        down: true
      },
      {
        label: 'Dead-Stock SKUs',
        value: s.deadStock,
        sub: `${this.api.fmt(s.deadUnits)} excess units`,
        bar: '#e0932f',
        trend: '> 20 wks cover',
        down: true
      },
      {
        label: 'Balanced SKUs',
        value: s.healthy,
        sub: 'Optimal 4–20 wks cover',
        bar: '#16a34a',
        trend: 'Healthy'
      },
      {
        label: 'Active Monitored SKUs',
        value: s.skus,
        sub: 'Across 13 families',
        bar: '#2f81c9',
        trend: 'Live ERP'
      }
    ];
  });
}

