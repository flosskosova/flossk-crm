import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { PasswordModule } from 'primeng/password';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { DividerModule } from 'primeng/divider';
import { TabsModule } from 'primeng/tabs';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AuthService, getInitials } from '@/pages/service/auth.service';
import { LogService, LogEntry } from '@/pages/service/log.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment.prod';

interface ProfileData {
    firstName: string; lastName: string; email: string;
    phone: string; location: string; role: string;
    memberSince: string; website: string; biography: string; skills: string[];
}

interface MembershipData {
    fullName: string; email: string; address: string; city: string;
    phone: string; schoolOrCompany: string; dateOfBirth: string;
    idCardNumber: string; status: string; statement: string; rejectionReason: string;
}

const ENTITY_SEVERITY: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
    'Project': 'info', 'Inventory': 'success',
};
const ACTION_ICON: Record<string, string> = {
    'Project created': 'pi-folder-plus', 'Project updated': 'pi-pen-to-square', 'Project deleted': 'pi-trash',
    'Status updated': 'pi-refresh', 'Field updated': 'pi-pen-to-square',
    'Moderator added': 'pi-user-plus', 'Moderator removed': 'pi-user-minus',
    'Team member added': 'pi-user-plus', 'Team member removed': 'pi-user-minus',
    'Team members removed': 'pi-user-minus', 'Member joined': 'pi-sign-in', 'Member left': 'pi-sign-out',
    'Objective created': 'pi-list-check', 'Objective updated': 'pi-pen-to-square', 'Objective deleted': 'pi-trash',
    'Objective status updated': 'pi-refresh', 'Member assigned to objective': 'pi-user-plus',
    'Member removed from objective': 'pi-user-minus', 'Objective member joined': 'pi-sign-in',
    'Objective member removed': 'pi-sign-out', 'Resource added': 'pi-link', 'Resource updated': 'pi-pen-to-square',
    'Resource removed': 'pi-trash', 'File attached': 'pi-paperclip', 'File detached': 'pi-times-circle',
    'Item created': 'pi-plus-circle', 'Item updated': 'pi-pen-to-square', 'Item deleted': 'pi-trash',
    'Checked out': 'pi-arrow-circle-right', 'Checked in': 'pi-arrow-circle-left',
    'Damage reported': 'pi-exclamation-triangle', 'Repair reported': 'pi-wrench',
    'Image added': 'pi-image', 'Image removed': 'pi-times-circle',
};

