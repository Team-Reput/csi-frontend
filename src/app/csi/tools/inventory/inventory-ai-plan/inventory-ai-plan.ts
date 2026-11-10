import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CsiDataApiService } from '../../../../core/services/csi-data-api.service';

@Component({
  selector: 'app-inventory-ai-plan',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card pad0">
      <table>
        <thead>
          <tr>
            <th>Direction</th>
            <th>Lens</th>
            <th>Family</th>
            <th>Shades</th>
            <th>Current 4Q</th>
            <th>Predicted 4Q</th>
            <th>Growth</th>
            <th>Recommended Action</th>
          </tr>
        </thead>
        <tbody>
          @for (r of rows(); track r.leader + r.lens) {
            <tr>
              <td>
                <div style="display:flex;align-items:center;gap:8px">
                  <span
                    class="sw-sm"
                    [style.background]="r.members[0].hex || '#ccc'"
                  ></span>
                  <b>{{ r.leader }}</b>
                </div>
              </td>
              <td>
                <span class="badge" [ngClass]="r.lens === 'emerging' ? 'b-Emerging' : 'b-Breakout'">
                  {{ r.lens }}
                </span>
              </td>
              <td>{{ r.family }}</td>
              <td class="mono">{{ r.members.length }}</td>
              <td class="mono">{{ api.fmt(r.current) }}</td>
              <td class="mono"><b>{{ api.fmt(r.predicted) }}</b></td>
              <td class="mono" [style.color]="r.growth >= 0 ? 'var(--accent-2)' : 'var(--danger)'">
                <b>{{ r.growth >= 0 ? '+' : '' }}{{ r.growth }}%</b>
              </td>
              <td>
                <span
                  class="badge"
                  [ngClass]="
                    r.action === 'Develop' || r.action === 'Expand'
                      ? 'b-Breakout'
                      : r.action === 'Retire'
                      ? 'b-Dormant'
                      : 'b-Core'
                  "
                >
                  {{ r.action }} ({{ r.suggestStandards || r.members.length }} standards)
                </span>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `
})
export class InventoryAiPlan {
  readonly api = inject(CsiDataApiService);
  readonly rows = computed(() => this.api.db()?.inventoryPlan || []);
}
