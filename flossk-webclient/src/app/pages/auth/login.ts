import { Component, AfterViewInit, ElementRef, ViewChild, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';
import { LayoutService } from '@/layout/service/layout.service';
import { AuthService } from '@/pages/service/auth.service';
import { MessageModule } from 'primeng/message';
import { CommonModule } from '@angular/common';


@Component({
    selector: 'app-login',
    standalone: true,
    imports: [ButtonModule, CheckboxModule, InputTextModule, PasswordModule, FormsModule, RouterModule, RippleModule, AppFloatingConfigurator, MessageModule, CommonModule],
    template: `
        <app-floating-configurator />
        <div class="flex min-h-screen min-w-screen overflow-hidden bg-surface-50 dark:bg-surface-950">
            <div class="hidden lg:flex lg:w-1/2 relative bg-surface-900 items-center justify-center p-12 overflow-hidden">
                <div class="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]">
                    <svg class="w-full h-full" viewBox="0 0 1000 800" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
                        <circle cx="200" cy="200" r="180" stroke="currentColor" stroke-width="0.5" fill="none" class="text-white"/>
                        <circle cx="200" cy="200" r="120" stroke="currentColor" stroke-width="0.5" fill="none" class="text-white"/>
                        <circle cx="200" cy="200" r="60" stroke="currentColor" stroke-width="0.5" fill="none" class="text-white"/>
                        <circle cx="750" cy="150" r="250" stroke="currentColor" stroke-width="0.5" fill="none" class="text-white"/>
                        <circle cx="750" cy="150" r="160" stroke="currentColor" stroke-width="0.5" fill="none" class="text-white"/>
                        <circle cx="750" cy="150" r="80" stroke="currentColor" stroke-width="0.5" fill="none" class="text-white"/>
                        <line x1="0" y1="600" x2="1000" y2="400" stroke="currentColor" stroke-width="0.5" class="text-white"/>
                        <line x1="0" y1="650" x2="1000" y2="450" stroke="currentColor" stroke-width="0.5" class="text-white"/>
                        <line x1="0" y1="700" x2="1000" y2="500" stroke="currentColor" stroke-width="0.5" class="text-white"/>
                        <rect x="50" y="550" width="120" height="120" rx="20" stroke="currentColor" stroke-width="0.5" fill="none" class="text-white" transform="rotate(15 110 610)"/>
                        <rect x="800" y="600" width="80" height="80" rx="15" stroke="currentColor" stroke-width="0.5" fill="none" class="text-white" transform="rotate(-10 840 640)"/>
                        <circle cx="500" cy="650" r="4" fill="currentColor" class="text-white"/>
                        <circle cx="520" cy="620" r="3" fill="currentColor" class="text-white"/>
                        <circle cx="480" cy="680" r="2" fill="currentColor" class="text-white"/>
                        <line x1="100" y1="100" x2="150" y2="50" stroke="currentColor" stroke-width="1" class="text-white" opacity="0.3"/>
                        <line x1="850" y1="350" x2="920" y2="280" stroke="currentColor" stroke-width="1" class="text-white" opacity="0.3"/>
                        <circle cx="900" cy="500" r="3" fill="currentColor" class="text-white" opacity="0.5"/>
                        <circle cx="920" cy="520" r="2" fill="currentColor" class="text-white" opacity="0.5"/>
                        <circle cx="880" cy="540" r="4" fill="currentColor" class="text-white" opacity="0.5"/>
                    </svg>
                </div>

                <div class="relative z-10 text-center">
                    <div class="mb-8 flex justify-center">
                        <svg #logoSvg class="w-80 h-auto" viewBox="408 540 410 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M457,603.12H445.54V651.5h-15V603.12h-8.89V590h8.89v-7.37a23.19,23.19,0,0,1,1.84-10,14.65,14.65,0,0,1,4.76-5.84,16.16,16.16,0,0,1,6.6-2.66,42.66,42.66,0,0,1,7.37-.64h7.23v13.84h-7.49a9.75,9.75,0,0,0-3.55.7,2.77,2.77,0,0,0-1.78,2.86V590H457Z" fill="none" stroke="white" stroke-width="3" stroke-linejoin="round" class="draw-path"/>
                            <path d="M469.28,651.62V563.5h15v88.12Z" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="draw-path"/>
                            <path d="M522.61,652.64q-12.32,0-19.55-5.91t-7.24-17.58V608.7q0-11.93,7.24-17.9t19.55-6q12.32,0,19.5,6t7.17,17.9v20.45q0,11.69-7.17,17.58T522.61,652.64Zm0-13.46a19.43,19.43,0,0,0,4.07-.44,12.58,12.58,0,0,0,3.74-1.47,8.29,8.29,0,0,0,2.8-2.66,7.52,7.52,0,0,0,1.08-4.19v-23a8.12,8.12,0,0,0-1.08-4.38,8.78,8.78,0,0,0-2.8-2.79,11.47,11.47,0,0,0-3.74-1.52,18.8,18.8,0,0,0-4.07-.45,19.53,19.53,0,0,0-4.12.45,11.4,11.4,0,0,0-3.81,1.52,8.88,8.88,0,0,0-2.8,2.79,8.12,8.12,0,0,0-1.08,4.38v23a7.52,7.52,0,0,0,1.08,4.19,8.38,8.38,0,0,0,2.8,2.66,12.48,12.48,0,0,0,3.81,1.47A20.19,20.19,0,0,0,522.61,639.18Z" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="draw-path"/>
                            <path d="M572.64,631.18a15.4,15.4,0,0,0,4.7,5.59,13.25,13.25,0,0,0,8.25,2.41,19.69,19.69,0,0,0,3.81-.38,11.58,11.58,0,0,0,3.37-1.21,7.66,7.66,0,0,0,2.41-2.1,4.74,4.74,0,0,0,1-2.93v-1.27a3.2,3.2,0,0,0-1-2.36,8.5,8.5,0,0,0-2.48-1.65,17.64,17.64,0,0,0-3.49-1.15c-1.31-.29-2.64-.57-4-.82a65.83,65.83,0,0,1-7.93-1.59,26.53,26.53,0,0,1-7.62-3.31,17.42,17.42,0,0,1-5.72-6,19.29,19.29,0,0,1-2.22-9.8,20.13,20.13,0,0,1,1.84-9,16.24,16.24,0,0,1,5.08-6.11,22.39,22.39,0,0,1,7.68-3.5,38.8,38.8,0,0,1,9.65-1.15,38.25,38.25,0,0,1,14,2.65,20.24,20.24,0,0,1,10.47,9q-3.42,2.4-5.44,3.86c-1.35,1-3.12,2.31-5.31,4a13.78,13.78,0,0,0-5.5-4.32,18.82,18.82,0,0,0-8.16-1.78,16.3,16.3,0,0,0-3,.32,13,13,0,0,0-3,1,7.16,7.16,0,0,0-2.34,1.65,3.6,3.6,0,0,0-.95,2.54v.77c0,1.87,1.06,3.2,3.17,4a41.52,41.52,0,0,0,7.46,2c2.62.42,5.34,1,8.16,1.59a24.11,24.11,0,0,1,7.72,3.18,17,17,0,0,1,5.69,6.24q2.22,4,2.22,10.76a19.53,19.53,0,0,1-2,9.29,18,18,0,0,1-5.52,6.3,23.72,23.72,0,0,1-8.13,3.62,40.58,40.58,0,0,1-9.84,1.15A43,43,0,0,1,578,652a30,30,0,0,1-7.3-2.27,25.46,25.46,0,0,1-6.23-4,18.08,18.08,0,0,1-4.44-6Z" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="draw-path"/>
                            <path d="M630.42,631.18a15.3,15.3,0,0,0,4.7,5.59,13.23,13.23,0,0,0,8.25,2.41,19.69,19.69,0,0,0,3.81-.38,11.41,11.41,0,0,0,3.36-1.21,7.7,7.7,0,0,0,2.42-2.1,4.8,4.8,0,0,0,.95-2.93v-1.27a3.24,3.24,0,0,0-.95-2.36,8.64,8.64,0,0,0-2.48-1.65,17.86,17.86,0,0,0-3.49-1.15c-1.32-.29-2.65-.57-4-.82a66,66,0,0,1-7.94-1.59,26.78,26.78,0,0,1-7.62-3.31,17.39,17.39,0,0,1-5.71-6,19.29,19.29,0,0,1-2.22-9.8,20.13,20.13,0,0,1,1.84-9,16.14,16.14,0,0,1,5.08-6.11,22.39,22.39,0,0,1,7.68-3.5,38.74,38.74,0,0,1,9.65-1.15,38.23,38.23,0,0,1,14,2.65,20.26,20.26,0,0,1,10.48,9q-3.42,2.4-5.44,3.86c-1.35,1-3.12,2.31-5.32,4a13.71,13.71,0,0,0-5.5-4.32,18.82,18.82,0,0,0-8.16-1.78,16.12,16.12,0,0,0-3,.32,13,13,0,0,0-3,1,7.16,7.16,0,0,0-2.34,1.65,3.6,3.6,0,0,0-.95,2.54v.77c0,1.87,1,3.2,3.16,4a41.87,41.87,0,0,0,7.47,2c2.61.42,5.33,1,8.16,1.59a24.15,24.15,0,0,1,7.71,3.18,17.07,17.07,0,0,1,5.7,6.24q2.21,4,2.21,10.76a19.65,19.65,0,0,1-2,9.29,18.1,18.1,0,0,1-5.52,6.3,23.72,23.72,0,0,1-8.13,3.62,40.58,40.58,0,0,1-9.84,1.15,43,43,0,0,1-7.56-.69,30.11,30.11,0,0,1-7.3-2.27,25.41,25.41,0,0,1-6.22-4,18.08,18.08,0,0,1-4.44-6Z" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="draw-path"/>
                            <path d="M697.59,651.5h-15V563.75l15-.25v49.4q2.53-2.92,5-5.59c1.65-1.78,3.33-3.6,5-5.46q3.3-3.81,6.92-7.87t7.05-8h18.66l-23.36,26.28q2.93,4.44,5.84,8.83t5.84,8.82q1.53,2.42,3.37,5.21t3.68,5.65c1.22,1.9,2.45,3.79,3.68,5.65l3.37,5.08H724.76L707,621.91c-.67.85-1.33,1.63-2,2.35l-2,2.22-2.73,3-2.73,3Z" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="draw-path"/>
                            <path d="M805,594.7v4.74L770.67,586l-3.92,13.46H765L762,584a30.91,30.91,0,0,1-9.24-7.84,22.08,22.08,0,0,1-4.58-11.65c-.8-8.09-7.92-8.74-7.92-8.74V554.4s12.78-11.24,21.19-.69a78.51,78.51,0,0,0,5.83,6.63s21.11,19.27,24.71,22.73Z" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="draw-path"/>
                        </svg>
                    </div>
                    <p class="text-surface-400 text-lg max-w-md mx-auto leading-relaxed">
                        Community management platform for Free Libre Open Source Software Kosova.
                    </p>
                    <div class="mt-8">
                        <a routerLink="/rent" class="inline-flex items-center gap-2 text-surface-400 hover:text-white transition-colors text-sm">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                            Rent Prishtina Hackerspace
                        </a>
                    </div>
                </div>
            </div>

            <div class="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
                <div class="w-full max-w-md">
                    <div class="lg:hidden text-center mb-10">
                        <img class="h-16 w-auto mx-auto mb-4" [src]="layoutService.isDarkTheme() ? 'assets/images/flossk_logo_dark_mode.png' : 'assets/images/logo.png'" alt="FLOSSK">
                        <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0">Welcome</h2>
                    </div>

                    <div class="hidden lg:block text-center mb-10">
                        <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0">
                            {{ isLoginMode ? 'Welcome back' : isForgotMode ? 'Reset password' : 'Create account' }}
                        </h2>
                        <p class="text-surface-500 dark:text-surface-400 mt-1">
                            {{ isLoginMode ? 'Log in to your account' : isForgotMode ? 'Enter your email to receive a reset link' : 'Sign up for a new account' }}
                        </p>
                    </div>

                    @if (authService.error()) {
                        <p-message severity="error" [text]="authService.error()!" styleClass="w-full mb-4"></p-message>
                    }
                    @if (registerSuccess) {
                        <p-message severity="success" text="Registration successful! Please log in." styleClass="w-full mb-4"></p-message>
                    }

                    @if (isLoginMode) {
                        <div class="space-y-5">
                            <div>
                                <label for="email1" class="block text-surface-700 dark:text-surface-200 text-sm font-medium mb-1.5">Email</label>
                                <input pInputText id="email1" type="text" placeholder="Enter your email" class="w-full" [(ngModel)]="email" />
                            </div>
                            <div>
                                <label for="password1" class="block text-surface-700 dark:text-surface-200 text-sm font-medium mb-1.5">Password</label>
                                <p-password id="password1" [(ngModel)]="password" placeholder="Enter your password" [toggleMask]="true" [fluid]="true" [feedback]="false"></p-password>
                            </div>
                            <div class="flex items-center justify-between">
                                <div class="flex items-center">
                                    <p-checkbox [(ngModel)]="checked" id="rememberme1" binary class="mr-2"></p-checkbox>
                                    <label for="rememberme1" class="text-sm text-surface-600 dark:text-surface-400">Remember me</label>
                                </div>
                                <span class="text-sm font-medium cursor-pointer text-primary hover:underline" (click)="setMode('forgot')">Forgot password?</span>
                            </div>
                            <p-button label="Log In" styleClass="w-full" [loading]="authService.isLoading()" (onClick)="onLogin()"></p-button>
                             <p class="text-sm text-surface-500 dark:text-surface-400 text-center leading-relaxed mt-4">
                                 By logging in, you agree to our <a routerLink="/terms" class="text-primary hover:underline">Terms of Service</a> and <a routerLink="/privacy" class="text-primary hover:underline">Privacy Policy</a>.
                             </p>
                             <div class="text-center pt-4 border-t border-surface-200 dark:border-surface-700">
                                 <span class="text-sm text-surface-500 dark:text-surface-400">Don't have an account? </span>
                                 <span class="text-sm font-medium cursor-pointer text-primary hover:underline" (click)="toggleMode()">Sign up</span>
                             </div>
                        </div>
                    } @else if (!isForgotMode) {
                        <div class="space-y-5">
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label for="firstName" class="block text-surface-700 dark:text-surface-200 text-sm font-medium mb-1.5">First Name</label>
                                    <input pInputText id="firstName" type="text" placeholder="First name" class="w-full" [(ngModel)]="firstName" />
                                </div>
                                <div>
                                    <label for="lastName" class="block text-surface-700 dark:text-surface-200 text-sm font-medium mb-1.5">Last Name</label>
                                    <input pInputText id="lastName" type="text" placeholder="Last name" class="w-full" [(ngModel)]="lastName" />
                                </div>
                            </div>
                            <div>
                                <label for="regEmail" class="block text-surface-700 dark:text-surface-200 text-sm font-medium mb-1.5">Email</label>
                                <input pInputText id="regEmail" type="text" placeholder="Enter your email" class="w-full" [(ngModel)]="email" />
                            </div>
                            <div>
                                <label for="regPassword" class="block text-surface-700 dark:text-surface-200 text-sm font-medium mb-1.5">Password</label>
                                <p-password id="regPassword" [(ngModel)]="password" placeholder="Create a password" [fluid]="true"></p-password>
                            </div>
                            <div>
                                <label for="confirmPassword" class="block text-surface-700 dark:text-surface-200 text-sm font-medium mb-1.5">Confirm Password</label>
                                <p-password id="confirmPassword" [(ngModel)]="confirmPassword" placeholder="Confirm your password" [fluid]="true" [feedback]="false"></p-password>
                            </div>
                            <div class="p-4 rounded-lg bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
                                <p class="text-sm text-surface-600 dark:text-surface-400 mb-3">You need to be verified as a member to register.</p>
                                <p-button label="Apply for Membership" styleClass="w-full" severity="secondary" [outlined]="true" size="small" routerLink="/apply"></p-button>
                            </div>
                            <p-button label="Create Account" styleClass="w-full" [loading]="authService.isLoading()" (onClick)="onRegister()"></p-button>
                             <p class="text-sm text-surface-500 dark:text-surface-400 text-center leading-relaxed mt-4">
                                 By creating an account, you agree to our <a routerLink="/terms" class="text-primary hover:underline">Terms of Service</a> and <a routerLink="/privacy" class="text-primary hover:underline">Privacy Policy</a>.
                             </p>
                             <div class="text-center pt-4 border-t border-surface-200 dark:border-surface-700">
                                 <span class="text-sm text-surface-500 dark:text-surface-400">Already have an account? </span>
                                 <span class="text-sm font-medium cursor-pointer text-primary hover:underline" (click)="setMode('login')">Log in</span>
                             </div>
                        </div>
                    } @else {
                        @if (forgotPasswordSent) {
                            <p-message severity="success" text="If that email is registered, a reset link has been sent. Please check your inbox." styleClass="w-full mb-6"></p-message>
                            <p-button label="Back to Log In" styleClass="w-full" severity="secondary" (onClick)="setMode('login')"></p-button>
                        } @else {
                            <div class="space-y-5">
                                <div>
                                    <label for="forgotEmail" class="block text-surface-700 dark:text-surface-200 text-sm font-medium mb-1.5">Email</label>
                                    <input pInputText id="forgotEmail" type="text" placeholder="Enter your email address" class="w-full" [(ngModel)]="email" />
                                </div>
                                <p-button label="Send Reset Link" styleClass="w-full" [loading]="authService.isLoading()" (onClick)="onForgotPassword()"></p-button>
                                <div class="text-center pt-4 border-t border-surface-200 dark:border-surface-700">
                                    <span class="text-sm font-medium cursor-pointer text-primary hover:underline" (click)="setMode('login')">Back to Log In</span>
                                </div>
                            </div>
                        }
                    }
                </div>
            </div>
        </div>
    `
})
export class Login implements AfterViewInit {
    @ViewChild('logoSvg') logoSvg!: ElementRef<SVGSVGElement>;

    isLoginMode: boolean = true;
    isForgotMode: boolean = false;
    registerSuccess: boolean = false;
    forgotPasswordSent: boolean = false;

    email: string = '';

    password: string = '';

    checked: boolean = false;

    firstName: string = '';

    lastName: string = '';

    confirmPassword: string = '';

    ngAfterViewInit() {
        const paths = this.logoSvg.nativeElement.querySelectorAll<SVGPathElement>('.draw-path');
        const gap = 400;

        paths.forEach((path, i) => {
            const length = path.getTotalLength();
            path.style.strokeDasharray = `${length}`;
            path.style.strokeDashoffset = `${length}`;
            setTimeout(() => {
                path.style.transition = `stroke-dashoffset 1000ms ease-out`;
                path.style.strokeDashoffset = '0';
            }, i * gap);
        });
    }

    constructor(
        public layoutService: LayoutService,
        public authService: AuthService,
        private router: Router
    ) { }

    toggleMode() {
        this.isLoginMode = !this.isLoginMode;
        this.isForgotMode = false;
        this.registerSuccess = false;
        this.forgotPasswordSent = false;
        this.authService.error.set(null);
    }

    setMode(mode: 'login' | 'register' | 'forgot') {
        this.isLoginMode = mode === 'login';
        this.isForgotMode = mode === 'forgot';
        this.registerSuccess = false;
        this.forgotPasswordSent = false;
        this.authService.error.set(null);
    }

    onForgotPassword() {
        if (!this.email) {
            this.authService.error.set('Please enter your email address.');
            return;
        }
        this.authService.forgotPassword(this.email).subscribe({
            next: () => { this.forgotPasswordSent = true; },
            error: () => {}
        });
    }

    onLogin() {
        this.authService.login({ email: this.email, password: this.password, rememberMe: this.checked }).subscribe({
            next: () => {
                this.authService.loadCurrentUser();
                this.router.navigate(['/dashboard']);
            },
            error: (err) => {
                console.error('Login failed:', err);
            }
        });
    }

    onRegister() {
        if (this.password !== this.confirmPassword) {
            this.authService.error.set('Passwords do not match');
            return;
        }

        this.authService.register({ 
            firstName: this.firstName, 
            lastName: this.lastName, 
            email: this.email, 
            password: this.password,
            confirmPassword: this.confirmPassword 
        }).subscribe({
            next: () => {
                this.password = '';
                this.confirmPassword = '';
                this.firstName = '';
                this.lastName = '';
                this.authService.error.set(null);
                this.registerSuccess = true;
                this.isLoginMode = true;
            },
            error: (err) => {
                console.error('Registration failed:', err);
            }
        });
    }
}