@Component({
    selector: 'app-user-settings',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ButtonModule, InputTextModule, TextareaModule,
        PasswordModule, AvatarModule, TagModule, SkeletonModule, TooltipModule,
        SelectModule, DatePickerModule, DividerModule, TabsModule, ToastModule, ConfirmDialogModule,
    ],
    providers: [ConfirmationService, MessageService],
    template: `
    <p-confirmdialog />
    <p-toast />

    <div class="card">
        <div class="flex items-center gap-3 mb-1">
            <i class="pi pi-cog text-primary text-2xl"></i>
            <span class="font-semibold text-xl">Settings</span>
        </div>
        <p class="text-sm text-muted-color m-0">Manage your account, security, and preferences.</p>

        @if (isLoading) {
            <div class="flex flex-col gap-4 mt-6">
                <p-skeleton width="20%" height="1.5rem" />
                <p-skeleton width="100%" height="12rem" />
            </div>
        }

        @if (!isLoading) {
            <p-tabs value="activeTab" class="mt-6">
                <p-tablist>
                    <p-tab value="profile"><i class="pi pi-user mr-2"></i>Profile</p-tab>
                    <p-tab value="membership"><i class="pi pi-id-card mr-2"></i>Membership</p-tab>
                    <p-tab value="security"><i class="pi pi-lock mr-2"></i>Security</p-tab>
                    <p-tab value="privacy"><i class="pi pi-shield mr-2"></i>Privacy</p-tab>
                    <p-tab value="activity"><i class="pi pi-history mr-2"></i>Activity Log</p-tab>
                </p-tablist>

                <p-tabpanels>
                    <!-- Profile -->
                    <p-tabpanel value="profile">
                        <div class="flex items-center gap-4 mb-6">
                            <p-avatar [label]="getInitials(profile.firstName + ' ' + profile.lastName)" shape="circle" size="xlarge"
                                [style]="{'background-color': 'var(--primary-color)', 'color': 'var(--primary-color-text)'}" />
                            <div>
                                <div class="text-lg font-semibold text-surface-900 dark:text-surface-0">{{ profile.firstName }} {{ profile.lastName }}</div>
                                <div class="text-sm text-muted-color">{{ profile.email }}</div>
                            </div>
                        </div>

                        <div class="flex items-center justify-between mb-4">
                            <h3 class="font-semibold text-surface-900 dark:text-surface-0 m-0">Personal Information</h3>
                            <p-button [label]="profileEditMode ? 'Cancel' : 'Edit'" [icon]="profileEditMode ? 'pi pi-times' : 'pi pi-pencil'"
                                [outlined]="!profileEditMode" severity="secondary" size="small" (onClick)="toggleProfileEdit()" />
                        </div>

                        @if (!profileEditMode) {
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                                <div><div class="text-xs text-muted-color mb-1">First Name</div><div class="text-surface-900 dark:text-surface-0 font-medium">{{ profile.firstName }}</div></div>
                                <div><div class="text-xs text-muted-color mb-1">Last Name</div><div class="text-surface-900 dark:text-surface-0 font-medium">{{ profile.lastName }}</div></div>
                                <div><div class="text-xs text-muted-color mb-1">Email</div><div class="text-surface-900 dark:text-surface-0">{{ profile.email }}</div></div>
                                <div><div class="text-xs text-muted-color mb-1">Phone</div><div class="text-surface-900 dark:text-surface-0">{{ profile.phone }}</div></div>
                                <div><div class="text-xs text-muted-color mb-1">Location</div><div class="text-surface-900 dark:text-surface-0">{{ profile.location }}</div></div>
                                <div><div class="text-xs text-muted-color mb-1">Role</div><div class="text-surface-900 dark:text-surface-0 font-medium">{{ profile.role }}</div></div>
                                <div><div class="text-xs text-muted-color mb-1">Member Since</div><div class="text-surface-900 dark:text-surface-0">{{ profile.memberSince }}</div></div>
                                <div><div class="text-xs text-muted-color mb-1">Website</div><div class="text-surface-900 dark:text-surface-0">{{ profile.website }}</div></div>
                            </div>
                            @if (profile.biography) {
                                <div class="mt-5 pt-5 border-t border-surface-200 dark:border-surface-700">
                                    <div class="text-xs text-muted-color mb-2">Biography</div>
                                    <div class="text-surface-700 dark:text-surface-300 leading-relaxed">{{ profile.biography }}</div>
                                </div>
                            }
                            @if (profile.skills.length) {
                                <div class="mt-5 pt-5 border-t border-surface-200 dark:border-surface-700">
                                    <div class="text-xs text-muted-color mb-3">Skills</div>
                                    <div class="flex flex-wrap gap-2">
                                        @for (skill of profile.skills; track skill) {
                                            <span class="px-3 py-1.5 bg-primary-50 dark:bg-primary-400/10 text-primary-700 dark:text-primary-300 rounded-md text-sm font-medium">{{ skill }}</span>
                                        }
                                    </div>
                                </div>
                            }
                        } @else {
                            <div class="flex flex-col gap-5">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><label class="block text-sm font-medium text-surface-900 dark:text-surface-0 mb-1.5">First Name</label><input pInputText [(ngModel)]="editProfile.firstName" class="w-full" /></div>
                                    <div><label class="block text-sm font-medium text-surface-900 dark:text-surface-0 mb-1.5">Last Name</label><input pInputText [(ngModel)]="editProfile.lastName" class="w-full" /></div>
                                    <div><label class="block text-sm font-medium text-surface-900 dark:text-surface-0 mb-1.5">Phone</label><input pInputText [(ngModel)]="editProfile.phone" class="w-full" /></div>
                                    <div><label class="block text-sm font-medium text-surface-900 dark:text-surface-0 mb-1.5">Location</label><input pInputText [(ngModel)]="editProfile.location" class="w-full" /></div>
                                    <div><label class="block text-sm font-medium text-surface-900 dark:text-surface-0 mb-1.5">Website</label><input pInputText [(ngModel)]="editProfile.website" class="w-full" /></div>
                                    <div><label class="block text-sm font-medium text-surface-900 dark:text-surface-0 mb-1.5">Skills</label><input pInputText [(ngModel)]="editProfile.skillsCsv" class="w-full" placeholder="Angular, .NET, TypeScript" /></div>
                                </div>
                                <div><label class="block text-sm font-medium text-surface-900 dark:text-surface-0 mb-1.5">Biography</label><textarea pTextarea [(ngModel)]="editProfile.biography" [rows]="4" class="w-full"></textarea></div>
                                <div class="flex justify-end gap-2">
                                    <p-button label="Cancel" severity="secondary" (onClick)="toggleProfileEdit()" />
                                    <p-button label="Save Changes" icon="pi pi-check" (onClick)="saveProfile()" [loading]="isSavingProfile" />
                                </div>
                            </div>
                        }
                    </p-tabpanel>

                    <!-- Membership -->
                    <p-tabpanel value="membership">
                        <div class="flex items-center gap-3 mb-4">
                            <h3 class="font-semibold text-surface-900 dark:text-surface-0 m-0">Membership Details</h3>
                            <p-tag [value]="membership.status"
                                [severity]="membership.status === 'Approved' ? 'success' : membership.status === 'Pending' ? 'warn' : membership.status === 'Rejected' ? 'danger' : 'info'" />
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                            <div><div class="text-xs text-muted-color mb-1">Full Name</div><div class="text-surface-900 dark:text-surface-0 font-medium">{{ membership.fullName }}</div></div>
                            <div><div class="text-xs text-muted-color mb-1">Email</div><div class="text-surface-900 dark:text-surface-0">{{ membership.email }}</div></div>
                            <div><div class="text-xs text-muted-color mb-1">Address</div><div class="text-surface-900 dark:text-surface-0">{{ membership.address }}</div></div>
                            <div><div class="text-xs text-muted-color mb-1">City</div><div class="text-surface-900 dark:text-surface-0">{{ membership.city }}</div></div>
                            <div><div class="text-xs text-muted-color mb-1">Phone</div><div class="text-surface-900 dark:text-surface-0">{{ membership.phone }}</div></div>
                            <div><div class="text-xs text-muted-color mb-1">School / Company</div><div class="text-surface-900 dark:text-surface-0">{{ membership.schoolOrCompany }}</div></div>
                            <div><div class="text-xs text-muted-color mb-1">Date of Birth</div><div class="text-surface-900 dark:text-surface-0">{{ membership.dateOfBirth }}</div></div>
                            <div><div class="text-xs text-muted-color mb-1">ID Card Number</div><div class="text-surface-900 dark:text-surface-0 font-mono">{{ membership.idCardNumber }}</div></div>
                        </div>
                        @if (membership.statement) {
                            <div class="mt-5 pt-5 border-t border-surface-200 dark:border-surface-700">
                                <div class="text-xs text-muted-color mb-2">Personal Statement</div>
                                <div class="text-surface-700 dark:text-surface-300 italic leading-relaxed">{{ membership.statement }}</div>
                            </div>
                        }
                        @if (membership.rejectionReason) {
                            <div class="mt-5 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                <div class="text-xs text-red-600 dark:text-red-400 mb-1">Rejection Reason</div>
                                <div class="text-red-700 dark:text-red-300">{{ membership.rejectionReason }}</div>
                            </div>
                        }
                    </p-tabpanel>

                    <!-- Security -->
                    <p-tabpanel value="security">
                        <div class="mb-8">
                            <h3 class="font-semibold text-surface-900 dark:text-surface-0 m-0 mb-1">Email Address</h3>
                            <p class="text-sm text-muted-color mb-4">Current: <span class="font-medium text-surface-900 dark:text-surface-0">{{ profile.email }}</span></p>
                            <div class="flex flex-col gap-4 max-w-md">
                                <div><label class="block text-sm font-medium text-surface-900 dark:text-surface-0 mb-1.5">New Email</label><input pInputText [(ngModel)]="emailData.newEmail" class="w-full" type="email" placeholder="you@example.com" /></div>
                                <div><label class="block text-sm font-medium text-surface-900 dark:text-surface-0 mb-1.5">Current Password</label><p-password [(ngModel)]="emailData.currentPassword" [feedback]="false" [toggleMask]="true" styleClass="w-full" inputStyleClass="w-full" /></div>
                                <div><p-button label="Update Email" icon="pi pi-envelope" (onClick)="changeEmail()" [loading]="isChangingEmail" /></div>
                            </div>
                        </div>
                        <p-divider />
                        <div class="mt-8 mb-8">
                            <h3 class="font-semibold text-surface-900 dark:text-surface-0 m-0 mb-1">Password</h3>
                            <p class="text-sm text-muted-color mb-4">Choose a strong password you don't use elsewhere.</p>
                            <div class="flex flex-col gap-4 max-w-md">
                                <div><label class="block text-sm font-medium text-surface-900 dark:text-surface-0 mb-1.5">Current Password</label><p-password [(ngModel)]="passwordData.currentPassword" [feedback]="false" [toggleMask]="true" styleClass="w-full" inputStyleClass="w-full" /></div>
                                <div><label class="block text-sm font-medium text-surface-900 dark:text-surface-0 mb-1.5">New Password</label><p-password [(ngModel)]="passwordData.newPassword" [toggleMask]="true" styleClass="w-full" inputStyleClass="w-full" /></div>
                                <div><label class="block text-sm font-medium text-surface-900 dark:text-surface-0 mb-1.5">Confirm New Password</label><p-password [(ngModel)]="passwordData.confirmNewPassword" [feedback]="false" [toggleMask]="true" styleClass="w-full" inputStyleClass="w-full" /></div>
                                <div><p-button label="Update Password" icon="pi pi-check" (onClick)="changePassword()" [loading]="isChangingPassword" /></div>
                            </div>
                        </div>

                        <p-divider />
                        <div class="mt-8 mb-8">
                            <h3 class="font-semibold text-surface-900 dark:text-surface-0 m-0 mb-1">Two-Factor Authentication</h3>
                            <p class="text-sm text-muted-color mb-4">Add an extra layer of security to your account.</p>

                            @if (mfaStatus === null) {
                                <p-button label="Check Status" icon="pi pi-refresh" (onClick)="loadMfaStatus()" [loading]="isMfaLoading" />
                            } @else if (!mfaStatus.twoFactorEnabled) {
                                @if (!mfaSetup) {
                                    <div class="flex flex-col gap-4 max-w-md">
                                        <div class="p-4 bg-surface-50 dark:bg-surface-800 rounded-xl">
                                            <p class="text-sm text-muted-color m-0">Status: <span class="text-red-500 font-medium">Disabled</span></p>
                                        </div>
                                        <p-button label="Set Up Two-Factor Authentication" icon="pi pi-shield" (onClick)="setupMfa()" [loading]="isMfaLoading" />
                                    </div>
                                } @else {
                                    <div class="flex flex-col gap-4 max-w-md">
                                        <p class="text-sm text-muted-color">Scan this QR code with your authenticator app (like Google Authenticator or Authy):</p>
                                        <div class="bg-white dark:bg-surface-800 p-4 rounded-xl flex justify-center">
                                            <img [src]="mfaQrCodeUrl" class="w-48 h-48" alt="QR Code" />
                                        </div>
                                        <p class="text-sm text-muted-color">Or enter this key manually: <code class="text-surface-900 dark:text-surface-0 font-mono text-xs break-all">{{ mfaSetupKey }}</code></p>
                                        <div>
                                            <label class="block text-sm font-medium text-surface-900 dark:text-surface-0 mb-1.5">Enter the 6-digit code from your authenticator app</label>
                                            <input pInputText [(ngModel)]="mfaVerifyCode" class="w-full text-center text-xl tracking-widest" maxlength="6" placeholder="000000" />
                                        </div>
                                        <div class="flex gap-2">
                                            <p-button label="Verify & Enable" icon="pi pi-check" (onClick)="verifyMfa()" [loading]="isMfaVerifying" />
                                            <p-button label="Cancel" severity="secondary" (onClick)="cancelMfaSetup()" />
                                        </div>
                                    </div>
                                }
                            } @else {
                                <div class="flex flex-col gap-4 max-w-md">
                                    <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                                        <p class="text-sm text-green-700 dark:text-green-300 m-0 font-medium">Enabled</p>
                                    </div>
                                    <div class="flex flex-wrap gap-2">
                                        <p-button label="Recovery Codes ({{ mfaRemainingCodes }} remaining)" icon="pi pi-eye" (onClick)="viewRecoveryCodes()" [loading]="isMfaLoading" severity="warn" />
                                        <p-button label="Generate New Codes" icon="pi pi-refresh" (onClick)="generateRecoveryCodes()" [loading]="isMfaGeneratingCodes" severity="help" />
                                        <p-button label="Disable 2FA" icon="pi pi-times" (onClick)="showDisableMfa = true" severity="danger" />
                                    </div>
                                    @if (showDisableMfa) {
                                        <div class="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl flex flex-col gap-3">
                                            <p class="text-sm text-red-700 dark:text-red-300 m-0 font-medium">Enter your password to disable two-factor authentication:</p>
                                            <p-password [(ngModel)]="mfaDisablePassword" [feedback]="false" [toggleMask]="true" styleClass="w-full" inputStyleClass="w-full" />
                                            <div class="flex gap-2">
                                                <p-button label="Confirm Disable" icon="pi pi-check" (onClick)="disableMfa()" [loading]="isMfaDisabling" severity="danger" />
                                                <p-button label="Cancel" severity="secondary" (onClick)="showDisableMfa = false; mfaDisablePassword = ''" />
                                            </div>
                                        </div>
                                    }
                                    @if (mfaRecoveryCodes.length > 0) {
                                        <div class="p-4 bg-surface-50 dark:bg-surface-800 rounded-xl">
                                            <p class="text-sm font-medium text-surface-900 dark:text-surface-0 mb-2">Recovery Codes</p>
                                            <p class="text-xs text-muted-color mb-3">Store these in a safe place. Each code can only be used once.</p>
                                            <div class="grid grid-cols-2 gap-2">
                                                @for (code of mfaRecoveryCodes; track code) {
                                                    <code class="font-mono text-sm bg-surface-100 dark:bg-surface-700 px-3 py-1.5 rounded text-surface-900 dark:text-surface-0">{{ code }}</code>
                                                }
                                            </div>
                                        </div>
                                    }
                                </div>
                            }
                        </div>

                        <p-divider />
                        <div class="mt-8">
                            <h3 class="font-semibold text-surface-900 dark:text-surface-0 m-0 mb-1">Passkeys</h3>
                            <p class="text-sm text-muted-color mb-4">Use passkeys to sign in quickly and securely without a password.</p>

                            <div class="flex flex-col gap-3 max-w-md">
                                @if (passkeys.length === 0) {
                                    <div class="p-4 bg-surface-50 dark:bg-surface-800 rounded-xl">
                                        <p class="text-sm text-muted-color m-0">No passkeys registered yet.</p>
                                    </div>
                                } @else {
                                    @for (passkey of passkeys; track passkey.id) {
                                        <div class="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-800 rounded-xl">
                                            <div>
                                                <div class="font-medium text-surface-900 dark:text-surface-0 text-sm">{{ passkey.name }}</div>
                                                <p class="text-xs text-muted-color m-0 mt-0.5">{{ passkey.deviceType }} &middot; Added {{ passkey.createdAt | date:'mediumDate' }}</p>
                                            </div>
                                            <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [text]="true" (onClick)="removePasskey(passkey.id)" [loading]="removingPasskeyId === passkey.id" />
                                        </div>
                                    }
                                }
                                <p-button label="Register Passkey" icon="pi pi-lock" (onClick)="registerPasskey()" [loading]="isRegisteringPasskey" [disabled]="!passkeySupported" />
                                @if (!passkeySupported) {
                                    <p class="text-xs text-muted-color">Passkeys are supported on modern browsers with secure contexts (HTTPS or localhost).</p>
                                }
                            </div>
                        </div>
                    </p-tabpanel>

                    <!-- Privacy -->
                    <p-tabpanel value="privacy">
                        <div class="flex flex-col gap-4">
                            <div class="flex items-center justify-between p-5 bg-surface-50 dark:bg-surface-800 rounded-xl">
                                <div>
                                    <div class="font-semibold text-surface-900 dark:text-surface-0 m-0">Export My Data</div>
                                    <p class="text-sm text-muted-color m-0 mt-1">Download all your personal data as a JSON file</p>
                                </div>
                                <p-button label="Export" icon="pi pi-download" [loading]="isExporting" (onClick)="exportData()" />
                            </div>
                            <div class="flex items-center justify-between p-5 bg-red-50 dark:bg-red-900/20 rounded-xl">
                                <div>
                                    <div class="font-semibold text-surface-900 dark:text-surface-0 m-0">Delete Account</div>
                                    <p class="text-sm text-muted-color m-0 mt-1">Permanently delete your account and all associated data</p>
                                </div>
                                <p-button label="Delete" icon="pi pi-trash" severity="danger" [loading]="isDeleting" (onClick)="confirmDelete()" />
                            </div>
                        </div>
                    </p-tabpanel>

                    <!-- Activity Log -->
                    <p-tabpanel value="activity">
                        <div class="flex items-center justify-between mb-1">
                            <span class="font-semibold text-xl">Activity Log</span>
                            <p-tag [value]="totalCount + ' entries'" severity="secondary" />
                        </div>
                        <p class="text-muted-color text-sm mt-0 mb-4">All actions you have performed across the platform.</p>
                        <p-divider />

                        <!-- Filters -->
                        <div class="flex flex-wrap items-end gap-4 mt-5 mb-4 p-4 bg-surface-50 dark:bg-surface-800 rounded-border border border-surface-200 dark:border-surface-700">
                            <div class="flex flex-col gap-1.5">
                                <label class="text-xs font-medium text-muted-color uppercase tracking-wide">Type</label>
                                <p-select [(ngModel)]="filterEntityType" [options]="entityTypeOptions" optionLabel="label" optionValue="value"
                                    placeholder="All types" [showClear]="true" (onChange)="onFilterChange()" class="w-40" />
                            </div>
                            <div class="flex flex-wrap gap-2">
                                <div class="flex flex-col gap-1.5">
                                    <label class="text-xs font-medium text-muted-color uppercase tracking-wide">From</label>
                                    <p-datepicker [(ngModel)]="filterDateFrom" placeholder="Start date" [showIcon]="true" dateFormat="M d, yy"
                                        appendTo="body" [showClear]="true" (ngModelChange)="onFilterChange()" />
                                </div>
                                <div class="flex flex-col gap-1.5">
                                    <label class="text-xs font-medium text-muted-color uppercase tracking-wide">To</label>
                                    <p-datepicker [(ngModel)]="filterDateTo" placeholder="End date" [showIcon]="true" dateFormat="M d, yy"
                                        appendTo="body" [showClear]="true" [minDate]="filterDateFrom ?? undefined" (ngModelChange)="onFilterChange()" />
                                </div>
                            </div>
                        </div>

                        @if (isLogsLoading) {
                            <div class="flex flex-col gap-3 mt-4">
                                @for (i of [1,2,3,4,5,6,7,8]; track i) {
                                    <div class="flex items-start gap-3">
                                        <p-skeleton shape="circle" size="2.5rem" />
                                        <div class="flex-1"><p-skeleton width="40%" height="1rem" styleClass="mb-2" /><p-skeleton width="70%" height="0.85rem" /></div>
                                        <p-skeleton width="6rem" height="0.85rem" />
                                    </div>
                                }
                            </div>
                        }

                        @if (!isLogsLoading && logs.length > 0) {
                            <ul class="list-none p-0 m-0 mt-2">
                                @for (log of logs; track log.id) {
                                    <li class="flex items-start gap-3 py-3 border-b border-surface">
                                        <div class="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                                             [ngClass]="entityBgClass(log.entityType)">
                                            <i class="pi text-sm" [ngClass]="actionIcon(log.action)"></i>
                                        </div>
                                        <div class="flex-1 min-w-0">
                                            <div class="flex items-center gap-2 flex-wrap">
                                                <p-tag [value]="log.entityType" [severity]="entitySeverity(log.entityType)" styleClass="text-xs" />
                                                <span class="font-medium text-sm text-surface-900 dark:text-surface-0">{{ log.action }}</span>
                                                @if (log.entityName) { <span class="text-muted-color text-sm truncate">— {{ log.entityName }}</span> }
                                            </div>
                                            @if (log.detail) {
                                                <div class="text-muted-color text-xs mt-1 truncate" [pTooltip]="log.detail" tooltipPosition="top">{{ log.detail }}</div>
                                            }
                                            <div class="flex items-center gap-2 mt-0.5">
                                                @if (log.ipAddress) {
                                                    <span class="text-muted-color text-xs flex items-center gap-1"><i class="pi pi-globe text-xs"></i>{{ log.ipAddress }}</span>
                                                }
                                                @if (log.userAgent) {
                                                    <span class="text-muted-color text-xs flex items-center gap-1 truncate max-w-40" [pTooltip]="log.userAgent" tooltipPosition="top">
                                                        <i class="pi pi-desktop text-xs shrink-0"></i><span class="truncate">{{ log.userAgent }}</span>
                                                    </span>
                                                }
                                            </div>
                                        </div>
                                        <span class="text-muted-color text-xs shrink-0 mt-0.5" [pTooltip]="formatDate(log.timestamp)" tooltipPosition="left">{{ timeAgo(log.timestamp) }}</span>
                                    </li>
                                }
                            </ul>

                            @if (totalPages > 1) {
                                <div class="flex items-center justify-between mt-4">
                                    <span class="text-muted-color text-sm">Page {{ currentPage }} of {{ totalPages }}</span>
                                    <div class="flex gap-2">
                                        <p-button icon="pi pi-chevron-left" [text]="true" size="small" [disabled]="currentPage === 1" (click)="loadPage(currentPage - 1)" />
                                        <p-button icon="pi pi-chevron-right" [text]="true" size="small" [disabled]="currentPage === totalPages" (click)="loadPage(currentPage + 1)" />
                                    </div>
                                </div>
                            }
                        }

                        @if (!isLogsLoading && logs.length === 0) {
                            <div class="flex flex-col items-center justify-center py-16 text-muted-color gap-3">
                                <i class="pi pi-history text-5xl opacity-30"></i>
                                <span class="text-sm">No activity recorded yet.</span>
                            </div>
                        }

                        @if (logsError) {
                            <div class="flex flex-col items-center justify-center py-16 text-muted-color gap-3">
                                <i class="pi pi-exclamation-circle text-4xl text-red-400"></i>
                                <span class="text-sm">Failed to load activity log.</span>
                            </div>
                        }
                    </p-tabpanel>
                </p-tabpanels>
            </p-tabs>
        }
    </div>
    `
})
export class UserSettings implements OnInit {
    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private logService = inject(LogService);
    private confirmationService = inject(ConfirmationService);
    private messageService = inject(MessageService);

