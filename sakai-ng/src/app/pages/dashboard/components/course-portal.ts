import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TagModule } from 'primeng/tag';
import { TabsModule } from 'primeng/tabs';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { AvatarModule } from 'primeng/avatar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { CourseService, Course, CourseModule, CourseResource, Instructor } from '@/pages/service/course.service';

@Component({
    selector: 'app-course-portal',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        DialogModule,
        InputTextModule,
        TextareaModule,
        SelectModule,
        DatePickerModule,
        TagModule,
        TabsModule,
        DividerModule,
        TooltipModule,
        AvatarModule,
        ConfirmDialogModule
    ],
    providers: [ConfirmationService],
    template: `
        <p-confirmdialog></p-confirmdialog>

        <!-- ── Create / Edit Course Dialog ── -->
        <p-dialog
            [(visible)]="courseDialogVisible"
            [header]="courseDialogMode === 'add' ? 'New Course' : 'Edit Course'"
            [modal]="true"
            [style]="{width: '52rem'}"
            [contentStyle]="{'max-height': '75vh', 'overflow-y': 'auto'}"
            appendTo="body"
            [maximizable]="true">
            <div class="flex flex-col gap-4 pt-2">
                <div>
                    <label class="block font-medium mb-2">Title <span class="text-red-500">*</span></label>
                    <input pInputText [(ngModel)]="courseForm.title" class="w-full" placeholder="e.g. Introduction to Linux" />
                </div>

                <div>
                    <label class="block font-medium mb-2">Description</label>
                    <textarea pTextarea [(ngModel)]="courseForm.description" rows="4" class="w-full" maxlength="2000" style="resize:vertical" placeholder="Course overview..."></textarea>
                    <div class="text-right text-xs text-muted-color mt-1">{{ courseForm.description.length }}/2000</div>
                </div>

                <div class="flex gap-4">
                    <div class="flex-1">
                        <label class="block font-medium mb-2">Level</label>
                        <p-select [(ngModel)]="courseForm.level" [options]="levelOptions" optionLabel="label" optionValue="value" placeholder="Select level" class="w-full" appendTo="body" />
                    </div>
                    <div class="flex-1">
                        <label class="block font-medium mb-2">Status</label>
                        <p-select [(ngModel)]="courseForm.status" [options]="statusOptions" optionLabel="label" optionValue="value" placeholder="Select status" class="w-full" appendTo="body" />
                    </div>
                </div>

                <div>
                    <div class="flex justify-between items-center mb-2">
                        <label class="block font-medium">Instructors</label>
                        <p-button label="Add Instructor" icon="pi pi-plus" size="small" [text]="true" (onClick)="addInstructorRow()" />
                    </div>
                    <div *ngIf="courseForm.instructors.length === 0" class="text-muted-color text-sm py-2">No instructors added yet.</div>
                    <div *ngFor="let inst of courseForm.instructors; let i = index" class="flex gap-2 mb-2 items-center">
                        <input pInputText [(ngModel)]="inst.name" placeholder="Full name" class="flex-1" />
                        <input pInputText [(ngModel)]="inst.role" placeholder="Role (e.g. Lead Instructor)" class="flex-1" />
                        <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" size="small" pTooltip="Remove" (onClick)="removeInstructorRow(i)" />
                    </div>
                </div>

                <div *ngIf="courseDialogError" class="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg p-3 flex items-center gap-2">
                    <i class="pi pi-exclamation-circle text-red-500"></i>
                    <span class="text-sm text-red-700 dark:text-red-300">{{ courseDialogError }}</span>
                </div>
            </div>

            <ng-template #footer>
                <div class="flex justify-end gap-2">
                    <p-button label="Cancel" severity="secondary" (onClick)="closeCourseDialog()" />
                    <p-button [label]="courseDialogMode === 'add' ? 'Create Course' : 'Save Changes'" (onClick)="saveCourse()" [disabled]="!courseForm.title.trim()" />
                </div>
            </ng-template>
        </p-dialog>

        <!-- ── Add / Edit Module Dialog ── -->
        <p-dialog
            [(visible)]="moduleDialogVisible"
            [header]="moduleDialogMode === 'add' ? 'Add Module' : 'Edit Module'"
            [modal]="true"
            [style]="{width: '40rem'}"
            appendTo="body">
            <div class="flex flex-col gap-4 pt-2">
                <div>
                    <label class="block font-medium mb-2">Title <span class="text-red-500">*</span></label>
                    <input pInputText [(ngModel)]="moduleForm.title" class="w-full" placeholder="e.g. Module 1: Getting Started" />
                </div>
                <div>
                    <label class="block font-medium mb-2">Description</label>
                    <textarea pTextarea [(ngModel)]="moduleForm.description" rows="4" class="w-full" maxlength="1000" style="resize:vertical" placeholder="What will students learn in this module?"></textarea>
                    <div class="text-right text-xs text-muted-color mt-1">{{ moduleForm.description.length }}/1000</div>
                </div>
            </div>
            <div class="flex justify-end gap-2 mt-6">
                <p-button label="Cancel" severity="secondary" (onClick)="moduleDialogVisible = false" />
                <p-button [label]="moduleDialogMode === 'add' ? 'Add Module' : 'Save'" (onClick)="saveModule()" [disabled]="!moduleForm.title.trim()" />
            </div>
        </p-dialog>

        <!-- ── Add / Edit Resource Dialog ── -->
        <p-dialog
            [(visible)]="resourceDialogVisible"
            [header]="resourceDialogMode === 'add' ? 'Add Resource' : 'Edit Resource'"
            [modal]="true"
            [style]="{width: '42rem'}"
            appendTo="body">
            <div class="flex flex-col gap-4 pt-2">
                <div>
                    <label class="block font-medium mb-2">Title <span class="text-red-500">*</span></label>
                    <input pInputText [(ngModel)]="resourceForm.title" class="w-full" placeholder="e.g. Course Slides" />
                </div>
                <div>
                    <label class="block font-medium mb-2">Type</label>
                    <p-select [(ngModel)]="resourceForm.type" [options]="resourceTypeOptions" optionLabel="label" optionValue="value" placeholder="Select type" class="w-full" appendTo="body" />
                </div>
                <div>
                    <label class="block font-medium mb-2">URL</label>
                    <input pInputText [(ngModel)]="resourceForm.url" class="w-full" placeholder="https://example.com/resource" />
                </div>
                <div>
                    <label class="block font-medium mb-2">Description</label>
                    <textarea pTextarea [(ngModel)]="resourceForm.description" rows="3" class="w-full" maxlength="500" style="resize:vertical" placeholder="Short description of the resource..."></textarea>
                </div>
            </div>
            <div class="flex justify-end gap-2 mt-6">
                <p-button label="Cancel" severity="secondary" (onClick)="resourceDialogVisible = false" />
                <p-button [label]="resourceDialogMode === 'add' ? 'Add Resource' : 'Save'" (onClick)="saveResource()" [disabled]="!resourceForm.title.trim()" />
            </div>
        </p-dialog>

        <!-- ══════════════════════════════════════════ -->
        <!-- ── COURSE LIST VIEW ── -->
        <!-- ══════════════════════════════════════════ -->
        <div *ngIf="!selectedCourse">
            <div class="card">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-semibold m-0">Courses</h2>
                    <p-button label="New Course" icon="pi pi-plus" size="small" (onClick)="openAddCourseDialog()" />
                </div>

                <!-- Empty state -->
                <div *ngIf="courses.length === 0" class="flex flex-col items-center justify-center py-16 text-muted-color">
                    <i class="pi pi-book text-6xl mb-4 opacity-40"></i>
                    <p class="text-xl font-medium mb-1">No courses yet</p>
                    <p class="text-sm mb-4">Create your first course to get started.</p>
                    <p-button label="Create Course" icon="pi pi-plus" [outlined]="true" (onClick)="openAddCourseDialog()" />
                </div>

                <!-- Course cards grid -->
                <div *ngIf="courses.length > 0" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <div
                        *ngFor="let course of courses"
                        class="border border-surface-200 dark:border-surface-700 rounded-xl p-5 flex flex-col gap-3 cursor-pointer hover:shadow-md hover:border-primary transition-all"
                        (click)="selectCourse(course)">
                        <!-- Status + Level -->
                        <div class="flex items-center justify-between">
                            <p-tag [value]="course.status | titlecase" [severity]="getStatusSeverity(course.status)" />
                            <span *ngIf="course.level" class="text-xs text-muted-color bg-surface-100 dark:bg-surface-800 px-2 py-1 rounded-full">{{ course.level }}</span>
                        </div>

                        <!-- Title -->
                        <h3 class="text-lg font-semibold m-0 line-clamp-2">{{ course.title }}</h3>

                        <!-- Description snippet -->
                        <p *ngIf="course.description" class="text-sm text-muted-color m-0 line-clamp-3">{{ course.description }}</p>

                        <p-divider styleClass="my-1" />

                        <!-- Stats row -->
                        <div class="flex items-center gap-4 text-xs text-muted-color">
                            <span class="flex items-center gap-1">
                                <i class="pi pi-list"></i> {{ course.modules.length }} {{ course.modules.length === 1 ? 'module' : 'modules' }}
                            </span>
                            <span class="flex items-center gap-1">
                                <i class="pi pi-link"></i> {{ course.resources.length }} {{ course.resources.length === 1 ? 'resource' : 'resources' }}
                            </span>
                            <span class="flex items-center gap-1">
                                <i class="pi pi-calendar"></i> {{ course.scheduledDates.length }} {{ course.scheduledDates.length === 1 ? 'date' : 'dates' }}
                            </span>
                        </div>

                        <!-- Instructors -->
                        <div *ngIf="course.instructors.length > 0" class="flex items-center gap-2 flex-wrap">
                            <span class="text-xs text-muted-color">By:</span>
                            <span *ngFor="let inst of course.instructors.slice(0, 3)" class="flex items-center gap-1">
                                <p-avatar [label]="getInitials(inst.name)" shape="circle" size="normal"
                                    [style]="{'width':'1.6rem','height':'1.6rem','font-size':'0.6rem','background-color':'var(--primary-color)','color':'var(--primary-color-text)'}">
                                </p-avatar>
                                <span class="text-xs font-medium">{{ inst.name }}</span>
                            </span>
                            <span *ngIf="course.instructors.length > 3" class="text-xs text-muted-color">+{{ course.instructors.length - 3 }} more</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ══════════════════════════════════════════ -->
        <!-- ── COURSE DETAIL VIEW ── -->
        <!-- ══════════════════════════════════════════ -->
        <div *ngIf="selectedCourse">
            <div class="card">
                <!-- Back + Actions header -->
                <div class="flex justify-between items-start mb-4 flex-wrap gap-3">
                    <div class="flex items-center gap-3">
                        <p-button icon="pi pi-arrow-left" [text]="true" [rounded]="true" severity="secondary" pTooltip="Back to courses" (onClick)="deselectCourse()" />
                        <div>
                            <div class="flex items-center gap-2 flex-wrap">
                                <h2 class="text-2xl font-semibold m-0">{{ selectedCourse.title }}</h2>
                                <p-tag [value]="selectedCourse.status | titlecase" [severity]="getStatusSeverity(selectedCourse.status)" />
                                <span *ngIf="selectedCourse.level" class="text-xs text-muted-color bg-surface-100 dark:bg-surface-800 px-2 py-1 rounded-full">{{ selectedCourse.level }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <p-button icon="pi pi-pencil" label="Edit" severity="secondary" size="small" (onClick)="openEditCourseDialog()" />
                        <p-button icon="pi pi-trash" severity="danger" size="small" [outlined]="true" (onClick)="confirmDeleteCourse()" />
                    </div>
                </div>

                <!-- Detail Tabs -->
                <p-tabs [(value)]="activeTab">
                    <p-tablist>
                        <p-tab value="overview">Overview</p-tab>
                        <p-tab value="modules">
                            Modules
                            <span class="ml-1 text-xs bg-primary text-white rounded-full px-1.5 py-0.5">{{ selectedCourse.modules.length }}</span>
                        </p-tab>
                        <p-tab value="resources">
                            Resources
                            <span class="ml-1 text-xs bg-primary text-white rounded-full px-1.5 py-0.5">{{ selectedCourse.resources.length }}</span>
                        </p-tab>
                        <p-tab value="schedule">
                            Schedule
                            <span *ngIf="selectedCourse.scheduledDates.length > 0" class="ml-1 text-xs bg-primary text-white rounded-full px-1.5 py-0.5">{{ selectedCourse.scheduledDates.length }}</span>
                        </p-tab>
                    </p-tablist>

                    <p-tabpanels>
                        <!-- ── OVERVIEW TAB ── -->
                        <p-tabpanel value="overview">
                            <div class="flex flex-col gap-5 pt-3">
                                <div *ngIf="selectedCourse.description">
                                    <h5 class="text-sm font-semibold text-muted-color mb-2 tracking-wide uppercase">Description</h5>
                                    <p class="text-surface-700 dark:text-surface-300 leading-relaxed m-0 whitespace-pre-wrap">{{ selectedCourse.description }}</p>
                                </div>
                                <div *ngIf="!selectedCourse.description" class="text-muted-color text-sm">No description provided.</div>

                                <p-divider />

                                <div>
                                    <div class="flex justify-between items-center mb-3">
                                        <h5 class="text-sm font-semibold text-muted-color m-0 tracking-wide uppercase">Instructors</h5>
                                    </div>
                                    <div *ngIf="selectedCourse.instructors.length === 0" class="text-muted-color text-sm py-4 flex flex-col items-center bg-surface-50 dark:bg-surface-800 rounded-lg">
                                        <i class="pi pi-users text-2xl mb-2"></i>
                                        <p class="m-0">No instructors assigned.</p>
                                    </div>
                                    <div *ngIf="selectedCourse.instructors.length > 0" class="flex flex-col gap-2">
                                        <div *ngFor="let inst of selectedCourse.instructors" class="flex items-center gap-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                                            <p-avatar
                                                [label]="getInitials(inst.name)"
                                                shape="circle"
                                                size="large"
                                                [style]="{'background-color':'var(--primary-color)','color':'var(--primary-color-text)'}">
                                            </p-avatar>
                                            <div>
                                                <p class="font-semibold m-0">{{ inst.name }}</p>
                                                <p class="text-sm text-muted-color m-0">{{ inst.role || 'Instructor' }}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </p-tabpanel>

                        <!-- ── MODULES TAB ── -->
                        <p-tabpanel value="modules">
                            <div class="pt-3">
                                <div class="flex justify-between items-center mb-4">
                                    <h5 class="text-sm font-semibold text-muted-color m-0 tracking-wide uppercase">Course Modules</h5>
                                    <p-button label="Add Module" icon="pi pi-plus" size="small" (onClick)="openAddModuleDialog()" />
                                </div>

                                <div *ngIf="selectedCourse.modules.length === 0" class="flex flex-col items-center justify-center py-10 text-muted-color bg-surface-50 dark:bg-surface-800 rounded-lg">
                                    <i class="pi pi-list text-4xl mb-3 opacity-40"></i>
                                    <p class="m-0">No modules yet. Add the first module.</p>
                                </div>

                                <div *ngIf="selectedCourse.modules.length > 0" class="flex flex-col gap-3">
                                    <div *ngFor="let mod of selectedCourse.modules; let i = index"
                                         class="flex items-start gap-3 p-4 border border-surface-200 dark:border-surface-700 rounded-xl">
                                        <!-- Order badge -->
                                        <div class="shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                                            {{ i + 1 }}
                                        </div>
                                        <!-- Content -->
                                        <div class="flex-1 min-w-0">
                                            <p class="font-semibold m-0 mb-1">{{ mod.title }}</p>
                                            <p *ngIf="mod.description" class="text-sm text-muted-color m-0">{{ mod.description }}</p>
                                        </div>
                                        <!-- Actions -->
                                        <div class="flex gap-1 shrink-0">
                                            <p-button icon="pi pi-arrow-up" [text]="true" [rounded]="true" size="small" severity="secondary" pTooltip="Move up" [disabled]="i === 0" (onClick)="moveModuleUp(i)" />
                                            <p-button icon="pi pi-arrow-down" [text]="true" [rounded]="true" size="small" severity="secondary" pTooltip="Move down" [disabled]="i === selectedCourse.modules.length - 1" (onClick)="moveModuleDown(i)" />
                                            <p-button icon="pi pi-pencil" [text]="true" [rounded]="true" size="small" severity="secondary" pTooltip="Edit" (onClick)="openEditModuleDialog(mod)" />
                                            <p-button icon="pi pi-trash" [text]="true" [rounded]="true" size="small" severity="danger" pTooltip="Delete" (onClick)="confirmDeleteModule(mod)" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </p-tabpanel>

                        <!-- ── RESOURCES TAB ── -->
                        <p-tabpanel value="resources">
                            <div class="pt-3">
                                <div class="flex justify-between items-center mb-4">
                                    <h5 class="text-sm font-semibold text-muted-color m-0 tracking-wide uppercase">Course Resources</h5>
                                    <p-button label="Add Resource" icon="pi pi-plus" size="small" (onClick)="openAddResourceDialog()" />
                                </div>

                                <div *ngIf="selectedCourse.resources.length === 0" class="flex flex-col items-center justify-center py-10 text-muted-color bg-surface-50 dark:bg-surface-800 rounded-lg">
                                    <i class="pi pi-link text-4xl mb-3 opacity-40"></i>
                                    <p class="m-0">No resources yet. Add links, videos, or documents.</p>
                                </div>

                                <div *ngIf="selectedCourse.resources.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div *ngFor="let res of selectedCourse.resources"
                                         class="flex gap-3 p-4 border border-surface-200 dark:border-surface-700 rounded-xl">
                                        <div class="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                                             [ngClass]="getResourceIconBg(res.type)">
                                            <i [class]="getResourceIcon(res.type) + ' text-white'"></i>
                                        </div>
                                        <div class="flex-1 min-w-0">
                                            <p class="font-semibold m-0 mb-0.5">{{ res.title }}</p>
                                            <a *ngIf="res.url" [href]="res.url" target="_blank" rel="noopener noreferrer"
                                               class="text-primary text-sm hover:underline flex items-center gap-1 truncate">
                                                <i class="pi pi-external-link text-xs"></i>
                                                <span class="truncate">{{ res.url }}</span>
                                            </a>
                                            <p *ngIf="res.description" class="text-xs text-muted-color m-0 mt-1">{{ res.description }}</p>
                                            <span class="inline-block mt-1 text-xs bg-surface-100 dark:bg-surface-800 text-muted-color px-2 py-0.5 rounded-full">{{ res.type }}</span>
                                        </div>
                                        <div class="flex flex-col gap-1 shrink-0">
                                            <p-button icon="pi pi-pencil" [text]="true" [rounded]="true" size="small" severity="secondary" pTooltip="Edit" (onClick)="openEditResourceDialog(res)" />
                                            <p-button icon="pi pi-trash" [text]="true" [rounded]="true" size="small" severity="danger" pTooltip="Delete" (onClick)="confirmDeleteResource(res)" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </p-tabpanel>

                        <!-- ── SCHEDULE TAB ── -->
                        <p-tabpanel value="schedule">
                            <div class="pt-3">
                                <h5 class="text-sm font-semibold text-muted-color mb-4 tracking-wide uppercase">Course Dates</h5>
                                <div class="flex flex-col lg:flex-row gap-6">
                                    <!-- Inline calendar -->
                                    <div class="shrink-0">
                                        <p class="text-sm text-muted-color mb-2">Click dates to select/deselect course sessions:</p>
                                        <p-datepicker
                                            [(ngModel)]="selectedCourse.scheduledDates"
                                            selectionMode="multiple"
                                            [inline]="true"
                                            [showButtonBar]="true"
                                            (onSelect)="onDateSelect()"
                                            (onClear)="onDateClear()"
                                        />
                                    </div>

                                    <!-- Selected dates list -->
                                    <div class="flex-1 min-w-0">
                                        <div *ngIf="selectedCourse.scheduledDates.length === 0" class="flex flex-col items-center justify-center py-10 text-muted-color bg-surface-50 dark:bg-surface-800 rounded-lg">
                                            <i class="pi pi-calendar text-4xl mb-3 opacity-40"></i>
                                            <p class="m-0 text-sm">No dates selected. Use the calendar to add sessions.</p>
                                        </div>
                                        <div *ngIf="selectedCourse.scheduledDates.length > 0">
                                            <p class="text-sm font-medium mb-3">{{ selectedCourse.scheduledDates.length }} session{{ selectedCourse.scheduledDates.length !== 1 ? 's' : '' }} scheduled:</p>
                                            <div class="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
                                                <div *ngFor="let d of sortedDates(); let i = index"
                                                     class="flex items-center gap-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                                                    <div class="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex flex-col items-center justify-center leading-none">
                                                        <span class="text-xs font-bold text-primary">{{ d | date:'MMM' }}</span>
                                                        <span class="text-sm font-bold text-primary">{{ d | date:'d' }}</span>
                                                    </div>
                                                    <div class="flex-1">
                                                        <p class="font-medium m-0">Session {{ i + 1 }}</p>
                                                        <p class="text-sm text-muted-color m-0">{{ d | date:'EEEE, MMMM d, y' }}</p>
                                                    </div>
                                                    <p-button icon="pi pi-times" [text]="true" [rounded]="true" size="small" severity="danger" pTooltip="Remove date" (onClick)="removeDate(d)" />
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
    `
})
export class CoursePortal {
    // ── State ──────────────────────────────────────────────────────────────
    get courses(): Course[] { return this.courseService.courses(); }
    selectedCourse: Course | null = null;
    activeTab: string = 'overview';

