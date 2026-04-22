import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
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
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import {
    CourseService,
    Course,
    CourseInstructor,
    CourseModule,
    CourseResource,
    CourseResourceType,
    CourseSession,
    CourseSessionType,
    CourseVoucher,
    UploadedFileResult
} from '@/pages/service/course.service';
import { ProjectsService, UserDto } from '@/pages/service/projects.service';
import { AuthService } from '@/pages/service/auth.service';
import { environment } from '@environments/environment.prod';

interface SelectOption {
    label: string;
    value: string;
}

interface InstructorFormRow {
    userId: string;
    role: string;
}

interface CourseFormState {
    title: string;
    description: string;
    projectId: string;
    instructors: InstructorFormRow[];
}

interface ResourceFormState {
    moduleId: string;
    title: string;
    urls: string[];
    uploadedFiles: UploadedFileResult[];
    description: string;
    type: CourseResourceType;
}

interface SessionFormState {
    date: Date | null;
    hour: Date | null;
    type: CourseSessionType;
    location: string;
    notes: string;
}

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
        ConfirmDialogModule,
        ToastModule
    ],
    providers: [ConfirmationService, MessageService],
    template: `
        <p-toast></p-toast>
        <p-confirmdialog></p-confirmdialog>

        <p-dialog
            [(visible)]="courseDialogVisible"
            [header]="courseDialogMode === 'add' ? 'New Course' : 'Edit Course'"
            [modal]="true"
            [style]="{ width: '56rem' }"
            [contentStyle]="{ 'max-height': '75vh', 'overflow-y': 'auto' }"
            appendTo="body"
            [maximizable]="true"
        >
            <div class="flex flex-col gap-4 pt-2">
                <div>
                    <label class="block font-medium mb-2">Title <span class="text-red-500">*</span></label>
                    <input pInputText [(ngModel)]="courseForm.title" class="w-full" placeholder="e.g. Introduction to Linux" />
                </div>

                <div>
                    <label class="block font-medium mb-2">Description <span class="text-red-500">*</span></label>
                    <textarea pTextarea [(ngModel)]="courseForm.description" rows="4" class="w-full" maxlength="2000" style="resize: vertical" placeholder="Course overview..."></textarea>
                    <div class="text-right text-xs text-muted-color mt-1">{{ courseForm.description.length }}/2000</div>
                </div>

                <div>
                    <label class="block font-medium mb-2">Project <span class="text-red-500">*</span></label>
                    <p-select
                        [(ngModel)]="courseForm.projectId"
                        [options]="projectOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Select project"
                        class="w-full"
                        appendTo="body"
                        [disabled]="courseDialogMode === 'edit'"
                    />
                    <div *ngIf="courseDialogMode === 'edit' && selectedCourse" class="text-xs text-muted-color mt-2">
                        Project linkage cannot be changed after the course is created.
                    </div>
                </div>

                <div>
                    <div class="flex justify-between items-center mb-2">
                        <label class="block font-medium">Instructors <span class="text-red-500">*</span></label>
                        <p-button label="Add Instructor" icon="pi pi-plus" size="small" [text]="true" (onClick)="addInstructorRow()" />
                    </div>

                    <div *ngIf="userOptions.length === 0" class="text-sm text-muted-color py-2">
                        No users available for instructor assignment.
                    </div>

                    <div *ngIf="courseForm.instructors.length === 0" class="text-muted-color text-sm py-2">No instructors added yet.</div>

                    <div *ngFor="let inst of courseForm.instructors; let i = index" class="flex gap-2 mb-2 items-center flex-col md:flex-row">
                        <p-select
                            [(ngModel)]="inst.userId"
                            [options]="userOptions"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Select instructor"
                            class="flex-1 w-full"
                            appendTo="body"
                        />
                        <input pInputText [(ngModel)]="inst.role" placeholder="Role" class="flex-1 w-full" />
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
                    <p-button [label]="courseDialogMode === 'add' ? 'Create Course' : 'Save Changes'" (onClick)="saveCourse()" [disabled]="courseSaving || !courseForm.title.trim()" />
                </div>
            </ng-template>
        </p-dialog>

        <p-dialog
            [(visible)]="moduleDialogVisible"
            [header]="moduleDialogMode === 'add' ? 'Add Module' : 'Edit Module'"
            [modal]="true"
            [style]="{ width: '40rem' }"
            appendTo="body"
        >
            <div class="flex flex-col gap-4 pt-2">
                <div>
                    <label class="block font-medium mb-2">Title <span class="text-red-500">*</span></label>
                    <input pInputText [(ngModel)]="moduleForm.title" class="w-full" placeholder="e.g. Module 1: Getting Started" />
                </div>
                <div>
                    <label class="block font-medium mb-2">Description</label>
                    <textarea pTextarea [(ngModel)]="moduleForm.description" rows="4" class="w-full" maxlength="1000" style="resize: vertical" placeholder="What will students learn in this module?"></textarea>
                    <div class="text-right text-xs text-muted-color mt-1">{{ moduleForm.description.length }}/1000</div>
                </div>
            </div>
            <div class="flex justify-end gap-2 mt-6">
                <p-button label="Cancel" severity="secondary" (onClick)="moduleDialogVisible = false" />
                <p-button [label]="moduleDialogMode === 'add' ? 'Add Module' : 'Save'" (onClick)="saveModule()" [disabled]="moduleSaving || !moduleForm.title.trim()" />
            </div>
        </p-dialog>

        <p-dialog
            [(visible)]="resourceDialogVisible"
            [header]="resourceDialogMode === 'add' ? 'Add Resource' : 'Edit Resource'"
            [modal]="true"
            [style]="{ width: '44rem' }"
            appendTo="body"
        >
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
                    <label class="block font-medium mb-2">URLs</label>
                    <div class="flex flex-col gap-2">
                        <div *ngFor="let url of resourceForm.urls; let i = index" class="flex gap-2">
                            <input pInputText [(ngModel)]="resourceForm.urls[i]" class="flex-1" [placeholder]="i === 0 ? 'https://example.com/resource' : 'https://...'" />
                            <p-button icon="pi pi-trash" [text]="true" [rounded]="true" size="small" severity="danger" (onClick)="removeResourceUrl(i)" />
                        </div>
                        <p-button label="Add URL" icon="pi pi-plus" [text]="true" size="small" styleClass="self-start" (onClick)="addResourceUrl()" />
                    </div>
                </div>
                <div>
                    <label class="block font-medium mb-2">Files</label>
                    <div class="flex flex-col gap-2">
                        <div *ngIf="resourceForm.uploadedFiles.length > 0" class="flex flex-col gap-1">
                            <div *ngFor="let f of resourceForm.uploadedFiles; let i = index" class="flex items-center gap-2 p-2 bg-surface-50 dark:bg-surface-800 rounded-lg">
                                <i class="pi pi-file text-muted-color text-sm"></i>
                                <span class="flex-1 text-sm truncate">{{ f.originalFileName }}</span>
                                <span class="text-xs text-muted-color">{{ formatFileSize(f.fileSize) }}</span>
                                <p-button icon="pi pi-times" [text]="true" [rounded]="true" size="small" severity="danger" (onClick)="removeUploadedFile(i)" />
                            </div>
                        </div>
                        <div class="relative">
                            <p-button label="Choose Files" icon="pi pi-upload" [text]="true" size="small" [loading]="resourceUploading" />
                            <input type="file" multiple class="absolute inset-0 opacity-0 cursor-pointer" (change)="onFilesSelected($event)" [disabled]="resourceUploading" />
                        </div>
                        <p *ngIf="resourceUploadError" class="text-xs text-red-500 m-0">{{ resourceUploadError }}</p>
                    </div>
                </div>
                <div *ngIf="resourceForm.title.trim() && resourceFormInvalid" class="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-2">
                    <i class="pi pi-exclamation-triangle shrink-0"></i>
                    <span>A resource must have at least one URL or one uploaded file.</span>
                </div>
                <div>
                    <label class="block font-medium mb-2">Description</label>
                    <textarea pTextarea [(ngModel)]="resourceForm.description" rows="3" class="w-full" maxlength="500" style="resize: vertical" placeholder="Short description of the resource..."></textarea>
                </div>
            </div>
            <div class="flex justify-end gap-2 mt-6">
                <p-button label="Cancel" severity="secondary" (onClick)="resourceDialogVisible = false" />
                <p-button [label]="resourceDialogMode === 'add' ? 'Add Resource' : 'Save'" (onClick)="saveResource()" [disabled]="resourceSaving || resourceFormInvalid" />
            </div>
        </p-dialog>

        <!-- View Resource Dialog -->
        <p-dialog
            [(visible)]="viewResourceDialogVisible"
            [modal]="true"
            [style]="{ width: '36rem', 'max-width': 'calc(100vw - 2rem)' }"
            [breakpoints]="{ '960px': '80vw', '640px': '95vw' }"
            [contentStyle]="{ 'max-height': '80vh', 'overflow-y': 'auto', 'overflow-x': 'hidden' }"
            appendTo="body"
        >
            <div *ngIf="viewingResource" class="flex flex-col gap-4 pt-2">
                <div class="flex items-start gap-3">
                    <div class="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" [ngClass]="getResourceIconBg(viewingResource.type)">
                        <i [class]="getResourceIcon(viewingResource.type) + ' text-white'" ></i>
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
                            class="flex items-center gap-2 text-sm text-primary hover:underline min-w-0">
                            <i class="pi pi-download shrink-0"></i>
                            <span class="truncate min-w-0">{{ file.originalFileName }}</span>
                            <span class="text-xs text-muted-color shrink-0">({{ formatFileSize(file.fileSize) }})</span>
                        </a>
                    </div>
                </div>
            </div>
            <div class="flex justify-end mt-6">
                <p-button label="Close" severity="secondary" (onClick)="viewResourceDialogVisible = false" />
            </div>
        </p-dialog>

        <p-dialog
            [(visible)]="sessionDialogVisible"
            [header]="sessionDialogMode === 'add' ? 'Add Session' : 'Edit Session'"
            [modal]="true"
            [style]="{ width: '42rem' }"
            appendTo="body"
        >
            <div class="flex flex-col gap-4 pt-2">
                <div class="flex gap-4 flex-col md:flex-row">
                    <div class="flex-1">
                        <label class="block font-medium mb-2">Time <span class="text-red-500">*</span></label>
                        <p-datepicker [(ngModel)]="sessionForm.hour" [timeOnly]="true" hourFormat="24" class="w-full" appendTo="body" />
                    </div>
                </div>

                <div class="flex gap-4 flex-col md:flex-row">
                    <div class="flex-1">
                        <label class="block font-medium mb-2">Type</label>
                        <p-select [(ngModel)]="sessionForm.type" [options]="sessionTypeOptions" optionLabel="label" optionValue="value" placeholder="Select type" class="w-full" appendTo="body" />
                    </div>
                    <div class="flex-1">
                        <label class="block font-medium mb-2">Location <span class="text-red-500">*</span></label>
                        <input pInputText [(ngModel)]="sessionForm.location" class="w-full" placeholder="Physical address or meeting link" />
                    </div>
                </div>

                <div>
                    <label class="block font-medium mb-2">Notes</label>
                    <textarea pTextarea [(ngModel)]="sessionForm.notes" rows="3" class="w-full" maxlength="1000" style="resize: vertical" placeholder="Optional session notes..."></textarea>
                </div>
            </div>
            <div class="flex justify-end gap-2 mt-6">
                <p-button label="Cancel" severity="secondary" (onClick)="sessionDialogVisible = false" />
                <p-button [label]="sessionDialogMode === 'add' ? 'Add Session' : 'Save'" (onClick)="saveSession()" [disabled]="sessionSaving || !sessionForm.date || !sessionForm.hour || !sessionForm.location.trim()" />
            </div>
        </p-dialog>

        <div *ngIf="!selectedCourse">
            <div class="card">
                <div class="flex justify-between items-center mb-6 gap-3 flex-wrap">
                    <h3 class="text-2xl m-0">Courses</h3>
                    <p-button label="New Course" icon="pi pi-plus" size="small" (onClick)="openAddCourseDialog()" />
                </div>

                <div *ngIf="loadingCourses" class="flex items-center justify-center py-16 text-muted-color gap-3">
                    <i class="pi pi-spin pi-spinner"></i>
                    <span>Loading courses...</span>
                </div>

                <div *ngIf="!loadingCourses && courses.length === 0" class="flex flex-col items-center justify-center py-16 text-muted-color">
                    <i class="pi pi-book text-6xl mb-4 opacity-40"></i>
                    <p class="text-xl font-medium mb-1">No courses yet</p>
                    <p class="text-sm mb-4">Create your first course to get started.</p>
                    <p-button label="Create Course" icon="pi pi-plus" [outlined]="true" (onClick)="openAddCourseDialog()" />
                </div>

                <div *ngIf="!loadingCourses && courses.length > 0" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <div
                        *ngFor="let course of courses"
                        class="border border-surface-200 dark:border-surface-700 rounded-xl p-5 flex flex-col gap-3 cursor-pointer hover:shadow-md hover:border-primary transition-all"
                        (click)="selectCourse(course)"
                    >
                        <div>
                            <h3 class="text-lg m-0 line-clamp-2">{{ course.title }}</h3>
                            <p class="text-xs text-muted-color mt-1 mb-0">{{ course.projectTitle }}</p>
                        </div>

                        <p *ngIf="course.description" class="text-sm text-muted-color m-0 line-clamp-3">{{ course.description }}</p>

                        <p-divider styleClass="my-1" />

                        <div class="flex items-center gap-4 text-xs text-muted-color flex-wrap">
                            <span class="flex items-center gap-1">
                                <i class="pi pi-list"></i> {{ getModuleCount(course) }} {{ getModuleCount(course) === 1 ? 'module' : 'modules' }}
                            </span>
                            <span class="flex items-center gap-1">
                                <i class="pi pi-link"></i> {{ getResourceCount(course) }} {{ getResourceCount(course) === 1 ? 'resource' : 'resources' }}
                            </span>
                            <span class="flex items-center gap-1">
                                <i class="pi pi-calendar"></i> {{ getSessionCount(course) }} {{ getSessionCount(course) === 1 ? 'session' : 'sessions' }}
                            </span>
                        </div>

                        <div *ngIf="course.instructors.length > 0" class="flex items-center gap-2 flex-wrap">
                            <span class="text-xs text-muted-color">By:</span>
                            <span *ngFor="let inst of course.instructors.slice(0, 3)" class="flex items-center gap-1">
                                <p-avatar
                                    [label]="getInstructorInitials(inst)"
                                    shape="circle"
                                    size="normal"
                                    [style]="{ 'width': '1.6rem', 'height': '1.6rem', 'font-size': '0.6rem', 'background-color': 'var(--primary-color)', 'color': 'var(--primary-color-text)' }"
                                ></p-avatar>
                                <span class="text-xs font-medium">{{ getInstructorName(inst) }}</span>
                            </span>
                            <span *ngIf="course.instructors.length > 3" class="text-xs text-muted-color">+{{ course.instructors.length - 3 }} more</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div *ngIf="selectedCourse">
            <div class="card">
                <div *ngIf="loadingSelectedCourse" class="flex items-center justify-center py-12 text-muted-color gap-3">
                    <i class="pi pi-spin pi-spinner"></i>
                    <span>Loading course details...</span>
                </div>

                <ng-container *ngIf="!loadingSelectedCourse && selectedCourse">
                    <div class="flex justify-between items-start mb-4 flex-wrap gap-3">
                        <div class="flex items-start gap-3">
                            <p-button icon="pi pi-arrow-left" [text]="true" [rounded]="true" severity="secondary" (onClick)="deselectCourse()" />
                            <div>
                                <div class="flex items-center gap-2 flex-wrap">
                                    <h2 class="text-2xl m-0">{{ selectedCourse.title }}</h2>
                                </div>
                                <p class="text-sm text-muted-color mt-1 mb-0">{{ selectedCourse.projectTitle }}</p>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <p-button icon="pi pi-pencil" label="Edit" severity="secondary" size="small" (onClick)="openEditCourseDialog()" />
                            <p-button icon="pi pi-trash" severity="danger" size="small" [outlined]="true" (onClick)="confirmDeleteCourse()" />
                        </div>
                    </div>

                    <p-tabs [value]="activeTab" (valueChange)="onTabChange($event)">
                        <p-tablist>
                            <p-tab value="overview">Overview</p-tab>
                            <p-tab value="modules">
                                Modules
                                <span class="ml-1 text-xs bg-primary text-white rounded-full px-1.5 py-0.5">{{ getModuleCount(selectedCourse) }}</span>
                            </p-tab>
                            <p-tab value="schedule">
                                Schedule
                                <span *ngIf="getSessionCount(selectedCourse) > 0" class="ml-1 text-xs bg-primary text-white rounded-full px-1.5 py-0.5">{{ getSessionCount(selectedCourse) }}</span>
                            </p-tab>
                            <p-tab value="members">Members</p-tab>
                            <p-tab value="vouchers">Vouchers
                                <span *ngIf="courseVouchers.length > 0" class="ml-1 text-xs bg-primary text-white rounded-full px-1.5 py-0.5">{{ courseVouchers.length }}</span>
                            </p-tab>
                        </p-tablist>

                        <p-tabpanels>
                            <p-tabpanel value="overview">
                                <div class="flex flex-col gap-5 pt-3">
                                    <div *ngIf="selectedCourse.description">
                                        <h5 class="text-sm text-muted-color mb-2">Description</h5>
                                        <p class="text-surface-700 dark:text-surface-300 leading-relaxed m-0 whitespace-pre-wrap">{{ selectedCourse.description }}</p>
                                    </div>
                                    <div *ngIf="!selectedCourse.description" class="text-muted-color text-sm">No description provided.</div>

                                    <div>
                                        <div class="flex justify-between items-center mb-3">
                                            <h5 class="text-sm m-0">Lead by</h5>
                                        </div>
                                        <div *ngIf="selectedCourse.instructors.length === 0" class="text-muted-color text-sm py-4 flex flex-col items-center bg-surface-50 dark:bg-surface-800 rounded-lg">
                                            <i class="pi pi-users text-2xl mb-2"></i>
                                            <p class="m-0">No instructors assigned.</p>
                                        </div>
                                        <div *ngIf="selectedCourse.instructors.length > 0" class="flex flex-col gap-2">
                                            <div *ngFor="let inst of selectedCourse.instructors" class="flex items-center gap-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                                                <p-avatar
                                                    [label]="getInstructorInitials(inst)"
                                                    shape="circle"
                                                    size="large"
                                                    [style]="{ 'background-color': 'var(--primary-color)', 'color': 'var(--primary-color-text)' }"
                                                ></p-avatar>
                                                <div>
                                                    <p class="m-0">{{ getInstructorName(inst) }}</p>
                                                    <p class="text-sm text-muted-color m-0">{{ inst.role || 'Instructor' }}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </p-tabpanel>

                            <p-tabpanel value="modules">
                                <div class="pt-3">
                                    <div class="flex justify-end items-center mb-4">
                                        <p-button label="Add Module" icon="pi pi-plus" size="small" (onClick)="openAddModuleDialog()" />
                                    </div>

                                    <div *ngIf="selectedCourse.modules.length === 0" class="flex flex-col items-center justify-center py-10 text-muted-color bg-surface-50 dark:bg-surface-800 rounded-lg">
                                        <i class="pi pi-list text-4xl mb-3 opacity-40"></i>
                                        <p class="m-0">No modules yet. Add the first module.</p>
                                    </div>

                                    <div *ngIf="selectedCourse.modules.length > 0" class="flex flex-col gap-4">
                                        <div *ngFor="let mod of selectedCourse.modules; let i = index" class="border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden">
                                            <!-- Module header -->
                                            <div class="flex items-start gap-3 p-4 bg-surface-50 dark:bg-surface-800">
                                                <div class="shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm ">
                                                    {{ i + 1 }}
                                                </div>
                                                <div class="flex-1 min-w-0">
                                                    <p class="m-0 mb-1">{{ mod.title }}</p>
                                                    <p *ngIf="mod.description" class="text-sm text-muted-color m-0">{{ mod.description }}</p>
                                                </div>
                                                <div class="flex gap-1 shrink-0">
                                                    <p-button icon="pi pi-arrow-up" [text]="true" [rounded]="true" size="small" severity="secondary" pTooltip="Move up" [disabled]="i === 0" (onClick)="moveModuleUp(i)" />
                                                    <p-button icon="pi pi-arrow-down" [text]="true" [rounded]="true" size="small" severity="secondary" pTooltip="Move down" [disabled]="i === selectedCourse.modules.length - 1" (onClick)="moveModuleDown(i)" />
                                                    <p-button icon="pi pi-pencil" [text]="true" [rounded]="true" size="small" severity="secondary" pTooltip="Edit module" (onClick)="openEditModuleDialog(mod)" />
                                                    <p-button icon="pi pi-trash" [text]="true" [rounded]="true" size="small" severity="danger" pTooltip="Delete module" (onClick)="confirmDeleteModule(mod)" />
                                                </div>
                                            </div>

                                            <!-- Module resources -->
                                            <div class="p-4">
                                                <div class="flex justify-end items-center mb-3">
                                                    <p-button label="Add Resource" icon="pi pi-plus" size="small" [text]="true" (onClick)="openAddResourceDialog(mod)" />
                                                </div>

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
                                                                <span *ngFor="let file of res.files" class="text-xs text-muted-color flex items-center gap-1">
                                                                    <i class="pi pi-paperclip text-xs"></i>
                                                                    <span class="truncate">{{ file.originalFileName }}</span>
                                                                </span>
                                                            </div>
                                                            <p *ngIf="res.description" class="text-xs text-muted-color m-0 mt-0.5">{{ res.description }}</p>
                                                            <span class="inline-block mt-1 text-xs bg-surface-100 dark:bg-surface-800 text-muted-color px-2 py-0.5 rounded-full">{{ res.type }}</span>
                                                        </div>
                                                        <div class="flex gap-1 shrink-0">
                                                            <p-button icon="pi pi-eye" [text]="true" [rounded]="true" size="small" severity="secondary" pTooltip="View" (onClick)="openViewResourceDialog(res)" />
                                                            <p-button icon="pi pi-pencil" [text]="true" [rounded]="true" size="small" severity="secondary" pTooltip="Edit" (onClick)="openEditResourceDialog(mod.id, res)" />
                                                            <p-button icon="pi pi-trash" [text]="true" [rounded]="true" size="small" severity="danger" pTooltip="Delete" (onClick)="confirmDeleteResource(mod.id, res)" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </p-tabpanel>

                            <p-tabpanel value="schedule">
                                <div class="pt-3">
                                    <h5 class="text-sm text-muted-color mb-4 tracking-wide">Course Schedule</h5>
                                    <div class="flex flex-col lg:flex-row gap-6">
                                        <div class="shrink-0">
                                            <p class="text-sm text-muted-color mb-2">Click a calendar date to open the session details modal.</p>
                                            <p-datepicker
                                                [(ngModel)]="scheduleCalendarDate"
                                                [inline]="true"
                                                [showButtonBar]="true"
                                                dateFormat="yy-mm-dd"
                                                (onSelect)="onScheduleDateSelect()"
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
                                            <div *ngIf="selectedCourse.sessions.length === 0" class="flex flex-col items-center justify-center py-10 text-muted-color bg-surface-50 dark:bg-surface-800 rounded-lg">
                                                <i class="pi pi-calendar text-4xl mb-3 opacity-40"></i>
                                                <p class="m-0 text-sm">No sessions yet. Click a date on the calendar to add the first one.</p>
                                            </div>

                                            <div *ngIf="selectedCourse.sessions.length > 0">
                                                <p class="text-sm font-medium mb-3">{{ selectedCourse.sessions.length }} session{{ selectedCourse.sessions.length !== 1 ? 's' : '' }} scheduled:</p>
                                                <div class="flex flex-col gap-3 max-h-96 overflow-y-auto pr-1">
                                                    <div *ngFor="let session of sortedSessions(); let i = index" class="flex items-start gap-3 p-4 border border-surface-200 dark:border-surface-700 rounded-xl">
                                                        <div class="shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex flex-col items-center justify-center leading-none">
                                                            <span class="text-xs  text-primary">{{ sessionDate(session) | date: 'MMM' }}</span>
                                                            <span class="text-lg  text-primary leading-tight">{{ sessionDate(session) | date: 'd' }}</span>
                                                        </div>
                                                        <div class="flex-1 min-w-0">
                                                            <div class="flex items-center gap-2 flex-wrap">
                                                                <p class="m-0">Session {{ i + 1 }}</p>
                                                                <span class="text-xs bg-surface-100 dark:bg-surface-800 text-muted-color px-2 py-0.5 rounded-full">{{ session.type }}</span>
                                                            </div>
                                                            <p class="text-sm text-muted-color m-0 mt-1">{{ sessionDate(session) | date: 'EEEE, MMMM d, y' }} at {{ sessionDate(session) | date: 'shortTime' }}</p>
                                                            <p class="text-sm text-muted-color m-0 mt-1">{{ session.location }}</p>
                                                            <p *ngIf="session.notes" class="text-xs text-muted-color m-0 mt-2">{{ session.notes }}</p>
                                                        </div>
                                                        <div class="flex flex-col gap-1 shrink-0">
                                                            <p-button icon="pi pi-pencil" [text]="true" [rounded]="true" size="small" severity="secondary" (onClick)="openEditSessionDialog(session)" />
                                                            <p-button icon="pi pi-trash" [text]="true" [rounded]="true" size="small" severity="danger" (onClick)="confirmDeleteSession(session)" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </p-tabpanel>
                            <p-tabpanel value="vouchers">
                                <div class="pt-3">
                                    <div *ngIf="loadingVouchers" class="flex items-center justify-center py-12 text-muted-color gap-3">
                                        <i class="pi pi-spin pi-spinner"></i>
                                        <span>Loading vouchers...</span>
                                    </div>

                                    <div *ngIf="!loadingVouchers && courseVouchers.length === 0" class="flex flex-col items-center justify-center py-10 text-muted-color bg-surface-50 dark:bg-surface-800 rounded-lg">
                                        <i class="pi pi-ticket text-4xl mb-3 opacity-40"></i>
                                        <p class="m-0 text-sm">No vouchers for this course.</p>
                                    </div>

                                    <div *ngIf="!loadingVouchers && courseVouchers.length > 0" class="flex flex-col gap-2">
                                        <div *ngFor="let voucher of courseVouchers" class="flex items-center gap-3 p-4 border border-surface-200 dark:border-surface-700 rounded-xl">
                                            <div class="flex-1 min-w-0">
                                                <p class="font-mono text-sm m-0 select-all">{{ voucher.code }}</p>
                                                <div class="flex items-center gap-2 mt-1 flex-wrap">
                                                    <span class="text-xs px-2 py-0.5 rounded-full" [ngClass]="voucher.isMultiUse ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'bg-surface-100 dark:bg-surface-800 text-muted-color'">{{ voucher.isMultiUse ? 'Multi-use' : 'Single-use' }}</span>
                                                    <span *ngIf="!voucher.isMultiUse" class="text-xs px-2 py-0.5 rounded-full" [ngClass]="voucher.isUsed ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'">{{ voucher.isUsed ? 'Used' : 'Available' }}</span>
                                                    <span *ngIf="voucher.isMultiUse" class="text-xs text-muted-color">{{ voucher.usedCount }} redemption{{ voucher.usedCount !== 1 ? 's' : '' }}</span>
                                                    <span class="text-xs text-muted-color">Created {{ voucher.createdAt | date: 'MMM d, y' }}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </p-tabpanel>
                        </p-tabpanels>
                    </p-tabs>
                </ng-container>
            </div>
        </div>
    `
})
export class CoursePortal implements OnInit {
    private authService = inject(AuthService);

