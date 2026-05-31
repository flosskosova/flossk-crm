import { Component, OnInit, effect, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DividerModule } from 'primeng/divider';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { AuthService } from '@/pages/service/auth.service';
import { LogService, LogEntry } from '@/pages/service/log.service';

const ACTION_ICON: Record<string, string> = {
    'Project created': 'pi-folder-plus',
    'Project updated': 'pi-pen-to-square',
    'Project deleted': 'pi-trash',
    'Status updated': 'pi-refresh',
    'Field updated': 'pi-pen-to-square',
    'Moderator added': 'pi-user-plus',
    'Moderator removed': 'pi-user-minus',
    'Team member added': 'pi-user-plus',
    'Team member removed': 'pi-user-minus',
    'Team members removed': 'pi-user-minus',
    'Member joined': 'pi-sign-in',
    'Member left': 'pi-sign-out',
    'Objective created': 'pi-list-check',
    'Objective updated': 'pi-pen-to-square',
    'Objective deleted': 'pi-trash',
    'Objective status updated': 'pi-refresh',
    'Member assigned to objective': 'pi-user-plus',
    'Member removed from objective': 'pi-user-minus',
    'Objective member joined': 'pi-sign-in',
    'Objective member left': 'pi-sign-out',
    'Resource added': 'pi-link',
    'Resource updated': 'pi-pen-to-square',
    'Resource removed': 'pi-trash',
    'File attached': 'pi-paperclip',
    'File detached': 'pi-times-circle',
    'Item created': 'pi-plus-circle',
    'Item updated': 'pi-pen-to-square',
    'Item deleted': 'pi-trash',
    'Checked out': 'pi-arrow-circle-right',
    'Checked in': 'pi-arrow-circle-left',
    'Damage reported': 'pi-exclamation-triangle',
    'Repair reported': 'pi-wrench',
    'Image added': 'pi-image',
    'Image removed': 'pi-times-circle',
};

const ENTITY_SEVERITY: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
    'Project': 'info',
    'Inventory': 'success',
};

