import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CsiDataApiService } from '../../../../core/services/csi-data-api.service';
import { PaletteToastService } from '../../../../core/services/palette-toast.service';

@Component({
  selector: 'app-inventory-dead-stock',
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
            <th>On-hand stock</th>
            <th>Weekly demand</th>
            <th>Cover weeks</th>
            <th>Status</th>
            <th>Action</th>
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
              <td class="mono"><b>{{ api.fmt(r.stock) }}</b></td>
              <td class="mono">{{ r.weeklyDemand }}</td>
              <td class="mono" style="color:var(--q-emerging)"><b>{{ r.coverWeeks }}w</b></td>
              <td><span class="badge b-Emerging">{{ r.status }}</span></td>
              <td>
                <button
                  class="btn-ghost btn-xs"
                  (click)="toast.showToast('Flagged for markdown / over-dye', r.n + ' routed to dye-house repurpose')"
                >
                  Repurpose / Freeze
                </button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `
})
export class InventoryDeadStock {
  readonly api = inject(CsiDataApiService);
  readonly toast = inject(PaletteToastService);
  private readonly router = inject(Router);

  readonly rows = computed(() => this.api.db()?.inventoryOps?.deadStock || []);

  openColor(id: string): void {
    this.router.navigate(['/color', id]);
  }
}