    activeTab = 'profile';
    isLoading = true;

    // Profile
    profileEditMode = false;
    isSavingProfile = false;
    profile: ProfileData = { firstName: '', lastName: '', email: '', phone: '', location: '', role: '', memberSince: '', website: '', biography: '', skills: [] };
    editProfile = { firstName: '', lastName: '', phone: '', location: '', website: '', biography: '', skillsCsv: '' };

    // Membership
    membership: MembershipData = { fullName: '', email: '', address: '', city: '', phone: '', schoolOrCompany: '', dateOfBirth: '', idCardNumber: '', status: '', statement: '', rejectionReason: '' };

    // Security
    isChangingPassword = false;
    isChangingEmail = false;
    passwordData = { currentPassword: '', newPassword: '', confirmNewPassword: '' };
    emailData = { newEmail: '', currentPassword: '' };

    // MFA
    mfaStatus: any = null;
    isMfaLoading = false;
    mfaSetup: any = null;
    mfaSetupKey = '';
    mfaQrCodeUrl = '';
    mfaVerifyCode = '';
    isMfaVerifying = false;
    showDisableMfa = false;
    mfaDisablePassword = '';
    isMfaDisabling = false;
    mfaRecoveryCodes: string[] = [];
    mfaRemainingCodes = 0;
    isMfaGeneratingCodes = false;

