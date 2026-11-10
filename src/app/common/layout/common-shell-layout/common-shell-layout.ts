import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { Topbar } from '../topbar/topbar';
import { CsiDataApiService } from '../../../core/services/csi-data-api.service';
import { PaletteToastService } from '../../../core/services/palette-toast.service';

@Component({
  selector: 'app-common-shell-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Sidebar, Topbar],
  templateUrl: './common-shell-layout.html',
  styleUrl: './common-shell-layout.scss'
})
export class CommonShellLayout implements OnInit {
  readonly api = inject(CsiDataApiService);
  readonly toast = inject(PaletteToastService);

  ngOnInit(): void {
    this.api.loadDatabase();
  }
}

