import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CsiDataApiService } from '../../../core/services/csi-data-api.service';
import { AuthRoleService } from '../../../core/services/auth-role.service';
import { CommonPageHeader } from '../../../common/cards/common-page-header/common-page-header';
import { TrendDirection } from '../../../core/models/csi.models';

@Component({
  selector: 'app-color-space-3d',
  standalone: true,
  imports: [CommonModule, FormsModule, CommonPageHeader],
  templateUrl: './color-space-3d.html'
})
export class ColorSpace3d implements OnInit, OnDestroy {
  readonly api = inject(CsiDataApiService);
  readonly auth = inject(AuthRoleService);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);

  // Prototype default state: rot = { x: -0.45, y: 0.7 }, scale = 4.6 * zoom
  readonly lens = signal<'emerging' | 'trending'>('emerging');
  readonly rotX = signal<number>(-0.45);
  readonly rotY = signal<number>(0.7);
  readonly zoom = signal<number>(1.0);
  readonly panX = signal<number>(0);
  readonly panY = signal<number>(0);
  readonly autoSpin = signal<boolean>(true);
  readonly isHovered = signal<boolean>(false);

  // Tooltip state
  readonly tipVisible = signal<boolean>(false);
  readonly tipX = signal<number>(0);
  readonly tipY = signal<number>(0);
  readonly tipHtml = signal<SafeHtml>('');

  private dragging = false;
  private dragMode: 'rot' | 'pan' = 'rot';
  private lastX = 0;
  private lastY = 0;
  private rafId: number | null = null;

  readonly isNike = computed(() => this.auth.role() === 'nike');

  readonly activeDirs = computed<TrendDirection[]>(() => {
    const db = this.api.db();
    if (!db) return [];
    return this.lens() === 'emerging' ? db.emergingDirections : db.trendingDirections;
  });

  readonly stageSvg = computed<SafeHtml>(() => {
    const dirs = this.activeDirs();
    const w = 1160;
    const h = 560;
    const scale = 4.6 * this.zoom();
    const cx = w / 2 + this.panX();
    const cy = h / 2 + this.panY();
    const lensVal = this.lens();
    const ringCol = lensVal === 'emerging' ? '224,147,47' : '22,163,74';

    const rot = { x: this.rotX(), y: this.rotY() };

    // Projection helper matching prototype exactly
    const P = (L: number, a: number, b: number): [number, number, number, number] => {
      const X = a;
      const Y = L - 52;
      const Z = b;
      const cyr = Math.cos(rot.y);
      const syr = Math.sin(rot.y);
      const X1 = X * cyr + Z * syr;
      const Z1 = -X * syr + Z * cyr;
      const cxr = Math.cos(rot.x);
      const sxr = Math.sin(rot.x);
      const Y1 = Y * cxr - Z1 * sxr;
      const Z2 = Y * sxr + Z1 * cxr;
      const p = 1 / (1 + Z2 / 460);
      return [cx + X1 * scale * p, cy - Y1 * scale * p, Z2, p];
    };

    // Axes with negative arms
    const aN = P(52, -62, 0);
    const aP = P(52, 62, 0);
    const bN = P(52, 0, -62);
    const bP = P(52, 0, 62);
    const lLo = P(16, 0, 0);
    const lHi = P(106, 0, 0);

    const axline = (p1: number[], p2: number[], c: string) =>
      `<line x1="${p1[0].toFixed(1)}" y1="${p1[1].toFixed(1)}" x2="${p2[0].toFixed(1)}" y2="${p2[1].toFixed(1)}" stroke="${c}" stroke-width="1"/>`;
    const axlab = (p: number[], t: string, c: string) =>
      `<text x="${p[0].toFixed(1)}" y="${p[1].toFixed(1)}" dx="3" font-size="10" fill="${c}" font-family="monospace">${t}</text>`;

    let ax = '';
    ax += axline(aN, aP, 'rgba(255,255,255,.18)') + axlab(aP, '+a', '#f0a58a') + axlab(aN, '−a', '#8fd6a6');
    ax += axline(bN, bP, 'rgba(255,255,255,.18)') + axlab(bP, '+b', '#f2d98a') + axlab(bN, '−b', '#8fbdf0');
    ax += axline(lLo, lHi, 'rgba(255,255,255,.18)') + axlab(lHi, 'L 100', 'rgba(255,255,255,.6)') + axlab(lLo, 'L 0', 'rgba(255,255,255,.45)');

    // Clusters with projected members + screen centroid + radius
    const clusters = dirs.map((d, di) => {
      const mp = d.members.map((m) => {
        const [px, py, pz, p] = P(m.L, m.a, m.b);
        return { ...m, px, py, pz, p };
      });
      const ccx = mp.reduce((s, m) => s + m.px, 0) / (mp.length || 1);
      const ccy = mp.reduce((s, m) => s + m.py, 0) / (mp.length || 1);
      const ccz = mp.reduce((s, m) => s + m.pz, 0) / (mp.length || 1);
      let rad = 0;
      mp.forEach((m) => {
        rad = Math.max(rad, Math.hypot(m.px - ccx, m.py - ccy));
      });
      rad = Math.max(rad + 12, 20);
      return { d, di, mp, ccx, ccy, ccz, rad };
    }).sort((a, b) => a.ccz - b.ccz); // far first

    let bg = '';
    let dots = '';
    let hit = '';

    clusters.forEach((cl) => {
      const { d, di, mp, ccx, ccy, rad } = cl;
      // Bounding circle
      bg += `<circle cx="${ccx.toFixed(1)}" cy="${ccy.toFixed(1)}" r="${rad.toFixed(1)}" fill="rgba(${ringCol},0.05)" stroke="rgba(${ringCol},0.42)" stroke-width="1.2" stroke-dasharray="3 3"/>`;
      // Tether lines
      mp.forEach((m) => {
        bg += `<line x1="${ccx.toFixed(1)}" y1="${ccy.toFixed(1)}" x2="${m.px.toFixed(1)}" y2="${m.py.toFixed(1)}" stroke="${m.hex}" stroke-width="0.5" opacity="0.25"/>`;
      });
      // Member dots
      mp.slice()
        .sort((a, b) => a.pz - b.pz)
        .forEach((m) => {
          const r = (3 + Math.max(0, (m.pz + 90) / 40)) * m.p;
          dots += `<circle cx="${m.px.toFixed(1)}" cy="${m.py.toFixed(1)}" r="${r.toFixed(1)}" fill="${m.hex}" stroke="rgba(255,255,255,.55)" stroke-width="0.6" opacity="${(0.6 + m.p * 0.4).toFixed(2)}"/>`;
        });
      // Interaction hit circle
      hit += `<circle class="cl-hit" data-di="${di}" data-dirid="${d.dir_id}" cx="${ccx.toFixed(1)}" cy="${ccy.toFixed(1)}" r="${rad.toFixed(1)}" fill="transparent" style="cursor:pointer"/>`;
    });

    const svg = `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;touch-action:none;display:block" id="svg3d" font-family="Inter">${ax}${bg}${dots}${hit}</svg>`;
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  });

  ngOnInit(): void {
    this.startTick();
  }

  private startTick(): void {
    const tick = () => {
      if (this.autoSpin() && !this.isHovered() && !this.dragging) {
        this.rotY.set(this.rotY() + 0.004);
      }
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  onMouseDown(ev: MouseEvent): void {
    const hitEl = (ev.target as HTMLElement)?.closest('.cl-hit');
    if (hitEl && !ev.shiftKey && ev.button === 0) {
      return; // allow click on cluster
    }
    this.dragging = true;
    this.autoSpin.set(false);
    this.dragMode = ev.shiftKey || ev.button === 2 || ev.button === 1 ? 'pan' : 'rot';
    this.lastX = ev.clientX;
    this.lastY = ev.clientY;
  }

  @HostListener('window:mousemove', ['$event'])
  onWindowMouseMove(ev: MouseEvent): void {
    if (!this.dragging) return;
    const dx = ev.clientX - this.lastX;
    const dy = ev.clientY - this.lastY;
    if (this.dragMode === 'rot') {
      this.rotY.set(this.rotY() + dx * 0.008);
      this.rotX.set(Math.max(-1.5, Math.min(1.5, this.rotX() + dy * 0.008)));
    } else {
      this.panX.set(this.panX() + dx);
      this.panY.set(this.panY() + dy);
    }
    this.lastX = ev.clientX;
    this.lastY = ev.clientY;
  }

  @HostListener('window:mouseup')
  onWindowMouseUp(): void {
    this.dragging = false;
  }

  onStageHover(ev: MouseEvent): void {
    if (this.dragging) {
      this.tipVisible.set(false);
      this.isHovered.set(false);
      return;
    }
    const hitEl = (ev.target as HTMLElement)?.closest('.cl-hit') as HTMLElement | null;
    if (!hitEl) {
      this.tipVisible.set(false);
      this.isHovered.set(false);
      return;
    }
    this.isHovered.set(true);
    const di = Number(hitEl.getAttribute('data-di'));
    const d = this.activeDirs()[di];
    if (!d) return;

    const stageEl = ev.currentTarget as HTMLElement;
    const r = stageEl.getBoundingClientRect();
    const col = this.lens() === 'emerging' ? '#e0932f' : '#16a34a';

    const swatches = d.members
      .slice(0, 4)
      .map((m) => `<div style="background:${m.hex};width:16px;height:16px;border-radius:4px;border:1px solid rgba(255,255,255,.3)"></div>`)
      .join('');

    const html = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">
        <div style="display:flex;gap:3px">${swatches}</div>
        <b style="font-size:13px;color:#fff">${d.leader}</b>
      </div>
      <div style="font-size:11px;color:rgba(255,255,255,.72)">
        ${d.family} &middot; ${d.size} colors &middot; ${this.api.fmt(d.vol)} units
      </div>
      <div style="display:flex;gap:12px;margin-top:5px;font-size:11px">
        <span>${this.lens() === 'emerging' ? 'Emergence' : 'Trend'} <b style="color:${col}">${d.avg}</b></span>
        ${d.breakoutProb ? `<span>Breakout <b style="color:#e0932f">${Math.round(d.breakoutProb * 100)}%</b></span>` : ''}
      </div>
      <div style="font-size:10px;color:rgba(255,255,255,.45);margin-top:5px;font-family:var(--mono)">
        click to open &rarr;
      </div>
    `;

    this.tipHtml.set(this.sanitizer.bypassSecurityTrustHtml(html));

    let x = ev.clientX - r.left + 14;
    let y = ev.clientY - r.top - 10;
    x = Math.min(x, r.width - 220);
    y = Math.max(6, Math.min(y, r.height - 110));
    this.tipX.set(x);
    this.tipY.set(y);
    this.tipVisible.set(true);
  }

  onStageMouseLeave(): void {
    this.tipVisible.set(false);
    this.isHovered.set(false);
  }

  onStageClick(ev: MouseEvent): void {
    const hitEl = (ev.target as HTMLElement)?.closest('.cl-hit') as HTMLElement | null;
    if (hitEl) {
      const dirId = Number(hitEl.getAttribute('data-dirid'));
      if (dirId) {
        this.router.navigate(['/direction', this.lens(), dirId]);
      }
    }
  }

  onWheel(ev: WheelEvent): void {
    ev.preventDefault();
    this.zoom.set(Math.min(3.2, Math.max(0.4, this.zoom() * (ev.deltaY < 0 ? 1.09 : 0.92))));
  }

  zoom3d(dir: number): void {
    this.zoom.set(Math.min(3.2, Math.max(0.4, this.zoom() * (dir > 0 ? 1.18 : 0.85))));
  }

  resetView3d(): void {
    this.rotX.set(-0.45);
    this.rotY.set(0.7);
    this.panX.set(0);
    this.panY.set(0);
    this.zoom.set(1.0);
  }

  toggleSpin(): void {
    this.autoSpin.set(!this.autoSpin());
  }

  openDir(dirId: number): void {
    this.router.navigate(['/direction', this.lens(), dirId]);
  }

  ngOnDestroy(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}

