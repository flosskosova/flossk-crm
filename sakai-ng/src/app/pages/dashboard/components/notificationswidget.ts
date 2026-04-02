import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { NotificationService, AppNotification } from '@/pages/service/notification.service';

@Component({
    standalone: true,
    selector: 'app-notifications-widget',
    imports: [CommonModule, ButtonModule],
    template: `
    <div class="card">
        <div class="flex items-center justify-between mb-6">
            <div class="font-semibold text-xl">Notifications</div>
            @if (notificationService.unreadCount() > 0) {
                <button pButton [text]="true" label="Mark all as read" (click)="markAllRead()"></button>
            }
        </div>

        @if (allNotifications.length === 0 && !loading) {
            <div class="text-center py-8 text-muted-color">
                <i class="pi pi-bell-slash text-4xl mb-3"></i>
                <p>No notifications yet</p>
            </div>
        }

        @if (loading) {
            <div class="text-center py-8 text-muted-color">
                <i class="pi pi-spin pi-spinner text-2xl"></i>
            </div>
        }

        <ul class="p-0 mx-0 mt-0 mb-4 list-none">
            @for (notification of allNotifications; track notification.id) {
                <li class="flex items-center justify-between py-3 border-b border-surface"
                    [class.bg-primary-50]="!notification.isRead"
                    [class.dark:bg-primary-900/10]="!notification.isRead">
                    <div class="flex items-start flex-1 cursor-pointer" (click)="markRead(notification)">
                        <div [class]="'w-12 h-12 flex items-center justify-center rounded-full mr-4 shrink-0 ' + getIconBg(notification.type)">
                            <i [class]="'pi ' + getIcon(notification.type) + ' text-xl!'"></i>
                        </div>
                        <div class="flex-1">
                            <div class="font-semibold text-surface-900 dark:text-surface-0">{{ notification.title }}</div>
                            <div class="text-sm text-muted-color mt-1">{{ notification.body }}</div>
                            <div class="text-xs text-muted-color mt-1">{{ getTimeAgo(notification.createdAt) }}</div>
                        </div>
                        @if (!notification.isRead) {
                            <div class="w-2.5 h-2.5 rounded-full bg-primary shrink-0 ml-3"></div>
                        }
                    </div>
                    <p-button icon="pi pi-trash" [text]="true" [rounded]="true" severity="danger" (onClick)="deleteNotification(notification.id)"></p-button>
                </li>
            }
        </ul>

        @if (hasMore) {
            <div class="text-center">
                <button pButton [text]="true" label="Load more" icon="pi pi-chevron-down" [loading]="loadingMore" (click)="loadMore()"></button>
            </div>
        }
    </div>
    `
})
export class NotificationsWidget implements OnInit {
    allNotifications: AppNotification[] = [];
    loading = true;
    loadingMore = false;
    hasMore = true;
    page = 1;
    pageSize = 20;

    constructor(public notificationService: NotificationService) {}

    ngOnInit() {
        this.loadPage();
    }

    loadPage() {
        this.notificationService.loadAll(this.page, this.pageSize).subscribe({
            next: data => {
                this.allNotifications = [...this.allNotifications, ...data.items];
                this.hasMore = this.allNotifications.length < data.totalCount;
                this.loading = false;
                this.loadingMore = false;
            },
            error: () => {
                this.loading = false;
                this.loadingMore = false;
            }
        });
    }

    loadMore() {
        this.loadingMore = true;
        this.page++;
        this.loadPage();
    }

    markRead(notification: AppNotification) {
        if (!notification.isRead) {
            this.notificationService.markAsRead(notification.id).subscribe(() => {
                notification.isRead = true;
            });
        }
    }

    markAllRead() {
        this.notificationService.markAllAsRead().subscribe(() => {
            this.allNotifications = this.allNotifications.map(n => ({ ...n, isRead: true }));
        });
    }

    deleteNotification(id: string) {
        this.notificationService.delete(id).subscribe(() => {
            this.allNotifications = this.allNotifications.filter(n => n.id !== id);
        });
    }

    getIcon(type: string): string {
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
            ObjectiveAssigned: 'pi-flag',
        };
        return icons[type] || 'pi-bell';
    }

    getIconBg(type: string): string {
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
            ObjectiveAssigned: 'bg-teal-100 dark:bg-teal-400/10 text-teal-500',
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
}
