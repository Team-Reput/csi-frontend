import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CsiDataApiService } from '../../../core/services/csi-data-api.service';
import { PaletteToastService } from '../../../core/services/palette-toast.service';
import { CommonPageHeader } from '../../../common/cards/common-page-header/common-page-header';
import { ColorStandard } from '../../../core/models/csi.models';

@Component({
  selector: 'app-palette-studio',
  standalone: true,
  imports: [CommonModule, CommonPageHeader],
  templateUrl: './palette-studio.html'
})
export class PaletteStudio {
  readonly api = inject(CsiDataApiService);
  readonly toast = inject(PaletteToastService);
  private readonly router = inject(Router);

  readonly paletteItems = computed<ColorStandard[]>(() => {
    const db = this.api.db();
    if (!db) return [];
    const ids = this.toast.palette();
    if (!ids.length) {
      return db.colors.slice(0, 6);
    }
    return ids
      .map((id) => db.colors.find((c) => c.id === id))
      .filter((c): c is ColorStandard => Boolean(c));
  });

  readonly suggestedShades = computed<ColorStandard[]>(() => {
    const db = this.api.db();
    return (db?.colors || []).slice(6, 18);
  });

  clearAll(): void {
    this.toast.clearPalette();
    this.toast.showToast('Palette cleared', 'Default 6-shade seasonal capsule restored');
  }

  openColor(id: string): void {
    this.router.navigate(['/color', id]);
  }
}