    get courses(): Course[] {
        return this.courseService.courses();
    }

    selectedCourse: Course | null = null;
    activeTab = 'overview';
    loadingCourses = false;
    loadingSelectedCourse = false;

    courseDialogVisible = false;
    courseDialogMode: 'add' | 'edit' = 'add';
    courseDialogError = '';
    courseSaving = false;
    courseForm: CourseFormState = this.emptyCourseForm();

    moduleDialogVisible = false;
    moduleDialogMode: 'add' | 'edit' = 'add';
    moduleSaving = false;
    editingModule: CourseModule | null = null;
    moduleForm: { title: string; description: string } = { title: '', description: '' };

    resourceDialogVisible = false;
    resourceDialogMode: 'add' | 'edit' = 'add';
    resourceSaving = false;
    resourceUploading = false;
    resourceUploadError = '';
    editingResource: CourseResource | null = null;
    resourceForm: ResourceFormState = this.emptyResourceForm();

    viewResourceDialogVisible = false;
    viewingResource: CourseResource | null = null;

    sessionDialogVisible = false;
    sessionDialogMode: 'add' | 'edit' = 'add';
    sessionSaving = false;
    editingSession: CourseSession | null = null;
    sessionForm: SessionFormState = this.emptySessionForm();
    scheduleCalendarDate: Date | null = null;

