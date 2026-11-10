import { Component, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthRoleService } from '../../core/services/auth-role.service';
import { PaletteToastService } from '../../core/services/palette-toast.service';
import { CommonPageHeader } from '../../common/cards/common-page-header/common-page-header';
import { CommonKpiRow, KpiItem } from '../../common/cards/common-kpi-row/common-kpi-row';
import { StepperHeader } from '../../common/cards/stepper-header/stepper-header';

@Component({
  selector: 'app-data-validation',
  standalone: true,
  imports: [CommonModule, CommonPageHeader, CommonKpiRow, StepperHeader],
  templateUrl: './data-validation.html'
})
export class DataValidation implements OnInit {
  readonly auth = inject(AuthRoleService);
  readonly toast = inject(PaletteToastService);
  private readonly router = inject(Router);

  readonly checks = [
    ['Row completeness', '4,346,403 of 4,346,403 rows parsed', 'pass', '100%'],
    ['Date continuity', '252 consecutive months (2006–2026)', 'pass', '60/60'],
    ['LAB coverage', '42,350 colors carry measured LAB', 'pass', '100%'],
    ['Brand mapping', '1,672 customer classes resolved', 'pass', '100%'],
    ['Duplicate orders', '1,204 exact duplicates removed', 'warn', '0.1%'],
    ['Internal orders excluded', 'CSI internal sampling filtered out', 'pass', '·'],
    ['Negative / zero quantities', '842 rows dropped as invalid', 'warn', '0.08%'],
    ['Color continuity', 'InventoryID stable across period', 'pass', 'ok'],
    ['Evidence floor', 'directions require ≥1,000 units and ≥2 brands', 'pass', 'enforced']
  ];

  readonly kpis = computed<KpiItem[]>(() => {
    const pass = this.checks.filter((c) => c[2] === 'pass').length;
    const warn = this.checks.filter((c) => c[2] === 'warn').length;
    const mo = (this.auth.yrEnd() - this.auth.yrStart() + 1) * 12;
    return [
      { label: 'Checks Passed', value: `${pass}/${this.checks.length}`, sub: 'data integrity verified', bar: 'var(--grad-leaf)' },
      { label: 'Warnings', value: warn, sub: 'rows cleaned, not blocking', bar: 'var(--grad-gold)' },
      { label: 'Records Validated', value: '4.3M', sub: 'orders admitted', bar: 'var(--grad-forest)' },
      { label: 'Analysis Period', value: `${this.auth.yrStart()}–${this.auth.yrEnd()}`, sub: `${mo} months`, bar: 'linear-gradient(135deg,#2f81c9,#5aa5e0)' }
    ];
  });

  ngOnInit(): void {
    this.auth.setupFlowStep.set(3);
  }

  goBackPreprocess(): void {
    this.auth.setupFlowStep.set(2);
    this.router.navigate(['/csi/setup/preprocessing']);
  }

  enterPlatform(): void {
    this.auth.finishOnboarding();
    this.toast.showToast(
      'Signed in',
      'CSI network workspace ready',
      '◆'
    );
  }
}
