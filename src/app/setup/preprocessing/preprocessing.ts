import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthRoleService } from '../../core/services/auth-role.service';
import { PaletteToastService } from '../../core/services/palette-toast.service';
import { CommonPageHeader } from '../../common/cards/common-page-header/common-page-header';
import { StepperHeader } from '../../common/cards/stepper-header/stepper-header';

export interface PreStageItem {
  title: string;
  detail: string;
  status: 'idle' | 'run' | 'done';
}

@Component({
  selector: 'app-preprocessing',
  standalone: true,
  imports: [CommonModule, FormsModule, CommonPageHeader, StepperHeader],
  templateUrl: './preprocessing.html'
})
export class Preprocessing implements OnInit, OnDestroy {
  readonly auth = inject(AuthRoleService);
  readonly toast = inject(PaletteToastService);
  private readonly router = inject(Router);

  readonly isRunning = signal<boolean>(false);
  readonly pipelineDone = signal<boolean>(false);
  private timers: Array<ReturnType<typeof setTimeout>> = [];

  readonly stages = signal<PreStageItem[]>([
    { title: 'Parsing order transactions', detail: '4,346,403 rows read', status: 'idle' },
    { title: 'Joining LAB color master', detail: '60,629 colors matched', status: 'idle' },
    { title: 'Mapping brands & palettes', detail: '1,672 brands resolved', status: 'idle' },
    { title: 'Building monthly demand matrix', detail: '252 months × 48,491 colors', status: 'idle' },
    { title: 'Computing Emergence & Trend indices', detail: '48,491 colors scored', status: 'idle' },
    { title: 'Clustering into trend directions', detail: '315 directions formed', status: 'idle' }
  ]);

  readonly spanYears = computed(() => Math.max(1, this.auth.yrEnd() - this.auth.yrStart() + 1));
  readonly spanMonths = computed(() => this.spanYears() * 12);
  readonly isPeriodSufficient = computed(() => this.spanYears() >= 3);

  ngOnInit(): void {
    this.auth.setupFlowStep.set(2);
  }

  ngOnDestroy(): void {
    this.timers.forEach((t) => clearTimeout(t));
  }

  onStartYearChange(val: number): void {
    this.auth.yrStart.set(Number(val));
  }

  onEndYearChange(val: number): void {
    this.auth.yrEnd.set(Number(val));
  }

  runPreprocess(): void {
    this.timers.forEach((t) => clearTimeout(t));
    this.timers = [];
    this.isRunning.set(true);
    this.pipelineDone.set(false);

    this.stages.update((list) => list.map((s) => ({ ...s, status: 'idle' })));

    let i = 0;
    const step = () => {
      if (i > 0) {
        this.stages.update((list) =>
          list.map((item, idx) => (idx === i - 1 ? { ...item, status: 'done' } : item))
        );
      }
      if (i >= this.stages().length) {
        this.isRunning.set(false);
        this.pipelineDone.set(true);
        this.toast.showToast(
          'Preprocessing complete',
          '12,885 colors scored · 315 directions',
          '⚙'
        );
        const tEnd = setTimeout(() => {
          this.auth.setupFlowStep.set(3);
          this.router.navigate(['/csi/setup/data-validation']);
        }, 800);
        this.timers.push(tEnd);
        return;
      }
      this.stages.update((list) =>
        list.map((item, idx) => (idx === i ? { ...item, status: 'run' } : item))
      );
      i++;
      const t = setTimeout(step, 500);
      this.timers.push(t);
    };
    step();
  }

  goBackUpload(): void {
    this.auth.setupFlowStep.set(1);
    this.router.navigate(['/csi/setup/data-upload']);
  }
}
