import { Component } from '@angular/core';
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
        <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-screen overflow-hidden">
            <div class="flex flex-col items-center justify-center">
                <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                    <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                        <div class="text-center mb-8 flex flex-col items-center">  
                            <img class="h-20 sm:h-28 w-auto" [src]="layoutService.isDarkTheme() ? 'assets/images/flossk_logo_dark_mode.png' : 'assets/images/logo.png'" alt="Sorra">
                            <span class="text-muted-color mt-5 font-medium">
                                {{ isLoginMode ? 'Log in to continue' : isForgotMode ? 'Reset your password' : 'Create your account' }}
                            </span>
                        </div>

                        <div>
                            @if (authService.error()) {
                                <p-message severity="error" [text]="authService.error()!" styleClass="w-full mb-4"></p-message>
                            }
                            @if (registerSuccess) {
                                <p-message severity="success" text="Registration successful! Please log in." styleClass="w-full mb-4"></p-message>
                            }
                            
                            @if (isLoginMode) {
                                <label for="email1" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Email</label>
                                <input pInputText id="email1" type="text" placeholder="Email address" class="w-full md:w-120 mb-8" [(ngModel)]="email" />

                                <label for="password1" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Password</label>
                                <p-password id="password1" [(ngModel)]="password" placeholder="Password" [toggleMask]="true" styleClass="mb-4" [fluid]="true" [feedback]="false"></p-password>

                                <div class="flex items-center justify-between mt-2 mb-8 gap-8">
                                    <div class="flex items-center">
                                        <p-checkbox [(ngModel)]="checked" id="rememberme1" binary class="mr-2"></p-checkbox>
                                        <label for="rememberme1">Remember me</label>
                                    </div>
                                    <span class="font-medium no-underline ml-2 text-right cursor-pointer text-primary" (click)="setMode('forgot')">Forgot password?</span>
                                </div>
                                <p-button label="Log In" styleClass="w-full" [loading]="authService.isLoading()" (onClick)="onLogin()"></p-button>
                                
                                <div class="text-center mt-6">
                                    <span class="text-muted-color">Don't have an account yet? </span>
                                    <span class="font-medium cursor-pointer text-primary" (click)="toggleMode()">Sign up</span>
                                </div>
                            } @else if (!isForgotMode) {
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <label for="firstName" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">First Name</label>
                                        <input pInputText id="firstName" type="text" placeholder="First name" class="w-full" [(ngModel)]="firstName" />
                                    </div>
                                    <div>
                                        <label for="lastName" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Last Name</label>
                                        <input pInputText id="lastName" type="text" placeholder="Last name" class="w-full" [(ngModel)]="lastName" />
                                    </div>
                                </div>

                                <label for="regEmail" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Email</label>
                                <input pInputText id="regEmail" type="text" placeholder="Email address" class="w-full md:w-120 mb-6" [(ngModel)]="email" />

                                <label for="regPassword" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Password</label>
                                <p-password id="regPassword" [(ngModel)]="password" placeholder="Password" [toggleMask]="true" styleClass="mb-6" [fluid]="true"></p-password>

                                <label for="confirmPassword" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Confirm Password</label>
                                <p-password id="confirmPassword" [(ngModel)]="confirmPassword" placeholder="Confirm password" [toggleMask]="true" styleClass="mb-4" [fluid]="true" [feedback]="false"></p-password>

                                <div class="mb-6 p-4 bg-surface-50 dark:bg-surface-500 rounded-lg">
                                    <p class="text-muted-color text-sm mb-3">Info: You need to be verified as a member in order to register</p>
                                    <p-button label="Apply for Membership" styleClass="w-full" severity="primary" [outlined]="true" routerLink="/apply"></p-button>
                                </div>

                                <p-button label="Register" styleClass="w-full" [loading]="authService.isLoading()" (onClick)="onRegister()"></p-button>
                                
                                <div class="text-center mt-6">
                                    <span class="text-muted-color">Already have an account? </span>
                                    <span class="font-medium cursor-pointer text-primary" (click)="setMode('login')">Log in</span>
                                </div>
                            } @else {
                                @if (forgotPasswordSent) {
                                    <p-message severity="success" text="If that email is registered, a reset link has been sent. Please check your inbox." styleClass="w-full mb-6"></p-message>
                                    <p-button label="Back to Log In" styleClass="w-full" severity="secondary" (onClick)="setMode('login')"></p-button>
                                } @else {
                                    <label for="forgotEmail" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Email</label>
                                    <input pInputText id="forgotEmail" type="text" placeholder="Enter your email address" class="w-full mb-8" [(ngModel)]="email" />
                                    <p-button label="Send Reset Link" styleClass="w-full" [loading]="authService.isLoading()" (onClick)="onForgotPassword()"></p-button>
                                    <div class="text-center mt-6">
                                        <span class="font-medium cursor-pointer text-primary" (click)="setMode('login')">Back to Log In</span>
                                    </div>
                                }
                            }
                            
                            <!-- Rent Hackerspace Link -->
                            <div class="text-center mt-8 pt-6 border-t border-surface">
                                <a routerLink="/rent" class="font-medium cursor-pointer text-primary hover:underline">
                                    Rent Prishtina Hackerspace
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class Login {
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
        this.authService.login({ email: this.email, password: this.password }).subscribe({
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
