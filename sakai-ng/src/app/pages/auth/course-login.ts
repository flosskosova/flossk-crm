import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { DividerModule } from 'primeng/divider';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';
import { LayoutService } from '@/layout/service/layout.service';
import { AuthService } from '@/pages/service/auth.service';

type PageMode = 'join' | 'login';

@Component({
    selector: 'app-course-login',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        ButtonModule,
        InputTextModule,
        MessageModule,
        DividerModule,
        AppFloatingConfigurator
    ],
    template: `
        <app-floating-configurator />
        <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-screen overflow-hidden">
            <div class="flex flex-col items-center justify-center w-full px-4">
                <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)"
                     class="w-full max-w-lg">
                    <div class="w-full bg-surface-0 dark:bg-surface-900 py-16 px-8 sm:px-16" style="border-radius: 53px">

                        <!-- Logo + heading -->
                        <div class="text-center mb-8 flex flex-col items-center">
                            <img class="h-16 sm:h-24 w-auto mb-4"
                                 [src]="layoutService.isDarkTheme() ? 'assets/images/flossk_logo_dark_mode.png' : 'assets/images/logo.png'"
                                 alt="FLOSSK" />
                            <div class="flex items-center gap-2 mb-1">
                                <h1 class="text-xl m-0">Course Portal</h1>
                            </div>
                            <p class="text-muted-color mt-1 text-sm">
                                {{ mode === 'join' ? 'Enter your access code to enroll in a course' : 'Sign in to access your enrolled courses' }}
                            </p>
                        </div>

                        <!-- Error / success messages -->
                        <p-message *ngIf="errorMsg" severity="error" [text]="errorMsg" styleClass="w-full mb-4" />
                        <p-message *ngIf="successMsg" severity="success" [text]="successMsg" styleClass="w-full mb-4" />

                        <!-- ── JOIN WITH ACCESS CODE ── -->
                        <div *ngIf="mode === 'join'">
                            <div class="mb-4">
                                <label for="participantName" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Your Name <span class="text-red-500">*</span></label>
                                <input pInputText id="participantName" type="text" placeholder="e.g. Jane Doe"
                                       class="w-full" [(ngModel)]="name" (keyup.enter)="onJoin()" />
                            </div>

                            <div class="mb-4">
                                <label for="participantEmail" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Email</label>
                                <input pInputText id="participantEmail" type="email" placeholder="your@email.com"
                                       class="w-full" [(ngModel)]="email" (keyup.enter)="onJoin()" />
                            </div>

                            <div class="mb-8">
                                <label for="accessCode" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Course Access Code <span class="text-red-500">*</span></label>
                                <input pInputText id="accessCode" type="text" placeholder="e.g. LINUX-2026"
                                       class="w-full uppercase tracking-widest" [(ngModel)]="accessCode"
                                       (input)="accessCode = accessCode.toUpperCase()" (keyup.enter)="onJoin()" />
                                <small class="text-muted-color">You'll receive this code from your instructor.</small>
                            </div>

                            <p-button label="Join Course" icon="pi pi-sign-in" styleClass="w-full" [loading]="loading" (onClick)="onJoin()" />

                            <p-divider />

                            <div class="text-center">
                                <span class="text-muted-color text-sm">Already enrolled? </span>
                                <span class="text-primary font-medium cursor-pointer text-sm" (click)="switchMode('login')">Sign in here</span>
                            </div>
                        </div>

                        <!-- ── RETURNING STUDENT LOGIN ── -->
                        <div *ngIf="mode === 'login'">
                            <div class="mb-8">
                                <label for="loginEmail" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Email <span class="text-red-500">*</span></label>
                                <input pInputText id="loginEmail" type="email" placeholder="your@email.com"
                                       class="w-full" [(ngModel)]="email" (keyup.enter)="onStudentLogin()" />
                                <small class="text-muted-color">Enter the email you used when you enrolled.</small>
                            </div>

                            <p-button label="Sign In" icon="pi pi-sign-in" styleClass="w-full" [loading]="loading" (onClick)="onStudentLogin()" />

                            <p-divider />

                            <div class="text-center">
                                <span class="text-muted-color text-sm">Have an access code? </span>
                                <span class="text-primary font-medium cursor-pointer text-sm" (click)="switchMode('join')">Join a course</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class CourseLogin {
    mode: PageMode = 'join';

    name = '';
    email = '';
    accessCode = '';

    loading = false;
    errorMsg = '';
    successMsg = '';

    constructor(public layoutService: LayoutService, private authService: AuthService, private router: Router) {}

    switchMode(m: PageMode) {
        this.mode = m;
        this.errorMsg = '';
        this.successMsg = '';
    }

    onJoin() {
        this.errorMsg = '';
        this.successMsg = '';

        if (!this.name.trim()) {
            this.errorMsg = 'Please enter your name.';
            return;
        }
        if (!this.email.trim()) {
            this.errorMsg = 'Please enter your email.';
            return;
        }
        if (!this.accessCode.trim()) {
            this.errorMsg = 'Please enter a course access code.';
            return;
        }

        this.loading = true;
        this.authService.traineeRegister({
            fullName: this.name.trim(),
            email: this.email.trim(),
            voucherCode: this.accessCode.trim()
        }).subscribe({
            next: (res) => {
                this.loading = false;
                this.router.navigate(['/course', res.courseId]);
            },
            error: (err) => {
                this.loading = false;
                const errors: string[] = err.error?.errors ?? [];
                this.errorMsg = errors.length > 0 ? errors[0] : 'Enrolment failed. Please check your access code and try again.';
            }
        });
    }

    onStudentLogin() {
        this.errorMsg = '';
        this.successMsg = '';

        if (!this.email.trim()) {
            this.errorMsg = 'Please enter your email.';
            return;
        }

        this.loading = true;
        this.authService.traineeLogin({ email: this.email.trim() }).subscribe({
            next: (res) => {
                this.loading = false;
                this.router.navigate(['/course', res.courseId]);
            },
            error: (err) => {
                this.loading = false;
                const errors: string[] = err.error?.errors ?? [];
                this.errorMsg = errors.length > 0 ? errors[0] : 'Sign in failed. Please check your email and try again.';
            }
        });
    }
}
