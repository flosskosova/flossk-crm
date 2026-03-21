import { Component, OnInit, OnDestroy, inject, computed, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import SignaturePad from 'signature_pad';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';

import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { environment } from '@environments/environment.prod';
import { AuthService, getInitials, isDefaultAvatar } from '@/pages/service/auth.service';

interface CertificateRecord {
    id: string;
    recipientUserId: string;
    recipientName: string;
    recipientEmail: string;
    certificateType: string;
    eventName: string;
    issuedDate: string;
    status: string;
}

interface CertificateTemplate {
    id: string;
    name: string;
    originalFileName: string;
    contentType: string;
    fileSize: number;
    uploadedAt: string;
    createdByName: string;
    previewPath: string;
}

interface FieldBox {
    id: string;
    key: string;
    label: string;
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
}

@Component({
    selector: 'app-cert-builder',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        DialogModule,
        InputTextModule,
        TextareaModule,
        SelectModule,
        AvatarModule,
        TagModule,
        SkeletonModule,
        TooltipModule,
        ToolbarModule,
        IconFieldModule,
        InputIconModule,
        ConfirmDialogModule
    ],
    providers: [ConfirmationService],
    template: `
        <p-confirmDialog />

        <!-- Layout Editor Dialog -->
        <p-dialog
            [(visible)]="layoutEditorVisible"
            [modal]="true"
            [style]="{ width: '92vw' }"
            [header]="'Edit Layout: ' + (editingTemplate?.name ?? '')"
            [draggable]="false"
            [resizable]="false"
            (onHide)="onLayoutEditorHide()"
        >
            <div class="flex gap-4" style="height: 72vh; user-select: none;">

                <!-- Field palette (left) -->
                <div class="flex flex-col gap-2 overflow-y-auto" style="width: 190px; min-width: 190px;">
                    <div class="text-xs font-semibold text-muted-color uppercase tracking-wide mb-1">Field Types</div>
                    @for (ft of FIELD_TYPES; track ft.key) {
                        <button
                            class="flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-colors w-full text-left"
                            [style.borderColor]="ft.color"
                            [style.color]="ft.color"
                            [style.backgroundColor]="activeFieldType === ft.key ? ft.color + '22' : 'transparent'"
                            [disabled]="isFieldTypeUsed(ft.key)"
                            [style.opacity]="isFieldTypeUsed(ft.key) ? '0.4' : '1'"
                            [style.cursor]="isFieldTypeUsed(ft.key) ? 'not-allowed' : 'pointer'"
                            (click)="selectFieldType(ft.key)"
                        >
                            <i class="pi {{ ft.icon }}"></i>
                            <span class="flex-1">{{ ft.label }}</span>
                            @if (isFieldTypeUsed(ft.key)) {
                                <i class="pi pi-check text-xs"></i>
                            }
                            @if (activeFieldType === ft.key) {
                                <i class="pi pi-pencil text-xs"></i>
                            }
                        </button>
                    }

                    @if (activeFieldType) {
                        <div class="mt-1 p-2 rounded text-xs surface-100 text-muted-color leading-relaxed">
                            <i class="pi pi-info-circle mr-1"></i>
                            Click &amp; drag on the template to place
                            <strong>{{ getFieldType(activeFieldType)?.label }}</strong>
                        </div>
                    }

                    @if (selectedField) {
                        <div class="mt-4 pt-4 border-t flex flex-col gap-2">
                            <div class="text-xs font-semibold text-muted-color uppercase tracking-wide">Selected</div>
                            <div class="text-sm font-semibold" [style.color]="selectedField.color">
                                {{ selectedField.label }}
                            </div>
                            <div class="text-xs text-muted-color font-mono">
                                x: {{ selectedField.x | number:'1.0-0' }},
                                y: {{ selectedField.y | number:'1.0-0' }}<br>
                                w: {{ selectedField.width | number:'1.0-0' }},
                                h: {{ selectedField.height | number:'1.0-0' }}
                            </div>
                            <p-button
                                label="Remove"
                                icon="pi pi-trash"
                                severity="danger"
                                size="small"
                                [text]="true"
                                (onClick)="deleteSelectedField()"
                            />
                        </div>
                    }
                </div>

                <!-- Canvas (right) -->
                <div class="flex-1 overflow-auto flex items-center justify-center rounded-lg surface-50" style="min-height:0;">
                    @if (editingTemplate) {
                        <div
                            #editorCanvas
                            class="relative inline-block"
                            [style.cursor]="activeFieldType ? 'crosshair' : 'default'"
                            (mousedown)="onCanvasMouseDown($event)"
                        >
                            <img
                                [src]="getTemplatePreviewUrl(editingTemplate)"
                                [alt]="editingTemplate.name"
                                draggable="false"
                                style="display:block; max-height:68vh; max-width:100%; pointer-events:none; border-radius:4px;"
                            />

                            <!-- Placed field boxes -->
                            @for (field of fields; track field.id) {
                                <div
                                    class="absolute border-2 flex items-center justify-center"
                                    [style.left.px]="field.x"
                                    [style.top.px]="field.y"
                                    [style.width.px]="field.width"
                                    [style.height.px]="field.height"
                                    [style.borderColor]="field.color"
                                    [style.backgroundColor]="'white'"
                                    [style.outline]="selectedFieldId === field.id ? '2px solid ' + field.color : 'none'"
                                    [style.outlineOffset]="'2px'"
                                    style="cursor:move; box-sizing:border-box;"
                                    (mousedown)="onFieldMouseDown($event, field)"
                                >
                                    <span
                                        class="pointer-events-none select-none font-semibold truncate px-1"
                                        [style.color]="field.color"
                                        style="font-size:11px; text-shadow:0 0 4px white, 0 0 4px white;"
                                    >{{ field.label }}</span>

                                    <!-- Corner resize handles -->
                                    @for (handle of ['tl','tr','bl','br']; track handle) {
                                        <div
                                            class="absolute w-3 h-3 bg-white border-2 rounded-sm"
                                            [style.borderColor]="field.color"
                                            [style.cursor]="handle === 'tl' ? 'nw-resize' : handle === 'tr' ? 'ne-resize' : handle === 'bl' ? 'sw-resize' : 'se-resize'"
                                            [style.top]="handle[0] === 't' ? '-5px' : 'auto'"
                                            [style.bottom]="handle[0] === 'b' ? '-5px' : 'auto'"
                                            [style.left]="handle[1] === 'l' ? '-5px' : 'auto'"
                                            [style.right]="handle[1] === 'r' ? '-5px' : 'auto'"
                                            (mousedown)="onResizeHandleMouseDown($event, field, handle)"
                                        ></div>
                                    }
                                </div>
                            }

                            <!-- Drawing preview -->
                            @if (drawing) {
                                <div
                                    class="absolute pointer-events-none"
                                    [style.left.px]="drawingRect.x"
                                    [style.top.px]="drawingRect.y"
                                    [style.width.px]="drawingRect.width"
                                    [style.height.px]="drawingRect.height"
                                    [style.border]="'2px dashed ' + (getFieldType(activeFieldType)?.color ?? '#3B82F6')"
                                    [style.backgroundColor]="(getFieldType(activeFieldType)?.color ?? '#3B82F6') + '22'"
                                ></div>
                            }
                        </div>
                    }
                </div>
            </div>

            <ng-template #footer>
                <div class="flex justify-between items-center">
                    <span class="text-xs text-muted-color">
                        {{ fields.length }} field{{ fields.length !== 1 ? 's' : '' }} placed
                    </span>
                    <div class="flex gap-2">
                        <p-button label="Cancel" severity="secondary" (onClick)="layoutEditorVisible = false" />
                        <p-button label="Save Layout" icon="pi pi-save" (onClick)="saveLayout()" />
                    </div>
                </div>
            </ng-template>
        </p-dialog>

        <!-- Members Grid -->
        <div class="card">
            <div class="flex flex-col gap-4 mb-6">
                <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <h5 class="text-sm text-muted-color mt-1 mb-0">Select a project to view users eligible for a certificate</h5>
                    <p-iconfield>
                        <p-inputicon styleClass="pi pi-search" />
                        <input pInputText type="text" [(ngModel)]="userSearchQuery" placeholder="Search members..." />
                    </p-iconfield>
                </div>
                <p-select
                    [(ngModel)]="selectedFilterProjectId"
                    (ngModelChange)="onProjectFilterChange($event)"
                    [options]="projects"
                    optionLabel="title"
                    optionValue="id"
                    placeholder="Filter by project..."
                    [filter]="true"
                    filterPlaceholder="Search projects..."
                    [showClear]="true"
                    [loading]="projectsLoading"
                    [style]="{ width: '100%', 'max-width': '28rem' }"
                />
            </div>

            @if (usersLoading) {
                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    @for (i of [1,2,3,4,5,6]; track i) {
                        <div class="border border-surface rounded-xl p-4 flex items-center gap-3">
                            <p-skeleton shape="circle" size="3rem" />
                            <div class="flex-1 flex flex-col gap-2">
                                <p-skeleton width="60%" height="1rem" />
                                <p-skeleton width="40%" height="0.75rem" />
                            </div>
                        </div>
                    }
                </div>
            } @else if (filteredUsers.length === 0) {
                <div class="flex flex-col items-center gap-3 text-muted-color py-12">
                    <i class="pi pi-users text-5xl"></i>
                    <span class="text-lg">{{ selectedFilterProjectId ? 'No eligible users found for this project' : 'Select a project above to see eligible recipients' }}</span>
                </div>
            } @else {
                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    @for (user of filteredUsers; track user.id) {
                        <div
                            class="border rounded-xl overflow-hidden transition-all duration-200"
                            [class.border-primary]="activeIssuingUserId === user.id"
                            [class.border-surface]="activeIssuingUserId !== user.id"
                            [class.shadow-lg]="activeIssuingUserId === user.id"
                        >
                            <!-- User Info Row -->
                            <div class="flex items-center gap-3 p-4">
                                <p-avatar
                                    *ngIf="hasProfilePicture(user.profilePictureUrl)"
                                    [image]="getProfilePictureUrl(user.profilePictureUrl)"
                                    shape="circle"
                                    size="large"
                                ></p-avatar>
                                <p-avatar
                                    *ngIf="!hasProfilePicture(user.profilePictureUrl)"
                                    [label]="getUserInitials(user)"
                                    shape="circle"
                                    size="large"
                                    [style]="{ 'background-color': 'var(--primary-color)', 'color': 'var(--primary-color-text)' }"
                                ></p-avatar>
                                <div class="flex-1 min-w-0">
                                    <div class="font-semibold truncate">{{ user.fullName }}</div>
                                    <div class="text-sm text-muted-color truncate">{{ user.email }}</div>
                                    @if (user.roles?.length) {
                                        <p-tag [value]="user.roles[0]" severity="secondary" styleClass="mt-1 text-xs" />
                                    }
                                </div>
                                @if (isAdmin()) {
                                    <p-button
                                        [icon]="activeIssuingUserId === user.id ? 'pi pi-times' : 'pi pi-plus-circle'"
                                        [severity]="activeIssuingUserId === user.id ? 'danger' : 'primary'"
                                        [rounded]="true"
                                        [text]="true"
                                        size="large"
                                        [pTooltip]="activeIssuingUserId === user.id ? 'Cancel' : 'Issue Certificate'"
                                        tooltipPosition="left"
                                        (onClick)="toggleIssueForm(user)"
                                    />
                                }
                            </div>

                            <!-- Certificates for this user -->
                            @if (getUserCerts(user.id).length > 0) {
                                <div class="px-4 pb-3 border-t border-surface pt-3">
                                    <span class="text-xs font-semibold text-muted-color uppercase tracking-wide">Certificates</span>
                                    <div class="flex flex-col gap-1.5 mt-2">
                                        @for (cert of getUserCerts(user.id); track cert.id) {
                                            <div class="flex items-center gap-2 bg-surface-100 dark:bg-surface-700 rounded-lg px-3 py-1.5">
                                                <p-tag [value]="cert.certificateType" [severity]="getTypeSeverity(cert.certificateType)" />
                                                <span class="flex-1 truncate text-surface-700 dark:text-surface-300 text-xs">{{ cert.eventName }}</span>
                                                <p-tag [value]="cert.status" [severity]="getStatusSeverity(cert.status)" />
                                                <p-button icon="pi pi-eye" [text]="true" [rounded]="true" size="small" severity="success" pTooltip="View" (onClick)="viewCertificate(cert)" />
                                                <p-button icon="pi pi-download" [text]="true" [rounded]="true" size="small" severity="info" pTooltip="Download" (onClick)="downloadCertificate(cert)" />
                                                <p-button icon="pi pi-envelope" [text]="true" [rounded]="true" size="small" severity="secondary" pTooltip="Resend Email" />
                                                <p-button icon="pi pi-trash" [text]="true" [rounded]="true" size="small" severity="danger" pTooltip="Delete" (onClick)="deleteCertificate(cert)" />
                                            </div>
                                        }
                                    </div>
                                </div>
                            }

                            <!-- Inline Issue Certificate Form -->
                            @if (activeIssuingUserId === user.id) {
                                <div class="border-t border-primary p-4 bg-surface-50 dark:bg-surface-800 flex flex-col gap-4">
                                    <div class="flex items-center gap-2">
                                        <i class="pi pi-certificate text-primary text-lg"></i>
                                        <span class="font-semibold">Issuing to <span class="text-primary">{{ user.fullName }}</span></span>
                                    </div>

                                    <div class="flex flex-col gap-1.5">
                                        <label class="text-sm font-semibold">Certificate Type</label>
                                        <p-select
                                            [(ngModel)]="certForm.type"
                                            [options]="certificateTypes"
                                            optionLabel="label"
                                            optionValue="value"
                                            placeholder="Select type"
                                            [style]="{ width: '100%' }"
                                            appendTo="body"
                                        />
                                    </div>

                                    <div class="flex flex-col gap-1.5">
                                        <label class="text-sm font-semibold">Event / Project</label>
                                        <p-select
                                            [(ngModel)]="certForm.eventId"
                                            [options]="projectsWithCustom"
                                            optionLabel="title"
                                            optionValue="id"
                                            placeholder="Select an event..."
                                            [filter]="true"
                                            filterPlaceholder="Search events..."
                                            [showClear]="true"
                                            [style]="{ width: '100%' }"
                                            [loading]="projectsLoading"
                                            appendTo="body"
                                        >
                                            <ng-template let-opt #item>
                                                <div class="flex items-center gap-2">
                                                    @if (opt.id === CUSTOM_EVENT_ID) {
                                                        <i class="pi pi-pen-to-square"></i>
                                                    } @else {
                                                        <i class="pi pi-folder"></i>
                                                    }
                                                    <span>{{ opt.id === CUSTOM_EVENT_ID ? 'Custom...' : opt.title }}</span>
                                                </div>
                                            </ng-template>
                                        </p-select>
                                        @if (certForm.eventId === CUSTOM_EVENT_ID) {
                                            <input pInputText [(ngModel)]="certForm.customEventTitle" placeholder="Enter custom event title..." class="mt-1" />
                                        }
                                    </div>

                                    <div class="flex flex-col gap-1.5">
                                        <label class="text-sm font-semibold">Description <span class="font-normal text-muted-color">(optional)</span></label>
                                        <textarea pTextarea [(ngModel)]="certForm.description" rows="2" placeholder="Achievement or participation details..." class="w-full"></textarea>
                                    </div>

                                    @if (templates.length > 0) {
                                        <div class="flex flex-col gap-1.5">
                                            <label class="text-sm font-semibold">Template <span class="font-normal text-muted-color">(optional)</span></label>
                                            <p-select
                                                [(ngModel)]="certForm.templateId"
                                                [options]="templateOptions"
                                                optionLabel="label"
                                                optionValue="value"
                                                placeholder="Default design"
                                                [showClear]="true"
                                                [style]="{ width: '100%' }"
                                                appendTo="body"
                                            />
                                        </div>
                                    }

                                    <div class="flex flex-col gap-1.5">
                                        <div class="flex items-center justify-between">
                                            <label class="text-sm font-semibold">Issuer Signature</label>
                                            <p-button label="Clear" icon="pi pi-eraser" size="small" [text]="true" severity="secondary" (onClick)="clearSignature()" />
                                        </div>
                                        <div class="border border-surface rounded-lg overflow-hidden" style="background:#fff;">
                                            <canvas #sigCanvas style="width:100%;height:110px;display:block;touch-action:none;"></canvas>
                                        </div>
                                    </div>

                                    <div class="flex gap-2 justify-end pt-1">
                                        <p-button label="Cancel" severity="secondary" size="small" (onClick)="cancelIssueForm()" />
                                        <p-button label="Issue Certificate" icon="pi pi-check" size="small" (onClick)="issueCertificate()" [disabled]="!canIssue()" />
                                    </div>
                                </div>
                            }
                        </div>
                    }
                </div>
            }
        </div>

        <!-- Templates Card -->
        @if (isAdmin()) {
            <div class="card mt-6">
                <p-toolbar styleClass="mb-6">
                    <ng-template #start>
                        <span class="font-semibold text-xl">Certificate Templates</span>
                    </ng-template>
                    <ng-template #end>
                        <p-button label="Upload Template" icon="pi pi-upload" (onClick)="triggerTemplateUpload()" [loading]="uploadingTemplate" />
                        <input #templateFileInput type="file" accept="image/png,image/jpeg,image/webp" style="display:none" (change)="onTemplateFileSelected($event)" />
                    </ng-template>
                </p-toolbar>

                @if (templates.length === 0) {
                    <div class="flex flex-col items-center gap-3 text-muted-color py-8">
                        <i class="pi pi-image text-4xl"></i>
                        <span>No templates uploaded yet. Upload a PNG/JPG image to use as a certificate background.</span>
                    </div>
                } @else {
                    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        @for (tmpl of templates; track tmpl.id) {
                            <div class="border rounded-lg p-3 flex flex-col gap-2 relative">
                                <img [src]="getTemplatePreviewUrl(tmpl)" [alt]="tmpl.name" class="w-full rounded object-cover" style="aspect-ratio:1.414;object-fit:cover" />
                                <div class="flex flex-col gap-1">
                                    <span class="font-semibold text-sm truncate" [title]="tmpl.name">{{ tmpl.name }}</span>
                                    <span class="text-xs text-muted-color">{{ tmpl.uploadedAt | date:'mediumDate' }}</span>
                                </div>
                                <div class="flex justify-end gap-1">
                                    <p-button icon="pi pi-sliders-h" [rounded]="true" [text]="true" severity="info" pTooltip="Edit Layout" (onClick)="openLayoutEditor(tmpl)" />
                                    <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" pTooltip="Delete template" (onClick)="deleteTemplate(tmpl)" />
                                </div>
                            </div>
                        }
                    </div>
                }
            </div>
        }
    `
})
export class CertBuilder implements OnInit, OnDestroy {
    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private cdr = inject(ChangeDetectorRef);
    private confirmationService = inject(ConfirmationService);

