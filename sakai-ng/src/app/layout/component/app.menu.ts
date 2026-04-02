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

    canSeeVoting = computed(() => {
        const user = this.authService.currentUser();
        const roles: string[] = user?.roles ?? (user?.role ? [user.role] : []);
        return roles.includes('Admin') || roles.includes('Full Member') || roles.includes('User');
    });

    model = computed<MenuItem[]>(() => [
        {
            label: 'Home',
            items: [
                { label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/dashboard'] },
                { label: 'Profile', icon: 'pi pi-fw pi-user', routerLink: ['/dashboard/profile'] },
                { label: 'Projects', icon: 'pi pi-fw pi-hammer', routerLink: ['/dashboard/projects'] },
                { label: 'Notifications', icon: 'pi pi-fw pi-inbox', routerLink: ['/dashboard/notifications'] },
                { label: 'Users', icon: 'pi pi-fw pi-users', routerLink: ['/dashboard/users'] },
                { label: 'Announcements', icon: 'pi pi-fw pi-megaphone', routerLink: ['/dashboard/announcements'] },
                { label: 'Inventory', icon: 'pi pi-fw pi-box', routerLink: ['/dashboard/inventory'] },
                { label: 'Events', icon: 'pi pi-fw pi-calendar', routerLink: ['/dashboard/events'] },
                ...(this.canSeeVoting() ? [{ label: 'Elections', icon: 'pi pi-fw pi-vote', routerLink: ['/dashboard/elections'] }] : []),
                { label: 'Expenses Tracking (Frontend only)', icon: 'pi pi-fw pi-wallet', routerLink: ['/dashboard/expenses'] },
                // { label: 'RFID Configurer', icon: 'pi pi-fw pi-id-card', routerLink: ['/dashboard/rfid-configurer'] },
                // { label: 'Hackerspace Presence (Frontend only)', icon: 'pi pi-fw pi-wave-pulse', routerLink: ['/dashboard/hackerspace-presence'] },
                { label: 'General Statistics', icon: 'pi pi-fw pi-chart-bar', routerLink: ['/dashboard/statistics'] },
                { label: 'Leaderboard', icon: 'pi pi-fw pi-graduation-cap', routerLink: ['/dashboard/leaderboard'] },
                { label: 'External Messages', icon: 'pi pi-fw pi-envelope', routerLink: ['/dashboard/external-messages'] },
                { label: 'Integrations', icon: 'pi pi-fw pi-th-large', routerLink: ['/dashboard/integrations'] },
                { label: 'Plugins (Frontend only)', icon: 'pi pi-fw pi-objects-column', routerLink: ['/dashboard/plugins'] },
                { label: 'Certificate Builder', icon: 'pi pi-fw pi-sparkles', routerLink: ['/dashboard/cert-builder'] },
                { label: 'Administration Settings', icon: 'pi pi-fw pi-cog', routerLink: ['/dashboard/admin-settings'] },
                ]
            },
            {
                label: 'UI Components',
                items: [
                    { label: 'Form Layout', icon: 'pi pi-fw pi-id-card', routerLink: ['/dashboard/uikit/formlayout'] },
                    { label: 'Input', icon: 'pi pi-fw pi-check-square', routerLink: ['/dashboard/uikit/input'] },
                    { label: 'Button', icon: 'pi pi-fw pi-mobile', class: 'rotated-icon', routerLink: ['/dashboard/uikit/button'] },
                    { label: 'Table', icon: 'pi pi-fw pi-table', routerLink: ['/dashboard/uikit/table'] },
                    { label: 'List', icon: 'pi pi-fw pi-list', routerLink: ['/dashboard/uikit/list'] },
                    { label: 'Tree', icon: 'pi pi-fw pi-share-alt', routerLink: ['/dashboard/uikit/tree'] },
                    { label: 'Panel', icon: 'pi pi-fw pi-tablet', routerLink: ['/dashboard/uikit/panel'] },
                    { label: 'Overlay', icon: 'pi pi-fw pi-clone', routerLink: ['/dashboard/uikit/overlay'] },
                    { label: 'Media', icon: 'pi pi-fw pi-image', routerLink: ['/dashboard/uikit/media'] },
                    { label: 'Menu', icon: 'pi pi-fw pi-bars', routerLink: ['/dashboard/uikit/menu'] },
                    { label: 'Message', icon: 'pi pi-fw pi-comment', routerLink: ['/dashboard/uikit/message'] },
                    { label: 'File', icon: 'pi pi-fw pi-file', routerLink: ['/dashboard/uikit/file'] },
                    { label: 'Chart', icon: 'pi pi-fw pi-chart-bar', routerLink: ['/dashboard/uikit/charts'] },
                    { label: 'Timeline', icon: 'pi pi-fw pi-calendar', routerLink: ['/dashboard/uikit/timeline'] },
                    { label: 'Misc', icon: 'pi pi-fw pi-circle', routerLink: ['/dashboard/uikit/misc'] }
                ]
            },
            {
                label: 'Pages',
                icon: 'pi pi-fw pi-briefcase',
                routerLink: ['/dashboard/pages'],
                items: [
                    {
                        label: 'Landing',
                        icon: 'pi pi-fw pi-globe',
                        routerLink: ['/landing']
                    },
                    {
                        label: 'Auth',
                        icon: 'pi pi-fw pi-user',
                        items: [
                            {
                                label: 'Login',
                                icon: 'pi pi-fw pi-sign-in',
                                routerLink: ['/auth/login']
                            },
                            {
                                label: 'Error',
                                icon: 'pi pi-fw pi-times-circle',
                                routerLink: ['/auth/error']
                            },
                            {
                                label: 'Access Denied',
                                icon: 'pi pi-fw pi-lock',
                                routerLink: ['/auth/access']
                            }
                        ]
                    },
                    {
                        label: 'Crud',
                        icon: 'pi pi-fw pi-pencil',
                        routerLink: ['/dashboard/pages/crud']
                    },
                    {
                        label: 'Not Found',
                        icon: 'pi pi-fw pi-exclamation-circle',
                        routerLink: ['/dashboard/pages/notfound']
                    },
                    {
                        label: 'Empty',
                        icon: 'pi pi-fw pi-circle-off',
                        routerLink: ['/dashboard/pages/empty']
                    }
                ]
            },
            {
                label: 'Hierarchy',
                items: [
                    {
                        label: 'Submenu 1',
                        icon: 'pi pi-fw pi-bookmark',
                        items: [
                            {
                                label: 'Submenu 1.1',
                                icon: 'pi pi-fw pi-bookmark',
                                items: [
                                    { label: 'Submenu 1.1.1', icon: 'pi pi-fw pi-bookmark' },
                                    { label: 'Submenu 1.1.2', icon: 'pi pi-fw pi-bookmark' },
                                    { label: 'Submenu 1.1.3', icon: 'pi pi-fw pi-bookmark' }
                                ]
                            },
                            {
                                label: 'Submenu 1.2',
                                icon: 'pi pi-fw pi-bookmark',
                                items: [{ label: 'Submenu 1.2.1', icon: 'pi pi-fw pi-bookmark' }]
                            }
                        ]
                    },
                    {
                        label: 'Submenu 2',
                        icon: 'pi pi-fw pi-bookmark',
                        items: [
                            {
                                label: 'Submenu 2.1',
                                icon: 'pi pi-fw pi-bookmark',
                                items: [
                                    { label: 'Submenu 2.1.1', icon: 'pi pi-fw pi-bookmark' },
                                    { label: 'Submenu 2.1.2', icon: 'pi pi-fw pi-bookmark' }
                                ]
                            },
                            {
                                label: 'Submenu 2.2',
                                icon: 'pi pi-fw pi-bookmark',
                                items: [{ label: 'Submenu 2.2.1', icon: 'pi pi-fw pi-bookmark' }]
                            }
                        ]
                    }
                ]
            },
            {
                label: 'Get Started',
                items: [
                    {
                        label: 'Documentation',
                        icon: 'pi pi-fw pi-book',
                        routerLink: ['/dashboard/documentation']
                    },
                    {
                        label: 'View Source',
                        icon: 'pi pi-fw pi-github',
                        url: 'https://github.com/primefaces/sakai-ng',
                        target: '_blank'
                    }
                ]
            }
        ]);
}
