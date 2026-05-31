import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { PaginatorModule } from 'primeng/paginator';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { environment } from '@environments/environment.prod';
import { LogService, LogEntry } from '@/pages/service/log.service';
import { AuthService } from '@/pages/service/auth.service';
import { ProjectsService, UserDto } from '@/pages/service/projects.service';

interface SelectOption { label: string; value: string; }

@Component({
    selector: 'app-audit-logs',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        SelectModule,
        DatePickerModule,
        PaginatorModule,
        AvatarModule,
        TooltipModule,
        ToastModule,
    ],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="card">
            <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
                <h3 class="text-2xl m-0">Audit Logs</h3>
                <span *ngIf="!loading" class="text-sm text-muted-color">{{ totalCount | number }} total entries</span>
            </div>

            <!-- Filters -->
            <div class="flex flex-wrap gap-3 mb-4 p-4 border border-surface-200 dark:border-surface-700 rounded-lg">
                <div class="flex flex-col gap-1" style="min-width:12rem">
                    <label class="text-sm font-medium text-muted-color">Entity Type</label>
                    <p-select
                        [(ngModel)]="filterEntityType"
                        [options]="entityTypeOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="All types"
                        [showClear]="true"
                        appendTo="body"
                        class="w-full"
                    />
                </div>
                <div class="flex flex-col gap-1" style="min-width:14rem">
                    <label class="text-sm font-medium text-muted-color">User</label>
                    <p-select
                        [(ngModel)]="filterUserId"
                        [options]="userOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="All users"
                        [filter]="true"
                        filterBy="label"
                        [showClear]="true"
                        appendTo="body"
                        class="w-full"
                    />
                </div>
                <div class="flex flex-col gap-1" style="min-width:11rem">
                    <label class="text-sm font-medium text-muted-color">From</label>
                    <p-datepicker
                        [(ngModel)]="filterDateFrom"
                        dateFormat="yy-mm-dd"
                        placeholder="Start date"
                        [showClear]="true"
                        appendTo="body"
                        class="w-full"
                    />
                </div>
                <div class="flex flex-col gap-1" style="min-width:11rem">
                    <label class="text-sm font-medium text-muted-color">To</label>
                    <p-datepicker
                        [(ngModel)]="filterDateTo"
                        dateFormat="yy-mm-dd"
                        placeholder="End date"
                        [showClear]="true"
                        appendTo="body"
                        class="w-full"
                    />
                </div>
                <div class="flex flex-row items-end gap-2" style="min-width:10rem">
                    <p-button label="Reset" icon="pi pi-filter-slash" severity="secondary" [outlined]="true" (onClick)="resetFilters()" class="flex-1" />
                    <p-button label="Apply" icon="pi pi-search" (onClick)="applyFilters()" class="flex-1" />
                </div>
            </div>

            <!-- Loading -->
            <div *ngIf="loading" class="flex items-center justify-center py-16 gap-3 text-muted-color">
                <i class="pi pi-spin pi-spinner text-xl"></i>
                <span>Loading logs...</span>
            </div>

            <!-- Empty -->
            <div *ngIf="!loading && logs.length === 0" class="flex flex-col items-center justify-center py-16 text-muted-color">
                <i class="pi pi-list text-5xl mb-4 opacity-30"></i>
                <p class="text-lg font-medium mb-1">No logs found</p>
                <p class="text-sm">Try adjusting the filters.</p>
            </div>

            <!-- Log list -->
            <div *ngIf="!loading && logs.length > 0" class="flex flex-col divide-y divide-surface-100 dark:divide-surface-700">
                <div *ngFor="let log of logs" class="flex items-start gap-4 py-4">

                    <p-avatar
                        *ngIf="log.userProfilePictureUrl"
                        [image]="getProfilePictureUrl(log.userProfilePictureUrl)"
                        shape="circle"
                        size="normal"
                        [style]="{ 'flex-shrink': '0' }"
                        tooltipPosition="top"
                    />
                    <p-avatar
                        *ngIf="!log.userProfilePictureUrl"
                        [label]="getUserInitials(log.userFullName)"
                        shape="circle"
                        size="normal"
                        [style]="{ 'background-color': getEntityColor(log.entityType), 'color': 'white', 'flex-shrink': '0' }"
                        tooltipPosition="top"
                    />

                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="inline-flex items-center gap-1 text-xs px-2 py-0.5 font-medium"
                                  [ngStyle]="{ 'background-color': getEntityColor(log.entityType) + '22', 'color': getEntityColor(log.entityType) }">
                                <i [class]="getEntityIcon(log.entityType) + ' text-xs'"></i>
                                {{ log.entityType }}
                            </span>
                            <span class="font-medium text-sm">{{ log.action }}</span>
                            <span class="text-sm text-muted-color" tooltipPosition="top">
                                &mdash; <em>{{ log.entityName }}</em>
                            </span>
                        </div>

                        <div class="flex items-center gap-3 mt-1 flex-wrap">
                            <span class="text-xs text-muted-color flex items-center gap-1">
                                <i class="pi pi-user text-xs"></i>
                                {{ log.userFullName }}
                            </span>
                            <span *ngIf="log.detail" class="text-xs text-muted-color flex items-center gap-1 max-w-xs">
                                <i class="pi pi-info-circle text-xs shrink-0"></i>
                                <span class="truncate">{{ log.detail }}</span>
                            </span>
                        </div>
                    </div>

                    <div class="shrink-0 text-right">
                        <p class="text-xs text-muted-color m-0 whitespace-nowrap">{{ log.timestamp | date: 'MMM d, y' }}</p>
                        <p class="text-xs text-muted-color m-0 whitespace-nowrap">{{ log.timestamp | date: 'HH:mm:ss' }}</p>
                    </div>
                </div>
            </div>

            <!-- Paginator -->
            <p-paginator
                *ngIf="!loading && totalCount > pageSize"
                [first]="(page - 1) * pageSize"
                [rows]="pageSize"
                [totalRecords]="totalCount"
                [rowsPerPageOptions]="[25, 50, 100]"
                (onPageChange)="onPageChange($event)"
                styleClass="mt-4"
            />
        </div>
    `
})
export class AuditLogs implements OnInit {
    logs: LogEntry[] = [];
    loading = false;
    totalCount = 0;
    page = 1;
    pageSize = 25;
    totalPages = 0;

    filterEntityType = '';
    filterUserId = '';
    filterDateFrom: Date | null = null;
    filterDateTo: Date | null = null;

    entityTypeOptions: SelectOption[] = [
        { label: 'All Types', value: '' },
        { label: 'Inventory', value: 'Inventory' },
        { label: 'Project', value: 'Project' },
    ];

    userOptions: SelectOption[] = [{ label: 'All Users', value: '' }];

    private readonly ENTITY_COLORS: Record<string, string> = {
        Inventory: '#f59e0b',
        Project:   '#6366f1',
    };
    private readonly ENTITY_ICONS: Record<string, string> = {
        Inventory: 'pi pi-box',
        Project:   'pi pi-folder',
    };

    constructor(
        private logService: LogService,
        private projectsService: ProjectsService,
        private messageService: MessageService,
    ) {}
    private authService = inject(AuthService);

    ngOnInit(): void {
        this.loadUsers();
        this.loadLogs();
    }

    loadUsers(): void {
        this.projectsService.getAllUsers(1, 500).subscribe({
            next: (res) => {
                const currentUser = this.authService.currentUser();
                const opts = res.users
                    .filter((u: UserDto) => u.id !== currentUser?.id)
                    .map((u: UserDto) => ({
                        label: `${u.firstName} ${u.lastName}`.trim() || u.email,
                        value: u.id,
                    }));
                const meOption: SelectOption[] = currentUser
                    ? [{ label: `Me (${((`${currentUser.firstName ?? ''} ${currentUser.lastName ?? ''}`).trim() || (currentUser.email ?? ''))})`, value: currentUser.id ?? '' }]
                    : [];
                this.userOptions = [{ label: 'All Users', value: '' }, ...meOption, ...opts];
            },
            error: () => {}
        });
    }

    loadLogs(): void {
        this.loading = true;
        const params = {
            entityType: this.filterEntityType || undefined,
            userId:     this.filterUserId     || undefined,
            dateFrom:   this.filterDateFrom   ? this.formatDate(this.filterDateFrom) : undefined,
            dateTo:     this.filterDateTo     ? this.formatDate(this.filterDateTo)   : undefined,
            page:       this.page,
            pageSize:   this.pageSize,
        };
        console.log('loadLogs params:', params);
        this.logService.getLogs(params).subscribe({
            next: (res) => {
                console.log('Audit logs response:', res);
                this.logs       = res.data;
                this.totalCount = res.totalCount;
                this.totalPages = res.totalPages;
                this.loading    = false;
            },
            error: () => {
                this.loading = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load audit logs.' });
            }
        });
    }

    applyFilters(): void {
        this.page = 1;
        this.loadLogs();
    }

    resetFilters(): void {
        this.filterEntityType = '';
        this.filterUserId     = '';
        this.filterDateFrom   = null;
        this.filterDateTo     = null;
        this.page             = 1;
        this.loadLogs();
    }

    onPageChange(event: { page?: number; rows?: number }): void {
        this.page     = (event.page ?? 0) + 1;
        this.pageSize = event.rows ?? 25;
        this.loadLogs();
    }

    getProfilePictureUrl(url: string | undefined): string {
        if (!url) return '';
        return url.startsWith('http') ? url : `${environment.baseUrl}${url}`;
    }

    getUserInitials(fullName: string): string {
        const parts = fullName.trim().split(' ').filter(Boolean);
        if (parts.length === 0) return '?';
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }

    getEntityColor(entityType: string): string {
        return this.ENTITY_COLORS[entityType] ?? '#64748b';
    }

    getEntityIcon(entityType: string): string {
        return this.ENTITY_ICONS[entityType] ?? 'pi pi-tag';
    }

    private formatDate(d: Date): string {
        const y  = d.getFullYear();
        const m  = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dd}`;
    }
}
