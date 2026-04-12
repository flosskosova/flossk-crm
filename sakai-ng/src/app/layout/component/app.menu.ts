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

    model = computed<MenuItem[]>(() => [
        {
            label: 'Home',
            items: [
                { label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/dashboard'] },
                { label: 'Collaboration Pads', icon: 'pi pi-fw pi-clipboard', routerLink: ['/dashboard/collaboration-pads'] },
                { label: 'Profile', icon: 'pi pi-fw pi-user', routerLink: ['/dashboard/profile'] },
                { label: 'Projects', icon: 'pi pi-fw pi-hammer', routerLink: ['/dashboard/projects'] },
                { label: 'Notifications', icon: 'pi pi-fw pi-inbox', routerLink: ['/dashboard/notifications'] },
                { label: 'Users', icon: 'pi pi-fw pi-users', routerLink: ['/dashboard/users'] },
                { label: 'Announcements', icon: 'pi pi-fw pi-megaphone', routerLink: ['/dashboard/announcements'] },
                { label: 'Inventory', icon: 'pi pi-fw pi-box', routerLink: ['/dashboard/inventory'] },
                { label: 'Events', icon: 'pi pi-fw pi-calendar', routerLink: ['/dashboard/events'] },
                { label: 'Elections', icon: 'pi pi-fw pi-vote', routerLink: ['/dashboard/elections'] },
                { label: 'General Statistics', icon: 'pi pi-fw pi-chart-bar', routerLink: ['/dashboard/statistics'] },
                { label: 'Leaderboard', icon: 'pi pi-fw pi-graduation-cap', routerLink: ['/dashboard/leaderboard'] },
                { label: 'Integrations', icon: 'pi pi-fw pi-th-large', routerLink: ['/dashboard/integrations'] },
                { label: 'Course Portal', icon: 'pi pi-fw pi-globe', routerLink: ['/dashboard/course-portal'] },
                // { label: 'RFID Configurer', icon: 'pi pi-fw pi-id-card', routerLink: ['/dashboard/rfid-configurer'] },
                // { label: 'Hackerspace Presence (Frontend only)', icon: 'pi pi-fw pi-wave-pulse', routerLink: ['/dashboard/hackerspace-presence'] },
            ]
        },
        {
            label: 'Administration',
            items: this.adminOnly() ? [
                { label: 'External Messages', icon: 'pi pi-fw pi-envelope', routerLink: ['/dashboard/external-messages'] },
                { label: 'Membership Requests', icon: 'pi pi-fw pi-bell', routerLink: ['/dashboard/membership-requests'] },
                { label: 'Expenses Tracking (Frontend only)', icon: 'pi pi-fw pi-wallet', routerLink: ['/dashboard/expenses'] },
                { label: 'Plugins (Frontend only)', icon: 'pi pi-fw pi-objects-column', routerLink: ['/dashboard/plugins'] },
                { label: 'Certificate Builder', icon: 'pi pi-fw pi-sparkles', routerLink: ['/dashboard/cert-builder'] },
                { label: 'Audit Logs', icon: 'pi pi-fw pi-server', routerLink: ['/dashboard/audit-logs'] },
                { label: 'Administration Settings', icon: 'pi pi-fw pi-cog', routerLink: ['/dashboard/admin-settings'] },
            ] : [],
        }
    ]);
}
