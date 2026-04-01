import { Component, OnInit, OnDestroy, effect } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { PopoverModule } from 'primeng/popover';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { DividerModule } from 'primeng/divider';
import { BadgeModule } from 'primeng/badge';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { LayoutService } from '../service/layout.service';
import { AuthService, getInitials, isDefaultAvatar } from '@/pages/service/auth.service';
import { NotificationService, AppNotification } from '@/pages/service/notification.service';
import { environment } from '@environments/environment.prod';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [RouterModule, CommonModule, StyleClassModule, PopoverModule, ButtonModule, AvatarModule, DividerModule, BadgeModule, OverlayBadgeModule],
    template: ` 
    <div class="layout-topbar">
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" (click)="layoutService.onMenuToggle()">
                <i class="pi pi-bars"></i>
            </button>
          
<a class="layout-topbar-logo" routerLink="/">
<img class="h-8 max-w-full" [src]="layoutService.isDarkTheme() ? 'assets/images/flossk_logo_dark_mode.png' : 'assets/images/logo.png'" alt="Flossk Logo"></a>
        </div>
        <div class="layout-topbar-actions">
            <div class="layout-config-menu">
                @if (authService.isAuthenticated()) {
                    <button type="button" class="layout-topbar-action relative mr-2" (click)="notificationPopover.toggle($event)">
                        @if (notificationService.unreadCount() > 0) {
                            <p-overlayBadge [value]="notificationService.unreadCount().toString()" severity="danger">
                                <i class="pi pi-bell text-xl"></i>
                            </p-overlayBadge>
                        } @else {
                            <i class="pi pi-bell text-xl"></i>
                        }
                    </button>
                    <p-popover #notificationPopover>
                        <div class="flex flex-col w-80">
                            <div class="flex items-center justify-between p-4 border-b border-surface-200 dark:border-surface-700">
                                <span class="font-semibold text-lg">Notifications</span>
                                @if (notificationService.unreadCount() > 0) {
                                    <button pButton [text]="true" size="small" label="Mark all read" (click)="onMarkAllRead()"></button>
                                }
                            </div>
                            <div class="max-h-80 overflow-y-auto">
                                @for (n of notificationService.notifications(); track n.id) {
                                    <div class="flex items-start gap-3 p-3 cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors border-b border-surface-100 dark:border-surface-800"
                                         [class.bg-primary-50]="!n.isRead"
                                         [class.dark:bg-primary-900/10]="!n.isRead"
                                         (click)="onNotificationClick(n)">
                                        <div class="w-8 h-8 flex items-center justify-center rounded-full shrink-0"
                                             [ngClass]="getNotificationIconBg(n.type)">
                                            <i [class]="'pi ' + getNotificationIcon(n.type) + ' text-sm'"></i>
                                        </div>
                                        <div class="flex-1 min-w-0">
                                            <div class="font-medium text-sm text-surface-900 dark:text-surface-0 truncate">{{ n.title }}</div>
                                            <div class="text-xs text-muted-color mt-0.5 line-clamp-2">{{ n.body }}</div>
                                            <div class="text-xs text-muted-color mt-1">{{ getTimeAgo(n.createdAt) }}</div>
                                        </div>
                                        @if (!n.isRead) {
                                            <div class="w-2 h-2 rounded-full bg-primary shrink-0 mt-2"></div>
                                        }
                                    </div>
                                } @empty {
                                    <div class="p-6 text-center text-muted-color">
                                        <i class="pi pi-bell-slash text-3xl mb-2"></i>
                                        <p class="text-sm">No notifications</p>
                                    </div>
                                }
                            </div>
                            @if (notificationService.notifications().length > 0) {
                                <div class="p-2 border-t border-surface-200 dark:border-surface-700 text-center">
                                    <a routerLink="/dashboard/notifications" class="text-primary text-sm font-medium no-underline hover:underline" (click)="notificationPopover.hide()">View all notifications</a>
                                </div>
                            }
                        </div>
                    </p-popover>
                }
                <button type="button" class="layout-topbar-action" style="width: auto; height: auto; border-radius: 0; background: none;" (click)="profilePopover.toggle($event)">
                    @if (hasProfilePicture()) {
                        <p-avatar
                            [image]="getProfilePictureUrl()"
                            shape="circle"
                            size="normal"
                        ></p-avatar>
                    } @else {
\                        <p-avatar
                            [label]="getUserInitials()"
                            shape="circle"
                            size="normal"
                            [style]="{'background-color': 'var(--primary-color)', 'color': 'var(--primary-color-text)'}"
                        ></p-avatar>
                    }
                </button>
                <p-popover #profilePopover>
                    <div class="flex flex-col w-72">
                        @if (authService.currentUser()) {
                            <div class="flex items-center gap-4 p-4 border-b border-surface-200 dark:border-surface-700">
                                <div class="flex flex-col">
                                    <div class="font-semibold text-surface-900 dark:text-surface-0">{{ authService.currentUser()?.email }}</div>
                                    <div class="text-sm text-muted-color">{{ authService.currentUser()?.role || authService.currentUser()?.roles?.[0] || 'Member' }}</div>
                                </div>
                            </div>
                            <div class="p-2">
                                <a routerLink="/dashboard/profile" class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors cursor-pointer text-surface-700 dark:text-surface-200 no-underline" (click)="profilePopover.hide()">
                                    <i class="pi pi-user text-lg"></i>
                                    <span>View Profile</span>
                                </a>
                                <button (click)="toggleDarkMode()" class="flex items-center gap-3 px-3 py-2 w-full rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors cursor-pointer text-surface-700 dark:text-surface-200 border-none bg-transparent">
                                    <i [class]="layoutService.isDarkTheme() ? 'pi pi-sun text-lg' : 'pi pi-moon text-lg'"></i>
                                    <span>{{ layoutService.isDarkTheme() ? 'Light Mode' : 'Dark Mode' }}</span>
                                </button>
                            </div>
                            <div class="p-2 border-t border-surface-200 dark:border-surface-700">
                                <button (click)="authService.logout(); profilePopover.hide()" class="flex items-center gap-3 px-3 py-2 w-full rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer text-red-600 dark:text-red-400 border-none bg-transparent">
                                    <i class="pi pi-sign-out text-lg"></i>
                                    <span>Logout</span>
                                </button>
                            </div>
                        } @else {
                            <div class="p-6 text-center">
                                <i class="pi pi-user text-4xl text-muted-color mb-3"></i>
                                <p class="text-muted-color mb-4">You are not logged in</p>
                                <p-button label="Login" icon="pi pi-sign-in" routerLink="/auth/login" styleClass="w-full" (onClick)="profilePopover.hide()"></p-button>
                            </div>
                        }
                    </div>
                </p-popover>
            </div>
        </div>
    </div>
    `
})
export class AppTopbar implements OnInit, OnDestroy {
    items!: MenuItem[];