    courseVouchers: CourseVoucher[] = [];
    loadingVouchers = false;

    projectOptions: SelectOption[] = [];
    userOptions: SelectOption[] = [];

    resourceTypeOptions: { label: string; value: CourseResourceType }[] = [
        { label: 'Documentation', value: 'Documentation' },
        { label: 'Tutorial', value: 'Tutorial' },
        { label: 'Tool', value: 'Tool' },
        { label: 'Reference', value: 'Reference' },
        { label: 'Other', value: 'Other' }
    ];

    sessionTypeOptions: { label: string; value: CourseSessionType }[] = [
        { label: 'In Person', value: 'InPerson' },
        { label: 'Online', value: 'Online' }
    ];

    constructor(
        private confirmationService: ConfirmationService,
        private messageService: MessageService,
        private courseService: CourseService,
        private projectsService: ProjectsService
    ) {}

    ngOnInit(): void {
        this.loadMeta();
        this.loadCourses();
    }

    getInstructorName(instructor: CourseInstructor): string {
        const name = `${instructor.firstName ?? ''} ${instructor.lastName ?? ''}`.trim();
        return name || instructor.userId;
    }

    getInstructorInitials(instructor: CourseInstructor): string {
        const parts = this.getInstructorName(instructor).split(' ').filter((part) => part.length > 0);
        if (parts.length === 0) return '?';
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }

