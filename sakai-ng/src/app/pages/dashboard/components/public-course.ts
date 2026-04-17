import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { TabsModule } from 'primeng/tabs';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { CourseService, Course as CourseData, CourseSession, CourseResource } from '@/pages/service/course.service';
import { environment } from '@environments/environment.prod';

@Component({
    selector: 'app-course',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ButtonModule, TagModule, DividerModule, TabsModule, AvatarModule, TooltipModule, DatePickerModule, DialogModule],
    template: `
    <div class="card mx-auto max-w-5xl my-6 mx-4 lg:mx-auto">
        <div *ngIf="!loading && !course" class="flex flex-col items-center justify-center py-20 text-muted-color">
            <i class="pi pi-book text-6xl mb-4 opacity-40"></i>
            <h2 class="text-2xl mb-2">Course not found</h2>
            <p class="text-sm mb-6">The course you're looking for doesn't exist or has been removed.</p>
        </div>

        <div *ngIf="loading" class="flex items-center justify-center py-16 text-muted-color gap-3">
            <i class="pi pi-spin pi-spinner"></i>
            <span>Loading course...</span>
        </div>

        <div *ngIf="course && !loading">
            <div class="flex items-start gap-3 mb-4 flex-wrap">
                <div>
                    <div class="flex items-center gap-2 flex-wrap">
                        <h2 class="text-2xl font-semibold m-0">{{ course.title }}</h2>
                        <p-tag [value]="course.status | titlecase" [severity]="getStatusSeverity(course.status)" />
                        <span *ngIf="course.level" class="text-xs text-muted-color bg-surface-100 dark:bg-surface-800 px-2 py-1 rounded-full">{{ course.level }}</span>
                    </div>
                    <p class="text-sm text-muted-color mt-1 mb-0">{{ course.projectTitle }}</p>
                </div>
            </div>

            <p-tabs [(value)]="activeTab">
                <p-tablist>
                    <p-tab value="overview">Overview</p-tab>
                    <p-tab value="modules">
                        Modules
                        <span class="ml-1 text-xs bg-primary text-white rounded-full px-1.5 py-0.5">{{ course.moduleCount }}</span>
                    </p-tab>
                    <p-tab value="schedule">
                        Schedule
                        <span *ngIf="course.sessionCount > 0" class="ml-1 text-xs bg-primary text-white rounded-full px-1.5 py-0.5">{{ course.sessionCount }}</span>
                    </p-tab>
                </p-tablist>

                <p-tabpanels>
                    <!-- Overview -->
                    <p-tabpanel value="overview">
                        <div class="flex flex-col gap-5 pt-3">
                            <div *ngIf="course.description">
                                <h5 class="text-sm font-semibold text-muted-color mb-2 tracking-wide">Description</h5>
                                <p class="text-surface-700 dark:text-surface-300 leading-relaxed m-0 whitespace-pre-wrap">{{ course.description }}</p>
                            </div>
                            <div *ngIf="!course.description" class="text-muted-color text-sm">No description provided.</div>

                            <div>
                                <div class="flex justify-between items-center mb-3">
                                    <h5 class="text-sm font-semibold text-muted-color m-0 tracking-wide">Instructors</h5>
                                </div>
                                <div *ngIf="course.instructors.length === 0" class="text-muted-color text-sm py-4 flex flex-col items-center bg-surface-50 dark:bg-surface-800 rounded-lg">
                                    <i class="pi pi-users text-2xl mb-2"></i>
                                    <p class="m-0">No instructors assigned.</p>
                                </div>
                                <div *ngIf="course.instructors.length > 0" class="flex flex-col gap-2">
                                    <div *ngFor="let inst of course.instructors" class="flex items-center gap-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                                        <p-avatar
                                            [label]="getInitials(inst.name)"
                                            shape="circle"
                                            size="large"
                                            [style]="{ 'background-color': 'var(--primary-color)', 'color': 'var(--primary-color-text)' }"
                                        ></p-avatar>
                                        <div>
                                            <p class="font-semibold m-0">{{ inst.name }}</p>
                                            <p class="text-sm text-muted-color m-0">{{ inst.role || 'Instructor' }}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </p-tabpanel>

                    <!-- Modules -->
                    <p-tabpanel value="modules">
                        <div class="pt-3">
                            <div *ngIf="course.modules.length === 0" class="flex flex-col items-center justify-center py-10 text-muted-color bg-surface-50 dark:bg-surface-800 rounded-lg">
                                <i class="pi pi-list text-4xl mb-3 opacity-40"></i>
                                <p class="m-0">No modules added yet.</p>
                            </div>

                            <div *ngIf="course.modules.length > 0" class="flex flex-col gap-4">
                                <div *ngFor="let mod of course.modules; let i = index" class="border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden">
                                    <!-- Module header -->
                                    <div class="flex items-start gap-3 p-4 bg-surface-50 dark:bg-surface-800">
                                        <div class="shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                                            {{ i + 1 }}
                                        </div>
                                        <div class="flex-1 min-w-0">
                                            <p class="font-semibold m-0 mb-1">{{ mod.title }}</p>
                                            <p *ngIf="mod.description" class="text-sm text-muted-color m-0">{{ mod.description }}</p>
                                        </div>
                                    </div>

                                    <!-- Module resources -->
                                    <div class="p-4">
                                        <div *ngIf="mod.resources.length === 0" class="text-sm text-muted-color py-3 text-center bg-surface-50 dark:bg-surface-900 rounded-lg">
                                            No resources yet.
                                        </div>

                                        <div *ngIf="mod.resources.length > 0" class="flex flex-row flex-wrap gap-2">
                                            <div *ngFor="let res of mod.resources" class="flex gap-3 p-3 border border-surface-100 dark:border-surface-700 rounded-lg w-full sm:w-[calc(50%-0.25rem)] lg:w-[calc(33.333%-0.375rem)]">
                                                <div class="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" [ngClass]="getResourceIconBg(res.type)">
                                                    <i [class]="getResourceIcon(res.type) + ' text-white text-sm'"></i>
                                                </div>
                                                <div class="flex-1 min-w-0">
                                                    <p class="font-medium m-0 mb-0.5 text-sm">{{ res.title }}</p>
                                                    <div *ngIf="res.urls.length > 0" class="flex flex-col gap-0.5 mt-0.5">
                                                        <a *ngFor="let url of res.urls" [href]="url" target="_blank" rel="noopener noreferrer" class="text-primary text-xs hover:underline flex items-center gap-1 truncate">
                                                            <i class="pi pi-external-link text-xs"></i>
                                                            <span class="truncate">{{ url }}</span>
                                                        </a>
                                                    </div>
                                                    <div *ngIf="res.files.length > 0" class="flex flex-col gap-0.5 mt-0.5">
                                                        <a *ngFor="let file of res.files" [href]="getFileDownloadUrl(file.fileId)" target="_blank" rel="noopener noreferrer" class="text-primary text-xs hover:underline flex items-center gap-1 truncate">
                                                            <i class="pi pi-download text-xs"></i>
                                                            <span class="truncate">{{ file.originalFileName }}</span>
                                                        </a>
                                                    </div>
                                                    <p *ngIf="res.description" class="text-xs text-muted-color m-0 mt-0.5">{{ res.description }}</p>
                                                    <span class="inline-block mt-1 text-xs bg-surface-100 dark:bg-surface-800 text-muted-color px-2 py-0.5 rounded-full">{{ res.type }}</span>
                                                </div>
                                                <div class="shrink-0">
                                                    <p-button icon="pi pi-eye" [text]="true" [rounded]="true" size="small" severity="secondary" (onClick)="openViewResourceDialog(res)" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </p-tabpanel>

                    <!-- Schedule -->
                    <p-tabpanel value="schedule">
                        <div class="pt-3">
                            <h5 class="text-sm font-semibold text-muted-color mb-4 tracking-wide">Course Schedule</h5>
                            <div class="flex flex-col lg:flex-row gap-6">
                                <div class="shrink-0">
                                    <p-datepicker
                                        [(ngModel)]="scheduleCalendarDate"
                                        [inline]="true"
                                        [showButtonBar]="false"
                                        dateFormat="yy-mm-dd"
                                        [readonlyInput]="true"
                                    >
                                        <ng-template #date let-date>
                                            <div class="flex flex-col items-center gap-px">
                                                <span [class.text-primary]="isSessionDate(date)" [class.font-bold]="isSessionDate(date)">{{ date.day }}</span>
                                                <span *ngIf="isSessionDate(date)" class="block w-1 h-1 rounded-full bg-primary"></span>
                                                <span *ngIf="!isSessionDate(date)" class="block w-1 h-1"></span>
                                            </div>
                                        </ng-template>
                                    </p-datepicker>
                                </div>

                                <div class="flex-1 min-w-0">
                                    <div *ngIf="course.sessions.length === 0" class="flex flex-col items-center justify-center py-10 text-muted-color bg-surface-50 dark:bg-surface-800 rounded-lg">
                                        <i class="pi pi-calendar text-4xl mb-3 opacity-40"></i>
                                        <p class="m-0 text-sm">No sessions scheduled yet.</p>
                                    </div>

                                    <div *ngIf="course.sessions.length > 0">
                                        <p class="text-sm font-medium mb-3">{{ course.sessions.length }} session{{ course.sessions.length !== 1 ? 's' : '' }} scheduled:</p>
                                        <div class="flex flex-col gap-3 max-h-96 overflow-y-auto pr-1">
                                            <div *ngFor="let session of sortedSessions(); let i = index" class="flex items-start gap-3 p-4 border border-surface-200 dark:border-surface-700 rounded-xl">
                                                <div class="shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex flex-col items-center justify-center leading-none">
                                                    <span class="text-xs font-bold text-primary">{{ sessionDate(session) | date: 'MMM' }}</span>
                                                    <span class="text-lg font-bold text-primary leading-tight">{{ sessionDate(session) | date: 'd' }}</span>
                                                </div>
                                                <div class="flex-1 min-w-0">
                                                    <div class="flex items-center gap-2 flex-wrap">
                                                        <p class="font-semibold m-0">Session {{ i + 1 }}</p>
                                                        <span class="text-xs bg-surface-100 dark:bg-surface-800 text-muted-color px-2 py-0.5 rounded-full">{{ session.type }}</span>
                                                    </div>
                                                    <p class="text-sm text-muted-color m-0 mt-1">{{ sessionDate(session) | date: 'EEEE, MMMM d, y' }} at {{ sessionDate(session) | date: 'shortTime' }}</p>
                                                    <p class="text-sm text-muted-color m-0 mt-1">{{ session.location }}</p>
                                                    <p *ngIf="session.notes" class="text-xs text-muted-color m-0 mt-2">{{ session.notes }}</p>
                                                </div>
                                                <div class="shrink-0">
                                                    <p-button icon="pi pi-eye" [text]="true" [rounded]="true" size="small" severity="secondary" (onClick)="openViewSessionDialog(session, i + 1)" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </p-tabpanel>
                </p-tabpanels>
            </p-tabs>
        </div>
    </div>

    <!-- View Resource Dialog -->
    <p-dialog
        [(visible)]="viewResourceDialogVisible"
        [modal]="true"
        [style]="{ width: '36rem' }"
        appendTo="body"
    >
        <div *ngIf="viewingResource" class="flex flex-col gap-4 pt-2">
            <div class="flex items-start gap-3">
                <div class="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" [ngClass]="getResourceIconBg(viewingResource.type)">
                    <i [class]="getResourceIcon(viewingResource.type) + ' text-white'"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <h3 class="text-base m-0">{{ viewingResource.title }}</h3>
                    <span class="inline-block mt-1 text-xs bg-surface-100 dark:bg-surface-800 text-muted-color px-2 py-0.5 rounded-full">{{ viewingResource.type }}</span>
                </div>
            </div>

            <p *ngIf="viewingResource.description" class="text-sm text-muted-color m-0">{{ viewingResource.description }}</p>

            <div *ngIf="viewingResource.urls.length > 0">
                <p class="text-sm font-medium mb-2">Links</p>
                <div class="flex flex-col gap-2">
                    <a *ngFor="let url of viewingResource.urls" [href]="url" target="_blank" rel="noopener noreferrer"
                        class="flex items-center gap-2 text-sm text-primary hover:underline break-all">
                        <i class="pi pi-external-link shrink-0"></i>
                        <span>{{ url }}</span>
                    </a>
                </div>
            </div>

            <div *ngIf="viewingResource.files.length > 0">
                <p class="text-sm font-medium mb-2">Attachments</p>
                <div class="flex flex-col gap-2">
                    <a *ngFor="let file of viewingResource.files"
                        [href]="getFileDownloadUrl(file.fileId)"
                        target="_blank" rel="noopener noreferrer"
                        class="flex items-center gap-2 text-sm text-primary hover:underline">
                        <i class="pi pi-download shrink-0"></i>
                        <span class="truncate">{{ file.originalFileName }}</span>
                    </a>
                </div>
            </div>
        </div>
        <div class="flex justify-end mt-6">
            <p-button label="Close" severity="secondary" (onClick)="viewResourceDialogVisible = false" />
        </div>
    </p-dialog>

    <!-- View Session Dialog -->
    <p-dialog
        [(visible)]="viewSessionDialogVisible"
        [modal]="true"
        [style]="{ width: '32rem' }"
        appendTo="body"
    >
        <div *ngIf="viewingSession" class="flex flex-col gap-4 pt-2">
            <div class="flex items-start gap-3">
                <div class="shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex flex-col items-center justify-center leading-none">
                    <span class="text-xs font-bold text-primary">{{ sessionDate(viewingSession) | date: 'MMM' }}</span>
                    <span class="text-lg font-bold text-primary leading-tight">{{ sessionDate(viewingSession) | date: 'd' }}</span>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="font-semibold m-0">Session {{ viewingSessionIndex }}</p>
                    <span class="inline-block mt-1 text-xs bg-surface-100 dark:bg-surface-800 text-muted-color px-2 py-0.5 rounded-full">{{ viewingSession.type }}</span>
                </div>
            </div>

            <div class="flex flex-col gap-2 text-sm">
                <div class="flex items-center gap-2 text-muted-color">
                    <i class="pi pi-calendar text-xs shrink-0"></i>
                    <span>{{ sessionDate(viewingSession) | date: 'EEEE, MMMM d, y' }}</span>
                </div>
                <div class="flex items-center gap-2 text-muted-color">
                    <i class="pi pi-clock text-xs shrink-0"></i>
                    <span>{{ sessionDate(viewingSession) | date: 'shortTime' }}</span>
                </div>
                <div *ngIf="viewingSession.location" class="flex items-center gap-2 text-muted-color">
                    <i class="pi pi-map-marker text-xs shrink-0"></i>
                    <span>{{ viewingSession.location }}</span>
                </div>
            </div>

            <div *ngIf="viewingSession.notes">
                <p class="text-sm font-medium mb-1">Notes</p>
                <p class="text-sm text-muted-color m-0 whitespace-pre-wrap">{{ viewingSession.notes }}</p>
            </div>
        </div>
        <div class="flex justify-end mt-6">
            <p-button label="Close" severity="secondary" (onClick)="viewSessionDialogVisible = false" />
        </div>
    </p-dialog>
    `
})
export class Course implements OnInit {
    course: CourseData | undefined;
    loading = true;
    activeTab = 'overview';
    scheduleCalendarDate: Date | null = null;
    viewResourceDialogVisible = false;
    viewingResource: CourseResource | null = null;
    viewSessionDialogVisible = false;
    viewingSession: CourseSession | null = null;
    viewingSessionIndex = 0;

