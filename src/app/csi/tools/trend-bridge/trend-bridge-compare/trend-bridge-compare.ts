import { Component, Input, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CsiDataApiService } from '../../../../core/services/csi-data-api.service';
import { PaletteToastService } from '../../../../core/services/palette-toast.service';
import { ColorStandard } from '../../../../core/models/csi.models';

export interface SampleShade {
  name: string;
  hex: string;
  season: string;
  note: string;
}

export interface SampleReport {
  title: string;
  source: string;
  shades: SampleShade[];
}

export interface CompareRow extends SampleShade {
  best: ColorStandard & { de: number };
  runner: (ColorStandard & { de: number }) | undefined;
  verdict: string;
  vCls: string;
  action: string;
}

@Component({
  selector: 'app-trend-bridge-compare',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './trend-bridge-compare.html'
})
export class TrendBridgeCompare implements OnInit {
  @Input() initialSampleKey = 'wgsn';

  readonly api = inject(CsiDataApiService);
  readonly toast = inject(PaletteToastService);
  private readonly router = inject(Router);

  readonly cmpSample = signal<string>('wgsn');
  readonly customText = signal<string>('');
  readonly rows = signal<CompareRow[]>([]);
  readonly activeTitle = signal<string>('');

  readonly samples: Record<string, SampleReport> = {
    wgsn: {
      title: 'WGSN × Coloro · Autumn/Winter 26/27 Key Directions',
      source: 'WGSN',
      shades: [
        { name: 'Transformative Teal', hex: '#1E5E63', season: 'AW 26/27', note: 'Color of the Year anchor' },
        { name: 'Wax Paper Cream', hex: '#EFE6D5', season: 'AW 26/27', note: 'Warm tactile neutral' },
        { name: 'Cocoa Powder', hex: '#6E473B', season: 'AW 26/27', note: 'Grounded earth brown' },
        { name: 'Fresh Purple', hex: '#7A4988', season: 'AW 26/27', note: 'Digital-botanical violet' },
        { name: 'Green Glow', hex: '#9BE564', season: 'AW 26/27', note: 'High-vis bioluminescent accent' }
      ]
    },
    pantone: {
      title: 'Pantone View · Spring/Summer 2026 Active & Streetwear',
      source: 'Pantone',
      shades: [
        { name: 'Mocha Mousse', hex: '#A47864', season: 'SS 26', note: 'Warm cacao core' },
        { name: 'Lime Cream', hex: '#D7E8BA', season: 'SS 26', note: 'Softened sport pastel' },
        { name: 'Kashmir Olive', hex: '#6F7D5C', season: 'SS 26', note: 'Utility outdoor sage' },
        { name: 'Future Dusk', hex: '#4C5070', season: 'SS 26', note: 'Indigo-violet crossover' },
        { name: 'Papaya Punch', hex: '#F27D52', season: 'SS 26', note: 'High-energy performance coral' }
      ]
    },
    pv: {
      title: 'Première Vision Paris · Eco-Resort & Performance Capsule',
      source: 'Première Vision',
      shades: [
        { name: 'Algae Bio-Green', hex: '#2F6B4F', season: 'PV 26', note: 'Regenerative forest tone' },
        { name: 'Raw Undyed Linen', hex: '#D9CEBF', season: 'PV 26', note: 'Low-impact greige' },
        { name: 'Mineral Ochre', hex: '#C68B3E', season: 'PV 26', note: 'Natural pigment gold' },
        { name: 'Deep Abyss Blue', hex: '#1B3B5A', season: 'PV 26', note: 'Marine technical navy' }
      ]
    }
  };

  readonly alignedCount = computed(() => this.rows().filter((r) => r.best.de <= 3.5).length);
  readonly risingCount = computed(
    () => this.rows().filter((r) => r.best.q === 'Breakout' || r.best.q === 'Emerging').length
  );
  readonly avgDe = computed(() => {
    const list = this.rows();
    if (!list.length) return '0.00';
    return (list.reduce((s, r) => s + r.best.de, 0) / list.length).toFixed(2);
  });