    getModuleCount(course: Course): number {
        return course.modules.length;
    }

    getResourceCount(course: Course): number {
        return course.modules.reduce((count, module) => count + module.resources.length, 0);
    }

    getSessionCount(course: Course): number {
        return course.sessions.length;
    }

    getResourceIcon(type: CourseResourceType): string {
        switch (type) {
            case 'Documentation':
                return 'pi pi-file-pdf';
            case 'Tutorial':
                return 'pi pi-play-circle';
            case 'Tool':
                return 'pi pi-wrench';
            case 'Reference':
                return 'pi pi-link';
            default:
                return 'pi pi-paperclip';
        }
    }

    getResourceIconBg(type: CourseResourceType): string {
        switch (type) {
            case 'Documentation':
                return 'bg-blue-400';
            case 'Tutorial':
                return 'bg-red-400';
            case 'Tool':
                return 'bg-yellow-500';
            case 'Reference':
                return 'bg-green-400';
            default:
                return 'bg-surface-400';
        }
    }

    sessionDate(session: CourseSession): Date {
        return new Date(`${session.date}T${this.timeInputValue(session.hour)}:00`);
    }

    isSessionDate(date: { year: number; month: number; day: number }): boolean {
        if (!this.selectedCourse) return false;
        return this.selectedCourse.sessions.some((session) => {
            const d = new Date(`${session.date}T00:00:00`);
            return d.getFullYear() === date.year && d.getMonth() === date.month && d.getDate() === date.day;
        });
    }