    constructor(
        private route: ActivatedRoute,
        private courseService: CourseService
    ) { }

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('courseId');
        if (!id) {
            this.loading = false;
            return;
        }

        this.courseService.getCourse(id, true).subscribe({
            next: (course) => {
                this.course = course;
                this.loading = false;
            },
            error: () => {
                this.course = undefined;
                this.loading = false;
            }
        });
    }

    sessionDate(session: CourseSession): Date {
        return new Date(`${session.date}T${session.hour.slice(0, 5)}:00`);
    }

    sortedSessions(): CourseSession[] {
        if (!this.course) return [];
        return [...this.course.sessions].sort((a, b) => this.sessionDate(a).getTime() - this.sessionDate(b).getTime());
    }

    isSessionDate(date: { year: number; month: number; day: number }): boolean {
        if (!this.course) return false;
        return this.course.sessions.some((session) => {
            const d = new Date(`${session.date}T00:00:00`);
            return d.getFullYear() === date.year && d.getMonth() === date.month && d.getDate() === date.day;
        });
    }

    openViewResourceDialog(resource: CourseResource): void {
        this.viewingResource = resource;
        this.viewResourceDialogVisible = true;
    }

    openViewSessionDialog(session: CourseSession, index: number): void {
        this.viewingSession = session;
        this.viewingSessionIndex = index;
        this.viewSessionDialogVisible = true;
    }

    getFileDownloadUrl(fileId: string): string {
        return `${environment.apiUrl}/Files/${fileId}/download`;
    }

    getInitials(name: string): string {
        if (!name) return '?';
        const parts = name.trim().split(' ').filter((p) => p.length > 0);
        if (parts.length === 0) return '?';
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }

    getStatusSeverity(status: string): 'success' | 'warn' | 'secondary' | 'info' | 'danger' | 'contrast' | undefined {
        switch (status) {
            case 'active': return 'success';
            case 'draft': return 'secondary';
            case 'completed': return 'info';
            default: return undefined;
        }
    }

    getResourceIcon(type: string): string {
        switch (type) {
            case 'documentation': return 'pi pi-file-pdf';
            case 'tutorial': return 'pi pi-play-circle';
            case 'tool': return 'pi pi-wrench';
            case 'reference': return 'pi pi-link';
            default: return 'pi pi-paperclip';
        }
    }

    getResourceIconBg(type: string): string {
        switch (type) {
            case 'documentation': return 'bg-blue-400';
            case 'tutorial': return 'bg-red-400';
            case 'tool': return 'bg-yellow-500';
            case 'reference': return 'bg-green-400';
            default: return 'bg-surface-400';
        }
    }
}