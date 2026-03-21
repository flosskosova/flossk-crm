import { Component, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { PopoverModule } from 'primeng/popover';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { DividerModule } from 'primeng/divider';
import { LayoutService } from '../service/layout.service';
import { AuthService, getInitials, isDefaultAvatar } from '@/pages/service/auth.service';
import { environment } from '@environments/environment.prod';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [RouterModule, CommonModule, StyleClassModule, PopoverModule, ButtonModule, AvatarModule, DividerModule],
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
                <button type="button" class="layout-topbar-action" (click)="profilePopover.toggle($event)">
                    <p-avatar
                        *ngIf="hasProfilePicture()"
                        [image]="getProfilePictureUrl()"
                        shape="circle"
                        size="normal"
                    ></p-avatar>
                    <p-avatar
                        *ngIf="!hasProfilePicture()"
                        [label]="getUserInitials()"
                        shape="circle"
                        size="normal"
                        [style]="{'background-color': 'var(--primary-color)', 'color': 'var(--primary-color-text)'}"
                    ></p-avatar>
                    <span>Profile</span>
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
                                <a routerLink="/dashboard/settings" class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors cursor-pointer text-surface-700 dark:text-surface-200 no-underline" (click)="profilePopover.hide()">
                                    <i class="pi pi-cog text-lg"></i>
                                    <span>Settings</span>
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
export class AppTopbar implements OnInit {
    items!: MenuItem[];

    constructor(
        public layoutService: LayoutService,
        public authService: AuthService
    ) { }

    ngOnInit() {
        // Load current user when topbar initializes
        this.authService.loadCurrentUser();
    }

    toggleDarkMode() {
        this.layoutService.toggleAndPersistDarkMode();
    }

    getUserInitials(): string {
        const user = this.authService.currentUser();
        if (user?.fullName) {
            return getInitials(user.fullName);
        }
        return (user?.email ?? '?').charAt(0).toUpperCase();
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