    sortedSessions(): CourseSession[] {
        if (!this.selectedCourse) {
            return [];
        }

        return [...this.selectedCourse.sessions].sort((left, right) => this.sessionDate(left).getTime() - this.sessionDate(right).getTime());
    }

    selectCourse(course: Course): void {
        this.loadingSelectedCourse = true;
        this.courseService.getCourse(course.id, true).subscribe({
            next: (selectedCourse) => {
                console.log('Course response:', selectedCourse);
                this.selectedCourse = selectedCourse;
                this.scheduleCalendarDate = null;
                this.activeTab = 'overview';
                this.loadingSelectedCourse = false;
            },
            error: (error: unknown) => {
                this.loadingSelectedCourse = false;
                this.showError('Unable to load course details.', error);
            }
        });
    }

    deselectCourse(): void {
        this.selectedCourse = null;
        this.scheduleCalendarDate = null;
        this.activeTab = 'overview';
        this.courseVouchers = [];
    }

    openAddCourseDialog(): void {
        this.courseDialogMode = 'add';
        this.courseForm = this.emptyCourseForm();
        this.courseDialogError = '';
        this.courseDialogVisible = true;
    }

    openEditCourseDialog(): void {
        if (!this.selectedCourse) {
            return;
        }

        this.courseDialogMode = 'edit';
        this.courseForm = {
            title: this.selectedCourse.title,
            description: this.selectedCourse.description,
            projectId: this.selectedCourse.projectId,
            instructors: this.selectedCourse.instructors.map((instructor) => ({
                userId: instructor.userId,
                role: instructor.role
            }))
        };
        this.courseDialogError = '';
        this.courseDialogVisible = true;
    }

