import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DividerModule } from 'primeng/divider';
import { AvatarModule } from 'primeng/avatar';
import { MessageService } from 'primeng/api';
import { environment } from '@environments/environment.prod';

interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePictureUrl: string;
    rfidCardId?: string;
}

interface AuthenticationResult {
    success: boolean;
    user?: User;
    message: string;
    timestamp: Date;
}

@Component({
    selector: 'app-rfid-configurer',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CardModule,
        ButtonModule,
        InputTextModule,
        SelectModule,
        TagModule,
        ToastModule,
        ProgressSpinnerModule,
        DividerModule,
        AvatarModule
    ],
    providers: [],
    template: `
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Enrollment Section -->
            <div class="card">
                <div class="flex items-center gap-3 mb-6">
                    <i class="pi pi-id-card text-primary" style="font-size: 1.5rem; line-height: 1;"></i>
                    <div class="flex flex-col">
                        <span class="font-semibold text-xl">Card Enrollment</span>
                        <span class="text-muted-color text-sm">Assign RFID cards to users</span>
                    </div>
                </div>

                <!-- Step 1: Select User -->
                <div class="mb-6">
                    <label class="block font-medium mb-2">Step 1: Select User</label>
                    <p-select 
                        [options]="users()" 
                        [(ngModel)]="selectedUser"
                        optionLabel="displayName"
                        placeholder="Select a user to assign card"
                        [filter]="true"
                        filterBy="displayName,email"
                        [style]="{ width: '100%' }"
                        [disabled]="enrollmentMode()">
                        <ng-template pTemplate="selectedItem" let-user>
                            <div class="flex items-center gap-2" *ngIf="user">
                                <p-avatar [image]="getProfilePictureUrl(user.profilePictureUrl)" shape="circle" size="normal"></p-avatar>
                                <div>
                                    <div>{{ user.firstName }} {{ user.lastName }}</div>
                                    <div class="text-muted-color text-sm">{{ user.email }}</div>
                                </div>
                            </div>
                        </ng-template>
                        <ng-template pTemplate="item" let-user>
                            <div class="flex items-center gap-2">
                                <p-avatar [image]="getProfilePictureUrl(user.profilePictureUrl)" shape="circle" size="normal"></p-avatar>
                                <div>
                                    <div>{{ user.firstName }} {{ user.lastName }}</div>
                                    <div class="text-muted-color text-sm">{{ user.email }}</div>
                                </div>
                            </div>
                        </ng-template>
                    </p-select>
                </div>

                <!-- Selected User Info -->
                @if (selectedUser) {
                    <div class="bg-surface-100 dark:bg-surface-800 rounded-lg p-4 mb-6">
                        <div class="flex items-center gap-4">
                            <p-avatar [image]="getProfilePictureUrl(selectedUser.profilePictureUrl)" shape="circle" size="xlarge"></p-avatar>
                            <div class="flex-1">
                                <div class="font-semibold text-lg">{{ selectedUser.firstName }} {{ selectedUser.lastName }}</div>
                                <div class="text-muted-color">{{ selectedUser.email }}</div>
                                <div class="mt-2">
                                    @if (selectedUser.rfidCardId) {
                                        <p-tag severity="success" value="Card Assigned" icon="pi pi-check"></p-tag>
                                        <span class="ml-2 text-sm font-mono">{{ formatUid(selectedUser.rfidCardId) }}</span>
                                    } @else {
                                        <p-tag severity="warn" value="No Card Assigned" icon="pi pi-exclamation-triangle"></p-tag>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                }

                <!-- Step 2: Enrollment Mode -->
                <div class="mb-6">
                    <label class="block font-medium mb-2">Step 2: Start Enrollment</label>
                    @if (!enrollmentMode()) {
                        <p-button 
                            label="Activate Card Reader" 
                            icon="pi pi-power-off"
                            (onClick)="startEnrollmentMode()"
                            [disabled]="!selectedUser"
                            styleClass="w-full">
                        </p-button>
                    } @else {
                        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center">
                            <p-progressSpinner 
                                styleClass="w-12 h-12" 
                                strokeWidth="4" 
                                animationDuration="1s">
                            </p-progressSpinner>
                            <p class="text-blue-700 dark:text-blue-300 font-medium mt-3 mb-2">
                                <i class="pi pi-wifi mr-2"></i>Waiting for card tap...
                            </p>
                            <p class="text-blue-600 dark:text-blue-400 text-sm mb-4">
                                Place the RFID card on the reader to assign it to {{ selectedUser?.firstName }} {{ selectedUser?.lastName }}
                            </p>
                            <p-button 
                                label="Cancel" 
                                icon="pi pi-times" 
                                severity="secondary"
                                (onClick)="cancelEnrollmentMode()">
                            </p-button>
                        </div>
                    }
                </div>

                <!-- Manual UID Entry (for testing) -->
                @if (enrollmentMode()) {
                    <p-divider align="center">
                        <span class="text-muted-color text-sm">or enter manually</span>
                    </p-divider>
                    <div class="flex gap-2">
                        <input 
                            type="text" 
                            pInputText 
                            [(ngModel)]="manualUid"
                            placeholder="Enter UID (e.g., 04:A3:2B:1C:9D:8E:7F)"
                            class="flex-1"
                            (keyup.enter)="enrollCardManually()">
                        <p-button 
                            icon="pi pi-check" 
                            (onClick)="enrollCardManually()"
                            [disabled]="!manualUid">
                        </p-button>
                    </div>
                }
            </div>

            <!-- Authentication Section -->
            <div class="card">
                <div class="flex items-center gap-3 mb-6">
                    <i class="pi pi-shield text-primary" style="font-size: 1.5rem; line-height: 1;"></i>
                    <div class="flex flex-col">
                        <span class="font-semibold text-xl">Card Authentication</span>
                        <span class="text-muted-color text-sm">Test card access verification</span>
                    </div>
                </div>

                <!-- Authentication Mode -->
                <div class="mb-6">
                    @if (!authenticationMode()) {
                        <p-button 
                            label="Start Authentication Mode" 
                            icon="pi pi-sign-in"
                            (onClick)="startAuthenticationMode()"
                            styleClass="w-full"
                            severity="success">
                        </p-button>
                    } @else {
                        <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
                            <p-progressSpinner 
                                styleClass="w-12 h-12" 
                                strokeWidth="4" 
                                animationDuration="1s">
                            </p-progressSpinner>
                            <p class="text-green-700 dark:text-green-300 font-medium mt-3 mb-2">
                                <i class="pi pi-wifi mr-2"></i>Reader Active
                            </p>
                            <p class="text-green-600 dark:text-green-400 text-sm mb-4">
                                Tap any card to verify access
                            </p>
                            <p-button 
                                label="Stop" 
                                icon="pi pi-times" 
                                severity="secondary"
                                (onClick)="stopAuthenticationMode()">
                            </p-button>
                        </div>
                    }
                </div>

                <!-- Manual UID Test (for testing) -->
                @if (authenticationMode()) {
                    <p-divider align="center">
                        <span class="text-muted-color text-sm">or test manually</span>
                    </p-divider>
                    <div class="flex gap-2 mb-6">
                        <input 
                            type="text" 
                            pInputText 
                            [(ngModel)]="testUid"
                            placeholder="Enter UID to test"
                            class="flex-1"
                            (keyup.enter)="authenticateCard()">
                        <p-button 
                            icon="pi pi-search" 
                            (onClick)="authenticateCard()"
                            [disabled]="!testUid"
                            severity="success">
                        </p-button>
                    </div>
                }

                <!-- Authentication Result -->
                @if (lastAuthResult()) {
                    <div class="rounded-lg p-4" 
                         [ngClass]="{
                            'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800': lastAuthResult()!.success,
                            'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800': !lastAuthResult()!.success
                         }">
                        <div class="flex items-center gap-3 mb-3">
                            <i class="text-2xl" 
                               [ngClass]="{
                                  'pi pi-check-circle text-green-600': lastAuthResult()!.success,
                                  'pi pi-times-circle text-red-600': !lastAuthResult()!.success
                               }"></i>
                            <span class="font-semibold text-lg">
                                {{ lastAuthResult()!.success ? 'ACCESS GRANTED' : 'ACCESS DENIED' }}
                            </span>
                        </div>
                        @if (lastAuthResult()!.success && lastAuthResult()!.user) {
                            <div class="flex items-center gap-3 bg-surface-0 dark:bg-surface-900 rounded-lg p-3">
                                <p-avatar [image]="getProfilePictureUrl(lastAuthResult()!.user!.profilePictureUrl)" shape="circle" size="large"></p-avatar>
                                <div>
                                    <div class="font-medium">{{ lastAuthResult()!.user!.firstName }} {{ lastAuthResult()!.user!.lastName }}</div>
                                    <div class="text-muted-color text-sm">{{ lastAuthResult()!.user!.email }}</div>
                                </div>
                            </div>
                        } @else {
                            <p class="text-red-600 dark:text-red-400 m-0">{{ lastAuthResult()!.message }}</p>
                        }
                        <p class="text-muted-color text-xs mt-3 mb-0">
                            {{ lastAuthResult()!.timestamp | date:'medium' }}
                        </p>
                    </div>
                }

                <!-- Recent Access Log -->
                @if (accessLog().length > 0) {
                    <div class="mt-6">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="font-medium m-0">Recent Access Log</h3>
                            <p-button 
                                label="Clear" 
                                icon="pi pi-trash" 
                                [text]="true" 
                                size="small"
                                (onClick)="clearAccessLog()">
                            </p-button>
                        </div>
                        <div class="flex flex-col gap-2 max-h-64 overflow-y-auto">
                            @for (log of accessLog(); track log.timestamp) {
                                <div class="flex items-center gap-3 p-2 rounded-lg bg-surface-100 dark:bg-surface-800">
                                    <i class="pi" 
                                       [ngClass]="{
                                          'pi-check-circle text-green-600': log.success,
                                          'pi-times-circle text-red-600': !log.success
                                       }"></i>
                                    <div class="flex-1">
                                        @if (log.user) {
                                            <span class="font-medium">{{ log.user.firstName }} {{ log.user.lastName }}</span>
                                        } @else {
                                            <span class="text-red-600">Unknown Card</span>
                                        }
                                    </div>
                                    <span class="text-muted-color text-xs">{{ log.timestamp | date:'shortTime' }}</span>
                                </div>
                            }
                        </div>
                    </div>
                }
            </div>
        </div>

        <!-- Instructions Card -->
        <div class="card mt-6">
            <h4 class="font-semibold text-lg mb-4">
                <i style="font-size: 1.5rem;" class="pi pi-info-circle mr-2 text-primary"></i>How RFID Card System Works
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h4 class="font-medium mb-2 text-primary">Card Enrollment</h4>
                    <ol class="list-decimal list-inside space-y-2 text-muted-color">
                        <li>Select the user you want to assign a card to</li>
                        <li>Click "Activate Card Reader" to enter enrollment mode</li>
                        <li>Have the user tap their RFID card on the reader</li>
                        <li>The card's unique ID (UID) is automatically captured and saved</li>
                        <li>The card is now linked to that user's account</li>
                    </ol>
                </div>
                <div>
                    <h4 class="font-medium mb-2 text-primary">Card Authentication</h4>
                    <ol class="list-decimal list-inside space-y-2 text-muted-color">
                        <li>User taps their card on the reader at a door/terminal</li>
                        <li>Reader sends the card UID to the backend</li>
                        <li>Backend looks up which user has this UID</li>
                        <li>If found → access granted; if not → access denied</li>
                        <li>Access event is logged for security tracking</li>
                    </ol>
                </div>
            </div>
            <div class="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p class="text-yellow-700 dark:text-yellow-300 text-sm m-0">
                    <i class="pi pi-exclamation-triangle mr-2"></i>
                    <strong>Note:</strong> Each RFID card has a unique factory-burned identifier (4-10 byte hex string) that cannot be changed. 
                    Example: <span class="font-mono">04:A3:2B:1C:9D:8E:7F</span>
                </p>
            </div>
        </div>
    `
})
export class RfidConfigurer implements OnInit, OnDestroy {
    private http = inject(HttpClient);
    private messageService = inject(MessageService);