@Component({
    selector: 'app-user-settings',
    standalone: true,
    imports: [CommonModule, FormsModule, DividerModule, SkeletonModule, TagModule, ButtonModule, TooltipModule, SelectModule, DatePickerModule],
    template: `
    <div class="card">
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
                <p-select
                    [(ngModel)]="filterEntityType"
                    [options]="entityTypeOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="All types"
                    [showClear]="true"
                    (onChange)="onFilterChange()"
                    class="w-40"
                />
            </div>
            <div class="flex flex-wrap gap-2">
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-medium text-muted-color uppercase tracking-wide">From</label>
                <p-datepicker
                    [(ngModel)]="filterDateFrom"
                    placeholder="Start date"
                    [showIcon]="true"
                    dateFormat="M d, yy"
                    appendTo="body"
                    [showClear]="true"
                    (ngModelChange)="onFilterChange()"
                />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-medium text-muted-color uppercase tracking-wide">To</label>
                <p-datepicker
                    [(ngModel)]="filterDateTo"
                    placeholder="End date"
                    [showIcon]="true"
                    dateFormat="M d, yy"
                    appendTo="body"
                    [showClear]="true"
                    [minDate]="filterDateFrom ?? undefined"
                    (ngModelChange)="onFilterChange()"
                />
              </div>
            </div>
        </div>
        @if (isLoading) {
            <div class="flex flex-col gap-3 mt-4">
                @for (i of [1,2,3,4,5,6,7,8]; track i) {
                    <div class="flex items-start gap-3">
                        <p-skeleton shape="circle" size="2.5rem" />
                        <div class="flex-1">
                            <p-skeleton width="40%" height="1rem" styleClass="mb-2" />
                            <p-skeleton width="70%" height="0.85rem" />
                        </div>
                        <p-skeleton width="6rem" height="0.85rem" />
                    </div>
                }
            </div>
        }

        <!-- Log entries -->
        @if (!isLoading && logs.length > 0) {
            <ul class="list-none p-0 m-0 mt-2">
                @for (log of logs; track log.id) {
                    <li class="flex items-start gap-3 py-3 border-b border-surface">
                        <!-- Icon bubble -->
                        <div class="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                             [ngClass]="entityBgClass(log.entityType)">
                            <i class="pi text-sm" [ngClass]="actionIcon(log.action)"></i>
                        </div>

                        <!-- Main text -->
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 flex-wrap">
                                <p-tag [value]="log.entityType"
                                       [severity]="entitySeverity(log.entityType)"
                                       styleClass="text-xs" />
                                <span class="font-medium text-sm text-surface-900 dark:text-surface-0">{{ log.action }}</span>
                                @if (log.entityName) {
                                    <span class="text-muted-color text-sm truncate">— {{ log.entityName }}</span>
                                }
                            </div>
                            @if (log.detail) {
                                <div class="text-muted-color text-xs mt-1 truncate" [pTooltip]="log.detail" tooltipPosition="top">
                                    {{ log.detail }}
                                </div>
                            }
                        </div>

                        <!-- Timestamp -->
                        <span class="text-muted-color text-xs shrink-0 mt-0.5"
                              [pTooltip]="formatDate(log.timestamp)" tooltipPosition="left">
                            {{ timeAgo(log.timestamp) }}
                        </span>
                    </li>
                }
            </ul>

            <!-- Pagination -->
            @if (totalPages > 1) {
                <div class="flex items-center justify-between mt-4">
                    <span class="text-muted-color text-sm">Page {{ currentPage }} of {{ totalPages }}</span>
                    <div class="flex gap-2">
                        <p-button icon="pi pi-chevron-left" [text]="true" size="small"
                                  [disabled]="currentPage === 1"
                                  (click)="loadPage(currentPage - 1)" />
                        <p-button icon="pi pi-chevron-right" [text]="true" size="small"
                                  [disabled]="currentPage === totalPages"
                                  (click)="loadPage(currentPage + 1)" />
                    </div>
                </div>
            }
        }

        <!-- Empty state -->
        @if (!isLoading && logs.length === 0) {
            <div class="flex flex-col items-center justify-center py-16 text-muted-color gap-3">
                <i class="pi pi-history text-5xl opacity-30"></i>
                <span class="text-sm">No activity recorded yet.</span>
            </div>
        }

        <!-- Error state -->
        @if (error) {
            <div class="flex flex-col items-center justify-center py-16 text-muted-color gap-3">
                <i class="pi pi-exclamation-circle text-4xl text-red-400"></i>
                <span class="text-sm">Failed to load activity log.</span>
            </div>
        }
    </div>
    `
})
export class UserSettings implements OnInit {
    private authService = inject(AuthService);
    private logService = inject(LogService);

    logs: LogEntry[] = [];
    isLoading = true;
    error = false;
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

    private initialized = false;

    constructor() {
        effect(() => {
            const user = this.authService.currentUser();
            if (user && !this.initialized) {
                this.initialized = true;
                this.loadPage(1);
            }
        });
    }

    ngOnInit(): void {}

    loadPage(page: number): void {
        const userId = this.authService.currentUser()?.id;
        if (!userId) return;

        this.isLoading = true;
        this.error = false;

        this.logService.getLogs({
            userId,
            page,
            pageSize: this.pageSize,
            entityType: this.filterEntityType ?? undefined,
            dateFrom: this.filterDateFrom ? this.toLocalDateString(this.filterDateFrom) : undefined,
            dateTo:   this.filterDateTo   ? this.toLocalDateString(this.filterDateTo)   : undefined,
        }).subscribe({
            next: (res) => {
                this.logs = res.data;
                this.totalCount = res.totalCount;
                this.totalPages = res.totalPages;
                this.currentPage = res.page;
                this.isLoading = false;
            },
            error: () => {
                this.error = true;
                this.isLoading = false;
            }
        });
    }

    onFilterChange(): void {
        this.loadPage(1);
    }

    private toLocalDateString(d: Date): string {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    actionIcon(action: string): string {
        for (const key of Object.keys(ACTION_ICON)) {
            if (action.startsWith(key)) return ACTION_ICON[key];
        }
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
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 30) return `${days}d ago`;
        return new Date(timestamp).toLocaleDateString();
    }

    formatDate(timestamp: string): string {
        return new Date(timestamp).toLocaleString();
    }
}