    // Passkeys
    passkeys: any[] = [];
    isRegisteringPasskey = false;
    removingPasskeyId: string | null = null;
    passkeySupported = typeof navigator !== 'undefined' && typeof navigator.credentials !== 'undefined' && typeof PublicKeyCredential !== 'undefined';

    // Privacy
    isExporting = false;
    isDeleting = false;

    // Activity Log
    logs: LogEntry[] = [];
    isLogsLoading = true;
    logsError = false;
    totalCount = 0;
    totalPages = 1;
    currentPage = 1;
    readonly pageSize = 20;
    filterEntityType: string | null = null;
    filterDateFrom: Date | null = null;
    filterDateTo: Date | null = null;
    readonly entityTypeOptions = [
        { label: 'Project', value: 'Project' },
        { label: 'Inventory', value: 'Inventory' },
    ];

    ngOnInit() {
        const token = this.authService.getToken();
        if (token) {
            this.loadSettings();
            this.loadPage(1);
        } else {
            this.isLoading = false;
            this.isLogsLoading = false;
        }
    }

    // --- Profile ---
    getInitials(name: string): string { return getInitials(name); }

    toggleProfileEdit() {
        if (this.profileEditMode) { this.profileEditMode = false; return; }
        this.editProfile = {
            firstName: this.profile.firstName, lastName: this.profile.lastName,
            phone: this.profile.phone !== 'Not set' ? this.profile.phone : '',
            location: this.profile.location !== 'Not set' ? this.profile.location : '',
            website: this.profile.website !== 'Not set' ? this.profile.website : '',
            biography: this.profile.biography, skillsCsv: this.profile.skills.join(', ')
        };
        this.profileEditMode = true;
    }