  ngOnInit(): void {
    this.loadSample(this.initialSampleKey || 'wgsn', false);
  }

  loadSample(key: string, notify = true): void {
    this.cmpSample.set(key);
    const s = this.samples[key] || this.samples['wgsn'];
    const txt = s.shades.map((x) => `${x.name}, ${x.hex}, ${x.season}, ${x.note}`).join('\n');
    this.customText.set(txt);
    this.computeRows(s.shades, s.title);
    if (notify) {
      this.toast.showToast(
        'Sample report loaded',
        `${s.title} (${s.shades.length} shades benchmarked)`,
        '⇄'
      );
    }
  }

  onFileUpload(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const txt = String(reader.result || '');
      const hexMatches = [
        ...txt.matchAll(/([A-Za-z0-9 _\-\/]{2,32})?[,;\t ]+(#[0-9A-Fa-f]{6})/g)
      ];
      let parsed: SampleShade[] = [];
      if (hexMatches.length) {
        parsed = hexMatches.slice(0, 12).map((m, idx) => ({
          name: (m[1] || `Uploaded Shade ${idx + 1}`).trim(),
          hex: m[2].toUpperCase(),
          season: 'Uploaded',
          note: file.name
        }));
      } else {
        parsed = this.samples['wgsn'].shades;
      }
      this.customText.set(
        parsed.map((x) => `${x.name}, ${x.hex}, ${x.season}, ${x.note}`).join('\n')
      );
      this.computeRows(parsed, `Uploaded Report · ${file.name}`);
      this.toast.showToast(
        'Report parsed & compared',
        `${parsed.length} shades extracted from ${file.name}`,
        '⇪'
      );
    };
    reader.readAsText(file);
  }

  runCustomCompare(): void {
    const lines = this.customText()
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean);
    const shades: SampleShade[] = [];
    lines.forEach((line, i) => {
      const m = line.match(/#[0-9A-Fa-f]{6}/);
      if (m) {
        const parts = line.split(',').map((s) => s.trim());
        shades.push({
          name: parts[0] || `Shade ${i + 1}`,
          hex: m[0].toUpperCase(),
          season: parts[2] || 'Custom',
          note: parts[3] || 'Custom uploaded shade'
        });
      }
    });
    if (!shades.length) {
      this.toast.showToast(
        'Include at least one #HEX code',
        'Format: Shade Name, #HEX, Season, Note',
        '!'
      );
      return;
    }
    this.computeRows(shades, `Custom Report (${shades.length} shades)`);
    this.toast.showToast(
      'Comparison complete',
      `${shades.length} external shades benchmarked against 1,288 CSI standards`,
      '⇄'
    );
  }

  private computeRows(shades: SampleShade[], title: string): void {
    const db = this.api.db();
    if (!db) return;
    this.activeTitle.set(title);
    const computedRows: CompareRow[] = shades.map((s) => {
      const lab = this.api.hex2lab(s.hex);
      const ranked = db.colors
        .map((c) => ({
          ...c,
          de: this.api.cmcDE(lab, [c.L, c.a, c.b])
        }))
        .sort((a, b) => a.de - b.de);
      const best = ranked[0];
      const runner = ranked[1];
      let verdict = 'Catalog Ready';
      let vCls = 'pill-leaf';
      let action = 'Immediate pitch from stock';
      if (best.de > 3.5) {
        verdict = 'White-Space Gap';
        vCls = 'pill-coral';
        action = 'Develop new lab-dip standard';
      } else if (best.q === 'Breakout' || best.q === 'Emerging') {
        verdict = 'Aligned & Accelerating';
        vCls = 'pill-leaf';
        action = 'Prioritize in seasonal capsule';
      } else if (best.q === 'Dormant') {
        verdict = 'External Hype · Low Order Velocity';
        vCls = 'pill-amber';
        action = 'Sample cautiously · monitor orders';
      }
      return { ...s, best, runner, verdict, vCls, action };
    });
    this.rows.set(computedRows);
  }

  openColor(id: string): void {
    this.router.navigate(['/color', id]);
  }
}

