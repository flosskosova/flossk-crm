import { Component, OnInit, inject, computed, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TableModule } from 'primeng/table';
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
import { MultiSelectModule } from 'primeng/multiselect';
import { environment } from '@environments/environment.prod';
import { AuthService, getInitials, isDefaultAvatar } from '@/pages/service/auth.service';

interface CertUser {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePictureUrl: string;
    roles: string[];
}

interface CertificateRecord {
    id: string;
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

@Component({
    selector: 'app-cert-builder',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
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
        MultiSelectModule
    ],
    template: `
        <!-- Issue Certificate Dialog -->
        <p-dialog
            [(visible)]="dialogVisible"
            [modal]="true"
            [style]="{width: '32rem'}"
            header="Issue Certificate"
            [draggable]="false"
            [resizable]="false"
        >
            <div class="flex flex-col gap-5 mt-2">
                <!-- Recipients -->
                <div class="flex flex-col gap-2">
                    <label class="font-semibold">Recipients</label>
                    <p-multiselect
                        [(ngModel)]="selectedRecipients"
                        [options]="users"
                        optionLabel="fullName"
                        placeholder="Select recipients"
                        [filter]="true"
                        filterPlaceholder="Search users..."
                        [showToggleAll]="true"
                        display="chip"
                        [style]="{ width: '100%' }"
                        appendTo="body"
                    >
                        <ng-template let-user #item>
                            <div class="flex items-center gap-2">
                                <p-avatar
                                    *ngIf="hasProfilePicture(user.profilePictureUrl)"
                                    [image]="getProfilePictureUrl(user.profilePictureUrl)"
                                    shape="circle"
                                    size="normal"
                                ></p-avatar>
                                <p-avatar
                                    *ngIf="!hasProfilePicture(user.profilePictureUrl)"
                                    [label]="getUserInitials(user)"
                                    shape="circle"
                                    size="normal"
                                    [style]="{ 'background-color': 'var(--primary-color)', 'color': 'var(--primary-color-text)' }"
                                ></p-avatar>
                                <span>{{ user.fullName }}</span>
                            </div>
                        </ng-template>
                    </p-multiselect>
                </div>

                <!-- Certificate Type -->
                <div class="flex flex-col gap-2">
                    <label class="font-semibold">Certificate Type</label>
                    <p-select
                        [(ngModel)]="certForm.type"
                        [options]="certificateTypes"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Select type"
                        [style]="{ width: '100%' }"
                        appendTo="body"
                    ></p-select>
                </div>

                <!-- Event -->
                <div class="flex flex-col gap-2">
                    <label class="font-semibold">Event / Project</label>
                    <p-select
                        [(ngModel)]="certForm.eventId"
                        [options]="projectsWithCustom"
                        optionLabel="title"
                        optionValue="id"
                        placeholder="Select a project / event"
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
                        <input pInputText [(ngModel)]="certForm.customEventTitle" placeholder="Enter custom event title..." class="mt-2" />
                    }
                </div>

                <!-- Description -->
                <div class="flex flex-col gap-2">
                    <label class="font-semibold">Description</label>
                    <textarea pTextarea [(ngModel)]="certForm.description" rows="3" placeholder="Certificate description or achievement details..."></textarea>
                </div>

                <!-- Template -->
                @if (templates.length > 0) {
                    <div class="flex flex-col gap-2">
                        <label class="font-semibold">Certificate Template <span class="font-normal text-muted-color">(optional)</span></label>
                        <p-select
                            [(ngModel)]="certForm.templateId"
                            [options]="templateOptions"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Use default design"
                            [showClear]="true"
                            [style]="{ width: '100%' }"
                            appendTo="body"
                        ></p-select>
                    </div>
                }

            </div>

            <ng-template #footer>
                <div class="flex justify-end gap-2">
                    <p-button label="Cancel" severity="secondary" (onClick)="dialogVisible = false" />
                    <p-button
                        label="Issue Certificate"
                        icon="pi pi-check"
                        (onClick)="issueCertificate()"
                        [disabled]="!canIssue()"
                    />
                </div>
            </ng-template>
        </p-dialog>

        <!-- Main Content -->
        <div class="card">
            <p-toolbar styleClass="mb-6">
                <ng-template #start>
                    <div class="flex items-center gap-2">
                        <span class="font-semibold text-xl">Certificates</span>
                    </div>
                </ng-template>
                <ng-template #end>
                    <p-button label="Issue Certificate" icon="pi pi-plus" (onClick)="openDialog()" />
                </ng-template>
            </p-toolbar>

            @if (loading) {
                <div class="flex flex-col gap-4">
                    @for (i of [1, 2, 3, 4, 5]; track i) {
                        <div class="flex items-center gap-4">
                            <p-skeleton width="12rem" height="1rem"></p-skeleton>
                            <p-skeleton width="15rem" height="1rem"></p-skeleton>
                            <p-skeleton width="10rem" height="1rem"></p-skeleton>
                            <p-skeleton width="8rem" height="1rem"></p-skeleton>
                            <p-skeleton width="6rem" height="1rem"></p-skeleton>
                        </div>
                    }
                </div>
            } @else {
                <p-table
                    #dt
                    [value]="issuedCertificates"
                    [paginator]="true"
                    [rows]="10"
                    [rowsPerPageOptions]="[5, 10, 25]"
                    [showCurrentPageReport]="true"
                    [rowHover]="true"
                    [globalFilterFields]="['recipientName', 'recipientEmail', 'certificateType', 'eventName']"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} certificates"
                    [tableStyle]="{ 'min-width': '60rem' }"
                >
                    <ng-template #caption>
                        <div class="flex items-center justify-between">
                            <span></span>
                            <p-iconfield>
                                <p-inputicon styleClass="pi pi-search" />
                                <input pInputText type="text" (input)="onGlobalFilter(dt, $event)" placeholder="Search certificates..." />
                            </p-iconfield>
                        </div>
                    </ng-template>

                    <ng-template #header>
                        <tr>
                            <th pSortableColumn="recipientName">Recipient <p-sortIcon field="recipientName" /></th>
                            <th pSortableColumn="certificateType">Type <p-sortIcon field="certificateType" /></th>
                            <th pSortableColumn="eventName">Event <p-sortIcon field="eventName" /></th>
                            <th pSortableColumn="issuedDate">Issued Date <p-sortIcon field="issuedDate" /></th>
                            <th pSortableColumn="status">Status <p-sortIcon field="status" /></th>
                            <th>Actions</th>
                        </tr>
                    </ng-template>

                    <ng-template #body let-cert>
                        <tr>
                            <td>
                                <div class="flex flex-col">
                                    <span class="font-medium">{{ cert.recipientName }}</span>
                                    <span class="text-sm text-muted-color">{{ cert.recipientEmail }}</span>
                                </div>
                            </td>
                            <td>
                                <p-tag [value]="cert.certificateType" [severity]="getTypeSeverity(cert.certificateType)" />
                            </td>
                            <td>{{ cert.eventName }}</td>
                            <td>{{ cert.issuedDate | date: 'mediumDate' }}</td>
                            <td>
                                <p-tag [value]="cert.status" [severity]="getStatusSeverity(cert.status)" />
                            </td>
                            <td>
                                <div class="flex gap-2">
                                    <p-button icon="pi pi-eye" [rounded]="true" [text]="true" severity="success" pTooltip="View" (onClick)="viewCertificate(cert)" />
                                    <p-button icon="pi pi-download" [rounded]="true" [text]="true" severity="info" pTooltip="Download" (onClick)="downloadCertificate(cert)" />
                                    <p-button icon="pi pi-envelope" [rounded]="true" [text]="true" severity="secondary" pTooltip="Resend Email" />
                                </div>
                            </td>
                        </tr>
                    </ng-template>

                    <ng-template #emptymessage>
                        <tr>
                            <td colspan="6" class="text-center py-8">
                                <div class="flex flex-col items-center gap-3 text-muted-color">
                                    <i class="pi pi-file text-4xl"></i>
                                    <span class="text-lg">No certificates issued yet</span>
                                </div>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
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
                                <div class="flex justify-end">
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
export class CertBuilder implements OnInit {
    private http = inject(HttpClient);
    private authService = inject(AuthService);

    @ViewChild('templateFileInput') templateFileInput!: ElementRef<HTMLInputElement>;

    isAdmin = computed(() => {
        const user = this.authService.currentUser();
        return user?.roles?.includes('Admin') ?? false;
    });

    loading = true;
    dialogVisible = false;
    users: any[] = [];
    selectedRecipients: any[] = [];
    issuedCertificates: CertificateRecord[] = [];
    templates: CertificateTemplate[] = [];
    templateOptions: { label: string; value: string }[] = [];
    uploadingTemplate = false;

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
        this.loadUsers();
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

    loadUsers() {
        this.http.get<any>(`${environment.apiUrl}/Auth/users?page=1&pageSize=200`).subscribe({
            next: (response) => {
                console.log('Cert builder users:', response);
                this.users = (response.users || []).map((u: any) => ({
                    ...u,
                    fullName: `${u.firstName} ${u.lastName}`
                }));
            },
            error: () => {
                this.users = [];
            }
        });
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

    openDialog() {
        this.selectedRecipients = [];
        this.certForm = {
            type: '',
            eventId: null,
            customEventTitle: '',
            description: '',
            templateId: null
        };
        this.dialogVisible = true;
    }

    canIssue(): boolean {
        const customValid = this.certForm.eventId !== this.CUSTOM_EVENT_ID || !!this.certForm.customEventTitle.trim();
        return this.selectedRecipients.length > 0 && !!this.certForm.type && customValid;
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

        const payload = {
            recipientUserIds: this.selectedRecipients.map((u) => u.id),
            type: this.certForm.type,
            eventName,
            description: this.certForm.description,
            issuedDate: new Date().toISOString(),
            templateId: this.certForm.templateId || null
        };

        this.http.post<CertificateRecord[]>(`${environment.apiUrl}/Certificates`, payload).subscribe({
            next: (certs) => {
                this.issuedCertificates = [...certs, ...this.issuedCertificates];
                this.dialogVisible = false;
            },
            error: (err) => {
                console.error('Error issuing certificates:', err);
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
        return `${environment.apiUrl}${url}`;
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

    onGlobalFilter(table: any, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
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
        if (!confirm(`Delete template "${tmpl.name}"?`)) return;
        this.http.delete(`${environment.apiUrl}/Certificates/templates/${tmpl.id}`).subscribe({
            next: () => {
                this.templates = this.templates.filter((t) => t.id !== tmpl.id);
                this.templateOptions = this.templateOptions.filter((o) => o.value !== tmpl.id);
            },
            error: (err) => console.error('Error deleting template:', err)
        });
    }

    getTemplatePreviewUrl(tmpl: CertificateTemplate): string {
        // previewPath is like /uploads/cert-templates/uuid.png, served as static files from API base
        return `${environment.apiUrl.replace(/\/api$/, '')}${tmpl.previewPath}`;
    }
}
