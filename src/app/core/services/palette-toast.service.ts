import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  title: string;
  desc: string;
  ic: string;
  visible: boolean;
}

@Injectable({ providedIn: 'root' })
export class PaletteToastService {
  readonly palette = signal<string[]>([]);
  readonly toastState = signal<ToastMessage>({
    title: '',
    desc: '',
    ic: '✓',
    visible: false
  });

  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  showToast(title: string, desc = '', ic = '✓'): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastState.set({ title, desc, ic, visible: true });
    this.toastTimer = setTimeout(() => {
      this.toastState.update((s) => ({ ...s, visible: false }));
    }, 2800);
  }

  addToPalette(colorId: string): void {
    const current = this.palette();
    if (!current.includes(colorId)) {
      this.palette.set([...current, colorId]);
      this.showToast('Added to palette', 'Color saved to your working palette', '✦');
    } else {
      this.showToast('Already in palette', 'This color is already in your working palette', '✦');
    }
  }

  clearPalette(): void {
    this.palette.set([]);
  }
}

