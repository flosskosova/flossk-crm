import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const messageService = inject(MessageService);
    const router = inject(Router);

    return next(req).pipe(
        catchError((error) => {
            const status = error.status;
            const body = error.error;

            // Extract the most useful message from the inconsistent backend shapes
            const serverMessage =
                body?.error ||
                body?.Error ||
                body?.message ||
                body?.Message ||
                (Array.isArray(body?.Errors) ? body.Errors[0] : null) ||
                (Array.isArray(body?.errors) ? body.errors[0] : null);

            switch (true) {
                // 400 — Validation: show server message so the user can fix the issue
                case status === 400:
                    messageService.add({
                        severity: 'error',
                        summary: 'Validation Error',
                        detail: serverMessage || 'The request was invalid. Please check your input.',
                        life: 5000,
                    });
                    break;

                // 401 — Unauthorized: redirect to login, no toast needed
                case status === 401:
                    localStorage.removeItem('auth_token');
                    router.navigate(['/auth/login']);
                    break;

                // 403 — Forbidden: generic message, don't reveal why
                case status === 403:
                    messageService.add({
                        severity: 'warn',
                        summary: 'Access Denied',
                        detail: "You don't have permission for this action.",
                        life: 4000,
                    });
                    break;

                // 404 — Not found: generic
                case status === 404:
                    messageService.add({
                        severity: 'error',
                        summary: 'Not Found',
                        detail: 'The requested resource was not found.',
                        life: 4000,
                    });
                    break;

                // 409 — Conflict: show server message, user can act on it
                case status === 409:
                    messageService.add({
                        severity: 'warn',
                        summary: 'Conflict',
                        detail: serverMessage || 'A conflict occurred. Please try again.',
                        life: 5000,
                    });
                    break;

                // 500+ — Server errors: always generic, never expose internals
                case status >= 500:
                    messageService.add({
                        severity: 'error',
                        summary: 'Server Error',
                        detail: 'An unexpected error occurred. Please try again later.',
                        life: 5000,
                    });
                    break;

                // Network error / no response (status 0)
                case status === 0:
                    messageService.add({
                        severity: 'error',
                        summary: 'Connection Error',
                        detail: 'Could not reach the server. Check your connection.',
                        life: 5000,
                    });
                    break;

                // Anything else
                default:
                    messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Something went wrong. Please try again.',
                        life: 4000,
                    });
                    break;
            }

            return throwError(() => error);
        })
    );
};
