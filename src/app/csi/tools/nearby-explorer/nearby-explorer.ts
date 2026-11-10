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
import { CommonPageHeader } from '../../../common/cards/common-page-header/common-page-header';
import { ColorStandard } from '../../../core/models/csi.models';

export interface NeighborItem extends ColorStandard {
  de: number;
}

@Component({
  selector: 'app-nearby-explorer',
  standalone: true,
  imports: [CommonModule, FormsModule, CommonPageHeader],
  templateUrl: './nearby-explorer.html',
  styles: [
    `
      .picker-grid {
        display: grid;
        grid-template-columns: 1fr 340px;
        gap: 22px;
        align-items: start;
      }
      .nearby-bottom-grid {
        grid-template-columns: 340px 1fr;
        align-items: start;
      }
      .sv-wrap {
        position: relative;
        width: 100%;
        aspect-ratio: 1.6 / 1;
        border-radius: 13px;
        overflow: hidden;
        box-shadow: var(--sh-md);
        cursor: crosshair;
        touch-action: none;
      }
      .sv-handle {
        position: absolute;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid #fff;
        box-shadow: 0 0 0 1.5px rgba(0, 0, 0, 0.4), 0 2px 6px rgba(0, 0, 0, 0.4);
        transform: translate(-50%, -50%);
        pointer-events: none;
      }
      .hue-wrap {
        position: relative;
        margin-top: 16px;
        height: 20px;
        border-radius: 10px;
        overflow: visible;
        cursor: pointer;
        touch-action: none;
        background: linear-gradient(
          to right,
          #f00 0%,
          #ff0 17%,
          #0f0 33%,
          #0ff 50%,
          #00f 67%,
          #f0f 83%,
          #f00 100%
        );
      }
      .hue-handle {
        position: absolute;
        top: 50%;
        width: 16px;
        height: 26px;
        border-radius: 6px;
        border: 3px solid #fff;
        box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.35), 0 2px 6px rgba(0, 0, 0, 0.35);
        transform: translate(-50%, -50%);
        pointer-events: none;
      }
      .nb-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
        gap: 10px;
      }
      .nb-tile {
        border: 1px solid var(--border);
        border-radius: 11px;
        padding: 9px;
        text-align: center;
        cursor: pointer;
        transition: 0.12s;
      }
      .nb-tile:hover {
        border-color: var(--leaf);
      }
      @media (max-width: 960px) {
        .picker-grid,
        .nearby-bottom-grid {
          grid-template-columns: 1fr;
        }
      }
    `
  ]
})
export class NearbyExplorer implements AfterViewInit {
  @ViewChild('svCanvas') svCanvas?: ElementRef<HTMLCanvasElement>;