    @ViewChild('templateFileInput') templateFileInput!: ElementRef<HTMLInputElement>;
    @ViewChild('editorCanvas') editorCanvas!: ElementRef<HTMLDivElement>;
    @ViewChild('sigCanvas') sigCanvasRef?: ElementRef<HTMLCanvasElement>;
    private signaturePad?: SignaturePad;

    readonly FIELD_TYPES = [
        { key: 'recipientName', label: 'Full Name',   icon: 'pi-user',          color: '#3B82F6' },
        { key: 'eventName',     label: 'Event Name',  icon: 'pi-calendar',      color: '#10B981' },
        { key: 'description',   label: 'Description', icon: 'pi-align-left',    color: '#8B5CF6' },
        { key: 'issuedDate',    label: 'Issue Date',  icon: 'pi-clock',         color: '#F59E0B' },
        { key: 'issuedBy',      label: 'Issued By',   icon: 'pi-id-card',       color: '#06B6D4' },
        { key: 'signature',     label: 'Signature',   icon: 'pi-pen-to-square', color: '#EF4444' },
    ];

    isAdmin = computed(() => {
        const user = this.authService.currentUser();
        return user?.roles?.includes('Admin') ?? false;
    });

    loading = true;
    usersLoading = false;
    users: any[] = [];
    selectedFilterProjectId: string | null = null;
    activeIssuingUserId: string | null = null;
    activeIssuingUser: any = null;
    userSearchQuery = '';
    issuedCertificates: CertificateRecord[] = [];
    templates: CertificateTemplate[] = [];
    templateOptions: { label: string; value: string }[] = [];
    uploadingTemplate = false;