    saveProfile() {
        this.isSavingProfile = true;
        const skills = this.editProfile.skillsCsv.split(',').map(s => s.trim()).filter(s => s.length > 0);
        this.http.patch(`${environment.apiUrl}/Auth/me`, {
            biography: this.editProfile.biography || null, phoneNumber: this.editProfile.phone || null,
            location: this.editProfile.location || null, websiteUrl: this.editProfile.website || null, skills
        }).subscribe({
            next: () => {
                this.profile = { ...this.profile, firstName: this.editProfile.firstName, lastName: this.editProfile.lastName, phone: this.editProfile.phone || 'Not set', location: this.editProfile.location || 'Not set', website: this.editProfile.website || 'Not set', biography: this.editProfile.biography, skills };
                this.isSavingProfile = false; this.profileEditMode = false;
                this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Profile updated.' });
            },
            error: () => { this.isSavingProfile = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update profile.' }); }
        });
    }

    // --- Security ---
    changeEmail() {
        if (!this.emailData.newEmail) { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Enter a new email.' }); return; }
        this.isChangingEmail = true;
        this.http.post(`${environment.apiUrl}/Auth/change-email`, {
            newEmail: this.emailData.newEmail, currentPassword: this.emailData.currentPassword
        }).subscribe({
            next: (res: any) => {
                this.isChangingEmail = false;
                this.profile = { ...this.profile, email: res.email || this.emailData.newEmail };
                this.emailData = { newEmail: '', currentPassword: '' };
                this.messageService.add({ severity: 'success', summary: 'Email Changed', detail: 'Your email has been updated.' });
            },
            error: (err) => { this.isChangingEmail = false; const msg = err.error?.message || err.error?.Errors?.[0] || 'Failed to change email.'; this.messageService.add({ severity: 'error', summary: 'Error', detail: msg }); }
        });
    }

    changePassword() {
        if (this.passwordData.newPassword !== this.passwordData.confirmNewPassword) { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Passwords do not match.' }); return; }
        this.isChangingPassword = true;
        this.http.post(`${environment.apiUrl}/Auth/change-password`, {
            currentPassword: this.passwordData.currentPassword, newPassword: this.passwordData.newPassword, confirmNewPassword: this.passwordData.confirmNewPassword
        }).subscribe({
            next: () => { this.isChangingPassword = false; this.passwordData = { currentPassword: '', newPassword: '', confirmNewPassword: '' }; this.messageService.add({ severity: 'success', summary: 'Password Changed', detail: 'Your password has been updated.' }); },
            error: (err) => { this.isChangingPassword = false; const msg = err.error?.message || err.error?.Errors?.[0] || 'Failed to change password.'; this.messageService.add({ severity: 'error', summary: 'Error', detail: msg }); }
        });
    }

    // --- MFA ---
    loadMfaStatus() {
        this.isMfaLoading = true;
        this.http.get(`${environment.apiUrl}/Mfa/status`).subscribe({
            next: (res: any) => {
                this.mfaStatus = res;
                this.mfaRemainingCodes = res.remainingRecoveryCodes;
                this.passkeys = res.passkeys || [];
                this.isMfaLoading = false;
            },
            error: () => { this.isMfaLoading = false; }
        });
    }

    setupMfa() {
        this.isMfaLoading = true;
        this.http.post(`${environment.apiUrl}/Mfa/setup`, {}).subscribe({
            next: (res: any) => {
                this.mfaSetupKey = res.sharedKey;
                this.mfaQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(res.authenticatorUri)}`;
                this.mfaSetup = res;
                this.isMfaLoading = false;
            },
            error: () => {
                this.isMfaLoading = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to set up 2FA.' });
            }
        });
    }

    verifyMfa() {
        if (!this.mfaVerifyCode || this.mfaVerifyCode.length < 6) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Enter a valid 6-digit code.' });
            return;
        }
        this.isMfaVerifying = true;
        this.http.post(`${environment.apiUrl}/Mfa/verify`, { code: this.mfaVerifyCode }).subscribe({
            next: (res: any) => {
                this.isMfaVerifying = false;
                this.mfaRecoveryCodes = res.recoveryCodes || [];
                this.mfaStatus = { ...this.mfaStatus, twoFactorEnabled: true };
                this.mfaSetup = null;
                this.mfaVerifyCode = '';
                this.messageService.add({ severity: 'success', summary: '2FA Enabled', detail: 'Two-factor authentication is now active.' });
            },
            error: (err) => {
                this.isMfaVerifying = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Invalid code. Try again.' });
            }
        });
    }

    cancelMfaSetup() {
        this.mfaSetup = null;
        this.mfaSetupKey = '';
        this.mfaQrCodeUrl = '';
        this.mfaVerifyCode = '';
    }

    disableMfa() {
        if (!this.mfaDisablePassword) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Enter your password.' });
            return;
        }
        this.isMfaDisabling = true;
        this.http.post(`${environment.apiUrl}/Mfa/disable`, { currentPassword: this.mfaDisablePassword }).subscribe({
            next: () => {
                this.isMfaDisabling = false;
                this.mfaStatus = { ...this.mfaStatus, twoFactorEnabled: false };
                this.showDisableMfa = false;
                this.mfaDisablePassword = '';
                this.mfaRecoveryCodes = [];
                this.messageService.add({ severity: 'success', summary: '2FA Disabled', detail: 'Two-factor authentication has been disabled.' });
            },
            error: (err) => {
                this.isMfaDisabling = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to disable 2FA.' });
            }
        });
    }

    viewRecoveryCodes() {
        this.isMfaLoading = true;
        this.http.get(`${environment.apiUrl}/Mfa/recovery-codes`).subscribe({
            next: (res: any) => {
                this.mfaRemainingCodes = res.remainingCount;
                this.isMfaLoading = false;
            },
            error: () => { this.isMfaLoading = false; }
        });
    }

    generateRecoveryCodes() {
        this.isMfaGeneratingCodes = true;
        this.http.post(`${environment.apiUrl}/Mfa/recovery-codes`, {}).subscribe({
            next: (res: any) => {
                this.mfaRecoveryCodes = res.recoveryCodes || [];
                this.mfaRemainingCodes = res.remainingCount;
                this.isMfaGeneratingCodes = false;
                this.messageService.add({ severity: 'success', summary: 'Codes Generated', detail: 'New recovery codes have been generated.' });
            },
            error: () => {
                this.isMfaGeneratingCodes = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to generate recovery codes.' });
            }
        });
    }

    // --- Passkeys ---
    async registerPasskey() {
        if (!this.passkeySupported) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Passkeys are not supported in this browser.' });
            return;
        }

        this.isRegisteringPasskey = true;

        this.http.post(`${environment.apiUrl}/Mfa/passkeys/register-start`, {}).subscribe({
            next: async (options: any) => {
                try {
                    const publicKey: PublicKeyCredentialCreationOptions = {
                        challenge: Uint8Array.from(atob(options.challenge), c => c.charCodeAt(0)),
                        rp: { id: options.rpId, name: options.rpName },
                        user: {
                            id: Uint8Array.from(atob(options.userId), c => c.charCodeAt(0)),
                            name: options.userName,
                            displayName: options.userDisplayName
                        },
                        pubKeyCredParams: JSON.parse(options.pubKeyCredParams),
                        timeout: parseInt(options.timeout),
                        attestation: options.attestation as AttestationConveyancePreference,
                        excludeCredentials: options.excludeCredentials.map((id: string) => ({
                            id: Uint8Array.from(atob(id), c => c.charCodeAt(0)),
                            type: 'public-key' as const
                        }))
                    };

                    const credential = await navigator.credentials.create({ publicKey }) as any;

                    const credentialJson = JSON.stringify({
                        id: credential.id,
                        rawId: Array.from(new Uint8Array(credential.rawId)),
                        type: credential.type,
                        response: {
                            clientDataJSON: Array.from(new Uint8Array(credential.response.clientDataJSON)),
                            attestationObject: Array.from(new Uint8Array(credential.response.attestationObject))
                        }
                    });

                    const deviceType = credential.response?.authenticatorData?.[0] === 0 ? 'platform' : 'cross-platform';
                    const name = `Passkey (${new Date().toLocaleDateString()})`;

                    this.http.post(`${environment.apiUrl}/Mfa/passkeys/register-complete`, {
                        credentialJson,
                        name,
                        deviceType
                    }).subscribe({
                        next: () => {
                            this.isRegisteringPasskey = false;
                            this.messageService.add({ severity: 'success', summary: 'Passkey Added', detail: 'Your passkey has been registered.' });
                            this.loadMfaStatus();
                        },
                        error: (err) => {
                            this.isRegisteringPasskey = false;
                            this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to register passkey.' });
                        }
                    });
                } catch (err: any) {
                    this.isRegisteringPasskey = false;
                    if (err.name !== 'AbortError' && err.name !== 'NotAllowedError') {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Passkey registration was cancelled or failed.' });
                    }
                }
            },
            error: () => {
                this.isRegisteringPasskey = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to start passkey registration.' });
            }
        });
    }

    removePasskey(id: string) {
        this.removingPasskeyId = id;
        this.http.delete(`${environment.apiUrl}/Mfa/passkeys/${id}`).subscribe({
            next: () => {
                this.passkeys = this.passkeys.filter(p => p.id !== id);
                this.removingPasskeyId = null;
                this.messageService.add({ severity: 'success', summary: 'Removed', detail: 'Passkey has been removed.' });
            },
            error: () => {
                this.removingPasskeyId = null;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to remove passkey.' });
            }
        });
    }

    // --- Privacy ---
    exportData() {
        this.isExporting = true;
        this.http.get(`${environment.apiUrl}/Auth/me/export`, { responseType: 'blob' }).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url;
                a.download = `flossk-export-${this.profile.email}-${new Date().toISOString().split('T')[0]}.json`;
                a.click(); window.URL.revokeObjectURL(url);
                this.isExporting = false;
                this.messageService.add({ severity: 'success', summary: 'Exported', detail: 'Your data has been downloaded.' });
            },
            error: () => { this.isExporting = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to export data.' }); }
        });
    }

    confirmDelete() {
        this.confirmationService.confirm({
            message: 'Are you sure you want to permanently delete your account? This action cannot be undone.',
            header: 'Delete Account', icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
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
            error: () => { this.isDeleting = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete account.' }); }
        });
    }

    // --- Load Settings ---
    loadSettings() {
        this.http.get<any>(`${environment.apiUrl}/Auth/me/settings`).subscribe({
            next: (data) => {
                this.profile = {
                    firstName: data.user.firstName ?? '', lastName: data.user.lastName ?? '',
                    email: data.user.email ?? '', phone: data.user.phoneNumber || 'Not set',
                    location: data.user.location || 'Not set', role: data.user.roles?.[0] ?? 'User',
                    memberSince: data.user.createdAt ? new Date(data.user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—',
                    website: data.user.websiteUrl || 'Not set', biography: data.user.biography || '', skills: data.user.skills ?? [],
                };
                if (data.membershipRequest) {
                    this.membership = {
                        fullName: data.membershipRequest.fullName, email: data.membershipRequest.email,
                        address: data.membershipRequest.address, city: data.membershipRequest.city,
                        phone: data.membershipRequest.phoneNumber, schoolOrCompany: data.membershipRequest.schoolOrCompany,
                        dateOfBirth: data.membershipRequest.dateOfBirth ? new Date(data.membershipRequest.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—',
                        idCardNumber: data.membershipRequest.idCardNumber, status: data.membershipRequest.status,
                        statement: data.membershipRequest.statement || '', rejectionReason: data.membershipRequest.rejectionReason || '',
                    };
                }
                this.isLoading = false;
            },
            error: () => { this.isLoading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load settings.' }); }
        });
        this.loadMfaStatus();
    }

    // --- Activity Log ---
    loadPage(page: number) {
        const userId = this.authService.currentUser()?.id;
        if (!userId) return;
        this.isLogsLoading = true; this.logsError = false;
        this.logService.getLogs({
            userId, page, pageSize: this.pageSize,
            entityType: this.filterEntityType ?? undefined,
            dateFrom: this.filterDateFrom ? this.toLocalDateString(this.filterDateFrom) : undefined,
            dateTo: this.filterDateTo ? this.toLocalDateString(this.filterDateTo) : undefined,
        }).subscribe({
            next: (res) => {
                this.logs = res.data; this.totalCount = res.totalCount;
                this.totalPages = res.totalPages; this.currentPage = res.page;
                this.isLogsLoading = false;
            },
            error: () => { this.logsError = true; this.isLogsLoading = false; }
        });
    }

    onFilterChange() { this.loadPage(1); }
    private toLocalDateString(d: Date): string {
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }

    actionIcon(action: string): string {
        for (const key of Object.keys(ACTION_ICON)) { if (action.startsWith(key)) return ACTION_ICON[key]; }
        return 'pi-circle';
    }
    entitySeverity(entityType: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        return ENTITY_SEVERITY[entityType] ?? 'secondary';
    }
    entityBgClass(entityType: string): string {
        const map: Record<string, string> = {
            'Project': 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300',
            'Inventory': 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300',
        };
        return map[entityType] ?? 'bg-surface-100 dark:bg-surface-700 text-muted-color';
    }
    timeAgo(timestamp: string): string {
        const diff = Date.now() - new Date(timestamp).getTime();
        const mins = Math.floor(diff / 60000), hours = Math.floor(diff / 3600000), days = Math.floor(diff / 86400000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 30) return `${days}d ago`;
        return new Date(timestamp).toLocaleDateString();
    }
    formatDate(timestamp: string): string { return new Date(timestamp).toLocaleString(); }
}
