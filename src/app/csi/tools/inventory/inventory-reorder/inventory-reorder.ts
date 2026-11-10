import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CsiDataApiService } from '../../../../core/services/csi-data-api.service';
import { PaletteToastService } from '../../../../core/services/palette-toast.service';

@Component({
  selector: 'app-inventory-reorder',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card pad0">
      <table>
        <thead>
          <tr>
            <th>Shade</th>
            <th>Standard</th>
            <th>Family</th>
            <th>Weekly demand</th>
            <th>12m fwd/wk</th>
            <th>Slope</th>
            <th>Cover</th>
            <th>Reorder qty</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (r of rows(); track r.id) {
            <tr>
              <td><span class="sw-sm" [style.background]="r.hex"></span></td>
              <td>
                <b style="cursor:pointer" (click)="openColor(r.id)">{{ r.n }}</b>
                <div class="mono" style="font-size:10px;color:var(--text-faint)">{{ r.id }}</div>
              </td>
              <td>{{ r.fam }}</td>
              <td class="mono">{{ r.weeklyDemand }}</td>
              <td class="mono"><b>{{ r.fwdWeekly }}</b></td>
              <td class="mono" [style.color]="r.slope >= 0 ? 'var(--accent-2)' : 'var(--danger)'">
                {{ r.slope >= 0 ? '+' : '' }}{{ r.slope }}%
              </td>
              <td class="mono"><b>{{ r.coverWeeks }}w</b></td>
              <td class="mono" style="font-weight:700;color:var(--danger)">
                {{ api.fmt(r.reorderQty) }}
              </td>
              <td>
                <span class="badge" [ngClass]="r.status === 'Stockout Risk' ? 'b-Dormant' : 'b-Emerging'">
                  {{ r.status }}
                </span>
              </td>
              <td>
                <button
                  class="btn-leaf btn-xs"
                  (click)="toast.showToast('PO drafted', r.n + ' · ' + api.fmt(r.reorderQty) + ' units queued')"
                >
                  Create PO
                </button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `
})
export class InventoryReorder {
  readonly api = inject(CsiDataApiService);
  readonly toast = inject(PaletteToastService);
  private readonly router = inject(Router);

  readonly rows = computed(() => this.api.db()?.inventoryOps?.reorder || []);

  openColor(id: string): void {
    this.router.navigate(['/color', id]);
  }
}