    // ── Layout editor state ──────────────────────────────────────────────────
    layoutEditorVisible = false;
    editingTemplate: CertificateTemplate | null = null;
    fields: FieldBox[] = [];
    selectedFieldId: string | null = null;
    activeFieldType: string | null = null;
    drawing: { startX: number; startY: number; currentX: number; currentY: number } | null = null;
    dragging: { fieldId: string; startMX: number; startMY: number; origX: number; origY: number } | null = null;
    resizing: { fieldId: string; handle: string; startMX: number; startMY: number; origBox: FieldBox } | null = null;

    certificateTypes = [
        { label: 'Participation', value: 'Participation' },
        { label: 'Volunteering', value: 'Volunteering' },
        { label: 'Speaker', value: 'Speaker' },
        { label: 'Achievement', value: 'Achievement' },
        { label: 'Membership', value: 'Membership' },
        { label: 'Contribution', value: 'Contribution' }
    ];

    readonly CUSTOM_EVENT_ID = '__custom__';

    projects: any[] = [];
    projectsWithCustom: any[] = [];
    projectsLoading = false;

    certForm = {
        type: '',
        eventId: null as string | null,
        customEventTitle: '',
        description: '',
        templateId: null as string | null
    };

    ngOnInit() {
        this.loadCertificates();
        this.loadProjects();
        this.loadTemplates();
    }

