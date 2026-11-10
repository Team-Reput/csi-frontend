import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthRoleService } from '../../../core/services/auth-role.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class Sidebar {
  readonly auth = inject(AuthRoleService);

  badgeClass(badge?: string): string {
    if (badge === 'AI') return 'ai';
    if (badge === 'FOR YOU') return 'foryou';
    return '';
  }
}

