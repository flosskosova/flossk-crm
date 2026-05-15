import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
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
import { ConfirmationService } from 'primeng/api';
import { AuthService } from '../../service/auth.service';
import { ProjectsService } from '../../service/projects.service';
import { Projects } from './projects';

@Component({
    selector: 'app-project-details',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, TagModule, AvatarModule, AvatarGroupModule, DividerModule, ProgressBarModule, TabsModule, DragDropModule, DialogModule, InputTextModule, TextareaModule, SelectModule, DatePickerModule, ConfirmDialogModule, MultiSelectModule, TooltipModule, FileUploadModule],
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
                    <textarea pTextarea id="description" [(ngModel)]="currentProject.description" rows="6" class="w-full" maxlength="4000" style="resize:vertical"></textarea>
                    <div class="text-right text-xs text-muted-color mt-1">{{ currentProject.description.length }}/4000</div>
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
                    <textarea pTextarea id="objectiveDescription" [(ngModel)]="currentObjective.description" rows="5" class="w-full" maxlength="4000" style="resize:vertical"></textarea>
                    <div class="text-right text-xs text-muted-color mt-1">{{ currentObjective.description.length }}/4000</div>
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
                                        <span class="flex-1 truncate">{{ file.fileName }}</span>
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
                            <p-button *ngIf="viewingObjective.status !== 'completed' && isAdminOrModerator(selectedProject)" icon="pi pi-times" size="small" [text]="true" [rounded]="true" severity="danger" pTooltip="Remove Member" (onClick)="removeMemberFromObjectiveDetail(member)" />
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
                        <p-button *ngIf="selectedProject!.status !== 'completed' && viewingObjective!.status !== 'completed'" icon="pi pi-plus" label="Add Resource" size="small" [text]="true" (onClick)="openAddObjectiveResourceDialog()" />
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
                                <div class="flex gap-1" *ngIf="canEditResource(resource) && viewingObjective!.status !== 'completed'">
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
                                            {{ file.fileName }}
                                        </span>
                                        <span class="text-muted-color text-xs">{{ formatFileSize(file.fileSize) }}</span>
                                        <div class="flex gap-1">
                                            <p-button *ngIf="!file.fileName.toLowerCase().endsWith('.pptx')" icon="pi pi-eye" [text]="true" [rounded]="true" size="small" severity="secondary" pTooltip="View" (onClick)="viewFile(file.id, file.fileName)" />
                                            <p-button icon="pi pi-download" [text]="true" [rounded]="true" size="small" severity="secondary" pTooltip="Download" (onClick)="downloadFile(file.id, file.fileName)" />
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
                    <p-button *ngIf="viewingObjective && viewingObjective.status !== 'completed'" label="Edit" icon="pi pi-pencil" severity="secondary" (onClick)="editObjectiveFromDetail()" />
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
                                        <span class="flex-1 truncate">{{ file.fileName }}</span>
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
                            <p-button *ngIf="isAdminOrModerator(selectedProject)" icon="pi pi-times" size="small" [text]="true" [rounded]="true" severity="danger" (onClick)="removeProjectMemberFromDialog(member)" />
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


        <div *ngIf="loading" class="card">
            <div class="flex items-center gap-3 text-muted-color">
                <i class="pi pi-spin pi-spinner"></i>
                <span>Loading project details...</span>
            </div>
        </div>

        <div *ngIf="!loading && errorMessage" class="card">
            <div class="text-red-500">{{ errorMessage }}</div>
        </div>

            <!-- Project Details Modal/Section -->
            <div *ngIf="selectedProject" class="card">
                <!-- Project Banner -->
                <div class="relative h-48 bg-linear-to-r from-primary-300 via-primary-500 to-primary-700 overflow-hidden rounded-xl mb-6 group">
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
                        <p-button icon="pi pi-times" [text]="true" [rounded]="true" (onClick)="goBackToProjects()"></p-button>
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
                                    <p-button *ngIf="selectedProject.status !== 'completed' && isAdminOrModerator(selectedProject)" icon="pi pi-times" size="small" [text]="true" [rounded]="true" severity="danger" pTooltip="Remove Member" (onClick)="removeMemberFromProject(member)" />
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
                                        <div class="flex gap-1" *ngIf="canEditResource(resource) && selectedProject!.status !== 'completed'">
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
                                                    {{ file.fileName }}
                                                </span>
                                                <span class="text-muted-color text-xs">{{ formatFileSize(file.fileSize) }}</span>
                                                <div class="flex gap-1">
                                                    <p-button *ngIf="!file.fileName.toLowerCase().endsWith('.pptx')" icon="pi pi-eye" [text]="true" [rounded]="true" size="small" severity="secondary" pTooltip="View" (onClick)="viewFile(file.id, file.fileName)" />
                                                    <p-button icon="pi pi-download" [text]="true" [rounded]="true" size="small" severity="secondary" pTooltip="Download" (onClick)="downloadFile(file.id, file.fileName)" />
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
export class ProjectDetails extends Projects implements OnInit, OnDestroy {
    private readonly route = inject(ActivatedRoute);
    private readonly detailsRouter = inject(Router);
    private readonly projectDetailsService = inject(ProjectsService);
    private routeSub?: Subscription;

    loading = true;
    errorMessage = '';

    constructor(
        confirmationService: ConfirmationService,
        http: HttpClient,
        projectsService: ProjectsService,
        authService: AuthService,
        router: Router
    ) {
        super(confirmationService, http, projectsService, authService, router);
    }

    ngOnInit(): void {
        this.routeSub = this.route.paramMap.subscribe(params => {
            const rawProjectId = params.get('projectId');

            if (!rawProjectId) {
                this.selectedProject = null;
                this.errorMessage = 'Project not found.';
                this.loading = false;
                return;
            }

            this.loadProject(rawProjectId);
        });
    }

    ngOnDestroy(): void {
        this.routeSub?.unsubscribe();
    }

    goBackToProjects(): void {
        this.detailsRouter.navigate(['/dashboard/projects']);
    }

    private loadProject(projectId: string): void {
        this.loading = true;
        this.errorMessage = '';

        this.projectDetailsService.getProjectById(projectId).subscribe({
            next: (projectData) => {
                this.selectedProject = this.mapProjectFromApi(projectData);
                if (this.selectedProject.githubRepo) {
                    this.loadGithubCommits(this.selectedProject);
                }
                this.loading = false;
            },
            error: () => {
                this.selectedProject = null;
                this.errorMessage = 'Unable to load project details.';
                this.loading = false;
            }
        });
    }
}
