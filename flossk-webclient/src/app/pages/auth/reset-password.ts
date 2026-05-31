import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';
import { LayoutService } from '@/layout/service/layout.service';
import { AuthService } from '@/pages/service/auth.service';

@Component({
    selector: 'app-reset-password',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, PasswordModule, MessageModule, RouterModule, AppFloatingConfigurator],
    template: `
        <app-floating-configurator />
        <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-screen overflow-hidden">
            <div class="flex flex-col items-center justify-center">
                <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                    <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px; min-width: 380px;">
                        <div class="text-center mb-8 flex flex-col items-center">
                            <img class="h-45" [src]="layoutService.isDarkTheme() ? 'assets/images/sorra_logo_dark_mode.png' : 'assets/images/sorra_logo.png'" alt="Sorra">
                            <span class="text-muted-color font-medium">Choose a new password</span>
                        </div>

                        <div>
                            @if (authService.error()) {
                                <p-message severity="error" [text]="authService.error()!" styleClass="w-full mb-4"></p-message>
                            }

                            @if (invalidLink) {
                                <p-message severity="error" text="This password reset link is invalid or missing required parameters." styleClass="w-full mb-6"></p-message>
                                <p-button label="Back to Log In" styleClass="w-full" severity="secondary" routerLink="/auth/login"></p-button>
                            } @else if (success) {
                                <p-message severity="success" text="Your password has been reset successfully. You can now log in." styleClass="w-full mb-6"></p-message>
                                <p-button label="Go to Log In" styleClass="w-full" routerLink="/auth/login"></p-button>
                            } @else {
                                <label for="newPassword" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">New Password</label>
                                <p-password
                                    id="newPassword"
                                    [(ngModel)]="newPassword"
                                    placeholder="New password"
                                    [toggleMask]="true"
                                    styleClass="mb-6"
                                    [fluid]="true"
                                ></p-password>

                                <label for="confirmPassword" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Confirm Password</label>
                                <p-password
                                    id="confirmPassword"
                                    [(ngModel)]="confirmPassword"
                                    placeholder="Confirm new password"
                                    [toggleMask]="true"
                                    styleClass="mb-8"
                                    [fluid]="true"
                                    [feedback]="false"
                                ></p-password>

                                <p-button
                                    label="Reset Password"
                                    styleClass="w-full"
                                    [loading]="authService.isLoading()"
                                    (onClick)="onSubmit()"
                                ></p-button>

                                <div class="text-center mt-6">
                                    <span class="font-medium cursor-pointer text-primary" routerLink="/auth/login">Back to Log In</span>
                                </div>
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class ResetPassword implements OnInit {
    layoutService = inject(LayoutService);
    authService = inject(AuthService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    newPassword = '';
    confirmPassword = '';
    token = '';
    email = '';
    success = false;
    invalidLink = false;

    ngOnInit() {
        this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
        this.email = this.route.snapshot.queryParamMap.get('email') ?? '';
        if (!this.token || !this.email) {
            this.invalidLink = true;
        }
    }

    onSubmit() {
        if (!this.newPassword || !this.confirmPassword) {
            this.authService.error.set('Please fill in both password fields.');
            return;
        }
        if (this.newPassword !== this.confirmPassword) {
            this.authService.error.set('Passwords do not match.');
            return;
        }

        this.authService.resetPassword({
            email: this.email,
            token: this.token,
            newPassword: this.newPassword,
            confirmPassword: this.confirmPassword
        }).subscribe({
            next: () => { this.success = true; },
            error: (err) => {
                const msg = err?.error?.message;
                if (msg) this.authService.error.set(msg);
            }
        });
    }
}
