import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { MessageService, ConfirmationService } from 'primeng/api';
import { AuthService } from '@/pages/service/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment.prod';

interface MembershipData {
    id: string;
    fullName: string;
    address: string;
    city: string;
    phoneNumber: string;
    email: string;
    schoolOrCompany: string;
    dateOfBirth: string;
    statement: string;
    idCardNumber: string;
    status: string;
    createdAt: string;
    reviewedAt: string | null;
    rejectionReason: string | null;
}

interface UserSettings {
    user: any;
    membershipRequest: MembershipData | null;
}

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, CardModule, DividerModule, SkeletonModule, ToastModule, ConfirmDialogModule, InputTextModule, TextareaModule, SelectModule, TagModule],
    providers: [ConfirmationService, MessageService],
    template: `
    <p-confirmdialog></p-confirmdialog>
    <p-toast></p-toast>

    <div class="card">
        <div class="flex items-center gap-3 mb-6">
            <i class="pi pi-cog text-primary text-2xl"></i>
            <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0 m-0">Settings</h1>
        </div>
        <p-divider />

        @if (isLoading) {
            <div class="flex flex-col gap-6">
                <div *ngFor="let i of [1,2,3]" class="card">
                    <p-skeleton width="30%" height="1.5rem" styleClass="mb-4"></p-skeleton>
                    <p-skeleton width="100%" height="6rem"></p-skeleton>
                </div>
            </div>
        }

        @if (!isLoading) {
            <!-- Profile Information -->
            <div class="card mb-6">
                <div class="flex items-center gap-3 mb-4">
                    <i class="pi pi-user text-primary text-xl"></i>
                    <h2 class="text-xl font-bold text-surface-900 dark:text-surface-0 m-0">Profile Information</h2>
                </div>
                <p-divider />
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-muted-color mb-1">First Name</label>
                        <p class="text-surface-900 dark:text-surface-0 font-semibold">{{ settings.user.firstName }}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-muted-color mb-1">Last Name</label>
                        <p class="text-surface-900 dark:text-surface-0 font-semibold">{{ settings.user.lastName }}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-muted-color mb-1">Email</label>
                        <p class="text-surface-900 dark:text-surface-0 font-semibold">{{ settings.user.email }}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-muted-color mb-1">Phone</label>
                        <p class="text-surface-900 dark:text-surface-0">{{ settings.user.phoneNumber || 'Not set' }}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-muted-color mb-1">Location</label>
                        <p class="text-surface-900 dark:text-surface-0">{{ settings.user.location || 'Not set' }}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-muted-color mb-1">Role</label>
                        <p class="text-surface-900 dark:text-surface-0 font-semibold">{{ settings.user.roles?.[0] }}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-muted-color mb-1">Member Since</label>
                        <p class="text-surface-900 dark:text-surface-0">{{ settings.user.createdAt | date:'longDate' }}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-muted-color mb-1">Website</label>
                        <p class="text-surface-900 dark:text-surface-0">{{ settings.user.websiteUrl || 'Not set' }}</p>
                    </div>
                </div>
                @if (settings.user.biography) {
                    <div class="mt-4">
                        <label class="block text-sm font-medium text-muted-color mb-1">Biography</label>
                        <p class="text-surface-900 dark:text-surface-0">{{ settings.user.biography }}</p>
                    </div>
                }
                @if (settings.user.skills?.length) {
                    <div class="mt-4">
                        <label class="block text-sm font-medium text-muted-color mb-1">Skills</label>
                        <div class="flex flex-wrap gap-2 mt-2">
                            <span *ngFor="let skill of settings.user.skills"
                                class="px-3 py-1 bg-primary-100 dark:bg-primary-400/10 text-primary-700 dark:text-primary-400 rounded-full text-sm">
                                {{ skill }}
                            </span>
                        </div>
                    </div>
                }
            </div>

            <!-- Membership Data -->
            @if (settings.membershipRequest) {
                <div class="card mb-6">
                    <div class="flex items-center gap-3 mb-4">
                        <i class="pi pi-id-card text-primary text-xl"></i>
                        <h2 class="text-xl font-bold text-surface-900 dark:text-surface-0 m-0">Membership Data</h2>
                        <p-tag [value]="settings.membershipRequest.status" [severity]="statusSeverity(settings.membershipRequest.status)"></p-tag>
                    </div>
                    <p-divider />
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-muted-color mb-1">Full Name</label>
                            <p class="text-surface-900 dark:text-surface-0 font-semibold">{{ settings.membershipRequest.fullName }}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-muted-color mb-1">Email</label>
                            <p class="text-surface-900 dark:text-surface-0">{{ settings.membershipRequest.email }}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-muted-color mb-1">Address</label>
                            <p class="text-surface-900 dark:text-surface-0">{{ settings.membershipRequest.address }}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-muted-color mb-1">City</label>
                            <p class="text-surface-900 dark:text-surface-0">{{ settings.membershipRequest.city }}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-muted-color mb-1">Phone</label>
                            <p class="text-surface-900 dark:text-surface-0">{{ settings.membershipRequest.phoneNumber }}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-muted-color mb-1">School / Company</label>
                            <p class="text-surface-900 dark:text-surface-0">{{ settings.membershipRequest.schoolOrCompany }}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-muted-color mb-1">Date of Birth</label>
                            <p class="text-surface-900 dark:text-surface-0">{{ settings.membershipRequest.dateOfBirth | date:'longDate' }}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-muted-color mb-1">ID Card Number</label>
                            <p class="text-surface-900 dark:text-surface-0 font-mono">{{ settings.membershipRequest.idCardNumber }}</p>
                        </div>
                    </div>
                    @if (settings.membershipRequest.statement) {
                        <div class="mt-4">
                            <label class="block text-sm font-medium text-muted-color mb-1">Personal Statement</label>
                            <p class="text-surface-900 dark:text-surface-0 italic">{{ settings.membershipRequest.statement }}</p>
                        </div>
                    }
                    @if (settings.membershipRequest.rejectionReason) {
                        <div class="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-border">
                            <label class="block text-sm font-medium text-red-600 dark:text-red-400 mb-1">Rejection Reason</label>
                            <p class="text-red-700 dark:text-red-300">{{ settings.membershipRequest.rejectionReason }}</p>
                        </div>
                    }
                </div>
            }

            <!-- Privacy & Data -->
            <div class="card mb-6">
                <div class="flex items-center gap-3 mb-4">
                    <i class="pi pi-shield text-primary text-xl"></i>
                    <h2 class="text-xl font-bold text-surface-900 dark:text-surface-0 m-0">Privacy & Data</h2>
                </div>
                <p-divider />
                <div class="flex flex-col gap-4">
                    <div class="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-800 rounded-border">
                        <div>
                            <h3 class="font-semibold text-surface-900 dark:text-surface-0 m-0 mb-1">Export My Data</h3>
                            <p class="text-sm text-muted-color m-0">Download all your personal data as a JSON file (GDPR data portability)</p>
                        </div>
                        <p-button label="Export" icon="pi pi-download" [loading]="isExporting" (onClick)="exportData()"></p-button>
                    </div>
                    <div class="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-border">
                        <div>
                            <h3 class="font-semibold text-surface-900 dark:text-surface-0 m-0 mb-1">Delete Account</h3>
                            <p class="text-sm text-muted-color m-0">Permanently delete your account and all associated data (GDPR right to erasure)</p>
                        </div>
                        <p-button label="Delete" icon="pi pi-trash" severity="danger" [loading]="isDeleting" (onClick)="confirmDelete()"></p-button>
                    </div>
                </div>
            </div>
        }
    </div>
    `,
    styles: [`
        .card { 
            background: var(--surface-card);
            padding: 1.5rem;
            border-radius: var(--border-radius);
            box-shadow: var(--card-shadow);
        }
    `]
})
export class Settings implements OnInit {
    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private confirmationService = inject(ConfirmationService);
    private messageService = inject(MessageService);

