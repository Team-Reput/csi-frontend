import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { UserRole } from '../models/csi.models';

export interface TempCredential {
  role: UserRole;
  code: string;
  title: string;
  subtitle: string;
  email: string;
  password: string;
}

export interface NavItem {
  id: string;
  route: string;
  ic: string;
  t: string;
  badge?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

const ONBOARDED_STORAGE_KEY = 'csi_onboarded_v1';

@Injectable({ providedIn: 'root' })
export class AuthRoleService {
  readonly tempCredentials: TempCredential[] = [
    {
      role: 'csi',
      code: 'CS',
      title: 'CSI Analyst',
      subtitle: 'Full network intelligence · all brands',
      email: 'csi.analyst@reput.ai',
      password: 'TempCSI#2026'
    },
    {
      role: 'nike',
      code: 'NK',
      title: 'Brand(Nike)',
      subtitle: 'Brand customer · scoped to your palette',
      email: 'nike.palette@nike.com',
      password: 'TempNike#2026'
    }
  ];

  readonly isLoggedIn = signal<boolean>(false);
  readonly role = signal<UserRole>('csi');
  
  // One-time onboarding check persisted in localStorage
  readonly onboarded = signal<boolean>(
    typeof localStorage !== 'undefined' && localStorage.getItem(ONBOARDED_STORAGE_KEY) === 'true'
  );
  readonly setupFlowStep = signal<number>(1);
  readonly uploaded = signal<boolean>(false);
  readonly yrStart = signal<number>(2021);
  readonly yrEnd = signal<number>(2025);

  readonly setupSteps = [
    { n: 1, ic: '⇪', t: 'Data Upload', route: '/csi/setup/data-upload' },
    { n: 2, ic: '⚙', t: 'Preprocessing', route: '/csi/setup/preprocessing' },
    { n: 3, ic: '✓', t: 'Data Validation', route: '/csi/setup/data-validation' }
  ];

  // CSI Main Platform Navigation: Setup + 3 Sections
  readonly csiNavGroups: NavGroup[] = [
    {
      label: 'Setup',
      items: [
        { id: 'setup-upload', route: '/csi/setup/data-upload', ic: '⇪', t: 'Data Upload', badge: '1' },
        { id: 'setup-pre', route: '/csi/setup/preprocessing', ic: '⚙', t: 'Preprocessing', badge: '2' },
        { id: 'setup-val', route: '/csi/setup/data-validation', ic: '✓', t: 'Data Validation', badge: '3' }
      ]
    },
    {
      label: 'Intelligence',
      items: [
        { id: 'dash', route: '/csi/intelligence/command-center', ic: '◆', t: 'Command Center' },
        { id: 'predictions', route: '/csi/intelligence/predictions', ic: '⊹', t: 'Predictions', badge: 'AI' },
        { id: 'space3d', route: '/csi/intelligence/color-space-3d', ic: '◉', t: '3D Color Space', badge: 'LIVE' },
        { id: 'directions', route: '/csi/intelligence/trend-directions', ic: '◆', t: 'Trend Directions' },
        { id: 'portfolio', route: '/csi/intelligence/customer-portfolio', ic: '▦', t: 'Customer Portfolio' }
      ]
    },
    {
      label: 'Data Collection',
      items: [
        { id: 'upload', route: '/csi/data-collection/bulk-upload', ic: '⇪', t: 'Bulk Upload' },
        { id: 'integrations', route: '/csi/data-collection/integrations', ic: '☵', t: 'Integrations' }
      ]
    },
    {
      label: 'Tools',
      items: [
        { id: 'bridge', route: '/csi/tools/trend-bridge', ic: '↗', t: 'Trend-Bridge', badge: '30/30' },
        { id: 'nearby', route: '/csi/tools/nearby-explorer', ic: '◉', t: 'Nearby Explorer' },
        { id: 'palette', route: '/csi/tools/palette-studio', ic: '✦', t: 'Palette Studio' },
        { id: 'inventory', route: '/csi/tools/inventory', ic: '▦', t: 'Inventory' }
      ]
    }
  ];

