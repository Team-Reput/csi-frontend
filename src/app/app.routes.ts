import { Routes } from '@angular/router';
import { authGuard, csiOnboardedGuard } from './core/guards/auth-role.guard';
import { Login } from './auth/login/login';
import { CommonShellLayout } from './common/layout/common-shell-layout/common-shell-layout';
import { DataUpload } from './setup/data-upload/data-upload';
import { Preprocessing } from './setup/preprocessing/preprocessing';
import { DataValidation as SetupDataValidation } from './setup/data-validation/data-validation';
import { CommandCenter } from './csi/intelligence/command-center/command-center';
import { Predictions } from './csi/intelligence/predictions/predictions';
import { ColorSpace3d } from './csi/intelligence/color-space-3d/color-space-3d';
import { TrendDirections } from './csi/intelligence/trend-directions/trend-directions';
import { CustomerPortfolio } from './csi/intelligence/customer-portfolio/customer-portfolio';
import { BrandPortalPreview } from './csi/intelligence/customer-portfolio/brand-portal-preview/brand-portal-preview';
import { BulkUpload } from './csi/data-collection/bulk-upload/bulk-upload';
import { Integrations } from './csi/data-collection/integrations/integrations';
import { TrendBridge } from './csi/tools/trend-bridge/trend-bridge';
import { NearbyExplorer } from './csi/tools/nearby-explorer/nearby-explorer';
import { PaletteStudio } from './csi/tools/palette-studio/palette-studio';
import { Inventory } from './csi/tools/inventory/inventory';
import { Dashboard } from './client/dashboard/dashboard';
import { Recommendations } from './client/recommendations/recommendations';
import { MyColors } from './client/my-colors/my-colors';
import { TrendGap } from './client/trend-gap/trend-gap';
import { Benchmark } from './client/benchmark/benchmark';
import { ColorDetail } from './sub-screens/color-detail/color-detail';
import { DirectionDetail } from './sub-screens/direction-detail/direction-detail';

export const routes: Routes = [
  { path: 'login', component: Login },
  {
    path: '',
    component: CommonShellLayout,
    canActivate: [authGuard],
    children: [
      // CSI Pre-Platform One-Time Onboarding Setup Flow
      {
        path: 'csi/setup',
        children: [
          { path: 'data-upload', component: DataUpload },
          { path: 'preprocessing', component: Preprocessing },
          { path: 'data-validation', component: SetupDataValidation },
          { path: '', redirectTo: 'data-upload', pathMatch: 'full' }
        ]
      },

      // CSI Main Platform — 3 Navbar Sections (Unlocked after one-time onboarding)
      {
        path: 'csi',
        canActivate: [csiOnboardedGuard],
        children: [
          // Section 1: Intelligence
          { path: 'intelligence/command-center', component: CommandCenter },
          { path: 'intelligence/predictions', component: Predictions },
          { path: 'intelligence/color-space-3d', component: ColorSpace3d },
          { path: 'intelligence/trend-directions', component: TrendDirections },
          { path: 'intelligence/customer-portfolio', component: CustomerPortfolio },
          { path: 'intelligence/customer-portfolio/portal/:code', component: BrandPortalPreview },

          // Section 2: Data Collection
          { path: 'data-collection/bulk-upload', component: BulkUpload },
          { path: 'data-collection/integrations', component: Integrations },

          // Section 3: Tools
          { path: 'tools/trend-bridge', component: TrendBridge },
          { path: 'tools/nearby-explorer', component: NearbyExplorer },
          { path: 'tools/palette-studio', component: PaletteStudio },
          { path: 'tools/inventory', component: Inventory },

          { path: '', redirectTo: 'intelligence/command-center', pathMatch: 'full' }
        ]
      },

      // Client Role (Brand / Nike) — 2 Navbar Sections
      {
        path: 'client',
        children: [
          // Section 1: My Intelligence
          { path: 'dashboard', component: Dashboard },
          { path: 'recommendations', component: Recommendations },
          { path: 'predictions', component: Predictions },
          { path: 'color-space-3d', component: ColorSpace3d },
          { path: 'my-colors', component: MyColors },
          { path: 'trend-gap', component: TrendGap },
          { path: 'benchmark', component: Benchmark },

          // Section 2: Tools
          { path: 'nearby-explorer', component: NearbyExplorer },

          { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
        ]
      },

      // Shared Drill-Down Sub-Screens
      { path: 'color/:id', component: ColorDetail },
      { path: 'direction/:lens/:id', component: DirectionDetail },

      { path: '', redirectTo: 'csi/intelligence/command-center', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
