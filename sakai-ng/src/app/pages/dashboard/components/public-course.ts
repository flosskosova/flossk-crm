import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { TabsModule } from 'primeng/tabs';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { CourseService, Course as CourseData, CourseResource, CourseSession } from '@/pages/service/course.service';

@Component({
    selector: 'app-course',
    standalone: true,
    imports: [CommonModule, RouterModule, ButtonModule, TagModule, DividerModule, TabsModule, AvatarModule, TooltipModule],
    template: `
        <div *ngIf="!loading && !course" class="card flex flex-col items-center justify-center py-20 text-muted-color">
            <i class="pi pi-book text-6xl mb-4 opacity-40"></i>
            <h2 class="text-2xl font-semibold mb-2">Course not found</h2>
            <p class="text-sm mb-6">The course you're looking for doesn't exist or has been removed.</p>
        </div>

        <div *ngIf="course">
            <div class="card">
                <div class="flex justify-between items-start mb-6 flex-wrap gap-3">
                    <div class="flex items-center gap-3">
                        <p-button icon="pi pi-arrow-left" [text]="true" [rounded]="true" severity="secondary" pTooltip="Back to courses" routerLink="/dashboard/course-portal" />
                        <div>
                            <div class="flex items-center gap-2 flex-wrap mb-1">
                                <h1 class="text-2xl font-semibold m-0">{{ course.title }}</h1>
                                <p-tag [value]="course.status | titlecase" [severity]="getStatusSeverity(course.status)" />
                            </div>
                            <div class="flex items-center gap-3 text-sm text-muted-color flex-wrap">
                                <span *ngIf="course.level" class="flex items-center gap-1">
                                    <i class="pi pi-chart-bar text-xs"></i> {{ course.level }}
                                </span>
                                <span class="flex items-center gap-1">
                                    <i class="pi pi-briefcase text-xs"></i> {{ course.projectTitle }}
                                </span>
                                <span class="flex items-center gap-1">
                                    <i class="pi pi-list text-xs"></i> {{ course.moduleCount }} {{ course.moduleCount === 1 ? 'module' : 'modules' }}
                                </span>
                                <span class="flex items-center gap-1">
                                    <i class="pi pi-link text-xs"></i> {{ course.resourceCount }} {{ course.resourceCount === 1 ? 'resource' : 'resources' }}
                                </span>
                                <span class="flex items-center gap-1">
                                    <i class="pi pi-calendar text-xs"></i> {{ course.sessionCount }} {{ course.sessionCount === 1 ? 'session' : 'sessions' }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <p-tabs [(value)]="activeTab">
                    <p-tablist>
                        <p-tab value="overview">Overview</p-tab>
                        <p-tab value="modules">
                            Modules
                            <span *ngIf="course.moduleCount > 0" class="ml-1 text-xs bg-primary text-white rounded-full px-1.5 py-0.5">{{ course.moduleCount }}</span>
                        </p-tab>
                        <p-tab value="resources">
                            Resources
                            <span *ngIf="course.resourceCount > 0" class="ml-1 text-xs bg-primary text-white rounded-full px-1.5 py-0.5">{{ course.resourceCount }}</span>
                        </p-tab>
                        <p-tab value="schedule">
                            Schedule
                            <span *ngIf="course.sessionCount > 0" class="ml-1 text-xs bg-primary text-white rounded-full px-1.5 py-0.5">{{ course.sessionCount }}</span>
                        </p-tab>
                    </p-tablist>

                    <p-tabpanels>
                        <p-tabpanel value="overview">
                            <div class="flex flex-col gap-6 pt-4">
                                <div *ngIf="course.description">
                                    <h5 class="text-sm font-semibold text-muted-color mb-2 tracking-wide uppercase">About this course</h5>
                                    <p class="text-surface-700 dark:text-surface-300 leading-relaxed m-0 whitespace-pre-wrap">{{ course.description }}</p>
                                </div>
                                <div *ngIf="!course.description" class="text-muted-color text-sm">No description provided.</div>

                                <p-divider />

                                <div>
                                    <h5 class="text-sm font-semibold text-muted-color mb-3 tracking-wide uppercase">Instructors</h5>
                                    <div *ngIf="course.instructors.length === 0" class="text-muted-color text-sm py-6 flex flex-col items-center bg-surface-50 dark:bg-surface-800 rounded-lg">
                                        <i class="pi pi-users text-2xl mb-2"></i>
                                        <p class="m-0">No instructors listed.</p>
                                    </div>
                                    <div *ngIf="course.instructors.length > 0" class="flex flex-col gap-2">
                                        <div *ngFor="let inst of course.instructors" class="flex items-center gap-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                                            <p-avatar [label]="getInitials(inst.name)" shape="circle" size="large" [style]="{ 'background-color': 'var(--primary-color)', 'color': 'var(--primary-color-text)' }"></p-avatar>
                                            <div>
                                                <p class="font-semibold m-0">{{ inst.name }}</p>
                                                <p class="text-sm text-muted-color m-0">{{ inst.role || 'Instructor' }}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </p-tabpanel>

                        <p-tabpanel value="modules">
                            <div class="pt-4">
                                <div *ngIf="course.modules.length === 0" class="flex flex-col items-center justify-center py-12 text-muted-color bg-surface-50 dark:bg-surface-800 rounded-lg">
                                    <i class="pi pi-list text-4xl mb-3 opacity-40"></i>
                                    <p class="m-0">No modules added yet.</p>
                                </div>
                                <div *ngIf="course.modules.length > 0" class="flex flex-col gap-3">
                                    <div *ngFor="let mod of course.modules; let i = index" class="flex items-start gap-3 p-4 border border-surface-200 dark:border-surface-700 rounded-xl">
                                        <div class="shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                                            {{ i + 1 }}
                                        </div>
                                        <div class="flex-1 min-w-0">
                                            <p class="font-semibold m-0 mb-1">{{ mod.title }}</p>
                                            <p *ngIf="mod.description" class="text-sm text-muted-color m-0">{{ mod.description }}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </p-tabpanel>

                        <p-tabpanel value="resources">
                            <div class="pt-4">
                                <div *ngIf="resources.length === 0" class="flex flex-col items-center justify-center py-12 text-muted-color bg-surface-50 dark:bg-surface-800 rounded-lg">
                                    <i class="pi pi-link text-4xl mb-3 opacity-40"></i>
                                    <p class="m-0">No resources added yet.</p>
                                </div>
                                <div *ngIf="resources.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div *ngFor="let res of resources" class="flex gap-3 p-4 border border-surface-200 dark:border-surface-700 rounded-xl">
                                        <div class="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" [ngClass]="getResourceIconBg(res.type)">
                                            <i [class]="getResourceIcon(res.type) + ' text-white'"></i>
                                        </div>
                                        <div class="flex-1 min-w-0">
                                            <p class="font-semibold m-0 mb-0.5">{{ res.title }}</p>
                                            <p class="text-xs text-muted-color m-0 mb-1">Module: {{ res.moduleTitle }}</p>
                                            <a *ngIf="res.url" [href]="res.url" target="_blank" rel="noopener noreferrer" class="text-primary text-sm hover:underline flex items-center gap-1 truncate">
                                                <i class="pi pi-external-link text-xs"></i>
                                                <span class="truncate">{{ res.url }}</span>
                                            </a>
                                            <p *ngIf="res.description" class="text-xs text-muted-color m-0 mt-1">{{ res.description }}</p>
                                            <span class="inline-block mt-1 text-xs bg-surface-100 dark:bg-surface-800 text-muted-color px-2 py-0.5 rounded-full">{{ res.type }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </p-tabpanel>

                        <p-tabpanel value="schedule">
                            <div class="pt-4">
                                <h5 class="text-sm font-semibold text-muted-color mb-4 tracking-wide uppercase">Scheduled Sessions</h5>
                                <div *ngIf="course.sessions.length === 0" class="flex flex-col items-center justify-center py-12 text-muted-color bg-surface-50 dark:bg-surface-800 rounded-lg">
                                    <i class="pi pi-calendar text-4xl mb-3 opacity-40"></i>
                                    <p class="m-0">No sessions scheduled yet.</p>
                                </div>
                                <div *ngIf="course.sessions.length > 0" class="flex flex-col gap-2">
                                    <div *ngFor="let session of sortedSessions(); let i = index" class="flex items-center gap-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                                        <div class="shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex flex-col items-center justify-center leading-none">
                                            <span class="text-xs font-bold text-primary">{{ sessionDate(session) | date: 'MMM' }}</span>
                                            <span class="text-lg font-bold text-primary leading-tight">{{ sessionDate(session) | date: 'd' }}</span>
                                        </div>
                                        <div>
                                            <p class="font-medium m-0">Session {{ i + 1 }}</p>
                                            <p class="text-sm text-muted-color m-0">{{ sessionDate(session) | date: 'EEEE, MMMM d, y' }} at {{ sessionDate(session) | date: 'shortTime' }}</p>
                                            <p class="text-sm text-muted-color m-0">{{ session.location }}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </p-tabpanel>
                    </p-tabpanels>
                </p-tabs>
            </div>
        </div>
    `
})
export class Course implements OnInit {
    course: CourseData | undefined;
    loading = true;
    activeTab = 'overview';