  readonly clientNavGroups: NavGroup[] = [
    {
      label: 'My Intelligence',
      items: [
        { id: 'ndash', route: '/client/dashboard', ic: '◆', t: 'Dashboard' },
        { id: 'nrecs', route: '/client/recommendations', ic: '★', t: 'Recommendations', badge: 'FOR YOU' },
        { id: 'npred', route: '/client/predictions', ic: '⊹', t: 'Predictions', badge: 'AI' },
        { id: 'nspace', route: '/client/color-space-3d', ic: '◉', t: '3D Color Space', badge: 'LIVE' },
        { id: 'bcolors', route: '/client/my-colors', ic: '≣', t: 'My Colors' },
        { id: 'ngap', route: '/client/trend-gap', ic: '⇄', t: 'Trend Gap' },
        { id: 'nbench', route: '/client/benchmark', ic: '▦', t: 'Benchmark' }
      ]
    },
    {
      label: 'Tools',
      items: [
        { id: 'nnearby', route: '/client/nearby-explorer', ic: '◍', t: 'Nearby Explorer' }
      ]
    }
  ];

  readonly activeNavGroups = computed<NavGroup[]>(() => {
    if (this.role() === 'csi') {
      return this.csiNavGroups;
    }
    return this.clientNavGroups;
  });

  readonly userAvatar = computed(() => (this.role() === 'csi' ? 'CS' : 'NK'));
  readonly userName = computed(() => (this.role() === 'csi' ? 'CSI Analyst' : 'Brand(Nike)'));
  readonly userRoleLabel = computed(() =>
    this.role() === 'csi' ? 'Network intelligence' : 'Customer · powered by CSI'
  );
  readonly viewingAsLabel = computed(() => (this.role() === 'csi' ? 'CSI' : 'Nike'));

  constructor(private router: Router) {}

  loginWithCredentials(email: string, password: string): { ok: boolean; error?: string } {
    const match = this.tempCredentials.find(
      (c) => c.email.toLowerCase() === email.trim().toLowerCase() && c.password === password.trim()
    );
    if (!match) {
      return {
        ok: false,
        error: 'Invalid credentials. Please click a demo role card below.'
      };
    }
    this.doLogin(match.role);
    return { ok: true };
  }

  doLogin(role: UserRole): void {
    this.isLoggedIn.set(true);
    this.role.set(role);
    if (role === 'csi' && !this.onboarded()) {
      this.setupFlowStep.set(1);
      this.router.navigate(['/csi/setup/data-upload']);
    } else if (role === 'csi') {
      this.router.navigate(['/csi/intelligence/command-center']);
    } else {
      this.router.navigate(['/client/dashboard']);
    }
  }

  switchRole(role: UserRole): void {
    this.role.set(role);
    if (role === 'csi' && !this.onboarded()) {
      this.setupFlowStep.set(1);
      this.router.navigate(['/csi/setup/data-upload']);
      return;
    }
    if (role === 'csi') {
      this.router.navigate(['/csi/intelligence/command-center']);
    } else {
      this.router.navigate(['/client/dashboard']);
    }
  }

  finishOnboarding(): void {
    this.onboarded.set(true);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ONBOARDED_STORAGE_KEY, 'true');
    }
    this.router.navigate(['/csi/intelligence/command-center']);
  }

  resetOnboarding(): void {
    this.onboarded.set(false);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(ONBOARDED_STORAGE_KEY);
    }
    this.setupFlowStep.set(1);
    this.uploaded.set(false);
    this.router.navigate(['/csi/setup/data-upload']);
  }

  logout(): void {
    this.isLoggedIn.set(false);
    this.setupFlowStep.set(1);
    this.uploaded.set(false);
    this.router.navigate(['/login']);
  }
}
