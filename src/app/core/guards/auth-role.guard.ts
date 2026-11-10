import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthRoleService } from '../services/auth-role.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthRoleService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }
  return true;
};

export const csiOnboardedGuard: CanActivateFn = () => {
  const auth = inject(AuthRoleService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }
  if (auth.role() === 'csi' && !auth.onboarded()) {
    return router.createUrlTree(['/csi/setup/data-upload']);
  }
  return true;
};

export const csiPlatformGuard = csiOnboardedGuard;

