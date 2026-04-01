import { Component, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { DividerModule } from 'primeng/divider';
import { ProgressBarModule } from 'primeng/progressbar';
import { TabsModule } from 'primeng/tabs';
import { DragDropModule } from 'primeng/dragdrop';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MultiSelectModule } from 'primeng/multiselect';
import { TooltipModule } from 'primeng/tooltip';
import { FileUploadModule } from 'primeng/fileupload';
import { EditorModule } from 'primeng/editor';
import { ConfirmationService } from 'primeng/api';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { GitHubCommit, Member, ModeratorInfo, Objective, Project, ProjectsService, Resource, ResourceFile } from '../../service/projects.service';
import { AuthService, getInitials, isDefaultAvatar } from '../../service/auth.service';
import { environment } from '@environments/environment.prod';
import { HistoryLogEntry, LogDto, PaginatedLogsResponse } from '@interfaces/history-log';

@Component({
    selector: 'app-projects',
    imports: [CommonModule, FormsModule, ButtonModule, TagModule, AvatarModule, AvatarGroupModule, DividerModule, ProgressBarModule, TabsModule, DragDropModule, DialogModule, InputTextModule, TextareaModule, SelectModule, DatePickerModule, ConfirmDialogModule, MultiSelectModule, TooltipModule, FileUploadModule, EditorModule],
    providers: [ConfirmationService],
    template: `
        <p-confirmdialog></p-confirmdialog>

        <p-dialog [(visible)]="dialogVisible" [header]="dialogMode === 'add' ? 'New Project' : 'Edit Project'" [modal]="true" [style]="{width: '50rem'}" [contentStyle]="{'max-height': '70vh', 'overflow-y': 'auto'}" appendTo="body" [maximizable]="true">
            <div class="flex flex-col gap-4">
                <div>
                    <label for="projectName" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Project Name</label>
                    <input pInputText id="projectName" [(ngModel)]="currentProject.title" class="w-full" />
                </div>

                <div class="flex flex-col lg:flex-row align-center justify-between gap-3">
                    <div class="">
                        <label for="startDate" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Start Date</label>
                        <p-datepicker id="startDate" [(ngModel)]="startDate" dateFormat="M d, yy" [showIcon]="true" class="w-full" appendTo="body" />
                    </div>

                    <div class="">
                        <label for="endDate" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">End Date</label>
                        <p-datepicker id="endDate" [(ngModel)]="endDate" dateFormat="M d, yy" [showIcon]="true" class="w-full" appendTo="body" />
                    </div>
                </div>

                <div>
                    <label for="description" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Description</label>
                    <p-editor [(ngModel)]="currentProject.description" [style]="{'height': '200px'}" (onInit)="onEditorInit($event, 'project')"></p-editor>
                    <div class="flex items-center gap-1 mt-1">
                        <input #projectFileInput type="file" style="display:none" (change)="onEditorFileSelected($event)" />
                        <p-button
                            label="Attach file"
                            icon="pi pi-paperclip"
                            [text]="true"
                            size="small"
                            severity="secondary"
                            (onClick)="activeEditorKey = 'project'; projectFileInput.click()"
                        />
                    </div>
                </div>

                <!-- <div>
                    <label for="teamMembers" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Team Members</label>
                    <p-multiselect
                        id="teamMembers"
                        [(ngModel)]="selectedMemberNames"
                        [options]="availableMembers"
                        optionLabel="name"
                        optionValue="name"
                        placeholder="Select Team Members"
                        class="w-full"
                        [showClear]="true"
                        display="chip"
                    />
                </div> -->

                <div>
                    <label for="status" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Status</label>
                    <p-select id="status" [(ngModel)]="currentProject.status" [options]="statusOptions" placeholder="Select Status" class="w-full" appendTo="body" />
                </div>

                <div>
                    <label class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Project Type(s)</label>
                    <p-multiselect
                        [(ngModel)]="currentProject.types"
                        [options]="projectTypeOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Select type(s)"
                        display="chip"
                        class="w-full"
                        appendTo="body"
                    />
                </div>

                <!-- Banner image -->
                <div>
                    <label class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Banner Image <span class="text-muted-color text-sm font-normal">(optional)</span></label>
                    <div *ngIf="dialogBannerPreviewUrl || (dialogMode === 'edit' && currentProject.bannerUrl && !removeBannerInEdit)" class="relative mb-2 h-32 rounded-lg overflow-hidden">
                        <img [src]="dialogBannerPreviewUrl || currentProject.bannerUrl" alt="Banner preview" class="w-full h-full object-cover" />
                        <button
                            (click)="removeDialogBanner()"
                            class="absolute top-2 right-2 flex items-center justify-center w-7 h-7 rounded-full bg-black/60 text-white border-0 hover:bg-red-600/80 backdrop-blur-sm transition-all cursor-pointer"
                        >
                            <i class="pi pi-times text-xs"></i>
                        </button>
                    </div>
                    <p-fileupload
                        *ngIf="!dialogBannerPreviewUrl && !(dialogMode === 'edit' && currentProject.bannerUrl && !removeBannerInEdit)"
                        mode="basic"
                        chooseLabel="Choose Banner"
                        chooseIcon="pi pi-image"
                        accept="image/*"
                        [maxFileSize]="5000000"
                        (onSelect)="onDialogBannerSelect($event)"
                        [auto]="false"
                    />
                </div>

                <!-- Error message -->
                <div *ngIf="projectDialogError" class="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg p-3 flex items-center gap-2">
                    <i class="pi pi-exclamation-circle text-red-500"></i>
                    <span class="text-sm text-red-700 dark:text-red-300">{{ projectDialogError }}</span>
                </div>
            </div>
            <ng-template pTemplate="footer">
                <div class="flex justify-end gap-2">
                    <p-button label="Cancel" severity="secondary" (onClick)="closeProjectDialog()" />
                    <p-button [label]="dialogMode === 'add' ? 'Create' : 'Save'" (onClick)="saveProject()" [disabled]="dialogMode === 'add' && !isProjectFormValid()" />
                </div>
            </ng-template>
        </p-dialog>

        <p-dialog [(visible)]="objectiveDialogVisible" [header]="objectiveDialogMode === 'add' ? 'New Task' : 'Edit Task'" [modal]="true" [style]="{width: '40rem'}" [contentStyle]="{'max-height': '70vh', 'overflow': 'visible'}" appendTo="body" [maximizable]="true">
            <div class="flex flex-col gap-4">
                <div>
                    <label for="objectiveTitle" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Title</label>
                    <input pInputText id="objectiveTitle" [(ngModel)]="currentObjective.title" class="w-full" />
                </div>

                <div>
                    <label for="objectiveDescription" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Description</label>
                    <p-editor [(ngModel)]="currentObjective.description" [style]="{'height': '160px'}" (onInit)="onEditorInit($event, 'objective')"></p-editor>
                    <div class="flex items-center gap-1 mt-1">
                        <input #objectiveFileInput type="file" style="display:none" (change)="onEditorFileSelected($event)" />
                        <p-button
                            label="Attach file"
                            icon="pi pi-paperclip"
                            [text]="true"
                            size="small"
                            severity="secondary"
                            (onClick)="activeEditorKey = 'objective'; objectiveFileInput.click()"
                        />
                    </div>
                </div>

                <div>
                    <label for="objectiveStatus" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Status</label>
                    <p-select id="objectiveStatus" [(ngModel)]="currentObjective.status" [options]="objectiveStatusOptions" placeholder="Select Status" class="w-full" />
                </div>

                <div>
                    <label for="objectivePoints" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Points <span class="text-muted-color text-sm font-normal">(used for contribution scoring)</span></label>
                    <input type="number" pInputText id="objectivePoints" [(ngModel)]="currentObjective.points" min="1" max="10" class="w-full"
                        (input)="clampObjectivePoints($event)" />
                </div>
            </div>

            <div class="flex justify-end gap-2 mt-6">
                <p-button label="Cancel" severity="secondary" (onClick)="objectiveDialogVisible = false" />
                <p-button [label]="objectiveDialogMode === 'add' ? 'Create' : 'Save'" (onClick)="saveObjective()" [disabled]="objectiveDialogMode === 'add' && !isObjectiveFormValid()" />
            </div>
        </p-dialog>

        <!-- Resource Dialog -->
        <p-dialog [(visible)]="resourceDialogVisible" [header]="resourceDialogMode === 'add' ? 'Add Resource to Project' : 'Edit Project Resource'" [modal]="true" [style]="{width: '40rem'}" appendTo="body">
            <div class="flex flex-col gap-4">
                <div>
                    <label for="resourceTitle" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Title *</label>
                    <input pInputText id="resourceTitle" [(ngModel)]="currentResource.title" class="w-full" />
                </div>

                <div>
                    <label class="block text-surface-900 dark:text-surface-0 font-medium mb-2">URLs</label>
                    <div class="flex gap-2 mb-2">
                        <input pInputText [(ngModel)]="newResourceUrl" placeholder="https://example.com" class="flex-1" (keyup.enter)="addUrlToCurrentResource()" />
                        <p-button icon="pi pi-plus" [text]="true" (onClick)="addUrlToCurrentResource()" />
                    </div>
                    @if (currentResource.urls && currentResource.urls.length > 0) {
                        <div class="flex flex-col gap-1 mb-2">
                            @for (url of currentResource.urls; track url; let i = $index) {
                                <div class="flex items-center gap-2 p-2 bg-surface-100 dark:bg-surface-800 rounded">
                                    <span class="flex-1 truncate text-sm">{{ url }}</span>
                                    <p-button icon="pi pi-times" [rounded]="true" [text]="true" severity="danger" size="small" (onClick)="removeUrlFromCurrentResource(i)" />
                                </div>
                            }
                        </div>
                    }
                    <small class="text-surface-500">Optional if files are attached</small>
                </div>

                <div>
                    <label class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Files</label>
                    <p-fileupload
                        mode="basic"
                        [multiple]="true"
                        chooseLabel="Choose Files"
                        (onSelect)="onResourceFilesSelect($event)"
                        [auto]="false"
                        chooseIcon="pi pi-upload"
                    ></p-fileupload>

                    <!-- Display selected files -->
                    @if (selectedResourceFiles.length > 0) {
                        <div class="mt-2 flex flex-col gap-1">
                            @for (file of selectedResourceFiles; track file.name) {
                                <div class="flex items-center gap-2 p-2 bg-surface-100 dark:bg-surface-800 rounded">
                                    <i class="pi pi-file"></i>
                                    <span class="flex-1 truncate">{{ file.name }}</span>
                                    <span class="text-surface-500 text-sm">{{ formatFileSize(file.size) }}</span>
                                    <p-button icon="pi pi-times" [rounded]="true" [text]="true" severity="danger" size="small" (onClick)="removeSelectedResourceFile(file)" />
                                </div>
                            }
                        </div>
                    }

                    <!-- Display existing files (edit mode) -->
                    @if (resourceDialogMode === 'edit' && currentResource.files && currentResource.files.length > 0) {
                        <div class="mt-2">
                            <span class="text-sm text-surface-500">Existing files:</span>
                            <div class="flex flex-col gap-1 mt-1">
                                @for (file of currentResource.files; track file.id) {
                                    <div class="flex items-center gap-2 p-2 bg-surface-100 dark:bg-surface-800 rounded">
                                        <i class="pi pi-file"></i>
                                        <span class="flex-1 truncate">{{ file.originalFileName }}</span>
                                        <span class="text-surface-500 text-sm">{{ formatFileSize(file.fileSize) }}</span>
                                        <p-button icon="pi pi-times" [rounded]="true" [text]="true" severity="danger" size="small" (onClick)="removeExistingResourceFile(file)" />
                                    </div>
                                }
                            </div>
                        </div>
                    }
                    <small class="text-surface-500">You can attach multiple files</small>
                </div>

                <div>
                    <label for="resourceDescription" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Description</label>
                    <textarea pInputTextarea id="resourceDescription" [(ngModel)]="currentResource.description" [rows]="2" class="w-full"></textarea>
                </div>

                <div>
                    <label for="resourceType" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Type *</label>
                    <p-select id="resourceType" [(ngModel)]="currentResource.type" [options]="resourceTypeOptions" optionLabel="label" optionValue="value" placeholder="Select Type" class="w-full" appendTo="body" />
                </div>
            </div>

            <div class="flex justify-end gap-2 mt-6">
                <p-button label="Cancel" severity="secondary" (onClick)="resourceDialogVisible = false" />
                <p-button [label]="resourceDialogMode === 'add' ? 'Add' : 'Save'" (onClick)="saveResource()" [loading]="savingResource" />
            </div>
        </p-dialog>

        <!-- Task Detail Dialog -->
        <p-dialog [(visible)]="objectiveDetailDialogVisible" [header]="viewingObjective?.title" [modal]="true" [style]="{width: '50rem'}" [contentStyle]="{'max-height': '80vh', 'overflow': 'auto'}" appendTo="body" [maximizable]="true">
            <div *ngIf="viewingObjective" class="flex flex-col gap-5">
                <!-- Creator & Date -->
                <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-3 flex flex-col gap-2">
                    <div *ngIf="viewingObjective.createdByFirstName || viewingObjective.createdByLastName" class="flex items-center gap-2">
                        <i class="pi pi-user text-primary"></i>
                        <span class="font-semibold text-surface-600 dark:text-surface-400">Created by:</span>
                        <span class="text-surface-900 dark:text-surface-0">{{ viewingObjective.createdByFirstName }} {{ viewingObjective.createdByLastName }}</span>
                    </div>
                    <div *ngIf="viewingObjective.createdAt" class="flex items-center gap-2">
                        <i class="pi pi-calendar text-primary"></i>
                        <span class="font-semibold text-surface-600 dark:text-surface-400">Created:</span>
                        <span class="text-surface-900 dark:text-surface-0">{{ viewingObjective.createdAt | date:'medium' }}</span>
                    </div>
                </div>

                <!-- Status & Points -->
                <div class="flex items-center gap-4">
                    <p-tag
                        [value]="viewingObjective.status === 'todo' ? 'To Do' : viewingObjective.status === 'in-progress' ? 'In Progress' : 'Completed'"
                        [severity]="getObjectiveStatusSeverity(viewingObjective.status)"
                        styleClass="text-sm"
                    ></p-tag>
                    <div *ngIf="viewingObjective.points" class="flex items-center gap-2">
                        <i class="pi pi-star-fill text-primary"></i>
                        <span class="font-semibold text-primary">{{ viewingObjective.points }} {{ viewingObjective.points === 1 ? 'point' : 'points' }}</span>
                    </div>
                </div>

                <!-- Description -->
                <div>
                    <h6 class="text-sm font-semibold text-muted-color mb-2 tracking-wide">Description</h6>
                    <p class="text-surface-700 dark:text-surface-300 leading-relaxed m-0" [innerHTML]="viewingObjective.description || 'No description provided.'"></p>
                </div>

                <p-divider></p-divider>

                <!-- Team Members -->
                <div>
                    <div class="flex justify-between items-center mb-3">
                        <h6 class="text-sm font-semibold text-muted-color m-0 tracking-wide">Team Members</h6>
                        <p-button *ngIf="viewingObjective.status !== 'completed' && isAdminOrModerator(selectedProject)" icon="pi pi-user-plus" label="Assign Members" size="small" [text]="true" (onClick)="openAssignMembersToObjectiveFromDetail()" />
                    </div>
                    <div *ngIf="viewingObjective.members && viewingObjective.members.length > 0" class="flex flex-col gap-3">
                        <div *ngFor="let member of viewingObjective.members" class="flex items-center gap-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                            <p-avatar *ngIf="hasProfilePicture(member)" [image]="member.avatar" shape="circle" size="large"></p-avatar>
                            <p-avatar *ngIf="!hasProfilePicture(member)" [label]="getInitials(member.name)" shape="circle" size="large" [style]="{'background-color': 'var(--primary-color)', 'color': 'var(--primary-color-text)'}"></p-avatar>
                            <div class="flex-1">
                                <p class="font-semibold text-surface-900 dark:text-surface-0 m-0">{{ member.name }}</p>
                                <p class="text-sm text-muted-color m-0">{{ member.role }}</p>
                            </div>
                            <p-button *ngIf="viewingObjective.status !== 'completed' && (isProjectCreator(selectedProject) || isProjectModerator(selectedProject))" icon="pi pi-times" size="small" [text]="true" [rounded]="true" severity="danger" pTooltip="Remove Member" (onClick)="removeMemberFromObjectiveDetail(member)" />
                        </div>
                    </div>
                    <div *ngIf="!viewingObjective.members || viewingObjective.members.length === 0" class="text-center text-muted-color py-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
                        <i class="pi pi-users text-2xl mb-2"></i>
                        <p class="m-0">{{ viewingObjective.status === 'completed' ? 'No team members were added' : 'No team members assigned yet' }}</p>
                    </div>
                </div>

                <p-divider></p-divider>

                <!-- Resources -->
                <div>
                    <div class="flex justify-between items-center mb-3">
                        <h6 class="text-sm font-semibold text-muted-color m-0 tracking-wide">Resources</h6>
                        <p-button *ngIf="selectedProject?.status !== 'completed' && viewingObjective?.status !== 'completed'" icon="pi pi-plus" label="Add Resource" size="small" [text]="true" (onClick)="openAddObjectiveResourceDialog()" />
                    </div>
                    <div *ngIf="viewingObjective.resources && viewingObjective.resources.length > 0" class="flex flex-col gap-2">
                        <div *ngFor="let resource of viewingObjective.resources" class="p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                            <div class="flex justify-between items-start mb-2">
                                <div class="flex-1">
                                    <div class="font-semibold text-surface-900 dark:text-surface-0 flex items-center gap-2">
                                        <i [class]="getResourceIcon(resource.type)"></i>
                                        {{ resource.title }}
                                    </div>
                                    @if (resource.urls && resource.urls.length > 0) {
                                        <div class="flex flex-col gap-1 mt-1 ml-5">
                                            @for (url of resource.urls; track url) {
                                                <a [href]="url" target="_blank" class="text-primary hover:underline flex items-center gap-1 text-sm">
                                                    <i class="pi pi-external-link text-xs"></i>{{ url }}
                                                </a>
                                            }
                                        </div>
                                    }
                                    <p class="text-sm text-muted-color m-0 mt-1">{{ resource.description }}</p>
                                </div>
                                <div class="flex gap-1" *ngIf="canEditResource(resource) && viewingObjective?.status !== 'completed'">
                                    <p-button icon="pi pi-pencil" size="small" [text]="true" severity="secondary" (onClick)="openEditObjectiveResourceDialog(resource)" />
                                    <p-button icon="pi pi-trash" size="small" [text]="true" severity="danger" (onClick)="confirmDeleteObjectiveResource(resource)" />
                                </div>
                            </div>
                            <div class="flex items-center gap-2 mb-2">
                                <p-tag [value]="resource.type" severity="secondary" styleClass="text-xs"></p-tag>
                                <span *ngIf="resource.createdByUserName" class="text-xs text-muted-color">
                                    <i class="pi pi-user text-xs mr-1"></i>{{ resource.createdByUserName }}
                                </span>
                            </div>
                            <div *ngIf="resource.files && resource.files.length > 0" class="mt-2">
                                <span class="text-xs text-muted-color">Attached files:</span>
                                <div class="flex flex-col gap-1 mt-1">
                                    <div *ngFor="let file of resource.files" class="flex items-center gap-2 p-2 bg-white dark:bg-surface-900 rounded">
                                        <i class="pi pi-file text-sm"></i>
                                        <span class="flex-1 truncate text-sm text-surface-900 dark:text-surface-0">
                                            {{ file.originalFileName }}
                                        </span>
                                        <span class="text-muted-color text-xs">{{ formatFileSize(file.fileSize) }}</span>
                                        <div class="flex gap-1">
                                            <p-button *ngIf="!(file.originalFileName ?? '').toLowerCase().endsWith('.pptx')" icon="pi pi-eye" [text]="true" [rounded]="true" size="small" severity="secondary" pTooltip="View" (onClick)="viewFile(file.id, file.originalFileName)" />
                                            <p-button icon="pi pi-download" [text]="true" [rounded]="true" size="small" severity="secondary" pTooltip="Download" (onClick)="downloadFile(file.id, file.originalFileName)" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div *ngIf="!viewingObjective.resources || viewingObjective.resources.length === 0" class="text-center text-muted-color py-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
                        <i class="pi pi-link text-2xl mb-2"></i>
                        <p class="m-0">{{ viewingObjective.status === 'completed' ? 'No resources were added' : 'No resources added yet' }}</p>
                    </div>
                </div>
            </div>

            <div class="flex justify-between gap-2 mt-6">
                <div class="flex gap-2">
                    @if (viewingObjective && viewingObjective.status !== 'completed' && !isUserInObjective(viewingObjective)) {
                        <p-button label="Join Task" icon="pi pi-user-plus" [outlined]="true" (onClick)="joinObjectiveFromDetail()" />
                    } @else if (viewingObjective && viewingObjective.status !== 'completed' && isUserInObjective(viewingObjective)) {
                        <p-button label="Leave Task" icon="pi pi-user-minus" [outlined]="true" severity="warn" (onClick)="leaveObjectiveFromDetail()" />
                    }
                </div>
                <div class="flex gap-2">
                    <p-button *ngIf="viewingObjective?.status !== 'completed'" label="Edit" icon="pi pi-pencil" severity="secondary" (onClick)="editObjectiveFromDetail()" />
                    <p-button label="Close" severity="secondary" [outlined]="true" (onClick)="objectiveDetailDialogVisible = false" />
                </div>
            </div>
        </p-dialog>

        <!-- Task Resource Dialog -->
        <p-dialog [(visible)]="objectiveResourceDialogVisible" [header]="objectiveResourceDialogMode === 'add' ? 'Add Resource to Task' : 'Edit Task Resource'" [modal]="true" [style]="{width: '40rem'}" appendTo="body">
            <div class="flex flex-col gap-4">
                <div>
                    <label for="objResourceTitle" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Title *</label>
                    <input pInputText id="objResourceTitle" [(ngModel)]="currentObjectiveResource.title" class="w-full" />
                </div>

                <div>
                    <label class="block text-surface-900 dark:text-surface-0 font-medium mb-2">URLs</label>
                    <div class="flex gap-2 mb-2">
                        <input pInputText [(ngModel)]="newObjectiveResourceUrl" placeholder="https://example.com" class="flex-1" (keyup.enter)="addUrlToCurrentObjectiveResource()" />
                        <p-button icon="pi pi-plus" [text]="true" (onClick)="addUrlToCurrentObjectiveResource()" />
                    </div>
                    @if (currentObjectiveResource.urls && currentObjectiveResource.urls.length > 0) {
                        <div class="flex flex-col gap-1 mb-2">
                            @for (url of currentObjectiveResource.urls; track url; let i = $index) {
                                <div class="flex items-center gap-2 p-2 bg-surface-100 dark:bg-surface-800 rounded">
                                    <span class="flex-1 truncate text-sm">{{ url }}</span>
                                    <p-button icon="pi pi-times" [rounded]="true" [text]="true" severity="danger" size="small" (onClick)="removeUrlFromCurrentObjectiveResource(i)" />
                                </div>
                            }
                        </div>
                    }
                    <small class="text-surface-500">Optional if files are attached</small>
                </div>

                <div>
                    <label class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Files</label>
                    <p-fileupload
                        mode="basic"
                        [multiple]="true"
                        chooseLabel="Choose Files"
                        (onSelect)="onObjectiveResourceFilesSelect($event)"
                        [auto]="false"
                        chooseIcon="pi pi-upload"
                    ></p-fileupload>

                    <!-- Display selected files -->
                    @if (selectedObjectiveResourceFiles.length > 0) {
                        <div class="mt-2 flex flex-col gap-1">
                            @for (file of selectedObjectiveResourceFiles; track file.name) {
                                <div class="flex items-center gap-2 p-2 bg-surface-100 dark:bg-surface-800 rounded">
                                    <i class="pi pi-file"></i>
                                    <span class="flex-1 truncate">{{ file.name }}</span>
                                    <span class="text-surface-500 text-sm">{{ formatFileSize(file.size) }}</span>
                                    <p-button icon="pi pi-times" [rounded]="true" [text]="true" severity="danger" size="small" (onClick)="removeSelectedObjectiveFile(file)" />
                                </div>
                            }
                        </div>
                    }

                    <!-- Display existing files (edit mode) -->
                    @if (objectiveResourceDialogMode === 'edit' && currentObjectiveResource.files && currentObjectiveResource.files.length > 0) {
                        <div class="mt-2">
                            <span class="text-sm text-surface-500">Existing files:</span>
                            <div class="flex flex-col gap-1 mt-1">
                                @for (file of currentObjectiveResource.files; track file.id) {
                                    <div class="flex items-center gap-2 p-2 bg-surface-100 dark:bg-surface-800 rounded">
                                        <i class="pi pi-file"></i>
                                        <span class="flex-1 truncate">{{ file.originalFileName }}</span>
                                        <span class="text-surface-500 text-sm">{{ formatFileSize(file.fileSize) }}</span>
                                        <p-button icon="pi pi-times" [rounded]="true" [text]="true" severity="danger" size="small" (onClick)="removeExistingObjectiveFile(file)" />
                                    </div>
                                }
                            </div>
                        </div>
                    }
                    <small class="text-surface-500">You can attach multiple files</small>
                </div>

                <div>
                    <label for="objResourceDescription" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Description</label>
                    <textarea pInputTextarea id="objResourceDescription" [(ngModel)]="currentObjectiveResource.description" [rows]="2" class="w-full"></textarea>
                </div>

                <div>
                    <label for="objResourceType" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Type *</label>
                    <p-select id="objResourceType" [(ngModel)]="currentObjectiveResource.type" [options]="resourceTypeOptions" optionLabel="label" optionValue="value" placeholder="Select Type" class="w-full" appendTo="body" />
                </div>
            </div>

            <div class="flex justify-end gap-2 mt-6">
                <p-button label="Cancel" severity="secondary" (onClick)="objectiveResourceDialogVisible = false" />
                <p-button [label]="objectiveResourceDialogMode === 'add' ? 'Add' : 'Save'" (onClick)="saveObjectiveResource()" [loading]="savingObjectiveResource" />
            </div>
        </p-dialog>

        <!-- Assign Members to Project Dialog -->
        <p-dialog [(visible)]="assignMembersToProjectDialogVisible" [header]="'Assign Members to: ' + (selectedProject?.title || 'Project')" [modal]="true" [style]="{width: '40rem'}" [contentStyle]="{'max-height': '70vh', 'overflow': 'visible'}" appendTo="body">
            <div class="flex flex-col gap-4">
                <div>
                    <label class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Select Team Members</label>
                    <p-multiselect
                        [(ngModel)]="tempSelectedProjectMembers"
                        [options]="availableMembers"
                        optionLabel="name"
                        optionValue="userId"
                        placeholder="Select members to assign"
                        class="w-full"
                        display="chip"
                        (onChange)="onProjectMembersChange($event)"
                    >
                        <ng-template let-member pTemplate="item">
                            <div class="flex items-center gap-2">
                                <p-avatar *ngIf="hasProfilePicture(member)" [image]="member.avatar" shape="circle" size="normal"></p-avatar>
                                <p-avatar *ngIf="!hasProfilePicture(member)" [label]="getInitials(member.name)" shape="circle" size="normal" [style]="{'background-color': 'var(--primary-color)', 'color': 'var(--primary-color-text)'}"></p-avatar>
                                <div>
                                    <span class="font-medium">{{ member.name }}</span>
                                    <span class="text-xs text-muted-color ml-2">{{ member.role }}</span>
                                </div>
                            </div>
                        </ng-template>
                    </p-multiselect>
                </div>

                <div *ngIf="selectedProject?.participants?.length" class="mt-2">
                    <p class="text-sm text-muted-color mb-2">Current team members:</p>
                    <div class="flex flex-wrap gap-2">
                        <div *ngFor="let member of selectedProject?.participants" class="flex items-center gap-2 bg-surface-100 dark:bg-surface-800 rounded-full pl-3 pr-1 py-1">
                            <p-avatar *ngIf="hasProfilePicture(member)" [image]="member.avatar" shape="circle" size="normal"></p-avatar>
                            <p-avatar *ngIf="!hasProfilePicture(member)" [label]="getInitials(member.name)" shape="circle" size="normal" [style]="{'background-color': 'var(--primary-color)', 'color': 'var(--primary-color-text)'}"></p-avatar>
                            <span class="text-sm">{{ member.name }}</span>
                            <p-button *ngIf="isProjectCreator(selectedProject) || isProjectModerator(selectedProject)" icon="pi pi-times" size="small" [text]="true" [rounded]="true" severity="danger" (onClick)="removeProjectMemberFromDialog(member)" />
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex justify-end gap-2 mt-6">
                <p-button label="Cancel" severity="secondary" (onClick)="assignMembersToProjectDialogVisible = false" />
                <p-button label="Save" (onClick)="assignProjectMembers()" />
            </div>
        </p-dialog>

        <!-- Assign Members to Task Dialog -->
        <p-dialog [(visible)]="assignMembersToObjectiveDialogVisible" [header]="'Assign Members to: ' + (assigningObjective?.title || '')" [modal]="true" [style]="{width: '40rem'}" [contentStyle]="{'max-height': '70vh', 'overflow': 'visible'}" appendTo="body">
            <div class="flex flex-col gap-4">
                <div>
                    <label class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Select Team Members</label>
                    <p-multiselect
                        [(ngModel)]="tempSelectedObjectiveMembers"
                        [options]="availableMembers"
                        optionLabel="name"
                        optionValue="userId"
                        placeholder="Select members to assign"
                        class="w-full"
                        [showClear]="false"
                        display="chip"
                        (onChange)="onObjectiveMembersChange($event)"
                    >
                        <ng-template let-member pTemplate="item">
                            <div class="flex items-center gap-2">
                                <p-avatar *ngIf="hasProfilePicture(member)" [image]="member.avatar" shape="circle" size="normal"></p-avatar>
                                <p-avatar *ngIf="!hasProfilePicture(member)" [label]="getInitials(member.name)" shape="circle" size="normal" [style]="{'background-color': 'var(--primary-color)', 'color': 'var(--primary-color-text)'}"></p-avatar>
                                <div>
                                    <span class="font-medium">{{ member.name }}</span>
                                    <span class="text-xs text-muted-color ml-2">{{ member.role }}</span>
                                </div>
                            </div>
                        </ng-template>
                    </p-multiselect>
                </div>

                <div *ngIf="assigningObjective?.members?.length" class="mt-2">
                    <p class="text-sm text-muted-color mb-2">Currently assigned:</p>
                    <div class="flex flex-wrap gap-2">
                        <div *ngFor="let member of assigningObjective?.members" class="flex items-center gap-2 bg-surface-100 dark:bg-surface-800 rounded-full pl-3 pr-1 py-1">
                            <p-avatar *ngIf="hasProfilePicture(member)" [image]="member.avatar" shape="circle" size="normal"></p-avatar>
                            <p-avatar *ngIf="!hasProfilePicture(member)" [label]="getInitials(member.name)" shape="circle" size="normal" [style]="{'background-color': 'var(--primary-color)', 'color': 'var(--primary-color-text)'}"></p-avatar>
                            <span class="text-sm">{{ member.name }}</span>
                            <p-button icon="pi pi-times" size="small" [text]="true" [rounded]="true" severity="danger" (onClick)="removeObjectiveMemberFromDialog(member)" />
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex justify-end gap-2 mt-6">
                <p-button label="Cancel" severity="secondary" (onClick)="assignMembersToObjectiveDialogVisible = false" />
                <p-button label="Save" (onClick)="saveObjectiveMembers()" />
            </div>
        </p-dialog>

        <!-- Assign Moderator Dialog -->
        <p-dialog [(visible)]="assignModeratorDialogVisible" [header]="'Manage Moderators: ' + (selectedProject?.title || 'Project')" [modal]="true" [style]="{width: '40rem'}" [contentStyle]="{'overflow': 'visible'}" appendTo="body">
            <div class="flex flex-col gap-4">
                <!-- Current moderators list -->
                <div>
                    <label class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Current Moderators</label>
                    <div *ngIf="!selectedProject?.moderators?.length" class="text-sm text-muted-color p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                        No moderators assigned yet.
                    </div>
                    <div class="flex flex-col gap-2">
                        <div *ngFor="let mod of selectedProject?.moderators" class="flex items-center justify-between p-3 bg-surface-100 dark:bg-surface-800 rounded-lg">
                            <div class="flex items-center gap-2">
                                <i class="pi pi-shield text-warning"></i>
                                <span class="font-medium">{{ mod.firstName }} {{ mod.lastName }}</span>
                            </div>
                            <p-button icon="pi pi-times" [text]="true" [rounded]="true" severity="danger" size="small"
                                [loading]="removingModeratorUserId === mod.userId"
                                (onClick)="removeProjectModerator(mod.userId)" pTooltip="Remove moderator" />
                        </div>
                    </div>
                </div>
                <!-- Add new moderator -->
                <div>
                    <label class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Add Moderator</label>
                    <div class="flex gap-2">
                        <p-select
                            [(ngModel)]="selectedModeratorUserId"
                            [options]="getAvailableMembersForModerator()"
                            optionLabel="name"
                            optionValue="userId"
                            placeholder="Select a member to add"
                            class="flex-1"
                            [showClear]="true"
                        >
                            <ng-template let-member pTemplate="item">
                                <div class="flex items-center gap-2">
                                    <p-avatar *ngIf="hasProfilePicture(member)" [image]="member.avatar" shape="circle" size="normal"></p-avatar>
                                    <p-avatar *ngIf="!hasProfilePicture(member)" [label]="getInitials(member.name)" shape="circle" size="normal" [style]="{'background-color': 'var(--primary-color)', 'color': 'var(--primary-color-text)'}"></p-avatar>
                                    <div>
                                        <span class="font-medium">{{ member.name }}</span>
                                        <span class="text-xs text-muted-color ml-2">{{ member.role }}</span>
                                    </div>
                                </div>
                            </ng-template>
                        </p-select>
                        <p-button label="Add" icon="pi pi-plus" [loading]="savingModerator" [disabled]="!selectedModeratorUserId" (onClick)="saveProjectModerator()" />
                    </div>
                </div>
                <p class="text-sm text-muted-color m-0">Moderators can edit, delete and manage tasks for this project.</p>
            </div>
            <div class="flex justify-end gap-2 mt-6">
                <p-button label="Close" severity="secondary" (onClick)="assignModeratorDialogVisible = false" />
            </div>
        </p-dialog>

        <div class="card">
            <div class="flex justify-end items-center mb-6">
                <p-button *ngIf="isAdmin()" label="New Project" icon="pi pi-plus" size="small" (onClick)="openAddDialog()"></p-button>
            </div>

            <!-- Kanban-style Board -->
            <div class="grid grid-cols-12 gap-4">
                <!-- Upcoming Column -->
                <div class="col-span-12 md:col-span-4">
                    <div class="bg-amber-100 dark:bg-amber-900/40 rounded-lg p-4" pDroppable="projects" (onDrop)="onDrop($event, 'upcoming')">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="font-semibold text-lg m-0">Upcoming</h3>
                            <p-tag [value]="getProjectsByStatus('upcoming').length.toString()" severity="warn"></p-tag>
                        </div>
                        <div class="flex flex-col gap-3 min-h-32">
                            <div *ngFor="let project of getProjectsByStatus('upcoming')" pDraggable="projects" (onDragStart)="dragStart(project)" (onDragEnd)="dragEnd()" class="bg-surface-0 dark:bg-surface-900 border border-surface rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" [ngClass]="{'ring-2 ring-primary !border-primary': selectedProject?.id === project.id}" (click)="selectProject(project)">
                                <div *ngIf="project.bannerUrl" class="h-20 overflow-hidden">
                                    <img [src]="project.bannerUrl" alt="Project banner" class="w-full h-full object-cover" />
                                </div>
                                <div class="p-4">
                                <div class="flex justify-between items-start mb-3">
                                    <div class="flex items-center gap-2 flex-wrap flex-1">
                                        <h4 class="text-base font-semibold text-surface-900 dark:text-surface-0 m-0">
                                            {{ project.title }}
                                        </h4>
                                        <ng-container *ngIf="project.types && project.types.length > 0; else noTypeUpcoming">
                                            <p-tag *ngFor="let type of project.types" [value]="type" severity="secondary" styleClass="text-xs"></p-tag>
                                        </ng-container>
                                        <ng-template #noTypeUpcoming>
                                            <span class="text-xs text-muted-color italic">No type selected</span>
                                        </ng-template>
                                    </div>
                                    <div class="flex justify-content-center align-content-end">
                                        <p-button *ngIf="isAdminOrModerator(project)" icon="pi pi-pencil" [text]="true" [rounded]="true" size="small" severity="secondary" (onClick)="openEditDialog(project); $event.stopPropagation()" />
                                        <p-button *ngIf="isAdminOrModerator(project)" icon="pi pi-trash" [text]="true" [rounded]="true" size="small" severity="danger" (onClick)="confirmDeleteProject(project)" />
                                        <p-button icon="pi pi-history" [text]="true" [rounded]="true" size="small" severity="info" pTooltip="History" (onClick)="openHistoryDialog(project); $event.stopPropagation()" />
                                    </div>
                                </div>

                                <p class="text-surface-700 dark:text-surface-300 text-sm mb-3 line-clamp-2">
                                    {{ stripHtml(project.description) }}
                                </p>

                                <div class="flex items-center gap-2 text-xs text-muted-color mb-3">
                                    <i class="pi pi-calendar"></i>
                                    <span>Starts {{ project.startDate | date:'MMM d, y' }}</span>
                                </div>

                                <div class="mb-3">
                                    <p-button
                                        *ngIf="!isUserMember(project)"
                                        label="Join"
                                        icon="pi pi-user-plus"
                                        size="small"
                                        [outlined]="true"
                                        (onClick)="joinProject(project, $event)"
                                        styleClass="w-full"
                                    />
                                    <p-button
                                        *ngIf="isUserMember(project)"
                                        label="Leave"
                                        icon="pi pi-user-minus"
                                        size="small"
                                        [outlined]="true"
                                        severity="danger"
                                        (onClick)="leaveProject(project, $event)"
                                        styleClass="w-full"
                                    />
                                </div>

                                <p-divider></p-divider>

                                <div class="mt-3">
                                    <p class="text-xs text-muted-color mb-2">Team</p>
                                    <p-avatargroup>
                                        <p-avatar
                                            *ngFor="let member of project.participants.slice(0, 3)"
                                            [image]="hasProfilePicture(member) ? member.avatar : undefined"
                                            [label]="!hasProfilePicture(member) ? getInitials(member.name) : undefined"
                                            shape="circle"
                                            size="normal"
                                            [style]="!hasProfilePicture(member) ? {'background-color': 'var(--primary-color)', 'color': 'var(--primary-color-text)'} : {}"
                                        ></p-avatar>
                                        <p-avatar
                                            *ngIf="project.participants.length > 3"
                                            [label]="'+' + (project.participants.length - 3)"
                                            shape="circle"
                                            size="normal"
                                            [style]="{'background-color': 'var(--primary-color)', 'color': 'var(--primary-color-text)'}"
                                        ></p-avatar>
                                    </p-avatargroup>
                                </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- In Progress Column -->
                <div class="col-span-12 md:col-span-4">
                    <div class="bg-blue-100 dark:bg-blue-900/40 rounded-lg p-4" [ngClass]="{'border-2 border-dashed border-orange-400': showInProgressWarning}" pDroppable="projects" (onDrop)="onDrop($event, 'in-progress')">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="font-semibold text-lg m-0">In Progress</h3>
                            <p-tag [value]="getProjectsByStatus('in-progress').length.toString()" severity="info"></p-tag>
                        </div>
                        <!-- Warning message when dragging project without in-progress objectives -->
                        <div *ngIf="showInProgressWarning" class="bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 rounded-lg p-3 mb-3 flex items-center gap-2">
                            <i class="pi pi-exclamation-triangle text-orange-500"></i>
                            <span class="text-sm text-orange-700 dark:text-orange-300">At least one objective must be in progress first</span>
                        </div>
                        <div class="flex flex-col gap-3 min-h-32">
                            <div *ngFor="let project of getProjectsByStatus('in-progress')" pDraggable="projects" (onDragStart)="dragStart(project)" (onDragEnd)="dragEnd()" class="bg-surface-0 dark:bg-surface-900 border border-surface rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" [ngClass]="{'ring-2 ring-primary !border-primary': selectedProject?.id === project.id}" (click)="selectProject(project)">
                                <div *ngIf="project.bannerUrl" class="h-20 overflow-hidden">
                                    <img [src]="project.bannerUrl" alt="Project banner" class="w-full h-full object-cover" />
                                </div>
                                <div class="p-4">
                                <div class="flex justify-between items-start mb-3">
                                    <div class="flex items-center gap-2 flex-wrap flex-1">
                                        <h4 class="text-base font-semibold text-surface-900 dark:text-surface-0 m-0">
                                            {{ project.title }}
                                        </h4>
                                        <ng-container *ngIf="project.types && project.types.length > 0; else noTypeInProgress">
                                            <p-tag *ngFor="let type of project.types" [value]="type" severity="secondary" styleClass="text-xs"></p-tag>
                                        </ng-container>
                                        <ng-template #noTypeInProgress>
                                            <span class="text-xs text-muted-color italic">No type selected</span>
                                        </ng-template>
                                    </div>
                                    <div class="flex justify-content-center align-content-end">
                                    <p-button *ngIf="isAdminOrModerator(project)" icon="pi pi-pencil" [text]="true" [rounded]="true" size="small" severity="secondary" (onClick)="openEditDialog(project); $event.stopPropagation()" />
                                    <p-button *ngIf="isAdminOrModerator(project)" icon="pi pi-trash" [text]="true" [rounded]="true" size="small" severity="danger" (onClick)="confirmDeleteProject(project)" />
                                    <p-button icon="pi pi-history" [text]="true" [rounded]="true" size="small" severity="info" pTooltip="History" (onClick)="openHistoryDialog(project); $event.stopPropagation()" />
                                    </div>
                                </div>

                                <p class="text-surface-700 dark:text-surface-300 text-sm mb-3 line-clamp-2">
                                    {{ stripHtml(project.description) }}
                                </p>

                                <div class="mb-3">
                                    <div class="flex justify-between text-xs mb-2">
                                        <span class="text-muted-color">Progress</span>
                                        <span class="font-semibold">{{ project.progress | number:'1.0-1' }}%</span>
                                    </div>
                                    <p-progressbar [value]="project.progress" [showValue]="false"></p-progressbar>
                                </div>

                                <div class="mb-3">
                                    <p-button
                                        *ngIf="!isUserMember(project)"
                                        label="Join"
                                        icon="pi pi-user-plus"
                                        size="small"
                                        [outlined]="true"
                                        (onClick)="joinProject(project, $event)"
                                        styleClass="w-full"
                                    />
                                    <p-button
                                        *ngIf="isUserMember(project)"
                                        label="Leave"
                                        icon="pi pi-user-minus"
                                        size="small"
                                        [outlined]="true"
                                        severity="danger"
                                        (onClick)="leaveProject(project, $event)"
                                        styleClass="w-full"
                                    />
                                </div>

                                <p-divider></p-divider>

                                <div class="mt-3">
                                    <p class="text-xs text-muted-color mb-2">Team</p>
                                    <p-avatargroup>
                                        <p-avatar
                                            *ngFor="let member of project.participants.slice(0, 3)"
                                            [image]="hasProfilePicture(member) ? member.avatar : undefined"
                                            [label]="!hasProfilePicture(member) ? getInitials(member.name) : undefined"
                                            shape="circle"
                                            size="normal"
                                            [style]="!hasProfilePicture(member) ? {'background-color': 'var(--primary-color)', 'color': 'var(--primary-color-text)'} : {}"
                                        ></p-avatar>
                                        <p-avatar
                                            *ngIf="project.participants.length > 3"
                                            [label]="'+' + (project.participants.length - 3)"
                                            shape="circle"
                                            size="normal"
                                            [style]="{'background-color': 'var(--primary-color)', 'color': 'var(--primary-color-text)'}"
                                        ></p-avatar>
                                    </p-avatargroup>
                                </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Completed Column -->
                <div class="col-span-12 md:col-span-4">
                    <div class="bg-green-100 dark:bg-green-900/40 rounded-lg p-4" [ngClass]="{'border-2 border-dashed border-orange-400': showCompletedWarning}" pDroppable="projects" (onDrop)="onDrop($event, 'completed')">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="font-semibold text-lg m-0">Completed</h3>
                            <p-tag [value]="getProjectsByStatus('completed').length.toString()" severity="success"></p-tag>
                        </div>
                        <!-- Warning message when dragging incomplete project -->
                        <div *ngIf="showCompletedWarning" class="bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 rounded-lg p-3 mb-3 flex items-center gap-2">
                            <i class="pi pi-exclamation-triangle text-orange-500"></i>
                            <span class="text-sm text-orange-700 dark:text-orange-300">All project objectives must be completed first</span>
                        </div>
                        <div class="flex flex-col gap-3 min-h-32">
                            <div *ngFor="let project of getProjectsByStatus('completed')" pDraggable="projects" (onDragStart)="dragStart(project)" (onDragEnd)="dragEnd()" class="bg-surface-0 dark:bg-surface-900 border border-surface rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" [ngClass]="{'ring-2 ring-primary !border-primary': selectedProject?.id === project.id}" (click)="selectProject(project)">
                                <div *ngIf="project.bannerUrl" class="h-20 overflow-hidden">
                                    <img [src]="project.bannerUrl" alt="Project banner" class="w-full h-full object-cover" />
                                </div>
                                <div class="p-4">
                                <div class="flex justify-between items-start mb-3">
                                    <div class="flex items-center gap-2 flex-wrap flex-1">
                                        <h4 class="text-base font-semibold text-surface-900 dark:text-surface-0 m-0">
                                            {{ project.title }}
                                        </h4>
                                        <ng-container *ngIf="project.types && project.types.length > 0; else noTypeCompleted">
                                            <p-tag *ngFor="let type of project.types" [value]="type" severity="secondary" styleClass="text-xs"></p-tag>
                                        </ng-container>
                                        <ng-template #noTypeCompleted>
                                            <span class="text-xs text-muted-color italic">No type selected</span>
                                        </ng-template>
                                    </div>
                                    <div class="flex justify-content-center align-content-end">
                                        <p-button *ngIf="isAdminOrModerator(project) && project.status !== 'completed'" icon="pi pi-pencil" [text]="true" [rounded]="true" size="small" severity="secondary" (onClick)="openEditDialog(project); $event.stopPropagation()" />
                                        <p-button *ngIf="isAdminOrModerator(project) && project.status !== 'completed'" icon="pi pi-trash" [text]="true" [rounded]="true" size="small" severity="danger" (onClick)="confirmDeleteProject(project)" />
                                        <p-button icon="pi pi-history" [text]="true" [rounded]="true" size="small" severity="info" pTooltip="History" (onClick)="openHistoryDialog(project); $event.stopPropagation()" />
                                    </div>
                                </div>

                                <p class="text-surface-700 dark:text-surface-300 text-sm mb-3 line-clamp-2">
                                    {{ stripHtml(project.description) }}
                                </p>

                                <div class="flex items-center gap-2 text-xs text-muted-color mb-3">
                                    <i class="pi pi-calendar"></i>
                                    <span>Completed {{ project.endDate | date:'MMM d, y' }}</span>
                                </div>

                                <div class="mb-3">
                                    <div class="flex justify-between text-xs mb-2">
                                        <span class="text-muted-color">Progress</span>
                                        <span class="font-semibold">{{ project.progress | number:'1.0-1' }}%</span>
                                    </div>
                                    <p-progressbar [value]="project.progress" [showValue]="false"></p-progressbar>
                                </div>

                                <p-divider></p-divider>

                                <div class="mt-3">
                                    <p class="text-xs text-muted-color mb-2">Team</p>
                                    <p-avatargroup>
                                        <p-avatar
                                            *ngFor="let member of project.participants.slice(0, 3)"
                                            [image]="hasProfilePicture(member) ? member.avatar : undefined"
                                            [label]="!hasProfilePicture(member) ? getInitials(member.name) : undefined"
                                            shape="circle"
                                            size="normal"
                                            [style]="!hasProfilePicture(member) ? {'background-color': 'var(--primary-color)', 'color': 'var(--primary-color-text)'} : {}"
                                        ></p-avatar>
                                        <p-avatar
                                            *ngIf="project.participants.length > 3"
                                            [label]="'+' + (project.participants.length - 3)"
                                            shape="circle"
                                            size="normal"
                                            [style]="{'background-color': 'var(--primary-color)', 'color': 'var(--primary-color-text)'}"
                                        ></p-avatar>
                                    </p-avatargroup>
                                </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Project Details Modal/Section -->
            <div *ngIf="selectedProject" class="mt-8 border-t border-surface pt-8">
                <!-- Project Banner -->
                <div class="relative h-48 bg-gradient-to-r from-primary-300 via-primary-500 to-primary-700 overflow-hidden rounded-xl mb-6 group">
                    <img
                        *ngIf="selectedProject.bannerUrl"
                        [src]="selectedProject.bannerUrl"
                        alt="Project banner"
                        class="w-full h-full object-cover"
                    />
                    <!-- Banner controls (admin/moderator/creator only) -->
                    <div *ngIf="(isAdminOrModerator(selectedProject) || isProjectCreator(selectedProject)) && selectedProject.status !== 'completed'" class="absolute bottom-3 right-3 flex gap-2 items-end">
                        <p-fileupload
                            mode="basic"
                            chooseIcon="pi pi-camera"
                            chooseLabel="Change Banner"
                            accept="image/*"
                            [maxFileSize]="5000000"
                            (onSelect)="onProjectBannerSelect($event)"
                            [auto]="true"
                            styleClass="!text-white !border-0"
                        />
                        <button
                            *ngIf="selectedProject.bannerUrl"
                            (click)="deleteProjectBanner()"
                            class="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium bg-black/50 text-white border-0 hover:bg-red-600/80 backdrop-blur-sm transition-all cursor-pointer"
                        >
                            <i class="pi pi-trash text-xs"></i>
                            Remove
                        </button>
                    </div>
                </div>

                <div class="flex flex-col md:flex-row justify-between items-start mb-4">
                    <div class="flex-1">
                        <div class="flex flex-col md:flex-row items-start md:items-center gap-2 mb-2">
                            <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0 m-0">{{ selectedProject.title }}</h2>
                            <p-tag
                                [value]="selectedProject.status === 'in-progress' ? 'In Progress' : selectedProject.status === 'upcoming' ? 'Upcoming' : 'Completed'"
                                [severity]="selectedProject.status === 'in-progress' ? 'info' : selectedProject.status === 'upcoming' ? 'warn' : 'success'"
                            ></p-tag>
                            <p-tag *ngFor="let type of selectedProject.types" [value]="type" severity="secondary"></p-tag>
                        </div>
                    </div>
                    <div class="flex flex-wrap gap-2">
                        <p-button *ngIf="isAdminOrModerator(selectedProject) && selectedProject.status !== 'completed'" label="Edit" icon="pi pi-pencil" severity="secondary" [outlined]="true" (onClick)="openEditDialog(selectedProject)" />
                        <p-button *ngIf="isAdminOrModerator(selectedProject) && selectedProject.status !== 'completed'" label="Delete" icon="pi pi-trash" severity="danger" [outlined]="true" (onClick)="confirmDeleteProject(selectedProject)" />
                        <p-button *ngIf="isAdmin() && selectedProject.status !== 'completed'" label="Moderator" icon="pi pi-shield" severity="warn" [outlined]="true" (onClick)="openAssignModeratorDialog()" />
                        <p-button label="History" icon="pi pi-history" severity="info" [outlined]="true" (onClick)="openHistoryDialog(selectedProject)" />
                        <p-button icon="pi pi-times" [text]="true" [rounded]="true" (onClick)="selectedProject = null"></p-button>
                    </div>
                </div>

                <div class="grid grid-cols-12 gap-6">
                    <div class="col-span-12 lg:col-span-8">
                        <div class="mb-6">
                            <div class="flex justify-between items-center mb-4">
                                <h3 class="text-lg font-semibold m-0">Tasks</h3>
                                <p-button *ngIf="selectedProject.status !== 'completed'" label="Add Task" icon="pi pi-plus" size="small" (onClick)="openAddObjectiveDialog()" />
                            </div>

                            <!-- Kanban Board for Tasks -->
                            <div class="grid grid-cols-12 gap-4">
                                <!-- Todo Column -->
                                <div *ngIf="selectedProject.status !== 'completed'" class="col-span-12 md:col-span-4">
                                    <div class="bg-surface-100 dark:bg-surface-800 rounded-lg p-3" pDroppable="objectives" (onDrop)="onDropObjective($event, 'todo')">
                                        <div class="flex items-center justify-between mb-3">
                                            <h4 class="font-semibold text-sm m-0 text-surface-600 dark:text-surface-400">To Do</h4>
                                            <p-tag [value]="getObjectivesByStatus('todo').length.toString()" severity="secondary" styleClass="text-xs"></p-tag>
                                        </div>
                                        <div class="flex flex-col gap-2 min-h-24">
                                            <div *ngFor="let objective of getObjectivesByStatus('todo')"
                                                pDraggable="objectives"
                                                (onDragStart)="dragStartObjective(objective)"
                                                (onDragEnd)="dragEndObjective()"
                                                (click)="openObjectiveDetailDialog(objective)"
                                                class="bg-surface-0 dark:bg-surface-900 border border-surface rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer">
                                                <div class="flex justify-between items-start mb-2">
                                                    <h5 class="font-semibold text-sm text-surface-900 dark:text-surface-0 m-0 flex-1">{{ objective.title }}</h5>
                                                    <div class="flex gap-1">
                                                        <p-button *ngIf="isAdminOrModerator(selectedProject)" icon="pi pi-pencil" [text]="true" [rounded]="true" size="small" severity="secondary" (onClick)="openEditObjectiveDialog(objective); $event.stopPropagation()" />
                                                        <p-button *ngIf="isAdminOrModerator(selectedProject)" icon="pi pi-trash" [text]="true" [rounded]="true" size="small" severity="danger" (onClick)="confirmDeleteObjective(objective); $event.stopPropagation()" />
                                                    </div>
                                                </div>
                                                <p class="text-xs text-surface-600 dark:text-surface-400 mb-2 line-clamp-2">{{ stripHtml(objective.description) }}</p>
                                                <div class="flex items-center gap-1 mb-2">
                                                    <i class="pi pi-star-fill text-primary" style="font-size: 0.65rem"></i>
                                                    <span class="text-xs font-semibold text-primary">{{ objective.points ?? 1 }} pts</span>
                                                </div>
                                                <div *ngIf="objective.createdByFirstName || objective.createdByLastName" class="text-xs text-surface-500 dark:text-surface-500 mb-2 flex items-center gap-1">
                                                    <i class="pi pi-user" style="font-size: 0.65rem"></i>
                                                    <span>{{ objective.createdByFirstName }} {{ objective.createdByLastName }}</span>
                                                </div>
                                                <div class="flex items-center justify-between">
                                                    <div class="flex items-center gap-1">
                                                        @if (objective.members && objective.members.length > 0) {
                                                            <p-avatarGroup>
                                                                @for (member of objective.members.slice(0, 2); track member.name) {
                                                                    <p-avatar *ngIf="hasProfilePicture(member)" [image]="member.avatar" shape="circle" size="normal" [pTooltip]="member.name"></p-avatar>
                                                                    <p-avatar *ngIf="!hasProfilePicture(member)" [label]="getInitials(member.name)" shape="circle" size="normal" [pTooltip]="member.name" [style]="{'background-color': 'var(--primary-color)', 'color': 'var(--primary-color-text)'}"></p-avatar>
                                                                }
                                                                @if (objective.members.length > 2) {
                                                                    <p-avatar [label]="'+' + (objective.members.length - 2)" shape="circle" size="normal" [style]="{'background-color': 'var(--primary-color)', 'color': 'var(--primary-color-text)', 'font-size': '0.7rem'}"></p-avatar>
                                                                }
                                                            </p-avatarGroup>
                                                        }
                                                    </div>
                                                    <div class="flex items-center gap-1">
                                                        <p-button *ngIf="objective.status !== 'completed' && isAdminOrModerator(selectedProject)" class="" icon="pi pi-users" size="small" [text]="true" [rounded]="true" severity="info" pTooltip="Assign Members" (onClick)="openAssignMembersToObjectiveDialog(objective, $event)" />
                                                        @if (objective.status !== 'completed' && !isUserInObjective(objective)) {
                                                            <p-button icon="pi pi-user-plus" size="small" [text]="true" [rounded]="true" severity="secondary" pTooltip="Join" (onClick)="joinObjective(objective, $event)" />
                                                        } @else if (objective.status !== 'completed' && isUserInObjective(objective)) {
                                                            <p-button icon="pi pi-user-minus" size="small" [text]="true" [rounded]="true" severity="warn" pTooltip="Leave" (onClick)="leaveObjective(objective, $event)" />
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- In Progress Column -->
                                <div *ngIf="selectedProject.status !== 'completed'" class="col-span-12 md:col-span-4">
                                    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3" pDroppable="objectives" (onDrop)="onDropObjective($event, 'in-progress')">
                                        <div class="flex items-center justify-between mb-3">
                                            <h4 class="font-semibold text-sm m-0 text-blue-600 dark:text-blue-400">In Progress</h4>
                                            <p-tag [value]="getObjectivesByStatus('in-progress').length.toString()" severity="info" styleClass="text-xs"></p-tag>
                                        </div>
                                        <div class="flex flex-col gap-2 min-h-24">
                                            <div *ngFor="let objective of getObjectivesByStatus('in-progress')"
                                                pDraggable="objectives"
                                                (onDragStart)="dragStartObjective(objective)"
                                                (onDragEnd)="dragEndObjective()"
                                                (click)="openObjectiveDetailDialog(objective)"
                                                class="bg-surface-0 dark:bg-surface-900 border border-blue-200 dark:border-blue-800 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer">
                                                <div class="flex justify-between items-start mb-2">
                                                    <h5 class="font-semibold text-sm text-surface-900 dark:text-surface-0 m-0 flex-1">{{ objective.title }}</h5>
                                                    <div class="flex gap-1">
                                                        <p-button *ngIf="isAdminOrModerator(selectedProject)" icon="pi pi-pencil" [text]="true" [rounded]="true" size="small" severity="secondary" (onClick)="openEditObjectiveDialog(objective); $event.stopPropagation()" />
                                                        <p-button *ngIf="isAdminOrModerator(selectedProject)" icon="pi pi-trash" [text]="true" [rounded]="true" size="small" severity="danger" (onClick)="confirmDeleteObjective(objective); $event.stopPropagation()" />
                                                    </div>
                                                </div>
                                                <p class="text-xs text-surface-600 dark:text-surface-400 mb-2 line-clamp-2">{{ stripHtml(objective.description) }}</p>
                                                <div class="flex items-center gap-1 mb-2">
                                                    <i class="pi pi-star-fill text-primary" style="font-size: 0.65rem"></i>
                                                    <span class="text-xs font-semibold text-primary">{{ objective.points ?? 1 }} pts</span>
                                                </div>
                                                <div *ngIf="objective.createdByFirstName || objective.createdByLastName" class="text-xs text-surface-500 dark:text-surface-500 mb-2 flex items-center gap-1">
                                                    <i class="pi pi-user" style="font-size: 0.65rem"></i>
                                                    <span>{{ objective.createdByFirstName }} {{ objective.createdByLastName }}</span>
                                                </div>
                                                <div class="flex items-center justify-between">
                                                    <div class="flex items-center gap-1">
                                                        @if (objective.members && objective.members.length > 0) {
                                                            <p-avatarGroup>
                                                                @for (member of objective.members.slice(0, 2); track member.name) {
                                                                    <p-avatar
                                                                        [image]="hasProfilePicture(member) ? member.avatar : undefined"
                                                                        [label]="!hasProfilePicture(member) ? getInitials(member.name) : undefined"
                                                                        shape="circle"
                                                                        size="normal"
                                                                        [pTooltip]="member.name"
                                                                        [style]="!hasProfilePicture(member) ? {'background-color': 'var(--primary-color)', 'color': 'var(--primary-color-text)'} : {}"
                                                                    ></p-avatar>
                                                                }
                                                                @if (objective.members.length > 2) {
                                                                    <p-avatar [label]="'+' + (objective.members.length - 2)" shape="circle" size="normal" [style]="{'background-color': 'var(--primary-color)', 'color': 'var(--primary-color-text)', 'font-size': '0.7rem'}"></p-avatar>
                                                                }
                                                            </p-avatarGroup>
                                                        }
                                                    </div>
                                                    <div class="flex items-center gap-1">
                                                        <p-button *ngIf="objective.status !== 'completed' && isAdminOrModerator(selectedProject)" icon="pi pi-users" size="small" [text]="true" [rounded]="true" severity="info" pTooltip="Assign Members" (onClick)="openAssignMembersToObjectiveDialog(objective, $event)" />
                                                        @if (objective.status !== 'completed' && !isUserInObjective(objective)) {
                                                            <p-button icon="pi pi-user-plus" size="small" [text]="true" [rounded]="true" severity="secondary" pTooltip="Join" (onClick)="joinObjective(objective, $event)" />
                                                        } @else if (objective.status !== 'completed' && isUserInObjective(objective)) {
                                                            <p-button icon="pi pi-user-minus" size="small" [text]="true" [rounded]="true" severity="warn" pTooltip="Leave" (onClick)="leaveObjective(objective, $event)" />
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Completed Column -->
                                <div [ngClass]="selectedProject.status === 'completed' ? 'col-span-12' : 'col-span-12 md:col-span-4'">
                                    <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-3" pDroppable="objectives" (onDrop)="onDropObjective($event, 'completed')">
                                        <div class="flex items-center justify-between mb-3">
                                            <h4 class="font-semibold text-sm m-0 text-green-600 dark:text-green-400">Completed</h4>
                                            <p-tag [value]="getObjectivesByStatus('completed').length.toString()" severity="success" styleClass="text-xs"></p-tag>
                                        </div>
                                        <div [ngClass]="selectedProject.status === 'completed' ? 'grid grid-cols-1 md:grid-cols-3 gap-2 min-h-24' : 'flex flex-col gap-2 min-h-24'">
                                            <div *ngFor="let objective of getObjectivesByStatus('completed')"
                                                pDraggable="objectives"
                                                (onDragStart)="dragStartObjective(objective)"
                                                (onDragEnd)="dragEndObjective()"
                                                (click)="openObjectiveDetailDialog(objective)"
                                                class="bg-surface-0 dark:bg-surface-900 border border-green-200 dark:border-green-800 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer">
                                                <div class="flex justify-between items-start mb-2">
                                                    <div class="flex items-center gap-2 flex-1">
                                                        <h5 class="font-semibold text-sm text-surface-900 dark:text-surface-0 m-0">{{ objective.title }}</h5>
                                                        <!-- <i class="pi pi-check-circle text-green-500 text-sm"></i> -->
                                                    </div>
                                                    <div class="flex gap-1">
                                                    </div>
                                                </div>
                                                <p class="text-xs text-surface-600 dark:text-surface-400 mb-2 line-clamp-2">{{ stripHtml(objective.description) }}</p>
                                                <div *ngIf="objective.createdByFirstName || objective.createdByLastName" class="text-xs text-surface-500 dark:text-surface-500 mb-2 flex items-center gap-1">
                                                    <i class="pi pi-user" style="font-size: 0.65rem"></i>
                                                    <span>{{ objective.createdByFirstName }} {{ objective.createdByLastName }}</span>
                                                </div>
                                                <div class="flex items-center justify-between">
                                                    <div class="flex items-center gap-1">
                                                        @if (objective.members && objective.members.length > 0) {
                                                            <p-avatarGroup>
                                                                @for (member of objective.members.slice(0, 2); track member.name) {
                                                                    <p-avatar
                                                                        [image]="hasProfilePicture(member) ? member.avatar : undefined"
                                                                        [label]="!hasProfilePicture(member) ? getInitials(member.name) : undefined"
                                                                        shape="circle"
                                                                        size="normal"
                                                                        [pTooltip]="member.name"
                                                                        [style]="!hasProfilePicture(member) ? {'background-color': 'var(--primary-color)', 'color': 'var(--primary-color-text)'} : {}"
                                                                    ></p-avatar>
                                                                }
                                                                @if (objective.members.length > 2) {
                                                                    <p-avatar [label]="'+' + (objective.members.length - 2)" shape="circle" size="normal" [style]="{'background-color': 'var(--primary-color)', 'color': 'var(--primary-color-text)', 'font-size': '0.7rem'}"></p-avatar>
                                                                }
                                                            </p-avatarGroup>
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-span-12 lg:col-span-4">
                        <h3 class="text-lg font-semibold m-0">Project details</h3>
                        <!-- Project Overview Card -->
                        <div class="mb-6">
                            <!-- Description -->
                            <p class="text-surface-700 dark:text-surface-300 m-0 mb-4" [innerHTML]="selectedProject.description"></p>

                            <!-- Dates and Info -->
                            <div class="flex flex-wrap items-center gap-4 mb-4 text-sm">
                                <div class="flex items-center gap-2">
                                    <i class="pi pi-calendar text-primary"></i>
                                    <span class="font-semibold text-surface-600 dark:text-surface-400">Start:</span>
                                    <span class="text-surface-900 dark:text-surface-0">{{ selectedProject.startDate | date:'MMM d, y' }}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <i class="pi pi-calendar-times text-primary"></i>
                                    <span class="font-semibold text-surface-600 dark:text-surface-400">End:</span>
                                    <span class="text-surface-900 dark:text-surface-0">{{ selectedProject.endDate | date:'MMM d, y' }}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <i class="pi pi-users text-primary"></i>
                                    <span class="text-surface-900 dark:text-surface-0">{{ selectedProject.participants.length }} member{{ selectedProject.participants.length !== 1 ? 's' : '' }}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <i class="pi pi-list text-primary"></i>
                                    <span class="text-surface-900 dark:text-surface-0">{{ selectedProject.objectives.length }} objective{{ selectedProject.objectives.length !== 1 ? 's' : '' }}</span>
                                </div>
                                <div *ngIf="selectedProject.githubRepo" class="flex items-center gap-2">
                                    <i class="pi pi-github text-primary"></i>
                                    <a [href]="getGithubRepoUrl(selectedProject.githubRepo)" target="_blank" class="text-primary hover:underline">
                                        {{ selectedProject.githubRepo }}
                                    </a>
                                </div>
                                <div class="flex items-center gap-2 flex-wrap">
                                    <i class="pi pi-tag text-primary"></i>
                                    <span class="font-semibold text-surface-600 dark:text-surface-400">Type:</span>
                                    <ng-container *ngIf="selectedProject.types && selectedProject.types.length > 0; else noTypes">
                                        <p-tag *ngFor="let type of selectedProject.types" [value]="type" severity="secondary" styleClass="text-xs"></p-tag>
                                    </ng-container>
                                    <ng-template #noTypes>
                                        <span class="text-muted-color text-sm italic">No type assigned</span>
                                    </ng-template>
                                </div>
                            </div>

                            <!-- Creator Information -->
                            <div *ngIf="selectedProject.createdByFirstName || selectedProject.createdByLastName" class="border-t border-surface-200 dark:border-surface-700 pt-3 pb-3">
                                <div class="flex items-center gap-2">
                                    <i class="pi pi-user text-primary"></i>
                                    <span class="font-semibold text-surface-600 dark:text-surface-400">Created by:</span>
                                    <span class="text-surface-900 dark:text-surface-0">{{ selectedProject.createdByFirstName }} {{ selectedProject.createdByLastName }}</span>
                                </div>
                            </div>

                            <!-- Moderator Information -->
                            <div class="border-t border-surface-200 dark:border-surface-700 pt-3 pb-3">
                                <div class="flex items-start gap-2">
                                    <i class="pi pi-shield text-primary mt-1"></i>
                                    <div class="flex flex-col gap-1">
                                        <span class="font-semibold text-primary">Moderators:</span>
                                        <span *ngIf="!selectedProject.moderators?.length" class="text-muted-color text-sm italic">None assigned</span>
                                        <span *ngFor="let mod of selectedProject.moderators" class="text-surface-900 dark:text-surface-0 text-sm">{{ mod.firstName }} {{ mod.lastName }}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Progress Bar -->
                            <div class="border-t border-surface-200 dark:border-surface-700 pt-3">
                                <div class="flex justify-between items-center mb-2">
                                    <span class="text-sm font-semibold text-surface-600 dark:text-surface-400">Overall Progress</span>
                                    <span class="text-xl font-bold text-primary">{{ selectedProject.progress | number:'1.0-1' }}%</span>
                                </div>
                                <p-progressbar [value]="selectedProject.progress" [showValue]="false"></p-progressbar>
                            </div>
                        </div>

                        <div class="mb-6">
                            <div class="flex justify-between items-center mb-4">
                                <h3 class="text-lg font-semibold m-0">Team members</h3>
                                <p-button *ngIf="selectedProject.status !== 'completed' && isAdminOrModerator(selectedProject)" icon="pi pi-user-plus" size="small" [text]="true" [rounded]="true" pTooltip="Assign Members" (onClick)="openAssignMembersToProjectDialog()" />
                            </div>
                            <div class="flex flex-col gap-3">
                                <div *ngFor="let member of selectedProject.participants" class="flex items-center gap-3">
                                    <p-avatar *ngIf="hasProfilePicture(member)" [image]="member.avatar" shape="circle" size="large"></p-avatar>
                                    <p-avatar *ngIf="!hasProfilePicture(member)" [label]="getInitials(member.name)" shape="circle" size="large" [style]="{'background-color': 'var(--primary-color)', 'color': 'var(--primary-color-text)'}"></p-avatar>
                                    <div class="flex-1">
                                        <p class="font-semibold m-0">{{ member.name }}</p>
                                        <p class="text-sm text-muted-color m-0">{{ member.role }}</p>
                                    </div>
                                    <p-button *ngIf="selectedProject.status !== 'completed' && (isProjectCreator(selectedProject) || isProjectModerator(selectedProject))" icon="pi pi-times" size="small" [text]="true" [rounded]="true" severity="danger" pTooltip="Remove Member" (onClick)="removeMemberFromProject(member)" />
                                </div>
                                <div *ngIf="!selectedProject.participants || selectedProject.participants.length === 0" class="text-center text-muted-color py-4">
                                    <i class="pi pi-users text-2xl mb-2"></i>
                                    <p class="m-0">{{ selectedProject.status === 'completed' ? 'No team members were added' : 'No team members assigned yet' }}</p>
                                </div>
                            </div>
                        </div>

                        <div class="mb-6">
                            <div class="flex justify-between items-center mb-4">
                                <h3 class="text-lg font-semibold m-0">Resources</h3>
                                <p-button *ngIf="selectedProject.status !== 'completed'" icon="pi pi-plus" size="small" [text]="true" [rounded]="true" (onClick)="openAddResourceDialog()" />
                            </div>
                            <div class="flex flex-col gap-2">
                                <div *ngFor="let resource of selectedProject.resources" class="p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                                    <div class="flex justify-between items-start mb-2">
                                        <div class="flex-1">
                                            <div class="font-semibold text-surface-900 dark:text-surface-0">{{ resource.title }}</div>
                                            @if (resource.urls && resource.urls.length > 0) {
                                                <div class="flex flex-col gap-1 mt-1">
                                                    @for (url of resource.urls; track url) {
                                                        <a [href]="url" target="_blank" class="text-primary hover:underline flex items-center gap-1 text-sm">
                                                            <i class="pi pi-external-link text-xs"></i>{{ url }}
                                                        </a>
                                                    }
                                                </div>
                                            }
                                            <p class="text-xs text-muted-color m-0 mt-1">{{ resource.description }}</p>
                                        </div>
                                        <div class="flex gap-1" *ngIf="canEditResource(resource) && selectedProject?.status !== 'completed'">
                                            <p-button icon="pi pi-pencil" size="small" [text]="true" severity="secondary" (onClick)="openEditResourceDialog(resource)" />
                                            <p-button icon="pi pi-trash" size="small" [text]="true" severity="danger" (onClick)="confirmDeleteResource(resource)" />
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-2 mb-2">
                                        <p-tag [value]="resource.type" severity="secondary" styleClass="text-xs"></p-tag>
                                        <span *ngIf="resource.createdByUserName" class="text-xs text-muted-color">
                                            <i class="pi pi-user text-xs mr-1"></i>{{ resource.createdByUserName }}
                                        </span>
                                    </div>
                                    <div *ngIf="resource.files && resource.files.length > 0" class="mt-2">
                                        <span class="text-xs text-muted-color">Attached files:</span>
                                        <div class="flex flex-col gap-1 mt-1">
                                            <div *ngFor="let file of resource.files" class="flex items-center gap-2 p-2 bg-white dark:bg-surface-900 rounded">
                                                <i class="pi pi-file text-sm"></i>
                                                <span class="flex-1 truncate text-sm text-surface-900 dark:text-surface-0">
                                                    {{ file.originalFileName }}
                                                </span>
                                                <span class="text-muted-color text-xs">{{ formatFileSize(file.fileSize) }}</span>
                                                <div class="flex gap-1">
                                                    <p-button *ngIf="!(file.originalFileName ?? '').toLowerCase().endsWith('.pptx')" icon="pi pi-eye" [text]="true" [rounded]="true" size="small" severity="secondary" pTooltip="View" (onClick)="viewFile(file.id, file.originalFileName)" />
                                                    <p-button icon="pi pi-download" [text]="true" [rounded]="true" size="small" severity="secondary" pTooltip="Download" (onClick)="downloadFile(file.id, file.originalFileName)" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div *ngIf="!selectedProject.resources || selectedProject.resources.length === 0" class="text-center text-muted-color text-sm py-4">
                                    {{ selectedProject.status === 'completed' ? 'No resources were added' : 'No resources added yet' }}
                                </div>
                            </div>
                        </div>

                        <!-- GitHub Commits Section -->
                        <div *ngIf="selectedProject.githubRepo">
                            <!-- <div class="flex justify-between items-center mb-4">
                                <div class="flex flex-col">
                                    <h3 class="text-lg font-semibold m-0 flex items-baseline gap-2">
                                        <i style="font-size: 1.5rem" class="pi pi-github text-xl"></i>
                                        GitHub Commits
                                    </h3>
                                    <span *ngIf="getTotalCommitsCount(selectedProject.id) > 0" class="text-xs text-muted-color">
                                        Showing {{ getTotalCommitsCount(selectedProject.id) }} commits
                                    </span>
                                </div>
                                <div class="flex gap-2">
                                    <p-button
                                        icon="pi pi-refresh"
                                        size="small"
                                        [text]="true"
                                        [rounded]="true"
                                        (onClick)="loadGithubCommits(selectedProject)"
                                        [loading]="isLoadingGithubCommits(selectedProject.id)"
                                    />
                                    <a [href]="getGithubRepoUrl(selectedProject.githubRepo)" target="_blank">
                                        <p-button
                                            icon="pi pi-external-link"
                                            size="small"
                                            [text]="true"
                                            [rounded]="true"
                                            severity="secondary"
                                        />
                                    </a>
                                </div>
                            </div> -->

                            <div class="flex flex-col gap-2">
                                <!-- <div *ngIf="isLoadingGithubCommits(selectedProject.id)" class="text-center text-muted-color text-sm py-4">
                                    <i class="pi pi-spin pi-spinner"></i> Loading commits...
                                </div> -->

                                <!-- <div *ngIf="getGithubError(selectedProject.id)" class="text-center text-red-500 text-sm py-4">
                                    <i class="pi pi-exclamation-triangle"></i>
                                    {{ getGithubError(selectedProject.id) }}
                                </div> -->

                                <div *ngIf="!isLoadingGithubCommits(selectedProject.id) && !getGithubError(selectedProject.id)">
                                    <!-- <div *ngFor="let commit of getGithubCommits(selectedProject.id)" class="p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                                        <div class="flex items-start gap-3">
                                            <p-avatar
                                                *ngIf="commit.author?.avatar_url; else defaultAvatar"
                                                [image]="commit.author!.avatar_url"
                                                shape="circle"
                                                size="normal"
                                            />
                                            <ng-template #defaultAvatar>
                                                <p-avatar
                                                    icon="pi pi-user"
                                                    shape="circle"
                                                    size="normal"
                                                    styleClass="bg-surface-300"
                                                />
                                            </ng-template>

                                            <div class="flex-1 min-w-0">
                                                <a [href]="commit.html_url" target="_blank" class="text-sm font-medium text-surface-900 dark:text-surface-0 hover:text-primary hover:underline line-clamp-2">
                                                    {{ truncateCommitMessage(commit.commit.message) }}
                                                </a>
                                                <div class="flex items-center gap-2 mt-1 text-xs text-muted-color">
                                                    <span>{{ commit.author?.login || commit.commit.author.name }}</span>
                                                    <span>•</span>
                                                    <span>{{ formatCommitDate(commit.commit.author.date) }}</span>
                                                </div>
                                                <div class="text-xs text-muted-color font-mono mt-1">
                                                    {{ commit.sha.substring(0, 7) }}
                                                </div>
                                            </div>
                                        </div>
                                    </div> -->

                                    <!-- Load More Button -->
                                    <!-- <div *ngIf="getGithubCommits(selectedProject.id).length > 0 && hasMoreCommits(selectedProject.id)" class="text-center py-3">
                                        <p-button
                                            label="Load More Commits"
                                            icon="pi pi-chevron-down"
                                            size="small"
                                            [outlined]="true"
                                            [loading]="isLoadingMoreCommits(selectedProject.id)"
                                            (onClick)="loadMoreCommits(selectedProject)"
                                        />
                                    </div> -->

                                    <!-- Loading More Indicator -->
                                    <!-- <div *ngIf="isLoadingMoreCommits(selectedProject.id)" class="text-center text-muted-color text-sm py-3">
                                        <i class="pi pi-spin pi-spinner"></i> Loading more commits...
                                    </div> -->

                                    <!-- No commits found -->
                                    <!-- <div *ngIf="getGithubCommits(selectedProject.id).length === 0 && !isLoadingGithubCommits(selectedProject.id) && !getGithubError(selectedProject.id)" class="text-center text-muted-color text-sm py-4">
                                        <p-button
                                            label="Load Commits"
                                            icon="pi pi-github"
                                            size="small"
                                            [outlined]="true"
                                            (onClick)="loadGithubCommits(selectedProject)"
                                        />
                                    </div> -->

                                    <!-- End of commits indicator -->
                                    <!-- <div *ngIf="getGithubCommits(selectedProject.id).length > 0 && !hasMoreCommits(selectedProject.id)" class="text-center text-muted-color text-xs py-2">
                                        <i class="pi pi-check-circle"></i> All commits loaded
                                    </div> -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- History Log Dialog -->
        <p-dialog
            [(visible)]="historyVisible"
            [header]="'History \u2014 ' + (historyProject?.title || '')"
            [modal]="true"
            [style]="{ width: '38rem' }"
            [breakpoints]="{ '575px': '95vw' }"
            [contentStyle]="{ 'max-height': '70vh', 'overflow-y': 'auto' }"
            appendTo="body"
        >
            <div *ngIf="historyLoading" class="flex justify-center items-center py-10">
                <i class="pi pi-spin pi-spinner text-3xl text-muted-color"></i>
            </div>
            <div *ngIf="!historyLoading && historyLog.length === 0" class="text-center text-muted-color py-8">
                <i class="pi pi-history text-5xl mb-3 block"></i>
                <p>No history available</p>
            </div>
            <div *ngIf="!historyLoading && historyLog.length > 0" class="flex flex-col gap-2">
                <div *ngFor="let entry of historyLog" class="flex flex-col gap-2 p-3 border border-surface-200 dark:border-surface-700 rounded-lg">
                    <div class="flex items-center gap-2">
                        <span
                            class="flex items-center justify-center text-white rounded-full w-7 h-7 shrink-0"
                            [style]="{ 'background-color': entry.color }"
                        >
                            <i [class]="entry.icon + ' text-xs'"></i>
                        </span>
                        <span class="font-semibold text-sm">{{ entry.action }}</span>
                        <ng-container *ngIf="entry.userFullName">
                            <span class="text-muted-color text-sm">·</span>
                            <p-avatar
                                *ngIf="entry.userProfilePictureUrl"
                                [image]="getHistoryProfilePictureUrl(entry.userProfilePictureUrl)"
                                shape="circle"
                                size="normal"
                            />
                            <p-avatar
                                *ngIf="!entry.userProfilePictureUrl"
                                [label]="getInitials(entry.userFullName)"
                                shape="circle"
                                size="normal"
                                [style]="{'background-color': 'var(--primary-color)', 'color': 'var(--primary-color-text)'}"
                            />
                            <span class="text-sm text-muted-color">{{ entry.userFullName }}</span>
                        </ng-container>
                    </div>
                    <img *ngIf="entry.detailImageUrl" [src]="entry.detailImageUrl" [alt]="entry.action" class="rounded-md max-h-32 object-cover border border-surface-200 dark:border-surface-700" />
                    <p *ngIf="entry.detail && !entry.detailImageUrl" class="text-sm text-muted-color mb-0">{{ entry.detail }}</p>
                    <p class="text-xs text-muted-color mb-0">{{ entry.date | date:'MMM d, y, h:mm a' }}</p>
                </div>
                <div *ngIf="historyHasMore" class="flex justify-center pt-1">
                    <p-button
                        [label]="historyLoadingMore ? 'Loading...' : 'Load more'"
                        [icon]="historyLoadingMore ? 'pi pi-spin pi-spinner' : 'pi pi-chevron-down'"
                        [disabled]="historyLoadingMore"
                        severity="secondary"
                        [text]="true"
                        size="small"
                        (onClick)="loadMoreHistory()"
                    />
                </div>
            </div>
        </p-dialog>
    `
})
export class Projects {
    // ----------------- Rich Editor (Quill) -----------------
    private activeEditorInstance: any = null;
    activeEditorKey: 'project' | 'objective' = 'project';
    private editorInstances: Record<string, any> = {};