    closeCourseDialog(): void {
        this.courseDialogVisible = false;
        this.courseDialogError = '';
    }

    addInstructorRow(): void {
        this.courseForm.instructors.push({ userId: '', role: 'Instructor' });
    }

    removeInstructorRow(index: number): void {
        this.courseForm.instructors.splice(index, 1);
    }

    saveCourse(): void {
        if (!this.courseForm.title.trim()) {
            this.courseDialogError = 'Title is required.';
            return;
        }

        if (!this.courseForm.projectId && this.courseDialogMode === 'add') {
            this.courseDialogError = 'Project selection is required.';
            return;
        }

        const instructors = this.courseForm.instructors
            .filter((instructor) => instructor.userId)
            .map((instructor) => ({
                userId: instructor.userId,
                role: instructor.role.trim() || 'Instructor'
            }));

        if (instructors.length === 0) {
            this.courseDialogError = 'At least one instructor is required.';
            return;
        }

        this.courseDialogError = '';
        this.courseSaving = true;

        if (this.courseDialogMode === 'add') {
            this.courseService.createCourse({
                title: this.courseForm.title.trim(),
                description: this.courseForm.description.trim(),
                projectId: this.courseForm.projectId,
                instructors,
                communicationChannels: []
            }).subscribe({
                next: (course) => {
                    this.courseSaving = false;
                    this.courseDialogVisible = false;
                    this.selectedCourse = course;
                    this.activeTab = 'overview';
                    this.messageService.add({ severity: 'success', summary: 'Created', detail: 'Course created successfully.' });
                },
                error: (error: unknown) => {
                    this.courseSaving = false;
                    this.courseDialogError = this.extractError(error);
                }
            });

            return;
        }

        if (!this.selectedCourse) {
            this.courseSaving = false;
            return;
        }

        this.courseService.updateCourse(this.selectedCourse.id, {
            title: this.courseForm.title.trim(),
            description: this.courseForm.description.trim(),
            instructors,
            communicationChannels: []
        }).subscribe({
            next: (course) => {
                this.courseSaving = false;
                this.courseDialogVisible = false;
                this.selectedCourse = course;
                this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Course updated successfully.' });
            },
            error: (error: unknown) => {
                this.courseSaving = false;
                this.courseDialogError = this.extractError(error);
            }
        });
    }

    confirmDeleteCourse(): void {
        this.confirmationService.confirm({
            message: `Delete course "<strong>${this.selectedCourse?.title ?? ''}</strong>"? This cannot be undone.`,
            header: 'Delete Course',
            icon: 'pi pi-trash',
            acceptLabel: 'Delete',
            rejectLabel: 'Cancel',
            accept: () => {
                if (!this.selectedCourse) {
                    return;
                }

                this.courseService.deleteCourse(this.selectedCourse.id).subscribe({
                    next: () => {
                        this.selectedCourse = null;
                        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Course deleted successfully.' });
                    },
                    error: (error: unknown) => {
                        this.showError('Unable to delete course.', error);
                    }
                });
            }
        });
    }

    openAddModuleDialog(): void {
        this.moduleDialogMode = 'add';
        this.editingModule = null;
        this.moduleForm = { title: '', description: '' };
        this.moduleDialogVisible = true;
    }

    openEditModuleDialog(module: CourseModule): void {
        this.moduleDialogMode = 'edit';
        this.editingModule = module;
        this.moduleForm = { title: module.title, description: module.description };
        this.moduleDialogVisible = true;
    }

    saveModule(): void {
        if (!this.selectedCourse || !this.moduleForm.title.trim()) {
            return;
        }

        this.moduleSaving = true;
        const payload = {
            title: this.moduleForm.title.trim(),
            description: this.moduleForm.description.trim()
        };

        const request = this.moduleDialogMode === 'add'
            ? this.courseService.addModule(this.selectedCourse.id, payload)
            : this.editingModule
                ? this.courseService.updateModule(this.selectedCourse.id, this.editingModule.id, payload)
                : null;

        if (!request) {
            this.moduleSaving = false;
            return;
        }

        request.subscribe({
            next: (course) => {
                this.moduleSaving = false;
                this.moduleDialogVisible = false;
                this.selectedCourse = course;
                this.messageService.add({
                    severity: 'success',
                    summary: this.moduleDialogMode === 'add' ? 'Added' : 'Saved',
                    detail: this.moduleDialogMode === 'add' ? 'Module added successfully.' : 'Module updated successfully.'
                });
            },
            error: (error: unknown) => {
                this.moduleSaving = false;
                this.showError('Unable to save module.', error);
            }
        });
    }

    moveModuleUp(index: number): void {
        if (!this.selectedCourse || index === 0) {
            return;
        }

        const orderedModuleIds = this.selectedCourse.modules.map((module) => module.id);
        [orderedModuleIds[index - 1], orderedModuleIds[index]] = [orderedModuleIds[index], orderedModuleIds[index - 1]];

        this.courseService.reorderModules(this.selectedCourse.id, orderedModuleIds).subscribe({
            next: (course) => {
                this.selectedCourse = course;
            },
            error: (error: unknown) => {
                this.showError('Unable to reorder modules.', error);
            }
        });
    }

    moveModuleDown(index: number): void {
        if (!this.selectedCourse || index >= this.selectedCourse.modules.length - 1) {
            return;
        }

        const orderedModuleIds = this.selectedCourse.modules.map((module) => module.id);
        [orderedModuleIds[index], orderedModuleIds[index + 1]] = [orderedModuleIds[index + 1], orderedModuleIds[index]];

        this.courseService.reorderModules(this.selectedCourse.id, orderedModuleIds).subscribe({
            next: (course) => {
                this.selectedCourse = course;
            },
            error: (error: unknown) => {
                this.showError('Unable to reorder modules.', error);
            }
        });
    }

    confirmDeleteModule(module: CourseModule): void {
        this.confirmationService.confirm({
            message: `Delete module "<strong>${module.title}</strong>"?`,
            header: 'Delete Module',
            icon: 'pi pi-trash',
            acceptLabel: 'Delete',
            rejectLabel: 'Cancel',
            accept: () => {
                if (!this.selectedCourse) {
                    return;
                }

                this.courseService.deleteModule(this.selectedCourse.id, module.id).subscribe({
                    next: (course) => {
                        this.selectedCourse = course;
                        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Module deleted successfully.' });
                    },
                    error: (error: unknown) => {
                        this.showError('Unable to delete module.', error);
                    }
                });
            }
        });
    }

    openAddResourceDialog(module: CourseModule): void {
        this.resourceDialogMode = 'add';
        this.editingResource = null;
        this.resourceForm = {
            ...this.emptyResourceForm(),
            moduleId: module.id
        };
        this.resourceDialogVisible = true;
    }