    // ── Course dialog ──────────────────────────────────────────────────────
    courseDialogVisible = false;
    courseDialogMode: 'add' | 'edit' = 'add';
    courseDialogError = '';
    courseForm: {
        title: string;
        description: string;
        level: string;
        status: 'draft' | 'active' | 'completed';
        instructors: Instructor[];
    } = this.emptyCourseForm();

    // ── Module dialog ──────────────────────────────────────────────────────
    moduleDialogVisible = false;
    moduleDialogMode: 'add' | 'edit' = 'add';
    editingModule: CourseModule | null = null;
    moduleForm: { title: string; description: string } = { title: '', description: '' };

    // ── Resource dialog ────────────────────────────────────────────────────
    resourceDialogVisible = false;
    resourceDialogMode: 'add' | 'edit' = 'add';
    editingResource: CourseResource | null = null;
    resourceForm: { title: string; url: string; description: string; type: CourseResource['type'] } = this.emptyResourceForm();

    // ── Options ────────────────────────────────────────────────────────────
    levelOptions = [
        { label: 'Beginner', value: 'Beginner' },
        { label: 'Intermediate', value: 'Intermediate' },
        { label: 'Advanced', value: 'Advanced' }
    ];

    statusOptions = [
        { label: 'Draft', value: 'draft' },
        { label: 'Active', value: 'active' },
        { label: 'Completed', value: 'completed' }
    ];