    loadProjects() {
        this.projectsLoading = true;
        this.http.get<any>(`${environment.apiUrl}/Projects`).subscribe({
            next: (data) => {
                this.projects = Array.isArray(data) ? data : (data.projects || []);
                this.projectsWithCustom = [
                    ...this.projects,
                    { id: this.CUSTOM_EVENT_ID, title: 'Custom...' }
                ];
                this.projectsLoading = false;
            },
            error: () => {
                this.projects = [];
                this.projectsWithCustom = [{ id: this.CUSTOM_EVENT_ID, title: 'Custom...' }];
                this.projectsLoading = false;
            }
        });
    }

    loadEligibleUsers(projectId: string) {
        this.usersLoading = true;
        this.http.get<any[]>(`${environment.apiUrl}/Projects/${projectId}/eligible-certificate-recipients`).subscribe({
            next: (data) => {
                this.users = (data || []).map((u: any) => ({
                    ...u,
                    id: u.userId,
                    fullName: `${u.firstName} ${u.lastName}`
                }));
                console.log('Eligible certificate recipients:', this.users);
                this.usersLoading = false;
            },
            error: () => {
                this.users = [];
                this.usersLoading = false;
            }
        });
    }

    onProjectFilterChange(projectId: string | null) {
        this.cancelIssueForm();
        this.users = [];
        this.userSearchQuery = '';
        if (projectId) {
            this.loadEligibleUsers(projectId);
        }
    }

