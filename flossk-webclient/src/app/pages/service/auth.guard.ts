import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { map } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
        return true;
    }

    // Redirect to error page if not authenticated
    router.navigate(['/error']);
    return false;
};

export const roleGuard = (allowedRoles: string[]): CanActivateFn => (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
        router.navigate(['/error']);
        return false;
    }

    const existingUser = authService.currentUser();
    const hasRoles = existingUser && (existingUser.roles?.length || existingUser.role);
    if (existingUser && hasRoles) {
        const userRoles: string[] = existingUser.roles ?? (existingUser.role ? [existingUser.role] : []);
        const hasRole = allowedRoles.some(r => userRoles.includes(r));
        if (!hasRole) router.navigate(['/error/access']);
        return hasRole;
    }

    // currentUser is null or loaded without roles — wait for load
    return authService.loadCurrentUser$().pipe(
        map(user => {
            if (!user) {
                // loadCurrentUser$ already logged the user out and redirected to /auth/login
                // (their token was invalid/expired) — don't navigate again.
                return false;
            }
            const userRoles: string[] = user.roles ?? (user.role ? [user.role] : []);
            const hasRole = allowedRoles.some(r => userRoles.includes(r));
            if (!hasRole) router.navigate(['/error/access']);
            return hasRole;
        })
    );
};