    constructor(
        public layoutService: LayoutService,
        public authService: AuthService,
        public notificationService: NotificationService
    ) {
        // Start SignalR and load notifications when user becomes authenticated
        effect(() => {
            const user = this.authService.currentUser();
            if (user) {
                this.notificationService.startConnection();
                this.notificationService.loadUnread();
                this.notificationService.refreshUnreadCount();
            } else {
                this.notificationService.stopConnection();
            }
        });
    }

    ngOnInit() {
        // Load current user when topbar initializes
        this.authService.loadCurrentUser();
    }

    ngOnDestroy() {
        this.notificationService.stopConnection();
    }

    toggleDarkMode() {
        this.layoutService.toggleAndPersistDarkMode();
    }

    onNotificationClick(notification: AppNotification) {
        if (!notification.isRead) {
            this.notificationService.markAsRead(notification.id).subscribe();
        }
    }

    onMarkAllRead() {
        this.notificationService.markAllAsRead().subscribe();
    }

    getNotificationIcon(type: string): string {
        const icons: Record<string, string> = {
            General: 'pi-info-circle',
            MembershipApproved: 'pi-check-circle',
            MembershipRejected: 'pi-times-circle',
            ProjectInvite: 'pi-envelope',
            ProjectUpdate: 'pi-briefcase',
            Announcement: 'pi-megaphone',
            ElectionStarted: 'pi-chart-bar',
            ElectionEnded: 'pi-chart-bar',
            ContributionApproved: 'pi-star',
            CertificateIssued: 'pi-id-card',
            InventoryCheckoutReminder: 'pi-box',
        };
        return icons[type] || 'pi-bell';
    }

    getNotificationIconBg(type: string): string {
        const bgs: Record<string, string> = {
            General: 'bg-blue-100 dark:bg-blue-400/10 text-blue-500',
            MembershipApproved: 'bg-green-100 dark:bg-green-400/10 text-green-500',
            MembershipRejected: 'bg-red-100 dark:bg-red-400/10 text-red-500',
            ProjectInvite: 'bg-purple-100 dark:bg-purple-400/10 text-purple-500',
            ProjectUpdate: 'bg-cyan-100 dark:bg-cyan-400/10 text-cyan-500',
            Announcement: 'bg-orange-100 dark:bg-orange-400/10 text-orange-500',
            ElectionStarted: 'bg-yellow-100 dark:bg-yellow-400/10 text-yellow-500',
            ElectionEnded: 'bg-yellow-100 dark:bg-yellow-400/10 text-yellow-500',
            ContributionApproved: 'bg-green-100 dark:bg-green-400/10 text-green-500',
            CertificateIssued: 'bg-indigo-100 dark:bg-indigo-400/10 text-indigo-500',
            InventoryCheckoutReminder: 'bg-orange-100 dark:bg-orange-400/10 text-orange-500',
        };
        return bgs[type] || 'bg-blue-100 dark:bg-blue-400/10 text-blue-500';
    }

    getTimeAgo(dateStr: string): string {
        const now = new Date();
        const date = new Date(dateStr);
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return 'just now';
        if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
        if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
        if (seconds < 604800) return Math.floor(seconds / 86400) + 'd ago';
        return date.toLocaleDateString();
    }

    getUserInitials(): string {
        const user = this.authService.currentUser();
        let initials = '?';
        if (user?.firstName || user?.lastName) {
            const name = (user.firstName ?? '') + ' ' + (user.lastName ?? '');
            initials = getInitials(name);
        } else if (user?.email) {
            initials = user.email.charAt(0).toUpperCase();
        }
        console.log('User initials in topbar:', initials);
        return initials;
    }

    hasProfilePicture(): boolean {
        const user = this.authService.currentUser();
        return !!user?.profilePictureUrl && !isDefaultAvatar(user.profilePictureUrl);
    }

    getProfilePictureUrl(): string {
        const user = this.authService.currentUser();
        if (!user?.profilePictureUrl) return '';

        if (user.profilePictureUrl.startsWith('http')) {
            return user.profilePictureUrl;
        }
        return `${environment.baseUrl}${user.profilePictureUrl}`;
    }
}
