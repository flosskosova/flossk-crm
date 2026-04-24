import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { map } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Public routes that don't require authentication
    const publicRoutes = ['/apply', '/auth/login', '/auth'];

    // Check if the current route is public
    const isPublicRoute = publicRoutes.some(publicRoute => 
        state.url === publicRoute || state.url.startsWith(publicRoute + '/')
    );

    if (isPublicRoute) {
        return true;
    }

    // Check if user is authenticated
    if (authService.isAuthenticated()) {
        return true;
    }

    // Redirect to error page if not authenticated
    router.navigate(['/auth/error']);
    return false;
};

export const roleGuard = (allowedRoles: string[]): CanActivateFn => (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
        router.navigate(['/auth/error']);
        return false;
    }

    // If currentUser is already loaded, check immediately
    const existingUser = authService.currentUser();
    if (existingUser) {
        const userRoles: string[] = existingUser.roles ?? (existingUser.role ? [existingUser.role] : []);
        const hasRole = allowedRoles.some(r => userRoles.includes(r));
        if (!hasRole) router.navigate(['/notfound']);
        return hasRole;
    }

    // On refresh: currentUser is null but token exists — wait for load
    return authService.loadCurrentUser$().pipe(
        map(user => {
            const userRoles: string[] = user?.roles ?? (user?.role ? [user.role] : []);
            const hasRole = allowedRoles.some(r => userRoles.includes(r));
            if (!hasRole) router.navigate(['/notfound']);
            return hasRole;
        })
    );
};
