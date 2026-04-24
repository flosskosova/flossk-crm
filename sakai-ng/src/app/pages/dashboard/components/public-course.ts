import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TabsModule } from 'primeng/tabs';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { CourseService, Course as CourseData, CourseInstructor, CourseSession, CourseResource } from '@/pages/service/course.service';
import { AuthService } from '@/pages/service/auth.service';
import { environment } from '@environments/environment.prod';

@Component({
    selector: 'app-course',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ButtonModule, DividerModule, TabsModule, AvatarModule, TooltipModule, DatePickerModule, DialogModule],
    template: `
    <div class="max-w-7xl my-8 mx-4 lg:mx-auto">

        <!-- Not found state -->
        <div *ngIf="!loading && !course" class="card flex flex-col items-center justify-center py-24 text-muted-color">
            <i class="pi pi-book text-6xl mb-5 opacity-20"></i>
            <h2 class="text-2xl font-semibold mb-2">Course not found</h2>
            <p class="text-sm">The course you're looking for doesn't exist or has been removed.</p>
        </div>

        <!-- Loading state -->
        <div *ngIf="loading" class="card flex items-center justify-center py-24 text-muted-color gap-3">
            <i class="pi pi-spin pi-spinner text-xl"></i>
            <span class="text-base">Loading course...</span>
        </div>

        <!-- Course content -->
        <div *ngIf="course && !loading">

            <!-- Hero banner -->
            <div class="rounded-2xl overflow-hidden mb-6 relative" style="background: linear-gradient(135deg, var(--p-primary-700, #3730a3) 0%, var(--p-primary-400, #818cf8) 100%);">
                <div class="absolute inset-0 opacity-[0.07]" style="background-image: radial-gradient(circle at 1px 1px, white 1px, transparent 0); background-size: 28px 28px;"></div>
                <div class="relative px-8 py-10 lg:py-12">
                    <div class="flex items-start justify-between gap-8 flex-wrap">
                        <div class="flex-1 min-w-0">
                            <p class="text-xs font-bold tracking-widest uppercase text-white/60 m-0 mb-3">{{ course.projectTitle }}</p>
                            <h1 class="text-3xl lg:text-4xl font-bold text-white! m-0 mb-5 leading-tight">{{ course.title }}</h1>
                            <div class="flex items-center gap-5 flex-wrap">
                                <div class="flex items-center gap-2 text-white/75 text-sm font-medium">
                                    <div class="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                                        <i class="pi pi-book text-xs"></i>
                                    </div>
                                    <span>{{ course.modules.length }} Module{{ course.modules.length !== 1 ? 's' : '' }}</span>
                                </div>
                                <div class="flex items-center gap-2 text-white/75 text-sm font-medium">
                                    <div class="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                                        <i class="pi pi-calendar text-xs"></i>
                                    </div>
                                    <span>{{ course.sessions.length }} Session{{ course.sessions.length !== 1 ? 's' : '' }}</span>
                                </div>
                                <div *ngIf="course.instructors.length > 0" class="flex items-center gap-2 text-white/75 text-sm font-medium">
                                    <div class="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                                        <i class="pi pi-users text-xs"></i>
                                    </div>
                                    <span>{{ course.instructors.length }} Instructor{{ course.instructors.length !== 1 ? 's' : '' }}</span>
                                </div>
                            </div>
                        </div>
                        <div *ngIf="currentUser()" class="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-5 py-4 shrink-0">
                            <div class="min-w-0">
                                <p class="font-bold text-sm text-white m-0 leading-tight">{{ currentUser()!.firstName }} {{ currentUser()!.lastName }}</p>
                                <p class="text-xs text-white/60 m-0 truncate mt-0.5">{{ currentUser()!.email }}</p>
                                <span *ngIf="currentUser()!.role" class="inline-block mt-1.5 text-xs bg-white/15 text-white px-2.5 py-0.5 rounded-full font-medium">{{ currentUser()!.role }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Main content card -->
            <div class="card">
            <p-tabs [(value)]="activeTab">
                <p-tablist>
                    <p-tab value="overview"><i class="pi pi-info-circle mr-2 text-sm"></i>Overview</p-tab>
                    <p-tab value="modules">
                        <i class="pi pi-list mr-2 text-sm"></i>Modules
                        <span class="ml-2 text-xs bg-primary text-white rounded-full px-2 py-0.5 font-semibold">{{ course.modules.length }}</span>
                    </p-tab>
                    <p-tab value="schedule">
                        <i class="pi pi-calendar mr-2 text-sm"></i>Schedule
                        <span *ngIf="course.sessions.length > 0" class="ml-2 text-xs bg-primary text-white rounded-full px-2 py-0.5 font-semibold">{{ course.sessions.length }}</span>
                    </p-tab>
                    <p-tab value="members">
                        <i class="pi pi-users mr-2 text-sm"></i>Members
                        <span *ngIf="courseMembers().length > 0" class="ml-2 text-xs bg-primary text-white rounded-full px-2 py-0.5 font-semibold">{{ courseMembers().length }}</span>
                    </p-tab>
                </p-tablist>

                <p-tabpanels>
                    <!-- Overview -->
                    <p-tabpanel value="overview">
                        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-5">
                            <!-- Main: Description -->
                            <div class="lg:col-span-2 flex flex-col gap-4">
                                <div class="flex items-center gap-3">
                                    <span class="text-xs font-bold tracking-widest uppercase text-muted-color">About this course</span>
                                    <div class="flex-1 h-px bg-surface-200 dark:bg-surface-700"></div>
                                </div>
                                <div *ngIf="course.description" class="text-surface-700 dark:text-surface-300 leading-relaxed whitespace-pre-wrap">{{ course.description }}</div>
                                <div *ngIf="!course.description" class="flex flex-col items-center justify-center py-12 text-muted-color bg-surface-50 dark:bg-surface-800 rounded-2xl border border-dashed border-surface-200 dark:border-surface-700">
                                    <i class="pi pi-align-left text-3xl mb-3 opacity-30"></i>
                                    <p class="m-0 text-sm">No description provided.</p>
                                </div>
                            </div>

                            <!-- Sidebar: Instructors -->
                            <div class="lg:col-span-1 flex flex-col gap-4">
                                <div class="flex items-center gap-3">
                                    <span class="text-xs font-bold tracking-widest uppercase text-muted-color">Instructors</span>
                                    <div class="flex-1 h-px bg-surface-200 dark:bg-surface-700"></div>
                                </div>
                                <div *ngIf="course.instructors.length === 0" class="flex flex-col items-center justify-center py-10 text-muted-color bg-surface-50 dark:bg-surface-800 rounded-2xl border border-dashed border-surface-200 dark:border-surface-700">
                                    <i class="pi pi-users text-2xl mb-2 opacity-30"></i>
                                    <p class="m-0 text-sm">No instructors assigned.</p>
                                </div>
                                <div *ngIf="course.instructors.length > 0" class="flex flex-col gap-2">
                                    <div *ngFor="let inst of course.instructors" class="flex items-center gap-3 p-3.5 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl transition-colors hover:border-primary/40">
                                        <p-avatar
                                            [label]="getInstructorInitials(inst)"
                                            shape="circle"
                                            size="large"
                                            [style]="{ 'background-color': 'var(--primary-color)', 'color': 'var(--primary-color-text)' }"
                                        ></p-avatar>
                                        <div>
                                            <p class="font-semibold text-sm m-0">{{ getInstructorName(inst) }}</p>
                                            <p class="text-xs text-muted-color m-0 mt-0.5">{{ inst.role || 'Instructor' }}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </p-tabpanel>

                    <!-- Modules -->
                    <p-tabpanel value="modules">
                        <div class="pt-5">
                            <div *ngIf="course.modules.length === 0" class="flex flex-col items-center justify-center py-16 text-muted-color bg-surface-50 dark:bg-surface-800 rounded-2xl border border-dashed border-surface-200 dark:border-surface-700">
                                <i class="pi pi-list text-4xl mb-3 opacity-25"></i>
                                <p class="m-0">No modules added yet.</p>
                            </div>

                            <div *ngIf="course.modules.length > 0" class="flex flex-col gap-5">
                                <div *ngFor="let mod of course.modules; let i = index" class="border border-surface-200 dark:border-surface-700 rounded-2xl overflow-hidden shadow-sm">
                                    <!-- Module header -->
                                    <div class="flex items-start gap-4 p-5 bg-surface-50 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
                                        <div class="shrink-0 w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center text-sm font-bold shadow-sm">
                                            {{ i + 1 }}
                                        </div>
                                        <div class="flex-1 min-w-0">
                                            <p class="font-bold text-base m-0 mb-1">{{ mod.title }}</p>
                                            <p *ngIf="mod.description" class="text-sm text-muted-color m-0 leading-relaxed">{{ mod.description }}</p>
                                        </div>
                                        <span class="shrink-0 text-xs text-muted-color bg-surface-200 dark:bg-surface-700 px-3 py-1 rounded-full font-semibold">
                                            {{ mod.resources.length }} resource{{ mod.resources.length !== 1 ? 's' : '' }}
                                        </span>
                                    </div>

                                    <!-- Module resources -->
                                    <div class="p-5">
                                        <div *ngIf="mod.resources.length === 0" class="text-sm text-muted-color py-5 text-center bg-surface-50 dark:bg-surface-900 rounded-xl border border-dashed border-surface-200 dark:border-surface-700">
                                            No resources yet.
                                        </div>

                                        <div *ngIf="mod.resources.length > 0" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                                            <div *ngFor="let res of mod.resources" class="group flex flex-col gap-3 p-4 border border-surface-100 dark:border-surface-700 rounded-xl bg-surface-0 dark:bg-surface-900 hover:border-primary/40 hover:shadow-md transition-all">
                                                <div class="flex items-start gap-3">
                                                    <div class="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center shadow-sm" [ngClass]="getResourceIconBg(res.type)">
                                                        <i [class]="getResourceIcon(res.type) + ' text-white text-sm'"></i>
                                                    </div>
                                                    <div class="flex-1 min-w-0">
                                                        <p class="font-semibold m-0 text-sm leading-snug">{{ res.title }}</p>
                                                        <span class="inline-block mt-1 text-xs bg-surface-100 dark:bg-surface-800 text-muted-color px-2 py-0.5 rounded-full">{{ res.type }}</span>
                                                    </div>
                                                    <p-button icon="pi pi-arrow-up-right" [text]="true" [rounded]="true" size="small" severity="secondary" (onClick)="openViewResourceDialog(res)" />
                                                </div>
                                                <p *ngIf="res.description" class="text-xs text-muted-color m-0 leading-relaxed">{{ res.description }}</p>
                                                <div *ngIf="res.urls.length > 0" class="flex flex-col gap-1">
                                                    <a *ngFor="let url of res.urls" [href]="url" target="_blank" rel="noopener noreferrer" class="text-primary text-xs hover:underline flex items-center gap-1.5 truncate">
                                                        <i class="pi pi-external-link text-xs shrink-0"></i>
                                                        <span class="truncate">{{ url }}</span>
                                                    </a>
                                                </div>
                                                <div *ngIf="res.files.length > 0" class="flex flex-col gap-1">
                                                    <a *ngFor="let file of res.files" [href]="getFileDownloadUrl(file.fileId)" target="_blank" rel="noopener noreferrer" class="text-primary text-xs hover:underline flex items-center gap-1.5 truncate">
                                                        <i class="pi pi-download text-xs shrink-0"></i>
                                                        <span class="truncate">{{ file.originalFileName }}</span>
                                                    </a>
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
                        <div class="pt-5">
                            <div class="flex flex-col lg:flex-row gap-8">
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
                                                <span *ngIf="isSessionDate(date)" class="block w-1.5 h-1.5 rounded-full bg-primary"></span>
                                                <span *ngIf="!isSessionDate(date)" class="block w-1 h-1"></span>
                                            </div>
                                        </ng-template>
                                    </p-datepicker>
                                </div>

                                <div class="flex-1 min-w-0">
                                    <div *ngIf="course.sessions.length === 0" class="flex flex-col items-center justify-center h-full py-16 text-muted-color bg-surface-50 dark:bg-surface-800 rounded-2xl border border-dashed border-surface-200 dark:border-surface-700">
                                        <i class="pi pi-calendar text-4xl mb-3 opacity-25"></i>
                                        <p class="m-0 text-sm">No sessions scheduled yet.</p>
                                    </div>

                                    <div *ngIf="course.sessions.length > 0">
                                        <div class="flex items-center gap-3 mb-5">
                                            <span class="text-xs font-bold tracking-widest uppercase text-muted-color">{{ course.sessions.length }} Session{{ course.sessions.length !== 1 ? 's' : '' }} Scheduled</span>
                                            <div class="flex-1 h-px bg-surface-200 dark:bg-surface-700"></div>
                                        </div>
                                        <div class="flex flex-col gap-3 max-h-120 overflow-y-auto pr-1">
                                            <div *ngFor="let session of sortedSessions(); let i = index" class="flex items-start gap-4 p-4 border border-surface-200 dark:border-surface-700 rounded-xl bg-surface-0 dark:bg-surface-900 hover:border-primary/40 hover:shadow-sm transition-all">
                                                <div class="shrink-0 w-14 h-14 rounded-xl bg-primary/10 dark:bg-primary/20 flex flex-col items-center justify-center leading-none border border-primary/20">
                                                    <span class="text-[10px] font-bold text-primary tracking-wider">{{ sessionDate(session) | date: 'MMM' | uppercase }}</span>
                                                    <span class="text-2xl font-bold text-primary leading-tight">{{ sessionDate(session) | date: 'd' }}</span>
                                                </div>
                                                <div class="flex-1 min-w-0">
                                                    <div class="flex items-center gap-2 flex-wrap mb-2">
                                                        <p class="font-bold text-sm m-0">Session {{ i + 1 }}</p>
                                                        <span class="text-xs bg-surface-100 dark:bg-surface-800 text-muted-color px-2.5 py-0.5 rounded-full font-medium">{{ session.type }}</span>
                                                    </div>
                                                    <div class="flex flex-col gap-1">
                                                        <div class="flex items-center gap-2 text-xs text-muted-color">
                                                            <i class="pi pi-calendar text-xs shrink-0"></i>
                                                            <span>{{ sessionDate(session) | date: 'EEEE, MMMM d, y' }}</span>
                                                        </div>
                                                        <div class="flex items-center gap-2 text-xs text-muted-color">
                                                            <i class="pi pi-clock text-xs shrink-0"></i>
                                                            <span>{{ sessionDate(session) | date: 'shortTime' }}</span>
                                                        </div>
                                                        <div *ngIf="session.location" class="flex items-center gap-2 text-xs text-muted-color">
                                                            <i class="pi pi-map-marker text-xs shrink-0"></i>
                                                            <span>{{ session.location }}</span>
                                                        </div>
                                                    </div>
                                                    <p *ngIf="session.notes" class="text-xs text-muted-color m-0 mt-2 leading-relaxed">{{ session.notes }}</p>
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
                    <!-- Members -->
                    <p-tabpanel value="members">
                        <div class="pt-5">
                            <div *ngIf="courseMembers().length === 0" class="flex flex-col items-center justify-center py-16 text-muted-color bg-surface-50 dark:bg-surface-800 rounded-2xl border border-dashed border-surface-200 dark:border-surface-700">
                                <i class="pi pi-users text-4xl mb-3 opacity-25"></i>
                                <p class="m-0 text-sm">No members have redeemed a voucher yet.</p>
                            </div>

                            <div *ngIf="courseMembers().length > 0">
                                <div class="flex items-center gap-3 mb-5">
                                    <span class="text-xs font-bold tracking-widest uppercase text-muted-color">{{ courseMembers().length }} Enrolled Member{{ courseMembers().length !== 1 ? 's' : '' }}</span>
                                    <div class="flex-1 h-px bg-surface-200 dark:bg-surface-700"></div>
                                </div>
                                <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                                    <div *ngFor="let member of courseMembers()" class="flex items-center gap-3 p-4 border border-surface-200 dark:border-surface-700 rounded-xl bg-surface-0 dark:bg-surface-900 hover:border-primary/40 hover:shadow-sm transition-all">
                                        <div class="flex-1 min-w-0">
                                            <p class="font-semibold text-sm m-0 truncate">{{ member.name }}</p>
                                            <p class="text-xs text-muted-color m-0 truncate mt-0.5">{{ member.email }}</p>
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
    private authService = inject(AuthService);

    readonly currentUser = this.authService.currentUser;

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
        const slug = this.route.snapshot.paramMap.get('slug');
        if (!slug) {
            this.loading = false;
            return;
        }

        this.courseService.getCourseBySlug(slug).subscribe({
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

    currentUserInitials(): string {
        const u = this.currentUser();
        if (!u) return '?';
        const first = u.firstName?.charAt(0) ?? '';
        const last = u.lastName?.charAt(0) ?? '';
        return (first + last).toUpperCase() || u.email.charAt(0).toUpperCase();
    }

    getFileDownloadUrl(fileId: string): string {
        const downloadUrl = new URL(`${environment.apiUrl}/Files/${fileId}/download`);
        const token = this.authService.getToken();

        if (token) {
            downloadUrl.searchParams.set('token', token);
        }

        return downloadUrl.toString();
    }

    getInstructorName(instructor: CourseInstructor): string {
        const name = `${instructor.firstName ?? ''} ${instructor.lastName ?? ''}`.trim();
        return name || instructor.userId;
    }

    getInstructorInitials(instructor: CourseInstructor): string {
        const parts = this.getInstructorName(instructor).split(' ').filter((p) => p.length > 0);
        if (parts.length === 0) return '?';
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }

    getResourceIcon(type: string): string {
        switch (type) {
            case 'Documentation': return 'pi pi-file-pdf';
            case 'Tutorial': return 'pi pi-play-circle';
            case 'Tool': return 'pi pi-wrench';
            case 'Reference': return 'pi pi-link';
            default: return 'pi pi-paperclip';
        }
    }

    getResourceIconBg(type: string): string {
        switch (type) {
            case 'Documentation': return 'bg-blue-400';
            case 'Tutorial': return 'bg-red-400';
            case 'Tool': return 'bg-yellow-500';
            case 'Reference': return 'bg-green-400';
            default: return 'bg-surface-400';
        }
    }

    private static readonly AVATAR_COLORS = [
        '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
        '#10b981', '#3b82f6', '#ef4444', '#14b8a6',
    ];

    courseMembers(): { email: string; name: string; initials: string; color: string }[] {
        if (!this.course) return [];
        const emails = [...new Set(this.course.vouchers.flatMap((v) => v.redeemedByEmails))];
        return emails.map((email, i) => {
            const local = email.split('@')[0] ?? '';
            const parts = local.split(/[._-]/).filter((p) => p.length > 0);
            const name = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ') || email;
            const initials = parts.length >= 2
                ? (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
                : local.slice(0, 2).toUpperCase();
            const color = Course.AVATAR_COLORS[i % Course.AVATAR_COLORS.length];
            return { email, name, initials, color };
        });
    }
}