    loadCertificates() {
        this.loading = true;
        this.http.get<any>(`${environment.apiUrl}/Certificates?page=1&pageSize=100`).subscribe({
            next: (response) => {
                this.issuedCertificates = response.certificates || [];
                this.loading = false;
            },
            error: () => {
                this.issuedCertificates = [];
                this.loading = false;
            }
        });
    }

    toggleIssueForm(user: any) {
        if (this.activeIssuingUserId === user.id) {
            this.cancelIssueForm();
            return;
        }
        this.activeIssuingUserId = user.id;
        this.activeIssuingUser = user;
        this.certForm = { type: '', eventId: this.selectedFilterProjectId, customEventTitle: '', description: '', templateId: null };
        this.cdr.detectChanges();
        this.initSignaturePad();
    }

    cancelIssueForm() {
        this.activeIssuingUserId = null;
        this.activeIssuingUser = null;
        this.signaturePad?.off();
        this.signaturePad = undefined;
    }

    initSignaturePad() {
        setTimeout(() => {
            if (!this.sigCanvasRef) return;
            const canvas = this.sigCanvasRef.nativeElement;
            const ratio = Math.max(window.devicePixelRatio || 1, 1);
            canvas.width = canvas.offsetWidth * ratio;
            canvas.height = canvas.offsetHeight * ratio;
            canvas.getContext('2d')!.scale(ratio, ratio);
            if (this.signaturePad) this.signaturePad.off();
            this.signaturePad = new SignaturePad(canvas, {
                backgroundColor: 'rgb(255,255,255)',
                penColor: 'rgb(0,0,0)',
            });
        }, 100);
    }