  readonly api = inject(CsiDataApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly pickH = signal<number>(352);
  readonly pickS = signal<number>(0.85);
  readonly pickV = signal<number>(0.72);

  readonly nearId = signal<string>('');
  readonly nearRad = signal<number>(5);
  readonly searchQuery = signal<string>('');
  readonly labL = signal<string | number | null>('');
  readonly labA = signal<string | number | null>('');
  readonly labB = signal<string | number | null>('');
  readonly labMsg = signal<{ warn?: string; name?: string; de?: number } | null>(null);

  private dragSV = false;
  private dragHue = false;

  readonly pickedColor = computed(() => {
    const h = this.pickH();
    const s = this.pickS();
    const v = this.pickV();
    const [r, g, b] = this.hsv2rgb(h, s, v);
    const [hr, hg, hb] = this.hsv2rgb(h, 1, 1);
    return {
      hex: this.rgb2hex(r, g, b).toUpperCase(),
      hueHex: this.rgb2hex(hr, hg, hb),
      lab: this.rgb2lab(r, g, b)
    };
  });

  readonly nearestMatch = computed<{ c: ColorStandard; de: number } | null>(() => {
    const pool = this.api.colorPool();
    if (!pool.length) return null;
    const lab = this.pickedColor().lab;
    let best: { c: ColorStandard; de: number } | null = null;
    for (const c of pool) {
      const de = this.api.cmcDE(lab, [c.L, c.a, c.b]);
      if (!best || de < best.de) {
        best = { c, de };
      }
    }
    return best;
  });

  readonly anchor = computed<ColorStandard | undefined>(() => {
    const pool = this.api.colorPool();
    if (!pool.length) return undefined;
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
      .slice(0, 40);
  });

  ngAfterViewInit(): void {
    const qId = this.route.snapshot.queryParamMap.get('anchor');
    const pool = this.api.colorPool();
    if (qId) {
      this.nearId.set(qId);
    } else if (pool.length && !this.nearId()) {
      this.nearId.set(pool[0].id);
    }
    this.paintSV();
  }

  paintSV(): void {
    const cv = this.svCanvas?.nativeElement;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const w = cv.width;
    const h = cv.height;
    const [hr, hg, hb] = this.hsv2rgb(this.pickH(), 1, 1);

    ctx.fillStyle = `rgb(${hr | 0},${hg | 0},${hb | 0})`;
    ctx.fillRect(0, 0, w, h);

    const gx = ctx.createLinearGradient(0, 0, w, 0);
    gx.addColorStop(0, '#fff');
    gx.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gx;
    ctx.fillRect(0, 0, w, h);

    const gy = ctx.createLinearGradient(0, 0, 0, h);
    gy.addColorStop(0, 'rgba(0,0,0,0)');
    gy.addColorStop(1, '#000');
    ctx.fillStyle = gy;
    ctx.fillRect(0, 0, w, h);
  }

  onSvPointerDown(ev: PointerEvent): void {
    this.dragSV = true;
    (ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId);
    this.updateSvFromPointer(ev);
  }

  onSvPointerMove(ev: PointerEvent): void {
    if (this.dragSV) {
      this.updateSvFromPointer(ev);
    }
  }

  onSvPointerUp(): void {
    this.dragSV = false;
  }

  onHuePointerDown(ev: PointerEvent): void {
    this.dragHue = true;
    (ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId);
    this.updateHueFromPointer(ev);
  }

  onHuePointerMove(ev: PointerEvent): void {
    if (this.dragHue) {
      this.updateHueFromPointer(ev);
    }
  }

  onHuePointerUp(): void {
    this.dragHue = false;
  }

  private updateSvFromPointer(ev: PointerEvent): void {
    const rect = (ev.currentTarget as HTMLElement).getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (ev.clientY - rect.top) / rect.height));
    this.pickS.set(x);
    this.pickV.set(1 - y);
    this.syncAnchorToPicker();
  }

  private updateHueFromPointer(ev: PointerEvent): void {
    const rect = (ev.currentTarget as HTMLElement).getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
    this.pickH.set(x * 360);
    this.paintSV();
    this.syncAnchorToPicker();
  }

  private syncAnchorToPicker(): void {
    const match = this.nearestMatch();
    if (match) {
      this.nearId.set(match.c.id);
    }
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    const q = query.trim().toLowerCase();
    if (q.length < 2) return;
    const match = this.api.colorPool().find((c) => c.n.toLowerCase().includes(q));
    if (match) {
      this.nearId.set(match.id);
    }
  }

  searchByLab(): void {
    const L = parseFloat(String(this.labL() ?? ''));
    const a = parseFloat(String(this.labA() ?? ''));
    const b = parseFloat(String(this.labB() ?? ''));
    if ([L, a, b].some((v) => Number.isNaN(v))) {
      this.labMsg.set({ warn: 'Enter all three values (L*, a*, b*)' });
      return;
    }
    const pool = this.api.colorPool();
    let best: { c: ColorStandard; de: number } | null = null;
    for (const c of pool) {
      const de = this.api.cmcDE([L, a, b], [c.L, c.a, c.b]);
      if (!best || de < best.de) {
        best = { c, de };
      }
    }
    if (!best) {
      this.labMsg.set({ warn: 'No match found' });
      return;
    }
    this.nearId.set(best.c.id);
    this.labMsg.set({ name: best.c.n, de: best.de });
  }

  selectAnchor(id: string): void {
    this.nearId.set(id);
  }

  openColor(id: string): void {
    this.router.navigate(['/color', id]);
  }

  private hsv2rgb(h: number, s: number, v: number): [number, number, number] {
    const hn = h / 360;
    const i = Math.floor(hn * 6);
    const f = hn * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    let r = 0;
    let g = 0;
    let b = 0;
    switch (i % 6) {
      case 0:
        r = v;
        g = t;
        b = p;
        break;
      case 1:
        r = q;
        g = v;
        b = p;
        break;
      case 2:
        r = p;
        g = v;
        b = t;
        break;
      case 3:
        r = p;
        g = q;
        b = v;
        break;
      case 4:
        r = t;
        g = p;
        b = v;
        break;
      default:
        r = v;
        g = p;
        b = q;
        break;
    }
    return [r * 255, g * 255, b * 255];
  }

  private rgb2hex(r: number, g: number, b: number): string {
    return (
      '#' +
      [r, g, b]
        .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
        .join('')
    );
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
    return [116 * Y - 16, 500 * (X - Y), 200 * (Y - Z)];
  }
}
