import { Component, OnInit, inject, computed, signal } from '@angular/core';
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
    `
})
export class CertBuilder implements OnInit {
    private http = inject(HttpClient);
    private authService = inject(AuthService);

    isAdmin = computed(() => {
        const user = this.authService.currentUser();
        return user?.roles?.includes('Admin') ?? false;
    });

    loading = true;
    dialogVisible = false;
    users: any[] = [];
    selectedRecipients: any[] = [];
    issuedCertificates: CertificateRecord[] = [];

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
        description: ''
    };

    ngOnInit() {
        this.loadUsers();
        this.loadCertificates();
        this.loadProjects();
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
            description: ''
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
            issuedDate: new Date().toISOString()
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
}
