import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { DividerModule } from 'primeng/divider';
import { SelectModule } from 'primeng/select';
import { AuthService } from '@/pages/service/auth.service';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, PasswordModule, MessageModule, DividerModule, SelectModule],
    template: `
        <div class="card">
            <div class="font-semibold text-xl mb-4">Settings</div>
            <p-divider />

            <div class="mt-6">
                <div class="font-semibold text-lg mb-1">Seed User</div>
                <p class="text-muted-color text-sm mb-6">Create a new user account with a specific role. The email will be automatically approved.</p>

                @if (successMessage) {
                    <p-message severity="success" [text]="successMessage" styleClass="w-full mb-4" />
                }
                @if (errorMessage) {
                    <p-message severity="error" [text]="errorMessage" styleClass="w-full mb-4" />
                }

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div class="flex flex-col gap-2">
                        <label for="adminFirstName" class="font-medium">First Name</label>
                        <input pInputText id="adminFirstName" type="text" placeholder="First name" [(ngModel)]="form.firstName" autocomplete="off" />
                    </div>
                    <div class="flex flex-col gap-2">
                        <label for="adminLastName" class="font-medium">Last Name</label>
                        <input pInputText id="adminLastName" type="text" placeholder="Last name" [(ngModel)]="form.lastName" autocomplete="off" />
                    </div>
                </div>

                <div class="flex flex-col gap-2 mb-4">
                    <label for="adminEmail" class="font-medium">Email</label>
                    <input pInputText id="adminEmail" type="text" placeholder="Email address" [(ngModel)]="form.email" class="w-full md:w-120" autocomplete="off" />
                </div>

                <div class="flex flex-col gap-2 mb-4">
                    <label for="adminPassword" class="font-medium">Password</label>
                    <p-password id="adminPassword" [(ngModel)]="form.password" placeholder="Password" [toggleMask]="true" [fluid]="true" [pt]="{pcInputText: {root: {autocomplete: 'new-password'}}}" />
                </div>

                <div class="flex flex-col gap-2 mb-4">
                    <label for="adminConfirmPassword" class="font-medium">Confirm Password</label>
                    <p-password id="adminConfirmPassword" [(ngModel)]="form.confirmPassword" placeholder="Confirm password" [toggleMask]="true" [fluid]="true" [feedback]="false" [pt]="{pcInputText: {root: {autocomplete: 'new-password'}}}" />
                </div>

                <div class="flex flex-col gap-2 mb-6">
                    <label for="userRole" class="font-medium">Role</label>
                    <p-select id="userRole" [(ngModel)]="form.role" [options]="roleOptions" placeholder="Select role" class="w-full md:w-120" />
                </div>

                <p-button label="Create User" icon="pi pi-user-plus" [loading]="loading" (onClick)="onSeedAdmin()" />
            </div>
        </div>
    `
})
export class Settings {
    form = {
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'User'
    };

    roleOptions = ['User', 'Admin', 'Full Member'];

    loading = false;
    successMessage: string | null = null;
    errorMessage: string | null = null;

    constructor(private authService: AuthService) {}

    onSeedAdmin(): void {
        this.successMessage = null;
        this.errorMessage = null;

        if (!this.form.firstName || !this.form.lastName || !this.form.email || !this.form.password || !this.form.confirmPassword || !this.form.role) {
            this.errorMessage = 'All fields are required.';
            return;
        }

        if (this.form.password !== this.form.confirmPassword) {
            this.errorMessage = 'Passwords do not match.';
            return;
        }

        this.loading = true;
        this.authService.seedAdmin(this.form).subscribe({
            next: () => {
                this.successMessage = `User account created for ${this.form.email} with role ${this.form.role}.`;
                this.form = { firstName: '', lastName: '', email: '', password: '', confirmPassword: '', role: 'User' };
                this.loading = false;
            },
            error: (err) => {
                const errors = err.error?.errors;
                this.errorMessage = Array.isArray(errors) && errors.length
                    ? errors.join(' ')
                    : (err.error?.message || 'Failed to create user account.');
                this.loading = false;
            }
        });
    }
}