    users = signal<(User & { displayName: string })[]>([]);
    selectedUser: (User & { displayName: string }) | null = null;
    
    enrollmentMode = signal(false);
    authenticationMode = signal(false);
    
    manualUid: string = '';
    testUid: string = '';
    
    lastAuthResult = signal<AuthenticationResult | null>(null);
    accessLog = signal<AuthenticationResult[]>([]);

    private pollingInterval: any = null;

    ngOnInit() {
        this.loadUsers();
    }

    ngOnDestroy() {
        this.stopPolling();
    }

    loadUsers() {
        this.http.get<any>(`${environment.apiUrl}/Auth/users?page=1&pageSize=100`).subscribe({
            next: (response) => {
                this.users.set(response.users.map((u: User) => ({
                    ...u,
                    displayName: `${u.firstName} ${u.lastName}`
                })));
            },
            error: (err) => {
                console.error('Error loading users:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load users'
                });
            }
        });
    }

    getProfilePictureUrl(profilePictureUrl: string | null): string {
        if (!profilePictureUrl) {
            return 'assets/images/avatar.jpg';
        }
        if (profilePictureUrl.startsWith('http')) {
            return profilePictureUrl;
        }
        return `${environment.baseUrl}${profilePictureUrl}`;
    }

    formatUid(uid: string): string {
        // Format UID with colons every 2 characters
        if (!uid) return '';
        const clean = uid.replace(/[^a-fA-F0-9]/g, '');
        return clean.match(/.{1,2}/g)?.join(':').toUpperCase() || uid;
    }

    normalizeUid(uid: string): string {
        // Remove colons/dashes and convert to uppercase
        return uid.replace(/[:\-\s]/g, '').toUpperCase();
    }

    // ==================== ENROLLMENT ====================

    startEnrollmentMode() {
        if (!this.selectedUser) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Warning',
                detail: 'Please select a user first'
            });
            return;
        }
        this.enrollmentMode.set(true);
        this.startPollingForCard('enrollment');
        this.messageService.add({
            severity: 'info',
            summary: 'Enrollment Mode Active',
            detail: `Waiting for card tap to assign to ${this.selectedUser.firstName} ${this.selectedUser.lastName}`
        });
    }

    cancelEnrollmentMode() {
        this.enrollmentMode.set(false);
        this.stopPolling();
        this.manualUid = '';
    }

    enrollCardManually() {
        if (!this.manualUid || !this.selectedUser) return;
        this.enrollCard(this.normalizeUid(this.manualUid));
    }

    enrollCard(uid: string) {
        if (!this.selectedUser) return;

        const normalizedUid = this.normalizeUid(uid);
        
        this.http.post(`${environment.apiUrl}/Rfid/enroll`, {
            userId: this.selectedUser.id,
            rfidCardId: normalizedUid
        }).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Card Enrolled',
                    detail: `Card ${this.formatUid(normalizedUid)} assigned to ${this.selectedUser!.firstName} ${this.selectedUser!.lastName}`
                });
                
                // Update local user data
                if (this.selectedUser) {
                    this.selectedUser.rfidCardId = normalizedUid;
                }
                
                // Refresh users list
                this.loadUsers();
                
                // Exit enrollment mode
                this.enrollmentMode.set(false);
                this.stopPolling();
                this.manualUid = '';
            },
            error: (err) => {
                console.error('Error enrolling card:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Enrollment Failed',
                    detail: err.error?.message || 'Failed to enroll card'
                });
            }
        });
    }

    // ==================== AUTHENTICATION ====================

    startAuthenticationMode() {
        this.authenticationMode.set(true);
        this.startPollingForCard('authentication');
        this.messageService.add({
            severity: 'info',
            summary: 'Authentication Mode Active',
            detail: 'Ready to scan cards'
        });
    }

    stopAuthenticationMode() {
        this.authenticationMode.set(false);
        this.stopPolling();
        this.testUid = '';
    }

    authenticateCard() {
        if (!this.testUid) return;
        this.verifyCard(this.normalizeUid(this.testUid));
        this.testUid = '';
    }

    verifyCard(uid: string) {
        const normalizedUid = this.normalizeUid(uid);

        this.http.post<any>(`${environment.apiUrl}/Rfid/authenticate`, {
            rfidCardId: normalizedUid
        }).subscribe({
            next: (response) => {
                const result: AuthenticationResult = {
                    success: true,
                    user: response.user,
                    message: 'Access granted',
                    timestamp: new Date()
                };
                this.lastAuthResult.set(result);
                this.accessLog.update(log => [result, ...log].slice(0, 50));
                
                this.messageService.add({
                    severity: 'success',
                    summary: 'Access Granted',
                    detail: `Welcome, ${response.user.firstName} ${response.user.lastName}`
                });
            },
            error: (err) => {
                const result: AuthenticationResult = {
                    success: false,
                    message: err.error?.message || 'Card not recognized',
                    timestamp: new Date()
                };
                this.lastAuthResult.set(result);
                this.accessLog.update(log => [result, ...log].slice(0, 50));
                
                this.messageService.add({
                    severity: 'error',
                    summary: 'Access Denied',
                    detail: 'Card not recognized'
                });
            }
        });
    }

    clearAccessLog() {
        this.accessLog.set([]);
        this.lastAuthResult.set(null);
    }

    // ==================== POLLING (Simulates reader communication) ====================

    private startPollingForCard(mode: 'enrollment' | 'authentication') {
        // In a real implementation, this would connect to a WebSocket or 
        // poll an endpoint that communicates with the physical RFID reader.
        // For now, this is a placeholder for the reader integration.
        
        this.pollingInterval = setInterval(() => {
            this.http.get<any>(`${environment.apiUrl}/Rfid/pending-scan`).subscribe({
                next: (response) => {
                    if (response && response.uid) {
                        if (mode === 'enrollment') {
                            this.enrollCard(response.uid);
                        } else {
                            this.verifyCard(response.uid);
                        }
                    }
                },
                error: () => {
                    // Silently fail - reader might not be connected
                }
            });
        }, 1000);
    }

    private stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }
}