    clearSignature() {
        this.signaturePad?.clear();
    }

    canIssue(): boolean {
        const customValid = this.certForm.eventId !== this.CUSTOM_EVENT_ID || !!this.certForm.customEventTitle.trim();
        const signatureValid = !!this.signaturePad && !this.signaturePad.isEmpty();
        return !!this.activeIssuingUser && !!this.certForm.type && customValid && signatureValid;
    }

    issueCertificate() {
        if (!this.canIssue()) return;

        let eventTitle: string | null = null;
        if (this.certForm.eventId === this.CUSTOM_EVENT_ID) {
            eventTitle = this.certForm.customEventTitle.trim() || null;
        } else {
            const selectedProject = this.projects.find((p) => p.id === this.certForm.eventId);
            eventTitle = selectedProject?.title ?? null;
        }
        const eventName = eventTitle ?? '';

        const signatureDataUrl = this.signaturePad!.toDataURL('image/png');

        const payload = {
            recipientUserId: this.activeIssuingUser.id,
            type: this.certForm.type,
            eventName,
            description: this.certForm.description,
            issuedDate: new Date().toISOString(),
            templateId: this.certForm.templateId || null,
            projectId: this.certForm.eventId !== this.CUSTOM_EVENT_ID ? this.certForm.eventId : null,
            issuerSignatureDataUrl: signatureDataUrl
        };

        this.http.post<CertificateRecord>(`${environment.apiUrl}/Certificates`, payload).subscribe({
            next: (cert) => {
                this.issuedCertificates = [cert, ...this.issuedCertificates];
                this.cancelIssueForm();
            },
            error: (err) => {
                console.error('Error issuing certificates:', err);
            }
        });
    }

    deleteCertificate(cert: CertificateRecord) {
        this.confirmationService.confirm({
            message: `Delete certificate for <strong>${cert.recipientName}</strong>? This cannot be undone.`,
            header: 'Delete Certificate',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            acceptLabel: 'Delete',
            rejectLabel: 'Cancel',
            accept: () => {
                this.http.delete(`${environment.apiUrl}/Certificates/${cert.id}`).subscribe({
                    next: () => {
                        this.issuedCertificates = this.issuedCertificates.filter((c) => c.id !== cert.id);
                    },
                    error: (err) => {
                        console.error('Error deleting certificate:', err);
                    }
                });
            }
        });
    }

