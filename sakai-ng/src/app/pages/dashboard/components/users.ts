import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CheckboxModule } from 'primeng/checkbox';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService } from 'primeng/api';
import { environment } from '@environments/environment.prod';
import { AuthService, getInitials, isDefaultAvatar } from '@/pages/service/auth.service';
import { PresenceService } from '@/pages/service/presence.service';
import { UserStatusIndicator } from './user-status-indicator';

interface User {
    id: string;
    firstName: string; 
    lastName: string;
    email: string;
    profilePictureUrl: string;
    roles: string[];
    rfid: boolean;
}

@Component({
    selector: 'app-users',
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, AvatarModule, ConfirmDialogModule, CheckboxModule, SkeletonModule, TagModule, TooltipModule, UserStatusIndicator],
    providers: [ConfirmationService],
    template: `
    <p-confirmdialog></p-confirmdialog>
    
    <div class="card">
        <div class="font-semibold text-xl mb-4">All Users</div>
        
        @if (loading) {
            <div class="flex flex-col gap-4">
                @for (i of [1,2,3,4,5]; track i) {
                    <div class="flex items-center gap-4">
                        <p-skeleton shape="circle" size="3rem"></p-skeleton>
                        <p-skeleton width="10rem" height="1rem"></p-skeleton>
                        <p-skeleton width="15rem" height="1rem"></p-skeleton>
                        <p-skeleton width="6rem" height="1rem"></p-skeleton>
                    </div>
                }
            </div>
        } @else {
            <p-table [value]="users" [tableStyle]="{ 'min-width': '50rem' }" [paginator]="true" [rows]="10" [showCurrentPageReport]="true" currentPageReportTemplate="Showing {first} to {last} of {totalRecords} users">
                <ng-template #header>
                    <tr>
                        <th>Avatar</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Last Active</th>
                        <th>RFID</th>
                        @if (isAdmin()) {
                            <th></th>
                        }
                    </tr>
                </ng-template>
                <ng-template #body let-user>
                    <tr class="cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors" (click)="viewUserProfile(user)">
                        <td>
                            <div class="relative inline-block">
                                <p-avatar 
                                    *ngIf="hasProfilePicture(user.profilePictureUrl)"
                                    [image]="getProfilePictureUrl(user.profilePictureUrl)" 
                                    shape="circle">
                                </p-avatar>
                                <p-avatar
                                    *ngIf="!hasProfilePicture(user.profilePictureUrl)"
                                    [label]="getUserInitials(user)"
                                    shape="circle"
                                    [style]="{'background-color': 'var(--primary-color)', 'color': 'var(--primary-color-text)'}">
                                </p-avatar>
                                <user-status-indicator
                                    [userId]="user.id"
                                    size="sm"
                                    class="absolute -bottom-0.5 -right-0.5"
                                />
                            </div>
                        </td>
                        <td>{{ user.firstName }} {{ user.lastName }}</td>
                        <td>{{ user.email }}</td>
                        <td>{{ user.roles[0] || 'User' }}</td>
                        <td>
                            @if (getPresenceStatus(user.id) === 'Online') {
                                <span class="text-green-500 font-medium">Online</span>
                            } @else if (getPresenceStatus(user.id) === 'Idle') {
                                <span class="text-yellow-500 font-medium">Idle</span>
                            } @else {
                                <span class="text-muted-color">{{ getLastActiveText(user.id) }}</span>
                            }
                        </td>
                        <td>
                            @if (isAdmin()) {
                                <div class="flex align-items-center gap-3">
                                    <div class="flex align-items-center gap-2">
                                        <p-checkbox 
                                            [(ngModel)]="user.rfid" 
                                            [binary]="true" 
                                            inputId="yes-{{user.id}}"
                                            [trueValue]="true"
                                            [falseValue]="false"
                                            (click)="$event.stopPropagation()"
                                            (onChange)="onRfidChange(user)"
                                        />
                                        <label [for]=\"'yes-' + user.id\">Yes</label>
                                    </div>
                                    <div class="flex align-items-center gap-2">
                                        <p-checkbox 
                                            [(ngModel)]="user.rfid" 
                                            [binary]="true" 
                                            inputId="no-{{user.id}}"
                                            [trueValue]="false"
                                            [falseValue]="true"
                                            (click)="$event.stopPropagation()"
                                            (onChange)="onRfidChange(user)"
                                        />
                                        <label [for]="'no-' + user.id">No</label>
                                    </div>
                                </div>
                            } @else {
                                <p-tag [value]="user.rfid ? 'Yes' : 'No'" [severity]="user.rfid ? 'success' : 'danger'"></p-tag>
                            }
                        </td>
                        @if (isAdmin()) {
                            <td (click)="$event.stopPropagation()" class="flex gap-1 items-center">
                                @if (!user.roles.includes('Admin') && !user.roles.includes('Full Member')) {
                                    <p-button
                                        icon="pi pi-arrow-up"
                                        [text]="true"
                                        severity="success"
                                        pTooltip="Promote to Full Member"
                                        tooltipPosition="top"
                                        (onClick)="confirmPromote(user)">
                                    </p-button>
                                }
                                @if (user.roles.includes('Full Member')) {
                                    <p-button
                                        icon="pi pi-arrow-down"
                                        [text]="true"
                                        severity="warn"
                                        pTooltip="Demote to User"
                                        tooltipPosition="top"
                                        (onClick)="confirmDemote(user)">
                                    </p-button>
                                }
                                <p-button icon="pi pi-trash" [text]="true" severity="danger" (onClick)="confirmDelete(user)"></p-button>
                            </td>
                        }
                    </tr>
                </ng-template>
            </p-table>
        }
    </div>
    `
})
export class Users implements OnInit {
    private http = inject(HttpClient);
    private router = inject(Router);
    private authService = inject(AuthService);
    private presenceService = inject(PresenceService);
    