    settings: UserSettings = { user: null, membershipRequest: null };
    isLoading = true;
    isExporting = false;
    isDeleting = false;

    ngOnInit() {
        this.loadSettings();
    }

    loadSettings() {
        this.isLoading = true;
        this.http.get<UserSettings>(`${environment.apiUrl}/Auth/me/settings`).subscribe({
            next: (data) => {
                this.settings = data;
                this.isLoading = false;
            },
            error: () => {
                this.isLoading = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load settings.' });
            }
        });
    }

    statusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        switch (status) {
            case 'Approved': return 'success';
            case 'Pending': return 'warn';
            case 'Rejected': return 'danger';
            default: return 'info';
        }
    }

    exportData() {
        this.isExporting = true;
        this.http.get(`${environment.apiUrl}/Auth/me/export`, { responseType: 'blob' }).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `flossk-export-${this.settings.user.email}-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                window.URL.revokeObjectURL(url);
                this.isExporting = false;
                this.messageService.add({ severity: 'success', summary: 'Exported', detail: 'Your data has been downloaded.' });
            },
            error: () => {
                this.isExporting = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to export data.' });
            }
        });
    }

    confirmDelete() {
        this.confirmationService.confirm({
            message: 'Are you sure you want to permanently delete your account? This action cannot be undone and all your data will be lost.',
            header: 'Delete Account',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonProps: { severity: 'danger' },
            accept: () => this.deleteAccount()
        });
    }

    deleteAccount() {
        this.isDeleting = true;
        this.http.delete(`${environment.apiUrl}/Auth/me`).subscribe({
            next: () => {
                this.isDeleting = false;
                this.messageService.add({ severity: 'success', summary: 'Account Deleted', detail: 'Your account has been deleted.' });
                setTimeout(() => this.authService.logout(), 2000);
            },
            error: () => {
                this.isDeleting = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete account.' });
            }
        });
    }
}