    get resources(): CourseResource[] {
        if (!this.course) {
            return [];
        }

        return this.course.modules.flatMap((module) => module.resources);
    }

    constructor(
        private route: ActivatedRoute,
        private courseService: CourseService
    ) {}

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
        if (!this.course) {
            return [];
        }

        return [...this.course.sessions].sort((left, right) => this.sessionDate(left).getTime() - this.sessionDate(right).getTime());
    }

    getInitials(name: string): string {
        if (!name) return '?';
        const parts = name.trim().split(' ').filter((part) => part.length > 0);
        if (parts.length === 0) return '?';
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }

    getStatusSeverity(status: string): 'success' | 'warn' | 'secondary' | 'info' | 'danger' | 'contrast' | undefined {
        switch (status) {
            case 'active':
                return 'success';
            case 'draft':
                return 'secondary';
            case 'completed':
                return 'info';
            default:
                return undefined;
        }
    }

    getResourceIcon(type: string): string {
        switch (type) {
            case 'documentation':
                return 'pi pi-file-pdf';
            case 'tutorial':
                return 'pi pi-play-circle';
            case 'tool':
                return 'pi pi-wrench';
            case 'reference':
                return 'pi pi-link';
            default:
                return 'pi pi-paperclip';
        }
    }

    getResourceIconBg(type: string): string {
        switch (type) {
            case 'documentation':
                return 'bg-blue-500';
            case 'tutorial':
                return 'bg-red-500';
            case 'tool':
                return 'bg-yellow-500';
            case 'reference':
                return 'bg-green-500';
            default:
                return 'bg-surface-400';
        }
    }
}