    users: User[] = [];
    loading = true;

    isAdmin = computed(() => {
        const user = this.authService.currentUser();
        return user?.roles?.includes('Admin') || user?.role === 'Admin';
    });

    constructor(private confirmationService: ConfirmationService) {}

    viewUserProfile(user: User) {
        this.router.navigate(['/dashboard/profile', user.id]);
    }

    ngOnInit() {
        this.loadUsers();
    }

    loadUsers() {
        this.loading = true;
        this.http.get<any>(`${environment.apiUrl}/Auth/users?page=1&pageSize=10`).subscribe({
            next: (response) => {
                console.log('Users response:', response);
                this.users = response.users;
                this.loading = false;
                // Fetch presence statuses for all loaded users
                const userIds = this.users.map(u => u.id);
                if (userIds.length > 0) {
                    this.presenceService.fetchStatuses(userIds);
                }
            },
            error: (err) => {
                console.error('Error loading users:', err);
                this.loading = false;
            }
        });
    }

    confirmPromote(user: User) {
        this.confirmationService.confirm({
            message: `Promote ${user.firstName} ${user.lastName} to Full Member?`,
            header: 'Promote to Full Member',
            icon: 'pi pi-arrow-up',
            acceptButtonStyleClass: 'p-button-success',
            accept: () => this.promoteToFullMember(user)
        });
    }

    promoteToFullMember(user: User) {
        this.http.post(`${environment.apiUrl}/Auth/users/${user.id}/promote-full-member`, {}).subscribe({
            next: () => {
                user.roles = [...user.roles.filter(r => r !== 'Full Member'), 'Full Member'];
            },
            error: (err) => {
                console.error('Error promoting user:', err);
            }
        });
    }

    confirmDemote(user: User) {
        this.confirmationService.confirm({
            message: `Demote ${user.firstName} ${user.lastName} from Full Member back to User?`,
            header: 'Demote to User',
            icon: 'pi pi-arrow-down',
            acceptButtonStyleClass: 'p-button-warning',
            accept: () => this.demoteFromFullMember(user)
        });
    }

    demoteFromFullMember(user: User) {
        this.http.post(`${environment.apiUrl}/Auth/users/${user.id}/demote-full-member`, {}).subscribe({
            next: () => {
                user.roles = user.roles.filter(r => r !== 'Full Member');
            },
            error: (err) => {
                console.error('Error demoting user:', err);
            }
        });
    }

    confirmDelete(user: User) {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete ${user.firstName} ${user.lastName}?`,
            header: 'Delete Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.deleteUser(user);
            }
        });
    }

    deleteUser(user: User) {
        this.http.delete(`${environment.apiUrl}/Auth/users/${user.id}`).subscribe({
            next: () => {
                console.log('User deleted successfully:', user.id);
                this.users = this.users.filter(u => u.id !== user.id);
            },
            error: (err) => {
                console.error('Error deleting user:', err);
            }
        });
    }

    onRfidChange(user: User) {
        console.log('RFID changed for user:', user.id, user.firstName, user.lastName, '- New value:', user.rfid);
        this.http.patch(`${environment.apiUrl}/Auth/users/toggle-rfid/${user.id}`, {}).subscribe({
            next: () => {
                console.log('RFID updated successfully for user:', user.id);
            },
            error: (err) => {
                console.error('Error updating RFID:', err);
                // Revert the change on error
                user.rfid = !user.rfid;
            }
        });
    }

    getProfilePictureUrl(profilePictureUrl: string | null): string {
        if (!profilePictureUrl) {
            return '';
        }
        if (profilePictureUrl.startsWith('http')) {
            return profilePictureUrl;
        }
        return `${environment.baseUrl}${profilePictureUrl}`;
    }

    getUserInitials(user: User): string {
        return getInitials(`${user.firstName} ${user.lastName}`);
    }

    hasProfilePicture(profilePictureUrl: string | null): boolean {
        return !!profilePictureUrl && !isDefaultAvatar(profilePictureUrl);
    }

    getPresenceStatus(userId: string): string {
        return this.presenceService.getPresence(userId).status;
    }

    getLastActiveText(userId: string): string {
        const p = this.presenceService.getPresence(userId);
        if (p.lastActivityAt) {
            const date = new Date(p.lastActivityAt);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
                ' at ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        }
        return 'Offline';
    }
}
