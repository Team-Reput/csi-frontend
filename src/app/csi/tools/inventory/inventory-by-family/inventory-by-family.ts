import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CsiDataApiService } from '../../../../core/services/csi-data-api.service';

@Component({
  selector: 'app-inventory-by-family',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card pad0">
      <table>
        <thead>
          <tr>
            <th>Color Family</th>
            <th>SKUs</th>
            <th>On-hand Stock</th>
            <th>Weekly Demand</th>
            <th>Cover Weeks</th>
            <th>Reorder Alerts</th>
            <th>Dead-Stock SKUs</th>
          </tr>
        </thead>
        <tbody>
          @for (r of rows(); track r.family) {
            <tr>
              <td><b>{{ r.family }}</b></td>
              <td class="mono">{{ r.skus }}</td>
              <td class="mono">{{ api.fmt(r.stock) }}</td>
              <td class="mono">{{ api.fmt(r.weeklyDemand) }}</td>
              <td class="mono"><b>{{ r.coverWeeks }}w</b></td>
              <td><span class="badge b-Emerging">{{ r.reorder }}</span></td>
              <td><span class="badge b-Dormant">{{ r.dead }}</span></td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `
})
export class InventoryByFamily {
  readonly api = inject(CsiDataApiService);
  readonly rows = computed(() => this.api.db()?.inventoryOps?.byFamily || []);
}