    get resourceFormInvalid(): boolean {
        const hasUrl = this.resourceForm.urls.some((u) => u.trim().length > 0);
        const hasFile = this.resourceForm.uploadedFiles.length > 0;
        return !this.resourceForm.title.trim() || (!hasUrl && !hasFile);
    }

    addResourceUrl(): void {
        this.resourceForm.urls = [...this.resourceForm.urls, ''];
    }

    removeResourceUrl(index: number): void {
        const updated = this.resourceForm.urls.filter((_, i) => i !== index);
        this.resourceForm.urls = updated.length > 0 ? updated : [''];
    }

    onFilesSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const files = Array.from(input.files ?? []);
        input.value = '';
        if (files.length === 0) return;

        this.resourceUploading = true;
        this.resourceUploadError = '';
        this.courseService.uploadFiles(files).subscribe({
            next: (results) => {
                this.resourceUploading = false;
                this.resourceForm.uploadedFiles = [...this.resourceForm.uploadedFiles, ...results];
            },
            error: (error: unknown) => {
                this.resourceUploading = false;
                this.resourceUploadError = this.extractError(error);
            }
        });
    }

    removeUploadedFile(index: number): void {
        this.resourceForm.uploadedFiles = this.resourceForm.uploadedFiles.filter((_, i) => i !== index);
    }

    formatFileSize(bytes: number): string {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    openViewResourceDialog(resource: CourseResource): void {
        this.viewingResource = resource;
        this.viewResourceDialogVisible = true;
    }

    getFileDownloadUrl(fileId: string): string {
        const downloadUrl = new URL(`${environment.apiUrl}/Files/${fileId}/download`);
        const token = this.authService.getToken();

        if (token) {
            downloadUrl.searchParams.set('token', token);
        }

        return downloadUrl.toString();
    }

    openEditResourceDialog(moduleId: string, resource: CourseResource): void {
        this.resourceDialogMode = 'edit';
        this.editingResource = resource;
        this.resourceUploadError = '';
        this.resourceForm = {
            moduleId,
            title: resource.title,
            urls: resource.urls.length > 0 ? [...resource.urls] : [''],
            uploadedFiles: resource.files.map((f) => ({
                fileId: f.fileId,
                fileName: f.fileName,
                originalFileName: f.originalFileName,
                contentType: f.contentType,
                fileSize: f.fileSize
            })),
            description: resource.description ?? '',
            type: resource.type
        };
        this.resourceDialogVisible = true;
    }

    saveResource(): void {
        if (!this.selectedCourse || !this.resourceForm.title.trim() || !this.resourceForm.moduleId) {
            return;
        }

        this.resourceSaving = true;
        const payload = {
            title: this.resourceForm.title.trim(),
            urls: this.resourceForm.urls.map((u) => u.trim()).filter((u) => u.length > 0),
            fileIds: this.resourceForm.uploadedFiles.map((f) => f.fileId),
            description: this.resourceForm.description.trim(),
            type: this.resourceForm.type
        };

        const request = this.resourceDialogMode === 'add'
            ? this.courseService.addResource(this.selectedCourse.id, this.resourceForm.moduleId, payload)
            : this.editingResource
                ? this.courseService.updateResource(this.selectedCourse.id, this.resourceForm.moduleId, this.editingResource.id, payload)
                : null;

        if (!request) {
            this.resourceSaving = false;
            return;
        }

        request.subscribe({
            next: (course) => {
                this.resourceSaving = false;
                this.resourceDialogVisible = false;
                this.selectedCourse = course;
                this.messageService.add({
                    severity: 'success',
                    summary: this.resourceDialogMode === 'add' ? 'Added' : 'Saved',
                    detail: this.resourceDialogMode === 'add' ? 'Resource added successfully.' : 'Resource updated successfully.'
                });
            },
            error: (error: unknown) => {
                this.resourceSaving = false;
                this.showError('Unable to save resource.', error);
            }
        });
    }

    confirmDeleteResource(moduleId: string, resource: CourseResource): void {
        this.confirmationService.confirm({
            message: `Delete resource "<strong>${resource.title}</strong>"?`,
            header: 'Delete Resource',
            icon: 'pi pi-trash',
            acceptLabel: 'Delete',
            rejectLabel: 'Cancel',
            accept: () => {
                if (!this.selectedCourse) {
                    return;
                }

                this.courseService.deleteResource(this.selectedCourse.id, moduleId, resource.id).subscribe({
                    next: (course) => {
                        this.selectedCourse = course;
                        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Resource deleted successfully.' });
                    },
                    error: (error: unknown) => {
                        this.showError('Unable to delete resource.', error);
                    }
                });
            }
        });
    }

    onScheduleDateSelect(): void {
        if (!this.scheduleCalendarDate) {
            return;
        }

        this.openAddSessionDialog(this.scheduleCalendarDate);
    }

    openAddSessionDialog(date?: Date): void {
        this.sessionDialogMode = 'add';
        this.editingSession = null;
        this.sessionForm = this.emptySessionForm();
        this.sessionForm.date = date ? new Date(date.getFullYear(), date.getMonth(), date.getDate()) : null;
        this.scheduleCalendarDate = null;
        this.sessionDialogVisible = true;
    }

    openEditSessionDialog(session: CourseSession): void {
        this.sessionDialogMode = 'edit';
        this.editingSession = session;
        this.sessionForm = {
            date: this.dateValue(session.date),
            hour: this.parseTimeString(session.hour),
            type: session.type,
            location: session.location,
            notes: session.notes ?? ''
        };
        this.scheduleCalendarDate = null;
        this.sessionDialogVisible = true;
    }

    saveSession(): void {
        if (!this.selectedCourse || !this.sessionForm.date || !this.sessionForm.hour || !this.sessionForm.location.trim()) {
            return;
        }

        this.sessionSaving = true;
        const hourStr = this.formatHourDate(this.sessionForm.hour);
        const payload = {
            title: this.buildSessionTitle(this.sessionForm.date, hourStr),
            date: this.dateOnlyValue(this.sessionForm.date),
            hour: this.apiTimeValue(hourStr),
            type: this.sessionForm.type,
            location: this.sessionForm.location.trim(),
            notes: this.sessionForm.notes.trim()
        };

        const request = this.sessionDialogMode === 'add'
            ? this.courseService.addSession(this.selectedCourse.id, payload)
            : this.editingSession
                ? this.courseService.updateSession(this.selectedCourse.id, this.editingSession.id, payload)
                : null;

        if (!request) {
            this.sessionSaving = false;
            return;
        }

        request.subscribe({
            next: (course) => {
                this.sessionSaving = false;
                this.sessionDialogVisible = false;
                this.scheduleCalendarDate = null;
                this.selectedCourse = course;
                this.messageService.add({
                    severity: 'success',
                    summary: this.sessionDialogMode === 'add' ? 'Added' : 'Saved',
                    detail: this.sessionDialogMode === 'add' ? 'Session added successfully.' : 'Session updated successfully.'
                });
            },
            error: (error: unknown) => {
                this.sessionSaving = false;
                this.showError('Unable to save session.', error);
            }
        });
    }

    confirmDeleteSession(session: CourseSession): void {
        this.confirmationService.confirm({
            message: `Delete session "<strong>${this.sessionLabel(session)}</strong>"?`,
            header: 'Delete Session',
            icon: 'pi pi-trash',
            acceptLabel: 'Delete',
            rejectLabel: 'Cancel',
            accept: () => {
                if (!this.selectedCourse) {
                    return;
                }

                this.courseService.deleteSession(this.selectedCourse.id, session.id).subscribe({
                    next: (course) => {
                        this.selectedCourse = course;
                        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Session deleted successfully.' });
                    },
                    error: (error: unknown) => {
                        this.showError('Unable to delete session.', error);
                    }
                });
            }
        });
    }

    onTabChange(tab: string | number | undefined): void {
        this.activeTab = (tab as string) ?? 'overview';
        if (this.activeTab === 'vouchers' && this.selectedCourse) {
            this.loadVouchers(this.selectedCourse.id);
        }
    }

    private loadVouchers(courseId: string): void {
        this.loadingVouchers = true;
        this.courseService.getVouchers(courseId).subscribe({
            next: (vouchers) => {
                console.log('Course vouchers response:', vouchers);
                this.courseVouchers = vouchers;
                this.loadingVouchers = false;
            },
            error: (error: unknown) => {
                this.loadingVouchers = false;
                this.showError('Unable to load vouchers.', error);
            }
        });
    }

    private loadCourses(): void {
        this.loadingCourses = true;
        this.courseService.loadCourses().subscribe({
            next: () => {
                this.loadingCourses = false;
            },
            error: (error: unknown) => {
                this.loadingCourses = false;
                this.showError('Unable to load courses.', error);
            }
        });
    }

    private loadMeta(): void {
        forkJoin({
            projects: this.projectsService.getProjects(),
            users: this.projectsService.getAllUsers(1, 200)
        }).subscribe({
            next: ({ projects, users }) => {
                this.projectOptions = this.mapProjectOptions(projects as Array<{ id: string; title?: string }>);
                this.userOptions = this.mapUserOptions(users.users);
            },
            error: (error: unknown) => {
                this.showError('Unable to load projects or users for course setup.', error);
            }
        });
    }

    private mapProjectOptions(projects: Array<{ id: string; title?: string }>): SelectOption[] {
        return projects
            .map((project) => ({
                label: project.title ?? 'Untitled project',
                value: project.id
            }))
            .sort((left, right) => left.label.localeCompare(right.label));
    }

    private mapUserOptions(users: UserDto[]): SelectOption[] {
        return users
            .map((user) => ({
                label: `${user.firstName} ${user.lastName}`.trim() || user.email,
                value: user.id
            }))
            .sort((left, right) => left.label.localeCompare(right.label));
    }

    private emptyCourseForm(): CourseFormState {
        return {
            title: '',
            description: '',
            projectId: '',
            instructors: []
        };
    }

    private emptyResourceForm(): ResourceFormState {
        return {
            moduleId: '',
            title: '',
            urls: [''],
            uploadedFiles: [],
            description: '',
            type: 'Documentation'
        };
    }

    private emptySessionForm(): SessionFormState {
        const defaultTime = new Date();
        defaultTime.setHours(9, 0, 0, 0);
        return {
            date: null,
            hour: defaultTime,
            type: 'InPerson',
            location: '',
            notes: ''
        };
    }

    private parseTimeString(timeStr: string): Date {
        const [h, m] = timeStr.split(':').map(Number);
        const d = new Date();
        d.setHours(h, m, 0, 0);
        return d;
    }

    private formatHourDate(d: Date): string {
        const h = `${d.getHours()}`.padStart(2, '0');
        const m = `${d.getMinutes()}`.padStart(2, '0');
        return `${h}:${m}`;
    }

    private buildSessionTitle(date: Date, hour: string): string {
        if (!this.selectedCourse) {
            return 'Session 1';
        }

        const targetId = this.editingSession?.id ?? '__new__';
        const candidateTime = new Date(`${this.dateOnlyValue(date)}T${this.timeInputValue(hour)}:00`).getTime();
        const rankedSessions = this.selectedCourse.sessions
            .filter((session) => session.id !== this.editingSession?.id)
            .map((session) => ({ id: session.id, time: this.sessionDate(session).getTime() }));

        rankedSessions.push({ id: targetId, time: candidateTime });
        rankedSessions.sort((left, right) => left.time - right.time);

        return `Session ${rankedSessions.findIndex((session) => session.id === targetId) + 1}`;
    }

    private sessionLabel(session: CourseSession): string {
        return `Session ${this.sortedSessions().findIndex((entry) => entry.id === session.id) + 1}`;
    }

    private dateValue(date: string): Date {
        return new Date(`${date}T00:00:00`);
    }

    private dateOnlyValue(date: Date): string {
        const year = date.getFullYear();
        const month = `${date.getMonth() + 1}`.padStart(2, '0');
        const day = `${date.getDate()}`.padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    private timeInputValue(hour: string): string {
        return hour.slice(0, 5);
    }

    private apiTimeValue(hour: string): string {
        return hour.length === 5 ? `${hour}:00` : hour;
    }

    private showError(summary: string, error: unknown): void {
        this.messageService.add({
            severity: 'error',
            summary,
            detail: this.extractError(error)
        });
    }

    private extractError(error: unknown): string {
        if (typeof error !== 'object' || error === null) {
            return 'Request failed.';
        }

        const errorRecord = error as {
            message?: string;
            error?: {
                Error?: string;
                error?: string;
                message?: string;
                title?: string;
                errors?: Record<string, string[]>;
                Errors?: Record<string, string[]>;
            };
        };

        const validationErrors =
            this.flattenValidationErrors(errorRecord.error?.errors) ??
            this.flattenValidationErrors(errorRecord.error?.Errors);

        return errorRecord.error?.Error
            ?? errorRecord.error?.error
            ?? validationErrors
            ?? errorRecord.error?.message
            ?? errorRecord.message
            ?? 'Request failed.';
    }

    private flattenValidationErrors(errors: Record<string, string[]> | null | undefined): string | null {
        if (!errors || typeof errors !== 'object' || Array.isArray(errors)) {
            return null;
        }

        const messages = Object.values(errors)
            .flat()
            .filter((v): v is string => typeof v === 'string');

        return messages.length > 0 ? messages.join(' ') : null;
    }
}