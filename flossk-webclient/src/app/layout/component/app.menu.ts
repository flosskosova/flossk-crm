import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { AuthService } from '@/pages/service/auth.service';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        <ng-container *ngFor="let item of model(); let i = index">
            <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
            <li *ngIf="item.separator" class="menu-separator"></li>
        </ng-container>
    </ul> `
})
export class AppMenu {
    private authService = inject(AuthService);

    adminOnly = computed(() => {
        const user = this.authService.currentUser();
        const roles: string[] = user?.roles ?? (user?.role ? [user.role] : []);
        return roles.includes('Admin');
    });

    isBoard = computed(() => {
        const user = this.authService.currentUser();
        const roles: string[] = user?.roles ?? (user?.role ? [user.role] : []);
        return roles.includes('Admin') || roles.includes('Leader');
    });

    model = computed<MenuItem[]>(() => {
        const admin = this.adminOnly();
        const board = this.isBoard();

        // Each "category" is a collapsible dropdown; empty ones are dropped automatically.
        const category = (label: string, icon: string, items: (MenuItem | false)[]): MenuItem | null => {
            const visible = items.filter(Boolean) as MenuItem[];
            return visible.length ? { label, icon: `pi pi-fw ${icon}`, items: visible } : null;
        };

        const section = (label: string, categories: (MenuItem | null)[]): MenuItem | null => {
            const items = categories.filter(Boolean) as MenuItem[];
            return items.length ? { label, items } : null;
        };

        const link = (label: string, icon: string, route: string): MenuItem => ({
            label,
            icon: `pi pi-fw ${icon}`,
            routerLink: [route]
        });

        return [
            section('Menu', [
                category('Overview', 'pi-compass', [
                    link('Dashboard', 'pi-home', '/dashboard'),
                    link('Announcements', 'pi-megaphone', '/dashboard/announcements'),
                    link('Notifications', 'pi-inbox', '/dashboard/notifications'),
                    link('Profile', 'pi-user', '/dashboard/profile')
                ]),
                category('Community', 'pi-users', [
                    link('Users', 'pi-users', '/dashboard/users'),
                    (admin || board) && link('Membership Requests', 'pi-user-plus', '/dashboard/membership-requests'),
                    link('Collaboration Pads', 'pi-clipboard', '/dashboard/collaboration-pads'),
                    link('Course Portal', 'pi-globe', '/dashboard/course-portal'),
                    link('Elections', 'pi-verified', '/dashboard/elections'),
                    link('Leaderboard', 'pi-graduation-cap', '/dashboard/leaderboard')
                ]),
                category('Operations', 'pi-briefcase', [
                    link('Projects', 'pi-hammer', '/dashboard/projects'),
                    link('Inventory', 'pi-box', '/dashboard/inventory')
                ]),
                category('Point of Sale', 'pi-shopping-cart', [
                    link('POS Terminal', 'pi-credit-card', '/dashboard/pos'),
                    link('Inventory', 'pi-box', '/dashboard/pos/inventory'),
                    link('Customers', 'pi-id-card', '/dashboard/pos/customers'),
                    link('Shifts', 'pi-clock', '/dashboard/pos/shifts'),
                    board && link('Payment Logs', 'pi-receipt', '/dashboard/pos/payment-logs'),
                    board && link('Analytics', 'pi-chart-line', '/dashboard/pos/analytics'),
                    admin && link('Operators', 'pi-user-edit', '/dashboard/pos/operators')
                ]),
                category('Purchasing', 'pi-shopping-bag', [
                    link('Purchase Requests', 'pi-file-edit', '/dashboard/purchase-requests'),
                    board && link('Purchase Approvals', 'pi-check-square', '/dashboard/purchase-approvals')
                ]),
                category('Insights', 'pi-chart-bar', [
                    link('General Statistics', 'pi-chart-pie', '/dashboard/statistics'),
                    admin && link('Audit Logs', 'pi-server', '/dashboard/audit-logs')
                ])
            ]),

            section('Admin', [
                category('Access Control', 'pi-lock', [
                    admin && link('Credentials', 'pi-id-card', '/dashboard/access'),
                    admin && link('Doors', 'pi-building', '/dashboard/access/doors'),
                    admin && link('ESP32 Devices', 'pi-wifi', '/dashboard/access/devices'),
                    admin && link('Access Logs', 'pi-list', '/dashboard/access/logs')
                ]),
                category('Administration', 'pi-cog', [
                    admin && link('External Messages', 'pi-envelope', '/dashboard/external-messages'),
                    admin && link('Certificate Builder', 'pi-sparkles', '/dashboard/cert-builder'),
                    admin && link('Integrations', 'pi-th-large', '/dashboard/integrations'),
                    admin && link('Expenses Tracking', 'pi-wallet', '/dashboard/expenses'),
                    admin && link('Plugins', 'pi-objects-column', '/dashboard/plugins'),
                    admin && link('Settings', 'pi-cog', '/dashboard/admin-settings')
                ])
            ])
        ].filter(Boolean) as MenuItem[];
    });
}