    onEditorInit(event: any, type: 'project' | 'objective') {
        const quill = event.editor;
        this.editorInstances[type] = quill;
        const toolbar = quill.getModule('toolbar');

        toolbar.addHandler('image', () => {
            this.activeEditorInstance = quill;
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e: Event) => this.onEditorImageSelected(e);
            input.click();
        });
    }

    private getAuthToken(): string {
        return localStorage.getItem('auth_token') || '';
    }

    private onEditorImageSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (!input.files || !input.files[0] || !this.activeEditorInstance) return;
        const file = input.files[0];
        const formData = new FormData();
        formData.append('file', file);
        this.http.post<any>(`${environment.apiUrl}/Files/upload`, formData).subscribe({
            next: (result) => {
                if (!result.success || !result.fileId) return;
                const token = this.getAuthToken();
                const url = `${environment.apiUrl}/Files/${result.fileId}/view?token=${encodeURIComponent(token)}`;
                const quill = this.activeEditorInstance;
                const range = quill.getSelection(true);
                quill.insertEmbed(range.index, 'image', url);
                quill.setSelection(range.index + 1);
            },
            error: (err) => console.error('Editor image upload failed', err)
        });
    }

    onEditorFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (!input.files || !input.files[0]) return;
        const quill = this.editorInstances[this.activeEditorKey];
        if (!quill) return;
        const file = input.files[0];
        const originalFileName = file.name;
        const formData = new FormData();
        formData.append('file', file);
        this.http.post<any>(`${environment.apiUrl}/Files/upload`, formData).subscribe({
            next: (result) => {
                if (!result.success || !result.fileId) return;
                const token = this.getAuthToken();
                const downloadUrl = `${environment.apiUrl}/Files/${result.fileId}/download?token=${encodeURIComponent(token)}`;
                const quill = this.editorInstances[this.activeEditorKey];
                if (!quill) return;
                const range = quill.getSelection(true);
                quill.insertText(range.index, originalFileName, 'link', downloadUrl);
                quill.setSelection(range.index + originalFileName.length + 1);
            },
            error: (err) => console.error('Editor file upload failed', err)
        });
    }
    // ----------------------------------------------------------

    constructor(
        private confirmationService: ConfirmationService,
        private http: HttpClient,
        private projectsService: ProjectsService,
        private authService: AuthService
    ) {
        this.loadProjectsByStatus();
        this.loadAvailableMembers();
        this.loadCurrentUser();

        // Watch for auth user changes (handles page reload where user is loaded async)
        effect(() => {
            const user = this.authService.currentUser();
            if (user && (!this.currentUser.userId || this.currentUser.userId !== (user as any).id)) {
                this.loadCurrentUser();
            }
        });
    }

    // Projects loaded from API by status
    upcomingProjects: Project[] = [];
    inProgressProjects: Project[] = [];
    completedProjects: Project[] = [];
    isLoading = false;

    loadProjectsByStatus() {
        this.isLoading = true;

        // Load upcoming projects
        this.projectsService.getProjects('Upcoming').subscribe({
            next: (projects) => {
                console.log('Upcoming projects received:', projects);
                this.upcomingProjects = this.mapProjectsFromApi(projects);
            },
            error: (err) => console.error('Error loading upcoming projects:', err)
        });

        // Load in-progress projects
        this.projectsService.getProjects('InProgress').subscribe({
            next: (projects) => {
                console.log('InProgress projects received:', projects);
                this.inProgressProjects = this.mapProjectsFromApi(projects);
            },
            error: (err) => console.error('Error loading in-progress projects:', err)
        });

        // Load completed projects
        this.projectsService.getProjects('Completed').subscribe({
            next: (projects) => {
                console.log('Completed projects received:', projects);
                this.completedProjects = this.mapProjectsFromApi(projects);
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading completed projects:', err);
                this.isLoading = false;
            }
        });
    }

    // Map API response to frontend Project interface
    mapProjectsFromApi(apiProjects: any[]): Project[] {
        return apiProjects.map(p => {
            const project = {
                id: p.id,
                title: p.title,
                description: p.description,
                status: this.mapStatusFromApi(p.status),
                startDate: p.startDate,
                endDate: p.endDate,
                progress: p.progressPercentage || 0,
                participants: this.mapTeamMembersFromApi(p.teamMembers || []),
                objectives: (p.objectives || []).map((o: any) => ({
                    id: o.id,
                    title: o.title,
                    description: o.description,
                    status: this.mapObjectiveStatusFromApi(o.status),
                    assignedTo: { name: 'Unassigned', avatar: '', role: 'Member' },
                    members: this.mapTeamMembersFromApi(o.teamMembers || []),
                    resources: o.resources || [],
                    createdByUserId: o.createdByUserId,
                    createdByFirstName: o.createdByFirstName,
                    createdByLastName: o.createdByLastName,
                    points: o.points || 1
                })),
                resources: p.resources || [],
                types: p.types || [],
                githubRepo: p.githubRepo,
                createdByUserId: p.createdByUserId,
                createdByFirstName: p.createdByFirstName,
                createdByLastName: p.createdByLastName,
                moderators: p.moderators || [],
                bannerUrl: p.bannerUrl
                    ? (p.bannerUrl.startsWith('http') ? p.bannerUrl : `${environment.baseUrl}${p.bannerUrl}`)
                    : undefined
            };
            console.log('Mapped project:', project.title, 'createdBy:', p.createdByFirstName, p.createdByLastName);
            return project;
        });
    }

    // Map team members from API to frontend Member interface
    mapTeamMembersFromApi(teamMembers: any[]): Member[] {
        return teamMembers.map(tm => {
            let avatarUrl = '';
            if (tm.profilePictureUrl) {
                avatarUrl = tm.profilePictureUrl.startsWith('http')
                    ? tm.profilePictureUrl
                    : `${environment.baseUrl}${tm.profilePictureUrl}`;
            }

            // Ensure userId is set and normalized to string - it could be tm.userId or tm.id
            const userId = String(tm.userId || tm.id || '');

            return {
                id: tm.id,
                userId: userId,
                name: `${tm.firstName || ''} ${tm.lastName || ''}`.trim() || tm.email || 'Unknown',
                avatar: avatarUrl,
                role: tm.role || 'Member'
            };
        });
    }

    // Map API status (PascalCase) to frontend status (lowercase with hyphen)
    mapStatusFromApi(status: string): 'upcoming' | 'in-progress' | 'completed' {
        switch (status?.toLowerCase()) {
            case 'upcoming': return 'upcoming';
            case 'inprogress': return 'in-progress';
            case 'completed': return 'completed';
            default: return 'upcoming';
        }
    }

    // Current logged-in user (loaded from auth service)
    currentUser: Member = {
        userId: '',
        name: '',
        avatar: '',
        role: 'Member'
    };

    loadCurrentUser() {
        const user = this.authService.currentUser();
        if (user) {
            const firstName = (user as any).firstName || '';
            const lastName = (user as any).lastName || '';
            const fullName = `${firstName} ${lastName}`.trim() || (user as any).fullName || user.email || '';

            let avatarUrl = '';
            if ((user as any).profilePictureUrl) {
                avatarUrl = (user as any).profilePictureUrl.startsWith('http')
                    ? (user as any).profilePictureUrl
                    : `${environment.baseUrl}${(user as any).profilePictureUrl}`;
            }

            this.currentUser = {
                userId: (user as any).id || '',
                name: fullName,
                avatar: avatarUrl,
                role: user.roles?.[0] || user.role || 'Member'
            };
            console.log('Current user loaded:', this.currentUser);
        }
    }

    selectedProject: Project | null = null;
    draggedProject: Project | null = null;

    // Check if the dragged project cannot be moved to Completed (progress < 100%)
    get showCompletedWarning(): boolean {
        return this.draggedProject !== null && this.draggedProject.progress < 100;
    }

    // Check if the dragged project cannot be moved to In Progress (no objectives in progress)
    get showInProgressWarning(): boolean {
        if (!this.draggedProject || this.draggedProject.status !== 'upcoming') {
            return false;
        }
        const hasInProgressObjective = this.draggedProject.objectives?.some(o => o.status === 'in-progress');
        return !hasInProgressObjective;
    }

    dialogVisible = false;
    dialogMode: 'add' | 'edit' = 'add';
    projectDialogError: string | null = null;
    currentProject: Project = this.getEmptyProject();
    startDate: Date | null = null;
    endDate: Date | null = null;
    pendingBannerFile: File | null = null;
    dialogBannerPreviewUrl: string | null = null;
    removeBannerInEdit = false;

    objectiveDialogVisible = false;
    objectiveDialogMode: 'add' | 'edit' = 'add';
    currentObjective: Objective = this.getEmptyObjective();
    selectedMemberNames: string[] = [];
    selectedObjectiveMemberNames: string[] = [];

    // Objective drag and drop
    draggedObjective: Objective | null = null;

    // Objective detail dialog
    objectiveDetailDialogVisible = false;
    viewingObjective: Objective | null = null;

    // Objective resource dialog
    objectiveResourceDialogVisible = false;
    objectiveResourceDialogMode: 'add' | 'edit' = 'add';
    currentObjectiveResource: Resource = this.getEmptyResource();
    selectedObjectiveResourceFiles: File[] = [];
    filesToRemoveFromObjectiveResource: string[] = [];
    savingObjectiveResource = false;
    newResourceUrl: string = '';
    newObjectiveResourceUrl: string = '';

    addUrlToCurrentResource() {
        const trimmed = this.newResourceUrl.trim();
        if (trimmed) {
            this.currentResource.urls = [...(this.currentResource.urls || []), trimmed];
            this.newResourceUrl = '';
        }
    }

    removeUrlFromCurrentResource(index: number) {
        this.currentResource.urls = this.currentResource.urls.filter((_, i) => i !== index);
    }

    addUrlToCurrentObjectiveResource() {
        const trimmed = this.newObjectiveResourceUrl.trim();
        if (trimmed) {
            this.currentObjectiveResource.urls = [...(this.currentObjectiveResource.urls || []), trimmed];
            this.newObjectiveResourceUrl = '';
        }
    }

    removeUrlFromCurrentObjectiveResource(index: number) {
        this.currentObjectiveResource.urls = this.currentObjectiveResource.urls.filter((_, i) => i !== index);
    }

    // Member assignment dialogs
    assignMembersToProjectDialogVisible = false;
    assignMembersToObjectiveDialogVisible = false;
    assigningObjective: Objective | null = null;
    tempSelectedProjectMembers: string[] = []; // Array of user IDs
    tempSelectedObjectiveMembers: string[] = [];
    initialProjectMembers: string[] = []; // Track initial members to prevent removal
    initialObjectiveMembers: string[] = []; // Track initial members to prevent removal

    // Moderator assignment dialog
    assignModeratorDialogVisible = false;
    selectedModeratorUserId: string | null = null;
    savingModerator = false;
    removingModeratorUserId: string | null = null;

    resourceDialogVisible = false;
    resourceDialogMode: 'add' | 'edit' = 'add';
    currentResource: Resource = this.getEmptyResource();
    selectedResourceFiles: File[] = [];
    filesToRemoveFromResource: string[] = [];
    savingResource = false;

    historyVisible = false;
    historyProject: Project | null = null;
    historyLog: HistoryLogEntry[] = [];
    historyLoading = false;
    historyLoadingMore = false;
    historyPage = 1;
    historyPageSize = 5;
    historyTotalCount = 0;
    get historyHasMore(): boolean { return this.historyLog.length < this.historyTotalCount; }

    availableMembers: Member[] = [];

    loadAvailableMembers() {
        this.projectsService.getAllUsers().subscribe({
            next: (response) => {
                console.log('Users loaded:', response.users);
                this.availableMembers = response.users.map(user => {
                    let avatarUrl = '';
                    if (user.profilePictureUrl) {
                        avatarUrl = user.profilePictureUrl.startsWith('http')
                            ? user.profilePictureUrl
                            : `${environment.baseUrl}${user.profilePictureUrl}`;
                    }

                    return {
                        userId: user.id, // Already a GUID string
                        name: `${user.firstName} ${user.lastName}`.trim() || user.email,
                        avatar: avatarUrl,
                        role: user.roles?.length > 0 ? user.roles[0] : 'Member'
                    };
                });
                console.log('Available members after mapping:', this.availableMembers);
            },
            error: (err) => {
                console.error('Error loading users:', err);
                // Keep availableMembers empty on error
            }
        });
    }

    projectTypeOptions = [
        { label: 'Software', value: 'Software' },
        { label: 'Hardware', value: 'Hardware' },
        { label: 'Event', value: 'Event' }
    ];

    statusOptions = [
        { label: 'Upcoming', value: 'upcoming' },
        { label: 'In Progress', value: 'in-progress' },
        { label: 'Completed', value: 'completed' }
    ];

    objectiveStatusOptions = [
        { label: 'To Do', value: 'todo' },
        { label: 'In Progress', value: 'in-progress' },
        { label: 'Completed', value: 'completed' }
    ];

    resourceTypeOptions = [
        { label: 'Documentation', value: 'documentation' },
        { label: 'Tutorial', value: 'tutorial' },
        { label: 'Tool', value: 'tool' },
        { label: 'Reference', value: 'reference' },
        { label: 'Other', value: 'other' }
    ];

    getProjectsByStatus(status: string): Project[] {
        switch (status) {
            case 'upcoming':
                return this.upcomingProjects;
            case 'in-progress':
                return this.inProgressProjects;
            case 'completed':
                return this.completedProjects;
            default:
                return [];
        }
    }

    getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'secondary' {
        switch (status) {
            case 'completed': return 'success';
            case 'in-progress': return 'info';
            case 'upcoming': return 'warn';
            default: return 'secondary';
        }
    }

    getObjectiveStatusSeverity(status: string): 'success' | 'info' | 'secondary' {
        switch (status) {
            case 'completed': return 'success';
            case 'in-progress': return 'info';
            case 'todo': return 'secondary';
            default: return 'secondary';
        }
    }

    getObjectivesByStatus(status: 'todo' | 'in-progress' | 'completed'): Objective[] {
        if (!this.selectedProject) return [];
        return this.selectedProject.objectives.filter(o => o.status === status);
    }

    dragStartObjective(objective: Objective) {
        console.log('Drag started for objective:', objective);
        this.draggedObjective = objective;
    }

    dragEndObjective() {
        this.draggedObjective = null;
    }

    onDropObjective(event: any, newStatus: 'todo' | 'in-progress' | 'completed') {
        console.log('onDropObjective called. Event:', event, '| Target status:', newStatus, '| Dragged objective:', this.draggedObjective);
        if (this.draggedObjective && this.selectedProject) {
            // Prevent modifying completed objectives via drag-drop
            if (this.selectedProject.status === 'completed') {
                console.log('Drop blocked: objective is already completed and cannot be moved.');
                this.draggedObjective = null;
                return;
            }

            const oldStatus = this.draggedObjective.status;
            const objectiveId = this.draggedObjective.id;
            const objective = this.draggedObjective;

            // Map frontend status to backend status (PascalCase)
            const apiStatus = this.mapObjectiveStatusToApi(newStatus);

            console.log(`Objective "${this.draggedObjective.title}" status changed: ${oldStatus} -> ${newStatus}`);

            // Update status locally
            this.draggedObjective.status = newStatus;

            // Update the objective in the selected project's objectives array
            const objectiveIndex = this.selectedProject.objectives?.findIndex(o => o.id === this.draggedObjective!.id);
            if (objectiveIndex !== undefined && objectiveIndex >= 0 && this.selectedProject.objectives) {
                this.selectedProject.objectives[objectiveIndex].status = newStatus;
            }

            // Also sync the objective status into the kanban-list project item so that
            // the in-progress guard in onDrop reads up-to-date data without a reload.
            const listProject = [...this.upcomingProjects, ...this.inProgressProjects, ...this.completedProjects]
                .find(p => p.id === this.selectedProject!.id);
            if (listProject?.objectives) {
                const listIdx = listProject.objectives.findIndex(o => o.id === objectiveId);
                if (listIdx >= 0) {
                    listProject.objectives[listIdx].status = newStatus;
                }
            }

            // Recalculate project progress based on completed objectives
            this.updateProjectProgress();

            // Send PATCH request to update status on backend
            this.projectsService.updateObjectiveStatus(objectiveId, apiStatus).subscribe({
                next: (response) => {
                    console.log('Objective status updated successfully:', response);
                },
                error: (err) => {
                    console.error('Error updating objective status:', err);
                    // Revert the UI change on error
                    this.revertObjectiveStatus(objective, oldStatus, newStatus);
                }
            });

            this.draggedObjective = null;
        }
    }

    // Map frontend objective status to API status (PascalCase)
    mapObjectiveStatusToApi(status: 'todo' | 'in-progress' | 'completed'): string {
        switch (status) {
            case 'todo': return 'Todo';
            case 'in-progress': return 'InProgress';
            case 'completed': return 'Completed';
            default: return 'Todo';
        }
    }

    // Revert objective status change on API error
    revertObjectiveStatus(objective: Objective, oldStatus: 'todo' | 'in-progress' | 'completed', newStatus: 'todo' | 'in-progress' | 'completed') {
        console.log(`Reverting objective "${objective.title}" status from ${newStatus} back to ${oldStatus}`);

        // Restore old status
        objective.status = oldStatus;

        // Update in the selected project's objectives array
        if (this.selectedProject?.objectives) {
            const objectiveIndex = this.selectedProject.objectives.findIndex(o => o.id === objective.id);
            if (objectiveIndex >= 0) {
                this.selectedProject.objectives[objectiveIndex].status = oldStatus;
            }
        }

        // Also revert the objective status in the kanban-list project item.
        const listProject = [...this.upcomingProjects, ...this.inProgressProjects, ...this.completedProjects]
            .find(p => p.id === this.selectedProject?.id);
        if (listProject?.objectives) {
            const listIdx = listProject.objectives.findIndex(o => o.id === objective.id);
            if (listIdx >= 0) {
                listProject.objectives[listIdx].status = oldStatus;
            }
        }

        // Recalculate project progress after revert
        this.updateProjectProgress();
    }

    // Calculate and update project progress based on completed objectives
    updateProjectProgress() {
        if (!this.selectedProject || !this.selectedProject.objectives || this.selectedProject.objectives.length === 0) {
            return;
        }

        const totalObjectives = this.selectedProject.objectives.length;
        const completedObjectives = this.selectedProject.objectives.filter(o => o.status === 'completed').length;
        const newProgress = Math.round((completedObjectives / totalObjectives) * 100);

        this.selectedProject.progress = newProgress;

        // Also update the project in the appropriate status list
        const projectInList = [...this.upcomingProjects, ...this.inProgressProjects, ...this.completedProjects]
            .find(p => p.id === this.selectedProject!.id);

        if (projectInList) {
            projectInList.progress = newProgress;
        }

        console.log(`Project progress updated: ${completedObjectives}/${totalObjectives} = ${newProgress}%`);
    }

    dragStart(project: Project) {
        this.draggedProject = project;
    }

    dragEnd() {
        this.draggedProject = null;
    }

    onDrop(event: any, newStatus: 'upcoming' | 'in-progress' | 'completed') {
        if (this.draggedProject) {
            // Skip if status is unchanged
            if (this.draggedProject.status === newStatus) {
                this.draggedProject = null;
                return;
            }

            // Prevent moving to Completed if project progress is not 100%
            if (newStatus === 'completed' && this.draggedProject.progress < 100) {
                console.log(`Cannot move project "${this.draggedProject.title}" to Completed - progress is ${this.draggedProject.progress}%`);
                this.draggedProject = null;
                return;
            }

            // Prevent moving from Upcoming to In Progress unless at least one objective is in progress
            if (this.draggedProject.status === 'upcoming' && newStatus === 'in-progress') {
                const hasInProgressObjective = this.draggedProject.objectives?.some(o => o.status === 'in-progress');
                if (!hasInProgressObjective) {
                    console.log(`Cannot start project "${this.draggedProject.title}" - at least one objective must be in progress`);
                    this.draggedProject = null;
                    return;
                }
            }

            const oldStatus = this.draggedProject.status;
            const projectId = this.draggedProject.id;
            const project = this.draggedProject;

            // Map frontend status to backend status (PascalCase)
            const apiStatus = this.mapStatusToApi(newStatus);

            console.log(`Project "${this.draggedProject.title}" status changed: ${oldStatus} -> ${newStatus}`);

            // Remove from old list
            this.upcomingProjects = this.upcomingProjects.filter(p => p.id !== this.draggedProject!.id);
            this.inProgressProjects = this.inProgressProjects.filter(p => p.id !== this.draggedProject!.id);
            this.completedProjects = this.completedProjects.filter(p => p.id !== this.draggedProject!.id);

            // Update project status locally
            this.draggedProject.status = newStatus;

            // If the detail panel is open for this project, sync its status too
            if (this.selectedProject?.id === projectId) {
                this.selectedProject.status = newStatus;
            }

            // Add to new list
            switch (newStatus) {
                case 'upcoming':
                    this.upcomingProjects.push(this.draggedProject);
                    break;
                case 'in-progress':
                    this.inProgressProjects.push(this.draggedProject);
                    break;
                case 'completed':
                    this.completedProjects.push(this.draggedProject);
                    break;
            }

            // Send PATCH request to update status on backend
            this.projectsService.updateProjectStatus(projectId, apiStatus).subscribe({
                next: (response) => {
                    console.log('Project status updated successfully:', response);
                },
                error: (err) => {
                    console.error('Error updating project status:', err);
                    // Revert the UI change on error
                    this.revertProjectStatus(project, oldStatus, newStatus);
                }
            });

            this.draggedProject = null;
        }
    }

    // Revert project status change on API error
    revertProjectStatus(project: Project, oldStatus: 'upcoming' | 'in-progress' | 'completed', newStatus: 'upcoming' | 'in-progress' | 'completed') {
        console.log(`Reverting project "${project.title}" status from ${newStatus} back to ${oldStatus}`);

        // Remove from new list
        switch (newStatus) {
            case 'upcoming':
                this.upcomingProjects = this.upcomingProjects.filter(p => p.id !== project.id);
                break;
            case 'in-progress':
                this.inProgressProjects = this.inProgressProjects.filter(p => p.id !== project.id);
                break;
            case 'completed':
                this.completedProjects = this.completedProjects.filter(p => p.id !== project.id);
                break;
        }

        // Restore old status
        project.status = oldStatus;

        // If the detail panel is open for this project, revert its status too
        if (this.selectedProject?.id === project.id) {
            this.selectedProject.status = oldStatus;
        }

        // Add back to old list
        switch (oldStatus) {
            case 'upcoming':
                this.upcomingProjects.push(project);
                break;
            case 'in-progress':
                this.inProgressProjects.push(project);
                break;
            case 'completed':
                this.completedProjects.push(project);
                break;
        }
    }

    // Map frontend status (lowercase with hyphen) to API status (PascalCase)
    mapStatusToApi(status: 'upcoming' | 'in-progress' | 'completed'): string {
        switch (status) {
            case 'upcoming': return 'Upcoming';
            case 'in-progress': return 'InProgress';
            case 'completed': return 'Completed';
            default: return 'Upcoming';
        }
    }

    getEmptyProject(): Project {
        return {
            id: 0,
            title: '',
            description: '',
            status: 'upcoming',
            startDate: '',
            endDate: '',
            progress: 0,
            types: [],
            participants: [],
            objectives: []
        };
    }

    formatDate(date: Date): string {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    }

    openAddDialog() {
        this.dialogMode = 'add';
        this.currentProject = this.getEmptyProject();
        this.startDate = null;
        this.endDate = null;
        this.selectedMemberNames = [];
        this.projectDialogError = null;
        this.pendingBannerFile = null;
        this.dialogBannerPreviewUrl = null;
        this.removeBannerInEdit = false;
        this.dialogVisible = true;
    }

    openEditDialog(project: Project) {
        this.dialogMode = 'edit';
        this.currentProject = { ...project, participants: [...project.participants], objectives: [...project.objectives] };
        // Parse dates if they exist
        this.startDate = project.startDate ? new Date(project.startDate) : null;
        this.endDate = project.endDate ? new Date(project.endDate) : null;
        // Load current team member names
        this.selectedMemberNames = project.participants.map(p => p.name);
        this.projectDialogError = null;
        this.pendingBannerFile = null;
        this.dialogBannerPreviewUrl = null;
        this.removeBannerInEdit = false;
        this.dialogVisible = true;
    }

    isProjectFormValid(): boolean {
        return !!(
            this.currentProject.title?.trim() &&
            this.currentProject.description?.trim() &&
            this.startDate &&
            this.endDate
        );
    }

    isObjectiveFormValid(): boolean {
        return !!(
            this.currentObjective.title?.trim() &&
            this.currentObjective.description?.trim() &&
            this.currentObjective.status
        );
    }

    saveProject() {
        if (this.dialogMode === 'add') {
            if (!this.isProjectFormValid()) {
                return;
            }

            const payload = {
                title: this.currentProject.title.trim(),
                description: this.currentProject.description?.trim() || '',
                startDate: this.startDate?.toISOString() || '',
                endDate: this.endDate?.toISOString() || '',
                status: this.mapStatusToApi(this.currentProject.status),
                types: this.currentProject.types || []
            };

            this.projectsService.createProject(payload).subscribe({
                next: (createdProject) => {
                    const mappedProject = this.mapProjectFromApi(createdProject);

                    switch (mappedProject.status) {
                        case 'upcoming':
                            this.upcomingProjects.push(mappedProject);
                            break;
                        case 'in-progress':
                            this.inProgressProjects.push(mappedProject);
                            break;
                        case 'completed':
                            this.completedProjects.push(mappedProject);
                            break;
                    }

                    if (this.pendingBannerFile) {
                        // Show preview immediately while upload is in-flight
                        mappedProject.bannerUrl = this.dialogBannerPreviewUrl ?? undefined;
                        this.projectsService.uploadBanner(String(mappedProject.id), this.pendingBannerFile).subscribe({
                            next: (resp) => {
                                if (resp.bannerUrl) {
                                    mappedProject.bannerUrl = resp.bannerUrl.startsWith('http')
                                        ? resp.bannerUrl
                                        : `${environment.baseUrl}${resp.bannerUrl}`;
                                }
                            },
                            error: (err) => console.error('Error uploading project banner:', err)
                        });
                    }

                    this.dialogVisible = false;
                    this.currentProject = this.getEmptyProject();
                    this.startDate = null;
                    this.endDate = null;
                    this.selectedMemberNames = [];
                    this.pendingBannerFile = null;
                    this.dialogBannerPreviewUrl = null;
                },
                error: (err) => {
                    console.error('Error creating project:', err);
                }
            });

            return;
        }

        // Edit mode
        if (this.dialogMode === 'edit') {
            const payload = {
                title: this.currentProject.title.trim(),
                description: this.currentProject.description?.trim() || '',
                startDate: this.startDate?.toISOString() || '',
                endDate: this.endDate?.toISOString() || '',
                status: this.mapStatusToApi(this.currentProject.status),
                types: this.currentProject.types || []
            };

            this.projectsService.updateProject(this.currentProject.id, payload).subscribe({
                next: (updatedProject) => {
                    console.log('Project updated successfully:', updatedProject);
                    const mappedProject = this.mapProjectFromApi(updatedProject);

                    // Preserve banner if not changing/removing it (server PUT response doesn't include bannerUrl)
                    if (!this.pendingBannerFile && !this.removeBannerInEdit) {
                        mappedProject.bannerUrl = this.currentProject.bannerUrl;
                    }

                    // Remove from old lists
                    this.upcomingProjects = this.upcomingProjects.filter(p => p.id !== mappedProject.id);
                    this.inProgressProjects = this.inProgressProjects.filter(p => p.id !== mappedProject.id);
                    this.completedProjects = this.completedProjects.filter(p => p.id !== mappedProject.id);

                    // Add to appropriate list based on status
                    switch (mappedProject.status) {
                        case 'upcoming':
                            this.upcomingProjects.push(mappedProject);
                            break;
                        case 'in-progress':
                            this.inProgressProjects.push(mappedProject);
                            break;
                        case 'completed':
                            this.completedProjects.push(mappedProject);
                            break;
                    }

                    // Update selectedProject if it's the same project
                    if (this.selectedProject?.id === mappedProject.id) {
                        this.selectedProject = mappedProject;
                    }

                    if (this.pendingBannerFile) {
                        // Show preview immediately while upload is in-flight
                        mappedProject.bannerUrl = this.dialogBannerPreviewUrl ?? undefined;
                        if (this.selectedProject?.id === mappedProject.id) {
                            this.selectedProject.bannerUrl = mappedProject.bannerUrl;
                        }
                        this.projectsService.uploadBanner(String(mappedProject.id), this.pendingBannerFile).subscribe({
                            next: (resp) => {
                                if (resp.bannerUrl) {
                                    const bannerUrl = resp.bannerUrl.startsWith('http')
                                        ? resp.bannerUrl
                                        : `${environment.baseUrl}${resp.bannerUrl}`;
                                    mappedProject.bannerUrl = bannerUrl;
                                    if (this.selectedProject?.id === mappedProject.id) {
                                        this.selectedProject.bannerUrl = bannerUrl;
                                    }
                                }
                            },
                            error: (err) => console.error('Error uploading project banner:', err)
                        });
                    } else if (this.removeBannerInEdit) {
                        this.projectsService.deleteBanner(String(mappedProject.id)).subscribe({
                            error: (err) => console.error('Error deleting project banner:', err)
                        });
                        mappedProject.bannerUrl = undefined;
                        if (this.selectedProject?.id === mappedProject.id) {
                            this.selectedProject.bannerUrl = undefined;
                        }
                    }

                    this.dialogVisible = false;
                    this.currentProject = this.getEmptyProject();
                    this.startDate = null;
                    this.endDate = null;
                    this.selectedMemberNames = [];
                    this.projectDialogError = null;
                    this.pendingBannerFile = null;
                    this.dialogBannerPreviewUrl = null;
                    this.removeBannerInEdit = false;
                },
                error: (err) => {
                    console.error('Error updating project:', err);
                    this.projectDialogError = err.error?.Error || err.error?.error || 'An error occurred while updating the project.';
                }
            });
        }
    }

    closeProjectDialog() {
        this.dialogVisible = false;
        this.projectDialogError = null;
        this.pendingBannerFile = null;
        this.dialogBannerPreviewUrl = null;
        this.removeBannerInEdit = false;
    }

    confirmDeleteProject(project: Project) {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete "${project.title}"? This action cannot be undone.`,
            header: 'Delete Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.deleteProject(project);
            }
        });
    }

    deleteProject(project: Project) {
        this.projectsService.deleteProject(project.id.toString()).subscribe({
            next: () => {
                // Remove from the appropriate list based on status
                switch (project.status) {
                    case 'upcoming':
                        this.upcomingProjects = this.upcomingProjects.filter(p => p.id !== project.id);
                        break;
                    case 'in-progress':
                        this.inProgressProjects = this.inProgressProjects.filter(p => p.id !== project.id);
                        break;
                    case 'completed':
                        this.completedProjects = this.completedProjects.filter(p => p.id !== project.id);
                        break;
                }

                // Clear selected project if it was deleted
                if (this.selectedProject?.id === project.id) {
                    this.selectedProject = null;
                }

                console.log('Project deleted successfully');
            },
            error: (err) => {
                console.error('Error deleting project:', err);
            }
        });
    }

    getEmptyObjective(): Objective {
        return {
            id: 0,
            title: '',
            description: '',
            status: 'todo',
            points: 1,
            assignedTo: { name: 'Unassigned', avatar: '', role: 'Member' },
            members: []
        };
    }

    clampObjectivePoints(event: Event) {
        const input = event.target as HTMLInputElement;
        let val = parseInt(input.value, 10);
        if (isNaN(val) || val < 1) val = 1;
        if (val > 10) val = 10;
        this.currentObjective.points = val;
        input.value = String(val);
    }

    openAddObjectiveDialog() {
        if (!this.selectedProject) return;
        this.objectiveDialogMode = 'add';
        this.currentObjective = this.getEmptyObjective();
        this.selectedObjectiveMemberNames = [];
        this.objectiveDialogVisible = true;
    }

    openEditObjectiveDialog(objective: Objective) {
        if (objective.status === 'completed') return;
        this.objectiveDialogMode = 'edit';
        this.currentObjective = { ...objective, assignedTo: { ...objective.assignedTo }, members: objective.members ? [...objective.members] : [] };
        this.selectedObjectiveMemberNames = objective.members ? objective.members.map(m => m.name) : [];
        this.objectiveDialogVisible = true;
    }

    saveObjective() {
        if (!this.selectedProject) {
            return;
        }

        const payload = {
            projectId: this.selectedProject.id.toString(),
            title: this.currentObjective.title.trim(),
            description: this.currentObjective.description?.trim() || '',
            status: this.mapObjectiveStatusToApi(this.currentObjective.status),
            points: this.currentObjective.points ?? 1
        };

        if (this.objectiveDialogMode === 'add') {
            if (!this.isObjectiveFormValid()) {
                return;
            }

            this.projectsService.createObjective(payload).subscribe({
                next: (createdObjective) => {
                    console.log('Objective created successfully:', createdObjective);

                    // Map the response to frontend format and add to selected project
                    const newObjective: Objective = {
                        id: createdObjective.id,
                        title: createdObjective.title,
                        description: createdObjective.description,
                        status: this.mapObjectiveStatusFromApi(createdObjective.status),
                        points: createdObjective.points ?? 1,
                        assignedTo: { name: 'Unassigned', avatar: '', role: 'Member' },
                        members: [],
                        createdByUserId: createdObjective.createdByUserId,
                        createdByFirstName: createdObjective.createdByFirstName,
                        createdByLastName: createdObjective.createdByLastName
                    };

                    if (this.selectedProject) {
                        this.selectedProject.objectives.push(newObjective);
                        // Sync new objective into the kanban-list project item
                        const listProject = [...this.upcomingProjects, ...this.inProgressProjects, ...this.completedProjects]
                            .find(p => p.id === this.selectedProject!.id);
                        listProject?.objectives?.push(newObjective);
                        this.updateProjectProgress();
                    }

                    this.objectiveDialogVisible = false;
                    this.currentObjective = this.getEmptyObjective();
                    this.selectedObjectiveMemberNames = [];
                },
                error: (err) => {
                    console.error('Error creating objective:', err);
                }
            });
        } else {
            // Edit mode
            this.projectsService.updateObjective(this.currentObjective.id, payload).subscribe({
                next: (updatedObjective) => {
                    console.log('Objective updated successfully:', updatedObjective);

                    // Update the objective in the selected project
                    if (this.selectedProject) {
                        const index = this.selectedProject.objectives.findIndex(obj => obj.id === this.currentObjective.id);
                        if (index !== -1) {
                            this.selectedProject.objectives[index] = {
                                ...this.selectedProject.objectives[index],
                                title: updatedObjective.title,
                                description: updatedObjective.description,
                                status: this.mapObjectiveStatusFromApi(updatedObjective.status),
                                points: updatedObjective.points ?? 1,
                                createdByUserId: updatedObjective.createdByUserId,
                                createdByFirstName: updatedObjective.createdByFirstName,
                                createdByLastName: updatedObjective.createdByLastName
                            };
                        }
                        // Sync the updated objective status into the kanban-list project item
                        const updatedStatus = this.mapObjectiveStatusFromApi(updatedObjective.status);
                        const listProject = [...this.upcomingProjects, ...this.inProgressProjects, ...this.completedProjects]
                            .find(p => p.id === this.selectedProject!.id);
                        if (listProject?.objectives) {
                            const listIdx = listProject.objectives.findIndex(o => o.id === this.currentObjective.id);
                            if (listIdx >= 0) {
                                listProject.objectives[listIdx].status = updatedStatus;
                            }
                        }
                        this.updateProjectProgress();
                    }

                    this.objectiveDialogVisible = false;
                    this.currentObjective = this.getEmptyObjective();
                    this.selectedObjectiveMemberNames = [];
                },
                error: (err) => {
                    console.error('Error updating objective:', err);
                }
            });
        }
    }

    confirmDeleteObjective(objective: Objective) {
        if (objective.status === 'completed') return;
        this.confirmationService.confirm({
            message: `Are you sure you want to delete "${objective.title}"?`,
            header: 'Delete Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.deleteObjective(objective);
            }
        });
    }

    deleteObjective(objective: Objective) {
        this.projectsService.deleteObjective(objective.id).subscribe({
            next: (response) => {
                console.log('Objective deleted successfully:', response);

                // Remove objective from selected project
                if (this.selectedProject) {
                    this.selectedProject.objectives = this.selectedProject.objectives.filter(o => o.id !== objective.id);
                    this.updateProjectProgress();
                }
            },
            error: (err) => {
                console.error('Error deleting objective:', err);
            }
        });
    }

    isUserMember(project: Project): boolean {
        return project.participants.some(p => p.userId === this.currentUser.userId);
    }

    joinProject(project: Project, event: Event) {
        event.stopPropagation();
        if (!this.isUserMember(project)) {
            this.projectsService.joinProject(project.id).subscribe({
                next: (response) => {
                    console.log('Successfully joined project:', response);
                    project.participants.push({ ...this.currentUser });

                    // If the detail panel is showing this project, sync it too
                    if (this.selectedProject?.id === project.id) {
                        this.selectedProject.participants = [...project.participants];
                    }
                },
                error: (err) => {
                    console.error('Error joining project:', err);
                }
            });
        }
    }

    leaveProject(project: Project, event: Event) {
        event.stopPropagation();
        this.projectsService.leaveProject(project.id).subscribe({
            next: (response) => {
                console.log('Successfully left project:', response);
                project.participants = project.participants.filter(p => p.userId !== this.currentUser.userId);

                // If the detail panel is showing this project, sync it too
                if (this.selectedProject?.id === project.id) {
                    this.selectedProject.participants = [...project.participants];
                }
            },
            error: (err) => {
                console.error('Error leaving project:', err);
            }
        });
    }

    getEmptyResource(): Resource {
        return {
            id: 0,
            title: '',
            urls: [],
            description: '',
            type: '' as any,
            files: []
        };
    }

    openAddResourceDialog() {
        if (!this.selectedProject) return;
        this.resourceDialogMode = 'add';
        this.currentResource = this.getEmptyResource();
        this.selectedResourceFiles = [];
        this.filesToRemoveFromResource = [];
        this.newResourceUrl = '';
        this.resourceDialogVisible = true;
    }

    openEditResourceDialog(resource: Resource) {
        this.resourceDialogMode = 'edit';
        this.currentResource = { ...resource, files: [...(resource.files || [])] };
        this.selectedResourceFiles = [];
        this.filesToRemoveFromResource = [];
        this.newResourceUrl = '';
        this.resourceDialogVisible = true;
    }

    onResourceFilesSelect(event: any) {
        const files = event.files as File[];
        this.selectedResourceFiles = [...this.selectedResourceFiles, ...files];
    }

    removeSelectedResourceFile(file: File) {
        this.selectedResourceFiles = this.selectedResourceFiles.filter(f => f !== file);
    }

    removeExistingResourceFile(file: ResourceFile) {
        this.filesToRemoveFromResource.push(file.id);
        if (this.currentResource.files) {
            this.currentResource.files = this.currentResource.files.filter(f => f.id !== file.id);
        }
    }

    saveResource() {
        if (!this.selectedProject) return;

        this.savingResource = true;

        // If there are files to upload, upload them first
        if (this.selectedResourceFiles.length > 0) {
            this.projectsService.uploadFiles(this.selectedResourceFiles).subscribe({
                next: (uploadResponse) => {
                    console.log('Files uploaded:', uploadResponse);
                    const uploadedFileIds = uploadResponse.results
                        ?.filter((r: any) => r.success)
                        .map((r: any) => r.fileId) || [];
                    this.saveResourceWithFiles(uploadedFileIds);
                },
                error: (err) => {
                    console.error('Error uploading files:', err);
                    this.savingResource = false;
                }
            });
        } else {
            this.saveResourceWithFiles([]);
        }
    }

    private saveResourceWithFiles(newFileIds: string[]) {
        if (!this.selectedProject) return;

        if (this.resourceDialogMode === 'add') {
            const payload = {
                projectId: this.selectedProject.id,
                title: this.currentResource.title,
                urls: this.currentResource.urls || [],
                description: this.currentResource.description,
                type: this.currentResource.type,
                fileIds: newFileIds
            };

            this.projectsService.createResource(payload).subscribe({
                next: (createdResource) => {
                    if (this.selectedProject) {
                        if (!this.selectedProject.resources) {
                            this.selectedProject.resources = [];
                        }
                        // Transform resource type to lowercase
                        const normalizedResource = {
                            ...createdResource,
                            type: createdResource.type?.toLowerCase() || 'other',
                            createdByUserId: createdResource.createdByUserId || createdResource.CreatedByUserId,
                            createdByUserName: createdResource.createdByUserName || createdResource.CreatedByUserName
                        };
                        this.selectedProject.resources.push(normalizedResource);
                    }
                    this.resourceDialogVisible = false;
                    this.savingResource = false;
                },
                error: (error) => {
                    console.error('Error creating resource:', error);
                    this.savingResource = false;
                }
            });
        } else {
            const payload = {
                title: this.currentResource.title,
                urls: this.currentResource.urls || [],
                description: this.currentResource.description,
                type: this.currentResource.type,
                fileIdsToAdd: newFileIds.length > 0 ? newFileIds : undefined,
                fileIdsToRemove: this.filesToRemoveFromResource.length > 0 ? this.filesToRemoveFromResource : undefined
            };

            this.projectsService.updateResource(this.currentResource.id, payload).subscribe({
                next: (updatedResource) => {
                    if (this.selectedProject && this.selectedProject.resources) {
                        const index = this.selectedProject.resources.findIndex(r => r.id === this.currentResource.id);
                        if (index !== -1) {
                            // Transform resource type to lowercase
                            const normalizedResource = {
                                ...updatedResource,
                                type: updatedResource.type?.toLowerCase() || 'other',
                                createdByUserId: updatedResource.createdByUserId || updatedResource.CreatedByUserId,
                                createdByUserName: updatedResource.createdByUserName || updatedResource.CreatedByUserName
                            };
                            this.selectedProject.resources[index] = normalizedResource;
                        }
                    }
                    this.resourceDialogVisible = false;
                    this.savingResource = false;
                },
                error: (error) => {
                    console.error('Error updating resource:', error);
                    this.savingResource = false;
                }
            });
        }
    }

    confirmDeleteResource(resource: Resource) {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete "${resource.title}"?`,
            header: 'Delete Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.deleteResource(resource);
            }
        });
    }

    deleteResource(resource: Resource) {
        this.projectsService.deleteResource(resource.id).subscribe({
            next: () => {
                if (this.selectedProject && this.selectedProject.resources) {
                    this.selectedProject.resources = this.selectedProject.resources.filter(r => r.id !== resource.id);
                }
            },
            error: (error) => {
                console.error('Error deleting resource:', error);
            }
        });
    }

    isUserInObjective(objective: Objective): boolean {
        return objective.members ? objective.members.some(m => m.userId === this.currentUser.userId) : false;
    }

    isProjectCreator(project: Project | null): boolean {
        if (!project) return false;
        return project.createdByUserId === this.currentUser.userId;
    }

    isProjectModerator(project: Project | null): boolean {
        if (!project) return false;
        return !!(project.moderators?.some(m => m.userId === this.currentUser.userId));
    }

    isAdminOrModerator(project: Project | null): boolean {
        return this.isAdmin() || this.isProjectModerator(project);
    }

    isAdmin(): boolean {
        const role = this.currentUser.role?.toLowerCase();
        return role === 'admin' || role === 'administrator';
    }

    getAvailableMembersForModerator(): any[] {
        const existingIds = new Set((this.selectedProject?.moderators || []).map(m => m.userId));
        return this.availableMembers.filter(m => m.userId && !existingIds.has(m.userId));
    }

    openAssignModeratorDialog() {
        if (!this.selectedProject) return;
        this.selectedModeratorUserId = null;
        this.assignModeratorDialogVisible = true;
    }

    saveProjectModerator() {
        if (!this.selectedProject || !this.selectedModeratorUserId) return;
        this.savingModerator = true;
        this.projectsService.addModerator(this.selectedProject.id, this.selectedModeratorUserId).subscribe({
            next: () => {
                if (this.selectedProject) {
                    const member = this.availableMembers.find(m => m.userId === this.selectedModeratorUserId);
                    if (member) {
                        const [firstName, ...rest] = member.name.split(' ');
                        if (!this.selectedProject.moderators) this.selectedProject.moderators = [];
                        this.selectedProject.moderators.push({
                            userId: this.selectedModeratorUserId!,
                            firstName,
                            lastName: rest.join(' ')
                        });
                    }
                }
                this.selectedModeratorUserId = null;
                this.savingModerator = false;
            },
            error: (err) => {
                console.error('Error adding moderator:', err);
                this.savingModerator = false;
            }
        });
    }

    removeProjectModerator(moderatorUserId: string) {
        if (!this.selectedProject) return;
        this.removingModeratorUserId = moderatorUserId;
        this.projectsService.removeModerator(this.selectedProject.id, moderatorUserId).subscribe({
            next: () => {
                if (this.selectedProject) {
                    this.selectedProject.moderators = this.selectedProject.moderators?.filter(m => m.userId !== moderatorUserId) || [];
                }
                this.removingModeratorUserId = null;
            },
            error: (err) => {
                console.error('Error removing moderator:', err);
                this.removingModeratorUserId = null;
            }
        });
    }

    joinObjective(objective: Objective, event: Event) {
        event.stopPropagation();

        // Prevent joining completed objectives
        if (objective.status === 'completed') {
            return;
        }

        if (!this.isUserInObjective(objective)) {
            this.projectsService.joinObjective(objective.id).subscribe({
                next: (response) => {
                    console.log('Successfully joined objective:', response);
                    if (!objective.members) {
                        objective.members = [];
                    }
                    objective.members.push({ ...this.currentUser });
                },
                error: (err) => {
                    console.error('Error joining objective:', err);
                }
            });
        }
    }

    leaveObjective(objective: Objective, event: Event) {
        event.stopPropagation();

        // Prevent leaving completed objectives
        if (objective.status === 'completed') {
            return;
        }

        this.projectsService.leaveObjective(objective.id).subscribe({
            next: (response) => {
                console.log('Successfully left objective:', response);
                if (objective.members) {
                    objective.members = objective.members.filter(m => m.userId !== this.currentUser.userId);
                }
            },
            error: (err) => {
                console.error('Error leaving objective:', err);
            }
        });
    }

    // Objective Detail Dialog Methods
    openObjectiveDetailDialog(objective: Objective) {
        this.viewingObjective = objective;
        this.objectiveDetailDialogVisible = true;
    }

    getResourceIcon(type: string): string {
        switch (type) {
            case 'documentation': return 'pi pi-file';
            case 'tutorial': return 'pi pi-book';
            case 'tool': return 'pi pi-wrench';
            case 'reference': return 'pi pi-bookmark';
            default: return 'pi pi-link';
        }
    }

    openAddObjectiveResourceDialog() {
        if (!this.viewingObjective || this.viewingObjective.status === 'completed') return;
        this.objectiveResourceDialogMode = 'add';
        this.currentObjectiveResource = this.getEmptyResource();
        this.selectedObjectiveResourceFiles = [];
        this.filesToRemoveFromObjectiveResource = [];
        this.newObjectiveResourceUrl = '';
        this.objectiveResourceDialogVisible = true;
    }

    openEditObjectiveResourceDialog(resource: Resource) {
        if (this.viewingObjective?.status === 'completed') return;
        this.objectiveResourceDialogMode = 'edit';
        this.currentObjectiveResource = { ...resource, files: [...(resource.files || [])] };
        this.selectedObjectiveResourceFiles = [];
        this.filesToRemoveFromObjectiveResource = [];
        this.newObjectiveResourceUrl = '';
        this.objectiveResourceDialogVisible = true;
    }

    onObjectiveResourceFilesSelect(event: any) {
        const files = event.files as File[];
        this.selectedObjectiveResourceFiles = [...this.selectedObjectiveResourceFiles, ...files];
    }

    removeSelectedObjectiveFile(file: File) {
        this.selectedObjectiveResourceFiles = this.selectedObjectiveResourceFiles.filter(f => f !== file);
    }

    removeExistingObjectiveFile(file: ResourceFile) {
        this.filesToRemoveFromObjectiveResource.push(file.id);
        if (this.currentObjectiveResource.files) {
            this.currentObjectiveResource.files = this.currentObjectiveResource.files.filter(f => f.id !== file.id);
        }
    }

    stripHtml(html: string | null | undefined): string {
        if (!html) return '';
        return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    }

    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    viewFile(fileId: string, fileName: string): void {
        const downloadUrl = `${environment.apiUrl}/Files/${fileId}/download`;

        this.http.get(downloadUrl, { responseType: 'blob' }).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                window.open(url, '_blank');
                // Clean up after a delay to ensure the file opens
                setTimeout(() => window.URL.revokeObjectURL(url), 100);
            },
            error: (err) => {
                console.error('Error viewing file:', err);
            }
        });
    }

    downloadFile(fileId: string, fileName: string): void {
        const downloadUrl = `${environment.apiUrl}/Files/${fileId}/download`;

        this.http.get(downloadUrl, { responseType: 'blob' }).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            },
            error: (err) => {
                console.error('Error downloading file:', err);
            }
        });
    }

    // Avatar helper methods
    getInitials(name: string): string {
        return getInitials(name);
    }

    hasProfilePicture(member: Member): boolean {
        return !isDefaultAvatar(member.avatar);
    }

    getHistoryProfilePictureUrl(url?: string): string {
        if (!url) return '';
        return url.startsWith('http') ? url : `${environment.baseUrl}${url}`;
    }

    openHistoryDialog(project: Project) {
        this.historyProject = project;
        this.historyLog = [];
        this.historyPage = 1;
        this.historyTotalCount = 0;
        this.historyLoading = true;
        this.historyVisible = true;

        this.http.get<PaginatedLogsResponse>(
            `${environment.apiUrl}/logs?entityType=Project&entityId=${project.id}&page=1&pageSize=${this.historyPageSize}`
        ).subscribe({
            next: (res) => {
                this.historyLog = res.data.map(log => this.mapLogToHistoryEntry(log));
                this.historyTotalCount = res.totalCount;
                this.historyLoading = false;
            },
            error: () => {
                this.historyLog = [];
                this.historyLoading = false;
            }
        });
    }

    loadMoreHistory() {
        if (!this.historyProject || this.historyLoadingMore) return;
        this.historyLoadingMore = true;
        this.historyPage++;

        this.http.get<PaginatedLogsResponse>(
            `${environment.apiUrl}/logs?entityType=Project&entityId=${this.historyProject.id}&page=${this.historyPage}&pageSize=${this.historyPageSize}`
        ).subscribe({
            next: (res) => {
                this.historyLog.push(...res.data.map(log => this.mapLogToHistoryEntry(log)));
                this.historyTotalCount = res.totalCount;
                this.historyLoadingMore = false;
            },
            error: () => {
                this.historyPage--;
                this.historyLoadingMore = false;
            }
        });
    }

    private mapLogToHistoryEntry(log: LogDto): HistoryLogEntry {
        const iconMap: Record<string, { icon: string; color: string }> = {
            'Project created':              { icon: 'pi pi-plus',             color: '#22c55e' },
            'Project updated':             { icon: 'pi pi-pen-to-square',    color: '#f59e0b' },
            'Field updated':               { icon: 'pi pi-pen-to-square',    color: '#f59e0b' },
            'Project deleted':             { icon: 'pi pi-trash',            color: '#ef4444' },
            'Status updated':              { icon: 'pi pi-refresh',          color: '#3b82f6' },
            'Team member added':           { icon: 'pi pi-user-plus',        color: '#22c55e' },
            'Team member removed':         { icon: 'pi pi-user-minus',       color: '#ef4444' },
            'Team members removed':        { icon: 'pi pi-users',            color: '#ef4444' },
            'Member joined':               { icon: 'pi pi-user-plus',        color: '#22c55e' },
            'Member left':                 { icon: 'pi pi-user-minus',       color: '#ef4444' },
            'Objective created':           { icon: 'pi pi-plus-circle',      color: '#22c55e' },
            'Objective updated':           { icon: 'pi pi-pencil',           color: '#f59e0b' },
            'Objective deleted':           { icon: 'pi pi-trash',            color: '#ef4444' },
            'Objective status updated':    { icon: 'pi pi-refresh',          color: '#3b82f6' },
            'Member assigned to objective':{ icon: 'pi pi-user-plus',        color: '#8b5cf6' },
            'Member removed from objective':{ icon: 'pi pi-user-minus',      color: '#f97316' },
            'Objective member joined':     { icon: 'pi pi-user-plus',        color: '#8b5cf6' },
            'Objective member left':       { icon: 'pi pi-user-minus',       color: '#f97316' },
            'Resource added':              { icon: 'pi pi-link',             color: '#22c55e' },
            'Resource updated':            { icon: 'pi pi-pencil',           color: '#f59e0b' },
            'Resource removed':            { icon: 'pi pi-link',             color: '#ef4444' },
            'File attached':               { icon: 'pi pi-paperclip',        color: '#22c55e' },
            'File detached':               { icon: 'pi pi-paperclip',        color: '#ef4444' },
        };
        const meta = iconMap[log.action] ?? { icon: 'pi pi-info-circle', color: '#94a3b8' };

        const isFileAction = log.action === 'File attached' || log.action === 'File detached';
        const isImageUrl = log.detail?.startsWith('/uploads/') || log.detail?.startsWith('uploads/');

        return {
            date: log.timestamp,
            action: log.action,
            detail: (isFileAction && isImageUrl) ? undefined : log.detail,
            detailImageUrl: (isFileAction && isImageUrl)
                ? `${environment.baseUrl}/${log.detail?.replace(/^\//, '')}`
                : undefined,
            userFullName: log.userFullName || undefined,
            userProfilePictureUrl: log.userProfilePictureUrl,
            icon: meta.icon,
            color: meta.color,
        };
    }

    saveObjectiveResource() {
        if (!this.viewingObjective) return;

        this.savingObjectiveResource = true;

        // If there are files to upload, upload them first
        if (this.selectedObjectiveResourceFiles.length > 0) {
            this.projectsService.uploadFiles(this.selectedObjectiveResourceFiles).subscribe({
                next: (uploadResponse) => {
                    console.log('Files uploaded:', uploadResponse);
                    const uploadedFileIds = uploadResponse.results
                        ?.filter((r: any) => r.success)
                        .map((r: any) => r.fileId) || [];
                    this.saveObjectiveResourceWithFiles(uploadedFileIds);
                },
                error: (err) => {
                    console.error('Error uploading files:', err);
                    this.savingObjectiveResource = false;
                }
            });
        } else {
            this.saveObjectiveResourceWithFiles([]);
        }
    }

    private saveObjectiveResourceWithFiles(newFileIds: string[]) {
        if (!this.viewingObjective) return;

        if (this.objectiveResourceDialogMode === 'add') {
            const payload = {
                objectiveId: this.viewingObjective.id,
                title: this.currentObjectiveResource.title,
                urls: this.currentObjectiveResource.urls || [],
                description: this.currentObjectiveResource.description,
                type: this.currentObjectiveResource.type,
                fileIds: newFileIds
            };

            this.projectsService.createResource(payload).subscribe({
                next: (response) => {
                    console.log('Resource created successfully:', response);
                    if (!this.viewingObjective!.resources) {
                        this.viewingObjective!.resources = [];
                    }
                    const normalizedResource = {
                        ...response,
                        type: response.type?.toLowerCase() || 'other',
                        createdByUserId: response.createdByUserId || response.CreatedByUserId,
                        createdByUserName: response.createdByUserName || response.CreatedByUserName
                    };
                    this.viewingObjective!.resources.push(normalizedResource);
                    this.objectiveResourceDialogVisible = false;
                    this.savingObjectiveResource = false;
                },
                error: (err) => {
                    console.error('Error creating resource:', err);
                    this.savingObjectiveResource = false;
                }
            });
        } else {
            const payload = {
                title: this.currentObjectiveResource.title,
                urls: this.currentObjectiveResource.urls || [],
                description: this.currentObjectiveResource.description,
                type: this.currentObjectiveResource.type,
                fileIdsToAdd: newFileIds.length > 0 ? newFileIds : undefined,
                fileIdsToRemove: this.filesToRemoveFromObjectiveResource.length > 0 ? this.filesToRemoveFromObjectiveResource : undefined
            };

            this.projectsService.updateResource(this.currentObjectiveResource.id, payload).subscribe({
                next: (response) => {
                    console.log('Resource updated successfully:', response);
                    if (this.viewingObjective?.resources) {
                        const index = this.viewingObjective.resources.findIndex(r => r.id === this.currentObjectiveResource.id);
                        if (index !== -1) {
                            const normalizedResource = {
                                ...response,
                                type: response.type?.toLowerCase() || 'other',
                                createdByUserId: response.createdByUserId || response.CreatedByUserId,
                                createdByUserName: response.createdByUserName || response.CreatedByUserName
                            };
                            this.viewingObjective.resources[index] = normalizedResource;
                        }
                    }
                    this.objectiveResourceDialogVisible = false;
                    this.savingObjectiveResource = false;
                },
                error: (err) => {
                    console.error('Error updating resource:', err);
                    this.savingObjectiveResource = false;
                }
            });
        }
    }

    confirmDeleteObjectiveResource(resource: Resource) {
        if (this.viewingObjective?.status === 'completed') return;
        this.confirmationService.confirm({
            message: `Are you sure you want to delete "${resource.title}"?`,
            header: 'Delete Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.deleteObjectiveResource(resource);
            }
        });
    }

    deleteObjectiveResource(resource: Resource) {
        this.projectsService.deleteResource(resource.id).subscribe({
            next: (response) => {
                console.log('Resource deleted successfully:', response);
                if (this.viewingObjective?.resources) {
                    this.viewingObjective.resources = this.viewingObjective.resources.filter(r => r.id !== resource.id);
                }
            },
            error: (err) => {
                console.error('Error deleting resource:', err);
            }
        });
    }

    joinObjectiveFromDetail() {
        if (!this.viewingObjective) return;

        // Prevent joining completed objectives
        if (this.viewingObjective.status === 'completed') {
            return;
        }

        if (!this.isUserInObjective(this.viewingObjective)) {
            this.projectsService.joinObjective(this.viewingObjective.id).subscribe({
                next: (response) => {
                    console.log('Successfully joined objective:', response);
                    if (!this.viewingObjective!.members) {
                        this.viewingObjective!.members = [];
                    }
                    this.viewingObjective!.members.push({ ...this.currentUser });
                    this.updateObjectiveInProject();
                },
                error: (err) => {
                    console.error('Error joining objective:', err);
                }
            });
        }
    }

    leaveObjectiveFromDetail() {
        if (!this.viewingObjective || !this.viewingObjective.members) return;

        // Prevent leaving completed objectives
        if (this.viewingObjective.status === 'completed') {
            return;
        }

        this.projectsService.leaveObjective(this.viewingObjective.id).subscribe({
            next: (response) => {
                console.log('Successfully left objective:', response);
                this.viewingObjective!.members = this.viewingObjective!.members!.filter(m => m.userId !== this.currentUser.userId);
                this.updateObjectiveInProject();
            },
            error: (err) => {
                console.error('Error leaving objective:', err);
            }
        });
    }

    editObjectiveFromDetail() {
        if (!this.viewingObjective || this.viewingObjective.status === 'completed') return;
        this.objectiveDetailDialogVisible = false;
        this.openEditObjectiveDialog(this.viewingObjective);
    }

    updateObjectiveInProject() {
       return;
    }

    // Member Assignment Methods
    getProjectParticipantsForObjective(): Member[] {
        if (!this.selectedProject) return this.availableMembers;
        return this.selectedProject.participants.length > 0
            ? this.selectedProject.participants
            : this.availableMembers;
    }

    openAssignMembersToProjectDialog() {
        if (!this.selectedProject) return;

        // Ensure all current participants are in availableMembers
        this.selectedProject.participants.forEach(participant => {
            if (participant.userId && !this.availableMembers.some(m => m.userId === participant.userId)) {
                this.availableMembers.push(participant);
            }
        });

        this.tempSelectedProjectMembers = this.selectedProject.participants
            .map(p => p.userId)
            .filter((id): id is string => !!id);

        // Store initial members to prevent removal
        this.initialProjectMembers = [...this.tempSelectedProjectMembers];

        this.assignMembersToProjectDialogVisible = true;
    }

    assignProjectMembers() {
        if (!this.selectedProject) return;

        const projectId = this.selectedProject.id;
        const currentMemberIds = this.selectedProject.participants
            .map(p => p.userId)
            .filter((id): id is string => !!id);
        const newMemberIds = this.tempSelectedProjectMembers.filter(id => !currentMemberIds.includes(id));

        if (newMemberIds.length === 0) {
            this.assignMembersToProjectDialogVisible = false;
            return;
        }

        // Send POST request for each new member
        let completed = 0;
        const total = newMemberIds.length;

        newMemberIds.forEach(memberId => {
            const member = this.availableMembers.find(m => m.userId === memberId);
            if (!member || !member.userId) {
                console.error('Member or userId not found for:', memberId);
                completed++;
                return;
            }

            const payload = {
                userId: member.userId,
                role: member.role || 'Member'
            };

            // POST /Projects/{projectId}/team-members
            this.http.post(`${environment.apiUrl}/Projects/${projectId}/team-members`, payload)
                .subscribe({
                    next: (response) => {
                        console.log('Member added successfully:', response);

                        // Add member to local project participants
                        if (this.selectedProject && !this.selectedProject.participants.some(p => p.userId === member.userId)) {
                            this.selectedProject.participants.push(member);
                            this.syncProjectInBoardArrays(this.selectedProject);
                        }

                        completed++;
                        if (completed === total) {
                            this.assignMembersToProjectDialogVisible = false;
                        }
                    },
                    error: (err) => {
                        console.error('Error adding member:', err);
                        completed++;
                        if (completed === total) {
                            this.assignMembersToProjectDialogVisible = false;
                        }
                    }
                });
        });
    }

    onProjectMembersChange(event: any) {
        // Prevent deselection of initial members
        const removedMembers = this.initialProjectMembers.filter(id => !this.tempSelectedProjectMembers.includes(id));
        if (removedMembers.length > 0) {
            // Re-add removed initial members
            this.tempSelectedProjectMembers = [...new Set([...this.tempSelectedProjectMembers, ...removedMembers])];
        }
    }

    onObjectiveMembersChange(event: any) {
        // Prevent deselection of initial members
        const removedMembers = this.initialObjectiveMembers.filter(id => !this.tempSelectedObjectiveMembers.includes(id));
        if (removedMembers.length > 0) {
            // Re-add removed initial members
            this.tempSelectedObjectiveMembers = [...new Set([...this.tempSelectedObjectiveMembers, ...removedMembers])];
        }
    }

    openAssignMembersToObjectiveDialog(objective: Objective, event: Event) {
        event.stopPropagation();

        // Prevent opening dialog for completed objectives
        if (objective.status === 'completed') {
            return;
        }

        this.assigningObjective = objective;
        console.log('Opening dialog for objective:', objective.title);
        console.log('Objective members:', objective.members);
        console.log('Available members:', this.availableMembers);

        // Ensure all objective members exist in availableMembers
        // This handles cases where a user joined but isn't in the availableMembers list yet
        if (objective.members) {
            objective.members.forEach(member => {
                if (member.userId && !this.availableMembers.find(m => m.userId === member.userId)) {
                    console.log('Adding missing member to availableMembers:', member);
                    this.availableMembers.push({
                        userId: member.userId,
                        name: member.name,
                        avatar: member.avatar,
                        role: member.role
                    });
                }
            });
        }

        // Extract userIds from objective members - they're already GUIDs (strings)
        this.tempSelectedObjectiveMembers = objective.members
            ? objective.members
                .map(m => m.userId)
                .filter((id): id is string => !!id)
            : [];

        // Store initial members to prevent removal
        this.initialObjectiveMembers = [...this.tempSelectedObjectiveMembers];

        console.log('Selected member IDs for multiselect:', this.tempSelectedObjectiveMembers);
        console.log('Updated available members:', this.availableMembers);
        this.assignMembersToObjectiveDialogVisible = true;
    }

    openAssignMembersToObjectiveFromDetail() {
        if (!this.viewingObjective) return;

        // Prevent opening dialog for completed objectives
        if (this.viewingObjective.status === 'completed') {
            return;
        }

        this.assigningObjective = this.viewingObjective;

        // Ensure all objective members exist in availableMembers
        if (this.viewingObjective.members) {
            this.viewingObjective.members.forEach(member => {
                if (member.userId && !this.availableMembers.find(m => m.userId === member.userId)) {
                    console.log('Adding missing member to availableMembers:', member);
                    this.availableMembers.push({
                        userId: member.userId,
                        name: member.name,
                        avatar: member.avatar,
                        role: member.role
                    });
                }
            });
        }

        // Extract userIds from objective members - they're already GUIDs (strings)
        this.tempSelectedObjectiveMembers = this.viewingObjective.members
            ? this.viewingObjective.members
                .map(m => m.userId)
                .filter((id): id is string => !!id)
            : [];

        // Store initial members to prevent removal
        this.initialObjectiveMembers = [...this.tempSelectedObjectiveMembers];

        this.assignMembersToObjectiveDialogVisible = true;
    }

    saveObjectiveMembers() {
        if (!this.assigningObjective) return;

        const objectiveId = this.assigningObjective.id;
        const currentMemberIds = this.assigningObjective.members?.map(m => m.userId).filter((id): id is string => !!id) || [];

        // Find newly selected members (in tempSelectedObjectiveMembers but not in current members)
        const newMemberIds = this.tempSelectedObjectiveMembers.filter(userId => !currentMemberIds.includes(userId));

        // Find members to add by matching userIds to availableMembers
        const membersToAdd = newMemberIds
            .map(userId => this.availableMembers.find(m => m.userId === userId))
            .filter((m): m is Member => m !== undefined && m.userId !== undefined);

        if (membersToAdd.length === 0) {
            this.assignMembersToObjectiveDialogVisible = false;
            return;
        }

        // Call API for each member to add
        let completedCount = 0;
        membersToAdd.forEach(member => {
            this.projectsService.assignTeamMemberToObjective(objectiveId, member.userId!).subscribe({
                next: (response) => {
                    console.log('Successfully assigned member to objective:', response);
                    if (!this.assigningObjective!.members) {
                        this.assigningObjective!.members = [];
                    }
                    this.assigningObjective!.members.push(member);

                    completedCount++;
                    if (completedCount === membersToAdd.length) {
                        this.assignMembersToObjectiveDialogVisible = false;
                    }
                },
                error: (err) => {
                    console.error('Error assigning member to objective:', err);
                    completedCount++;
                    if (completedCount === membersToAdd.length) {
                        this.assignMembersToObjectiveDialogVisible = false;
                    }
                }
            });
        });
    }

    // Sync a mutated selectedProject back into the board status arrays so cards update without a full refetch
    private syncProjectInBoardArrays(project: Project) {
        const arrays = [this.upcomingProjects, this.inProgressProjects, this.completedProjects];
        for (const arr of arrays) {
            const idx = arr.findIndex(p => p.id === project.id);
            if (idx !== -1) {
                arr[idx] = { ...arr[idx], participants: [...project.participants], objectives: [...project.objectives] };
                break;
            }
        }
    }

    // Remove Member Methods
    removeMemberFromProject(member: Member) {
        if (!this.selectedProject || !member.userId) {
            console.error('Cannot remove member: missing project or userId');
            return;
        }

        this.confirmationService.confirm({
            message: `Are you sure you want to remove "${member.name}" from this project? This will also remove them from all objectives in this project.`,
            header: 'Remove Team Member',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                if (!this.selectedProject || !member.userId) return;

                const projectId = this.selectedProject.id;
                const userId = member.userId;

                this.projectsService.removeTeamMember(projectId, userId).subscribe({
                    next: (response) => {
                        console.log('Team member removed successfully:', response);
                        if (this.selectedProject?.participants) {
                            this.selectedProject.participants = this.selectedProject.participants.filter(p => p.userId !== userId);

                            // Also remove member from all objectives in this project
                            this.selectedProject.objectives.forEach(objective => {
                                if (objective.members) {
                                    objective.members = objective.members.filter(m => m.userId !== userId);
                                }
                            });

                            this.syncProjectInBoardArrays(this.selectedProject);
                        }
                    },
                    error: (err) => {
                        console.error('Error removing team member:', err);
                    }
                });
            }
        });
    }

    removeMemberFromObjectiveDetail(member: Member) {
        if (!this.viewingObjective || !this.selectedProject || !member.userId) return;

        // Prevent removing members from completed objectives
        if (this.viewingObjective.status === 'completed') {
            return;
        }

        const objectiveId = this.viewingObjective.id;
        const userId = member.userId;

        this.confirmationService.confirm({
            message: `Are you sure you want to remove "${member.name}" from this objective?`,
            header: 'Remove Member',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.projectsService.removeTeamMemberFromObjective(objectiveId, userId).subscribe({
                    next: (response) => {
                        console.log('Successfully removed member from objective:', response);
                        if (this.viewingObjective?.members) {
                            this.viewingObjective.members = this.viewingObjective.members.filter(m => m.userId !== userId);
                            this.updateObjectiveInProject();
                        }
                    },
                    error: (err) => {
                        console.error('Error removing member from objective:', err);
                    }
                });
            }
        });
    }

    removeProjectMemberFromDialog(member: Member) {
        if (!this.selectedProject || !member.userId) {
            console.error('Cannot remove member: missing project or userId');
            return;
        }

        this.confirmationService.confirm({
            message: `Are you sure you want to remove "${member.name}" from this project? This will also remove them from all objectives in this project.`,
            header: 'Remove Team Member',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                if (!this.selectedProject || !member.userId) return;

                const projectId = this.selectedProject.id;
                const userId = member.userId;

                this.projectsService.removeTeamMember(projectId, userId).subscribe({
                    next: (response) => {
                        console.log('Team member removed successfully:', response);
                        if (this.selectedProject?.participants) {
                            this.selectedProject.participants = this.selectedProject.participants.filter(p => p.userId !== userId);

                            // Also remove member from all objectives in this project
                            this.selectedProject.objectives.forEach(objective => {
                                if (objective.members) {
                                    objective.members = objective.members.filter(m => m.userId !== userId);
                                }
                            });

                            // Update temp selection
                            this.tempSelectedProjectMembers = this.tempSelectedProjectMembers.filter(id => id !== member.userId);
                        }
                    },
                    error: (err) => {
                        console.error('Error removing team member:', err);
                    }
                });
            }
        });
    }

    removeObjectiveMemberFromDialog(member: Member) {
        if (!this.assigningObjective || !member.userId) return;

        const objectiveId = this.assigningObjective.id;

        this.projectsService.removeTeamMemberFromObjective(objectiveId, member.userId).subscribe({
            next: (response) => {
                console.log('Successfully removed member from objective:', response);
                // Remove from the objective's members list
                if (this.assigningObjective?.members) {
                    this.assigningObjective.members = this.assigningObjective.members.filter(m => m.userId !== member.userId);
                }
                // Remove from temp selection
                this.tempSelectedObjectiveMembers = this.tempSelectedObjectiveMembers.filter(userId => userId !== member.userId);
            },
            error: (err) => {
                console.error('Error removing member from objective:', err);
            }
        });
    }

    // GitHub Integration Properties
    githubCommits: Map<number, GitHubCommit[]> = new Map();
    loadingGithubCommits: Set<number> = new Set();
    githubError: Map<number, string> = new Map();
    githubPagination: Map<number, { currentPage: number; hasMore: boolean; totalCommits: number }> = new Map();
    loadingMoreCommits: Set<number> = new Set();

    // GitHub Integration Methods
    loadGithubCommits(project: Project, loadMore: boolean = false) {
        if (!project.githubRepo || this.loadingGithubCommits.has(project.id)) {
            return;
        }

        if (loadMore) {
            this.loadingMoreCommits.add(project.id);
        } else {
            this.loadingGithubCommits.add(project.id);
            this.githubError.delete(project.id);
            // Reset pagination for fresh load
            this.githubPagination.set(project.id, { currentPage: 1, hasMore: true, totalCommits: 0 });
        }

        // Extract owner and repo from the githubRepo format (owner/repo)
        const [owner, repo] = project.githubRepo.split('/');

        if (!owner || !repo) {
            this.githubError.set(project.id, 'Invalid GitHub repository format');
            this.loadingGithubCommits.delete(project.id);
            this.loadingMoreCommits.delete(project.id);
            return;
        }

        const paginationInfo = this.githubPagination.get(project.id) || { currentPage: 1, hasMore: true, totalCommits: 0 };
        const page = loadMore ? paginationInfo.currentPage : 1;
        const perPage = 10; // Load more commits per page

        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=${perPage}&page=${page}`;

        this.http.get<GitHubCommit[]>(apiUrl, { observe: 'response' })
            .pipe(
                catchError(error => {
                    console.error('GitHub API Error:', error);
                    if (error.status === 403) {
                        this.githubError.set(project.id, 'GitHub API rate limit exceeded. Please try again later.');
                    } else if (error.status === 404) {
                        this.githubError.set(project.id, 'Repository not found or not accessible');
                    } else {
                        this.githubError.set(project.id, 'Failed to load GitHub commits');
                    }
                    return of(null);
                })
            )
            .subscribe({
                next: (response) => {
                    if (response && response.body) {
                        const commits = response.body;

                        if (loadMore) {
                            // Append new commits to existing ones
                            const existingCommits = this.githubCommits.get(project.id) || [];
                            this.githubCommits.set(project.id, [...existingCommits, ...commits]);
                        } else {
                            // Set new commits
                            this.githubCommits.set(project.id, commits);
                        }

                        // Update pagination info
                        const linkHeader = response.headers.get('Link');
                        const hasNextPage = linkHeader ? linkHeader.includes('rel="next"') : commits.length === perPage;

                        this.githubPagination.set(project.id, {
                            currentPage: page + 1,
                            hasMore: hasNextPage,
                            totalCommits: (this.githubCommits.get(project.id) || []).length
                        });
                    }

                    this.loadingGithubCommits.delete(project.id);
                    this.loadingMoreCommits.delete(project.id);
                },
                error: (error) => {
                    console.error('Error loading GitHub commits:', error);
                    this.githubError.set(project.id, 'Failed to load GitHub commits');
                    this.loadingGithubCommits.delete(project.id);
                    this.loadingMoreCommits.delete(project.id);
                }
            });
    }

    getGithubCommits(projectId: number): GitHubCommit[] {
        return this.githubCommits.get(projectId) || [];
    }

    isLoadingGithubCommits(projectId: number): boolean {
        return this.loadingGithubCommits.has(projectId);
    }

    getGithubError(projectId: number): string | null {
        return this.githubError.get(projectId) || null;
    }

    hasMoreCommits(projectId: number): boolean {
        const paginationInfo = this.githubPagination.get(projectId);
        return paginationInfo ? paginationInfo.hasMore : false;
    }

    isLoadingMoreCommits(projectId: number): boolean {
        return this.loadingMoreCommits.has(projectId);
    }

    getTotalCommitsCount(projectId: number): number {
        const paginationInfo = this.githubPagination.get(projectId);
        return paginationInfo ? paginationInfo.totalCommits : 0;
    }

    loadMoreCommits(project: Project) {
        if (!this.hasMoreCommits(project.id) || this.isLoadingMoreCommits(project.id)) {
            return;
        }
        this.loadGithubCommits(project, true);
    }

    formatCommitDate(dateString: string): string {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor(diffMs / (1000 * 60));

        if (diffDays > 0) {
            return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        } else if (diffHours > 0) {
            return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        } else if (diffMinutes > 0) {
            return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
        } else {
            return 'Just now';
        }
    }

    getGithubRepoUrl(githubRepo: string): string {
        return `https://github.com/${githubRepo}`;
    }

    truncateCommitMessage(message: string, maxLength: number = 60): string {
        if (message.length <= maxLength) return message;
        return message.substring(0, maxLength) + '...';
    }

    selectProject(project: Project) {
        // Fetch full project details from API
        this.projectsService.getProjectById(project.id).subscribe({
            next: (projectData) => {
                console.log('Project details received:', projectData);
                this.selectedProject = this.mapProjectFromApi(projectData);
                if (this.selectedProject.githubRepo) {
                    this.loadGithubCommits(this.selectedProject);
                }
            },
            error: (err) => {
                console.error('Error loading project details:', err);
                // Fallback to the project from the list
                this.selectedProject = project;
            }
        });
    }

    // Map single project from API response
    mapProjectFromApi(p: any): Project {
        return {
            id: p.id,
            title: p.title,
            description: p.description,
            status: this.mapStatusFromApi(p.status),
            startDate: p.startDate,
            endDate: p.endDate,
            progress: p.progressPercentage || 0,
            participants: this.mapTeamMembersFromApi(p.teamMembers || []),
            objectives: (p.objectives || []).map((o: any) => ({
                id: o.id,
                title: o.title,
                description: o.description,
                status: this.mapObjectiveStatusFromApi(o.status),
                progress: o.progressPercentage || 0,
                members: this.mapTeamMembersFromApi(o.teamMembers || []),
                resources: (o.resources || []).map((r: any) => ({
                    ...r,
                    type: r.type?.toLowerCase() || 'documentation',
                    createdByUserId: r.createdByUserId || r.CreatedByUserId,
                    createdByUserName: r.createdByUserName || r.CreatedByUserName
                })),
                createdByUserId: o.createdByUserId,
                createdByFirstName: o.createdByFirstName,
                createdByLastName: o.createdByLastName,
                points: o.points || 1
            })),
            resources: (p.resources || []).map((r: any) => ({
                ...r,
                type: r.type?.toLowerCase() || 'documentation',
                createdByUserId: r.createdByUserId || r.CreatedByUserId,
                createdByUserName: r.createdByUserName || r.CreatedByUserName
            })),
            githubRepo: p.githubRepo,
            types: p.types || [],
            createdByUserId: p.createdByUserId,
            createdByFirstName: p.createdByFirstName,
            createdByLastName: p.createdByLastName,
            moderators: p.moderators || [],
            bannerUrl: p.bannerUrl
                ? (p.bannerUrl.startsWith('http') ? p.bannerUrl : `${environment.baseUrl}${p.bannerUrl}`)
                : undefined
        };
    }

    // Map objective status from API
    mapObjectiveStatusFromApi(status: string): 'todo' | 'in-progress' | 'completed' {
        switch (status?.toLowerCase()) {
            case 'todo': return 'todo';
            case 'inprogress': return 'in-progress';
            case 'completed': return 'completed';
            default: return 'todo';
        }
    }

    // Check if current user can edit/delete a resource
    canEditResource(resource: Resource): boolean {
        const currentUser = this.authService.currentUser();
        if (!currentUser) return false;

        // Users can edit their own resources
        return resource.createdByUserId === currentUser.id;
    }

    onDialogBannerSelect(event: any) {
        const file = event.files[0];
        if (!file) return;
        this.pendingBannerFile = file;
        this.removeBannerInEdit = false;
        // Use createObjectURL — synchronous and zone-safe (no FileReader async callback)
        this.dialogBannerPreviewUrl = URL.createObjectURL(file);
    }

    removeDialogBanner() {
        this.pendingBannerFile = null;
        this.dialogBannerPreviewUrl = null;
        if (this.dialogMode === 'edit') {
            this.removeBannerInEdit = true;
        }
    }

    onProjectBannerSelect(event: any) {
        const file = event.files[0];
        if (!file || !this.selectedProject) return;
        const projectId = this.selectedProject.id;
        // Apply preview immediately (synchronous, in-zone)
        const previewUrl = URL.createObjectURL(file);
        this.selectedProject.bannerUrl = previewUrl;
        this.updateProjectBannerInArrays(projectId, previewUrl);
        this.projectsService.uploadBanner(String(projectId), file).subscribe({
            next: (response) => {
                if (response.bannerUrl) {
                    const bannerUrl = response.bannerUrl.startsWith('http')
                        ? response.bannerUrl
                        : `${environment.baseUrl}${response.bannerUrl}`;
                    if (this.selectedProject?.id === projectId) {
                        this.selectedProject.bannerUrl = bannerUrl;
                    }
                    this.updateProjectBannerInArrays(projectId, bannerUrl);
                }
            },
            error: (err) => console.error('Error uploading project banner:', err)
        });
    }

    deleteProjectBanner() {
        if (!this.selectedProject) return;
        const projectId = this.selectedProject.id;
        // Optimistic: remove immediately
        this.selectedProject.bannerUrl = undefined;
        this.updateProjectBannerInArrays(projectId, undefined);
        this.projectsService.deleteBanner(String(projectId)).subscribe({
            error: (err) => console.error('Error deleting project banner:', err)
        });
    }

    private updateProjectBannerInArrays(projectId: any, bannerUrl: string | undefined) {
        for (const arr of [this.upcomingProjects, this.inProgressProjects, this.completedProjects]) {
            const project = arr.find(p => p.id === projectId);
            if (project) {
                project.bannerUrl = bannerUrl;
                break;
            }
        }
    }
}