    resourceTypeOptions = [
        { label: 'Link', value: 'link' },
        { label: 'Video', value: 'video' },
        { label: 'Document', value: 'document' },
        { label: 'Other', value: 'other' }
    ];

    constructor(
        private confirmationService: ConfirmationService,
        private courseService: CourseService
    ) {}

    // ── Helpers ────────────────────────────────────────────────────────────
    private emptyCourseForm() {
        return { title: '', description: '', level: '', status: 'draft' as const, instructors: [] };
    }

    private emptyResourceForm(): { title: string; url: string; description: string; type: CourseResource['type'] } {
        return { title: '', url: '', description: '', type: 'link' };
    }

    getInitials(name: string): string {
        if (!name) return '?';
        const parts = name.trim().split(' ').filter(p => p.length > 0);
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
            case 'video': return 'pi pi-video';
            case 'document': return 'pi pi-file-pdf';
            case 'link': return 'pi pi-link';
            default: return 'pi pi-paperclip';
        }
    }

    getResourceIconBg(type: string): string {
        switch (type) {
            case 'video': return 'bg-red-400';
            case 'document': return 'bg-blue-400';
            case 'link': return 'bg-green-400';
            default: return 'bg-surface-400';
        }
    }

    sortedDates(): Date[] {
        return [...(this.selectedCourse?.scheduledDates ?? [])].sort((a, b) => a.getTime() - b.getTime());
    }

    // ── Course actions ─────────────────────────────────────────────────────
    selectCourse(course: Course) {
        this.selectedCourse = course;
        this.activeTab = 'overview';
    }

    deselectCourse() {
        this.selectedCourse = null;
    }

    openAddCourseDialog() {
        this.courseDialogMode = 'add';
        this.courseForm = this.emptyCourseForm();
        this.courseDialogError = '';
        this.courseDialogVisible = true;
    }

    openEditCourseDialog() {
        if (!this.selectedCourse) return;
        this.courseDialogMode = 'edit';
        this.courseForm = {
            title: this.selectedCourse.title,
            description: this.selectedCourse.description,
            level: this.selectedCourse.level,
            status: this.selectedCourse.status,
            instructors: this.selectedCourse.instructors.map(i => ({ ...i }))
        };
        this.courseDialogError = '';
        this.courseDialogVisible = true;
    }

    closeCourseDialog() {
        this.courseDialogVisible = false;
    }

    addInstructorRow() {
        this.courseForm.instructors.push({ name: '', role: '' });
    }

    removeInstructorRow(index: number) {
        this.courseForm.instructors.splice(index, 1);
    }

    saveCourse() {
        if (!this.courseForm.title.trim()) {
            this.courseDialogError = 'Title is required.';
            return;
        }
        const instructors = this.courseForm.instructors.filter(i => i.name.trim());
        const data = {
            title: this.courseForm.title.trim(),
            description: this.courseForm.description.trim(),
            level: this.courseForm.level,
            status: this.courseForm.status,
            instructors
        };

        if (this.courseDialogMode === 'add') {
            const course = this.courseService.addCourse(data);
            this.courseDialogVisible = false;
            this.selectCourse(course);
        } else if (this.selectedCourse) {
            this.courseService.updateCourse(this.selectedCourse.id, data);
            // Refresh local reference from service after update
            this.selectedCourse = this.courseService.getCourseById(this.selectedCourse.id) ?? null;
            this.courseDialogVisible = false;
        }
    }

    confirmDeleteCourse() {
        this.confirmationService.confirm({
            message: `Delete course "<strong>${this.selectedCourse?.title}</strong>"? This cannot be undone.`,
            header: 'Delete Course',
            icon: 'pi pi-trash',
            acceptLabel: 'Delete',
            rejectLabel: 'Cancel',
            accept: () => {
                if (this.selectedCourse) {
                    this.courseService.deleteCourse(this.selectedCourse.id);
                    this.selectedCourse = null;
                }
            }
        });
    }

    // ── Module actions ─────────────────────────────────────────────────────
    openAddModuleDialog() {
        this.moduleDialogMode = 'add';
        this.editingModule = null;
        this.moduleForm = { title: '', description: '' };
        this.moduleDialogVisible = true;
    }

    openEditModuleDialog(mod: CourseModule) {
        this.moduleDialogMode = 'edit';
        this.editingModule = mod;
        this.moduleForm = { title: mod.title, description: mod.description };
        this.moduleDialogVisible = true;
    }

    saveModule() {
        if (!this.moduleForm.title.trim() || !this.selectedCourse) return;
        const data = { title: this.moduleForm.title.trim(), description: this.moduleForm.description.trim() };
        if (this.moduleDialogMode === 'add') {
            this.courseService.addModule(this.selectedCourse.id, data);
        } else if (this.editingModule) {
            this.courseService.updateModule(this.selectedCourse.id, this.editingModule.id, data);
        }
        this.selectedCourse = this.courseService.getCourseById(this.selectedCourse.id) ?? this.selectedCourse;
        this.moduleDialogVisible = false;
    }

    moveModuleUp(index: number) {
        if (!this.selectedCourse || index === 0) return;
        this.courseService.moveModule(this.selectedCourse.id, index, index - 1);
        this.selectedCourse = this.courseService.getCourseById(this.selectedCourse.id) ?? this.selectedCourse;
    }

    moveModuleDown(index: number) {
        if (!this.selectedCourse) return;
        if (index >= this.selectedCourse.modules.length - 1) return;
        this.courseService.moveModule(this.selectedCourse.id, index, index + 1);
        this.selectedCourse = this.courseService.getCourseById(this.selectedCourse.id) ?? this.selectedCourse;
    }

    confirmDeleteModule(mod: CourseModule) {
        this.confirmationService.confirm({
            message: `Delete module "<strong>${mod.title}</strong>"?`,
            header: 'Delete Module',
            icon: 'pi pi-trash',
            acceptLabel: 'Delete',
            rejectLabel: 'Cancel',
            accept: () => {
                if (this.selectedCourse) {
                    this.courseService.deleteModule(this.selectedCourse.id, mod.id);
                    this.selectedCourse = this.courseService.getCourseById(this.selectedCourse.id) ?? this.selectedCourse;
                }
            }
        });
    }

    // ── Resource actions ───────────────────────────────────────────────────
    openAddResourceDialog() {
        this.resourceDialogMode = 'add';
        this.editingResource = null;
        this.resourceForm = this.emptyResourceForm();
        this.resourceDialogVisible = true;
    }

    openEditResourceDialog(res: CourseResource) {
        this.resourceDialogMode = 'edit';
        this.editingResource = res;
        this.resourceForm = { title: res.title, url: res.url, description: res.description, type: res.type };
        this.resourceDialogVisible = true;
    }

    saveResource() {
        if (!this.resourceForm.title.trim() || !this.selectedCourse) return;
        const data = {
            title: this.resourceForm.title.trim(),
            url: this.resourceForm.url.trim(),
            description: this.resourceForm.description.trim(),
            type: this.resourceForm.type
        };
        if (this.resourceDialogMode === 'add') {
            this.courseService.addResource(this.selectedCourse.id, data);
        } else if (this.editingResource) {
            this.courseService.updateResource(this.selectedCourse.id, this.editingResource.id, data);
        }
        this.selectedCourse = this.courseService.getCourseById(this.selectedCourse.id) ?? this.selectedCourse;
        this.resourceDialogVisible = false;
    }

    confirmDeleteResource(res: CourseResource) {
        this.confirmationService.confirm({
            message: `Delete resource "<strong>${res.title}</strong>"?`,
            header: 'Delete Resource',
            icon: 'pi pi-trash',
            acceptLabel: 'Delete',
            rejectLabel: 'Cancel',
            accept: () => {
                if (this.selectedCourse) {
                    this.courseService.deleteResource(this.selectedCourse.id, res.id);
                    this.selectedCourse = this.courseService.getCourseById(this.selectedCourse.id) ?? this.selectedCourse;
                }
            }
        });
    }

    // ── Schedule actions ───────────────────────────────────────────────────
    onDateSelect() {
        if (this.selectedCourse) {
            this.courseService.setScheduledDates(this.selectedCourse.id, this.selectedCourse.scheduledDates);
            this.selectedCourse = this.courseService.getCourseById(this.selectedCourse.id) ?? this.selectedCourse;
        }
    }

    onDateClear() {
        if (this.selectedCourse) {
            this.courseService.setScheduledDates(this.selectedCourse.id, []);
            this.selectedCourse = this.courseService.getCourseById(this.selectedCourse.id) ?? this.selectedCourse;
        }
    }

    removeDate(date: Date) {
        if (!this.selectedCourse) return;
        const updated = this.selectedCourse.scheduledDates.filter(d => d.getTime() !== date.getTime());
        this.courseService.setScheduledDates(this.selectedCourse.id, updated);
        this.selectedCourse = this.courseService.getCourseById(this.selectedCourse.id) ?? this.selectedCourse;
    }
}
