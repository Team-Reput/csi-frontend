import {
  Component,
  inject,
  signal,
  computed,
  AfterViewInit,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CsiDataApiService } from '../../../core/services/csi-data-api.service';
import { PaletteToastService } from '../../../core/services/palette-toast.service';
import { CommonPageHeader } from '../../../common/cards/common-page-header/common-page-header';
import { ColorStandard } from '../../../core/models/csi.models';

export interface NeighborItem extends ColorStandard {
  de: number;
}

@Component({
  selector: 'app-nearby-explorer',
  standalone: true,
  imports: [CommonModule, FormsModule, CommonPageHeader],
  templateUrl: './nearby-explorer.html'
})
export class NearbyExplorer implements AfterViewInit {
  @ViewChild('colorCanvas') colorCanvas?: ElementRef<HTMLCanvasElement>;

  readonly api = inject(CsiDataApiService);
  readonly toast = inject(PaletteToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly nearId = signal<string>('');
  readonly nearRad = signal<number>(10);
  readonly nearVal = signal<number>(88);
  readonly nearCustom = signal<{ hex: string; L: number; a: number; b: number; label: string } | null>(
    null
  );
  readonly customL = signal<number>(52);
  readonly customA = signal<number>(12);
  readonly customB = signal<number>(18);

  private canvasDragging = false;

  readonly anchor = computed(() => {
    const custom = this.nearCustom();
    if (custom) {
      return {
        id: 'CUSTOM',
        n: custom.label || 'Custom Picked Color',
        hex: custom.hex,
        L: custom.L,
        a: custom.a,
        b: custom.b,
        fam: 'Custom LAB',
        q: 'Emerging' as const
      };
    }
    const pool = this.api.colorPool();
    const id = this.nearId();
    return pool.find((c) => c.id === id) || pool[0];
  });

  readonly neighbors = computed<NeighborItem[]>(() => {
    const a = this.anchor();
    if (!a) return [];
    const rad = this.nearRad();
    return this.api
      .colorPool()
      .filter((c) => c.id !== a.id)
      .map((c) => ({
        ...c,
        de: this.api.cmcDE([a.L, a.a, a.b], [c.L, c.a, c.b])
      }))
      .filter((c) => c.de <= rad)
      .sort((x, y) => x.de - y.de)
      .slice(0, 24);
  });

  ngAfterViewInit(): void {
    const qId = this.route.snapshot.queryParamMap.get('anchor');
    const pool = this.api.colorPool();
    if (qId) {
      this.nearId.set(qId);
    } else if (pool.length && !this.nearId()) {
      this.nearId.set(pool[0].id);
    }
    const a = this.anchor();
    if (a) {
      this.customL.set(a.L);
      this.customA.set(a.a);
      this.customB.set(a.b);
    }
    setTimeout(() => this.drawPickerCanvas(), 0);
  }

  onSelectStandard(id: string): void {
    this.nearCustom.set(null);
    this.nearId.set(id);
    const a = this.anchor();
    if (a) {
      this.customL.set(a.L);
      this.customA.set(a.a);
      this.customB.set(a.b);
    }
  }

  onValChange(val: number): void {
    this.nearVal.set(Number(val));
    this.drawPickerCanvas();
  }

  drawPickerCanvas(): void {
    const cv = this.colorCanvas?.nativeElement;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const w = cv.width;
    const h = cv.height;
    const val = this.nearVal() / 100;
    const img = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++) {
      const sat = 1 - y / h;
      for (let x = 0; x < w; x++) {
        const hue = (x / w) * 360;
        const [r, g, b] = this.hsv2rgb(hue, sat, val);
        const idx = (y * w + x) * 4;
        img.data[idx] = r;
        img.data[idx + 1] = g;
        img.data[idx + 2] = b;
        img.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  onCanvasMouseDown(ev: MouseEvent): void {
    this.canvasDragging = true;
    this.pickFromCanvas(ev);
  }

  onCanvasMouseMove(ev: MouseEvent): void {
    if (this.canvasDragging) {
      this.pickFromCanvas(ev);
    }
  }

  onCanvasMouseUp(): void {
    this.canvasDragging = false;
  }

  private pickFromCanvas(ev: MouseEvent): void {
    const cv = this.colorCanvas?.nativeElement;
    if (!cv) return;
    const rect = cv.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (ev.clientY - rect.top) / rect.height));
    const hue = x * 360;
    const sat = 1 - y;
    const val = this.nearVal() / 100;
    const [r, g, b] = this.hsv2rgb(hue, sat, val);
    const hex = '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
    const [L, a, bl] = this.rgb2lab(r, g, b);
    this.customL.set(L);
    this.customA.set(a);
    this.customB.set(bl);
    this.nearCustom.set({
      hex,
      L,
      a,
      b: bl,
      label: `Picked ${hex}`
    });
  }

  pickFromLab(): void {
    const L = Number(this.customL()) || 55;
    const a = Number(this.customA()) || 0;
    const b = Number(this.customB()) || 0;
    const cur = this.nearCustom();
    this.nearCustom.set({
      hex: cur?.hex || '#4A7C59',
      L,
      a,
      b,
      label: `Custom L*${L} a*${a} b*${b}`
    });
  }

  openColor(id: string): void {
    this.router.navigate(['/color', id]);
  }

  private hsv2rgb(h: number, s: number, v: number): [number, number, number] {
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let r = 0;
    let g = 0;
    let b = 0;
    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    return [
      Math.round((r + m) * 255),
      Math.round((g + m) * 255),
      Math.round((b + m) * 255)
    ];
  }

  private rgb2lab(r: number, g: number, bl: number): [number, number, number] {
    const f = (v: number) => {
      v /= 255;
      return v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92;
    };
    const R = f(r);
    const G = f(g);
    const B = f(bl);
    let X = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
    let Y = R * 0.2126 + G * 0.7152 + B * 0.0722;
    let Z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
    const h = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
    X = h(X);
    Y = h(Y);
    Z = h(Z);
    return [
      +(116 * Y - 16).toFixed(1),
      +(500 * (X - Y)).toFixed(1),
      +(200 * (Y - Z)).toFixed(1)
    ];
  }
}