    viewCertificate(cert: CertificateRecord) {
        this.http.get(`${environment.apiUrl}/Certificates/${cert.id}/download`, { responseType: 'blob' }).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                window.open(url, '_blank');
            },
            error: (err) => {
                console.error('Error viewing certificate:', err);
            }
        });
    }

    downloadCertificate(cert: CertificateRecord) {
        this.http.get(`${environment.apiUrl}/Certificates/${cert.id}/download`, { responseType: 'blob' }).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Certificate_${cert.recipientName.replace(/ /g, '_')}.pdf`;
                a.click();
                window.URL.revokeObjectURL(url);
            },
            error: (err) => {
                console.error('Error downloading certificate:', err);
            }
        });
    }

    hasProfilePicture(url: string): boolean {
        return !!url && !isDefaultAvatar(url);
    }

    getProfilePictureUrl(url: string): string {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        const baseUrl = environment.apiUrl.replace(/\/api$/, '');
        return `${baseUrl}${url}`;
    }

    getUserInitials(user: any): string {
        return getInitials(`${user.firstName} ${user.lastName}`);
    }

    getTypeSeverity(type: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
        const map: Record<string, any> = {
            Participation: 'info',
            Volunteering: 'success',
            Speaker: 'warn',
            Achievement: 'contrast',
            Membership: 'secondary',
            Contribution: 'success'
        };
        return map[type] || 'info';
    }

    getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
        const map: Record<string, any> = {
            Issued: 'success',
            Pending: 'warn',
            Revoked: 'danger'
        };
        return map[status] || 'info';
    }

    get filteredUsers(): any[] {
        if (!this.userSearchQuery.trim()) return this.users;
        const q = this.userSearchQuery.toLowerCase();
        return this.users.filter(u =>
            u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
        );
    }

    getUserCerts(userId: string): CertificateRecord[] {
        return this.issuedCertificates.filter(c => c.recipientUserId === userId);
    }

    // ── Template management ──────────────────────────────────────────────────

    loadTemplates() {
        this.http.get<CertificateTemplate[]>(`${environment.apiUrl}/Certificates/templates`).subscribe({
            next: (data) => {
                this.templates = data;
                this.templateOptions = data.map((t) => ({ label: t.name, value: t.id }));
            },
            error: () => {
                this.templates = [];
                this.templateOptions = [];
            }
        });
    }

    triggerTemplateUpload() {
        this.templateFileInput.nativeElement.value = '';
        this.templateFileInput.nativeElement.click();
    }

    onTemplateFileSelected(event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const name = file.name.replace(/\.[^/.]+$/, '');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', name);

        this.uploadingTemplate = true;
        this.http.post<CertificateTemplate>(`${environment.apiUrl}/Certificates/templates`, formData).subscribe({
            next: (tmpl) => {
                this.templates = [tmpl, ...this.templates];
                this.templateOptions = [{ label: tmpl.name, value: tmpl.id }, ...this.templateOptions];
                this.uploadingTemplate = false;
            },
            error: (err) => {
                console.error('Error uploading template:', err);
                this.uploadingTemplate = false;
            }
        });
    }

    deleteTemplate(tmpl: CertificateTemplate) {
        this.confirmationService.confirm({
            message: `Delete template <strong>${tmpl.name}</strong>? This cannot be undone.`,
            header: 'Delete Template',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            acceptLabel: 'Delete',
            rejectLabel: 'Cancel',
            accept: () => {
                this.http.delete(`${environment.apiUrl}/Certificates/templates/${tmpl.id}`).subscribe({
                    next: () => {
                        this.templates = this.templates.filter((t) => t.id !== tmpl.id);
                        this.templateOptions = this.templateOptions.filter((o) => o.value !== tmpl.id);
                    },
                    error: (err) => console.error('Error deleting template:', err)
                });
            }
        });
    }

    getTemplatePreviewUrl(tmpl: CertificateTemplate): string {
        return `${environment.apiUrl.replace(/\/api$/, '')}${tmpl.previewPath}`;
    }

    get selectedField(): FieldBox | null {
        return this.fields.find(f => f.id === this.selectedFieldId) ?? null;
    }

    get drawingRect(): { x: number; y: number; width: number; height: number } {
        if (!this.drawing) return { x: 0, y: 0, width: 0, height: 0 };
        return {
            x: Math.min(this.drawing.startX, this.drawing.currentX),
            y: Math.min(this.drawing.startY, this.drawing.currentY),
            width: Math.abs(this.drawing.currentX - this.drawing.startX),
            height: Math.abs(this.drawing.currentY - this.drawing.startY),
        };
    }

    openLayoutEditor(tmpl: CertificateTemplate) {
        this.editingTemplate = tmpl;
        this.fields = [];
        this.selectedFieldId = null;
        this.activeFieldType = null;
        this.drawing = null;
        this.dragging = null;
        this.resizing = null;
        this.layoutEditorVisible = true;

        this.http.get<any>(`${environment.apiUrl}/Certificates/templates/${tmpl.id}/layout`).subscribe({
            next: (layout) => {
                if (!layout?.fields?.length || !this.editorCanvas) return;
                setTimeout(() => {
                    const canvas = this.editorCanvas?.nativeElement;
                    if (!canvas) return;
                    const cw = canvas.clientWidth;
                    const ch = canvas.clientHeight;
                    if (!cw || !ch) return;
                    this.fields = layout.fields.map((f: any) => {
                        const ft = this.FIELD_TYPES.find(t => t.key === f.key);
                        return {
                            id: crypto.randomUUID(),
                            key: f.key,
                            label: ft?.label ?? f.key,
                            color: ft?.color ?? '#3B82F6',
                            x: f.x * cw,
                            y: f.y * ch,
                            width: f.width * cw,
                            height: f.height * ch,
                        };
                    });
                    this.cdr.detectChanges();
                }, 150);
            },
            error: () => {} 
        });
    }

    onLayoutEditorHide() {
        this.stopGlobalListeners();
    }

    selectFieldType(key: string) {
        if (this.isFieldTypeUsed(key)) return;
        this.activeFieldType = this.activeFieldType === key ? null : key;
        this.selectedFieldId = null;
    }

    isFieldTypeUsed(key: string): boolean {
        return this.fields.some(f => f.key === key);
    }

    getFieldType(key: string | null) {
        return this.FIELD_TYPES.find(ft => ft.key === key) ?? null;
    }

    deleteSelectedField() {
        if (!this.selectedFieldId) return;
        this.fields = this.fields.filter(f => f.id !== this.selectedFieldId);
        this.selectedFieldId = null;
    }

    private getCanvasCoords(e: MouseEvent): { x: number; y: number } {
        const rect = this.editorCanvas.nativeElement.getBoundingClientRect();
        return {
            x: Math.max(0, Math.min(e.clientX - rect.left, rect.width)),
            y: Math.max(0, Math.min(e.clientY - rect.top, rect.height)),
        };
    }

    onCanvasMouseDown(e: MouseEvent) {
        if (!this.activeFieldType) return;
        e.preventDefault();
        const { x, y } = this.getCanvasCoords(e);
        this.drawing = { startX: x, startY: y, currentX: x, currentY: y };
        this.startGlobalListeners();
    }

    onFieldMouseDown(e: MouseEvent, field: FieldBox) {
        e.stopPropagation();
        e.preventDefault();
        this.selectedFieldId = field.id;
        this.activeFieldType = null;
        this.dragging = { fieldId: field.id, startMX: e.clientX, startMY: e.clientY, origX: field.x, origY: field.y };
        this.startGlobalListeners();
    }

    onResizeHandleMouseDown(e: MouseEvent, field: FieldBox, handle: string) {
        e.stopPropagation();
        e.preventDefault();
        this.selectedFieldId = field.id;
        this.resizing = { fieldId: field.id, handle, startMX: e.clientX, startMY: e.clientY, origBox: { ...field } };
        this.startGlobalListeners();
    }

    private onDocMouseMove = (e: MouseEvent) => {
        if (this.drawing) {
            const { x, y } = this.getCanvasCoords(e);
            this.drawing = { ...this.drawing, currentX: x, currentY: y };
        } else if (this.dragging) {
            const dx = e.clientX - this.dragging.startMX;
            const dy = e.clientY - this.dragging.startMY;
            const f = this.fields.find(f => f.id === this.dragging!.fieldId);
            if (f) {
                const bounds = this.editorCanvas.nativeElement.getBoundingClientRect();
                f.x = Math.max(0, Math.min(this.dragging.origX + dx, bounds.width - f.width));
                f.y = Math.max(0, Math.min(this.dragging.origY + dy, bounds.height - f.height));
                this.fields = [...this.fields];
            }
        } else if (this.resizing) {
            const dx = e.clientX - this.resizing.startMX;
            const dy = e.clientY - this.resizing.startMY;
            const ob = this.resizing.origBox;
            const f = this.fields.find(f => f.id === this.resizing!.fieldId);
            if (!f) return;
            const MIN = 30;
            switch (this.resizing.handle) {
                case 'br':
                    f.width  = Math.max(MIN, ob.width + dx);
                    f.height = Math.max(MIN, ob.height + dy);
                    break;
                case 'bl':
                    f.width  = Math.max(MIN, ob.width - dx);
                    f.x      = ob.x + ob.width - f.width;
                    f.height = Math.max(MIN, ob.height + dy);
                    break;
                case 'tr':
                    f.width  = Math.max(MIN, ob.width + dx);
                    f.height = Math.max(MIN, ob.height - dy);
                    f.y      = ob.y + ob.height - f.height;
                    break;
                case 'tl':
                    f.width  = Math.max(MIN, ob.width - dx);
                    f.x      = ob.x + ob.width - f.width;
                    f.height = Math.max(MIN, ob.height - dy);
                    f.y      = ob.y + ob.height - f.height;
                    break;
            }
            this.fields = [...this.fields];
        }
        this.cdr.detectChanges();
    };

    private onDocMouseUp = (_e: MouseEvent) => {
        if (this.drawing) {
            const rect = this.drawingRect;
            if (rect.width > 10 && rect.height > 10 && this.activeFieldType) {
                const ft = this.getFieldType(this.activeFieldType)!;
                this.fields = [...this.fields, {
                    id: crypto.randomUUID(),
                    key: ft.key,
                    label: ft.label,
                    x: rect.x,
                    y: rect.y,
                    width: rect.width,
                    height: rect.height,
                    color: ft.color,
                }];
                this.activeFieldType = null;
            }
            this.drawing = null;
        }
        this.dragging = null;
        this.resizing = null;
        this.stopGlobalListeners();
        this.cdr.detectChanges();
    };

    private startGlobalListeners() {
        this.stopGlobalListeners();
        document.addEventListener('mousemove', this.onDocMouseMove);
        document.addEventListener('mouseup', this.onDocMouseUp);
    }

    private stopGlobalListeners() {
        document.removeEventListener('mousemove', this.onDocMouseMove);
        document.removeEventListener('mouseup', this.onDocMouseUp);
    }

    saveLayout() {
        if (!this.editingTemplate || !this.editorCanvas) return;

        const canvas = this.editorCanvas.nativeElement;
        const cw = canvas.clientWidth;
        const ch = canvas.clientHeight;

        const payload = {
            canvasWidth: cw,
            canvasHeight: ch,
            fields: this.fields.map(f => ({
                key: f.key,
                x: f.x,
                y: f.y,
                width: f.width,
                height: f.height
            }))
        };

        this.http
            .put(`${environment.apiUrl}/Certificates/templates/${this.editingTemplate.id}/layout`, payload)
            .subscribe({
                next: () => { this.layoutEditorVisible = false; },
                error: (err) => { console.error('Error saving layout:', err); }
            });
    }

    ngOnDestroy() {
        this.stopGlobalListeners();
    }
}
