import { Component, ElementRef, ViewChild, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { StatsWidget } from './components/statswidget';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { PanelModule } from 'primeng/panel';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { SkeletonModule } from 'primeng/skeleton';
import SignaturePad from 'signature_pad';
import { CollaborationPadsService, CollaborationPad } from '@/pages/service/collaboration-pads.service';
import { MembershipRequestsService } from '@/pages/service/membership-requests.service';
import { ProjectsService } from '@/pages/service/projects.service';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';

interface JoinRequest {
    id: string;
    fullName: string;
    address: string;
    city: string;
    idCardNumber: string;
    email: string;
    phoneNumber: string;
    schoolOrCompany: string;
    statement: string;
    dateOfBirth: string;
    status: string;
    createdAt: string;
}

interface Pad {
    id: string;
    name: string;
    url: string;
    safeUrl?: SafeResourceUrl;
    description?: string;
    createdAt?: string;
}

interface Project {
    id: number;
    title: string;
    description: string;
    status: string;
    startDate: string;
    endDate: string;
    progress?: number;
}

interface ProjectDeadline {
    title: string;
    date: Date;
    status: string;
    description: string;
    projectId: number;
    type: 'start' | 'end';
}

@Component({
    selector: 'app-dashboard',
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, TagModule, DialogModule, DividerModule, InputTextModule, TextareaModule, PanelModule, ConfirmDialogModule, SkeletonModule, FullCalendarModule],
    providers: [ConfirmationService],
    styles: [`
        .calendar-container {
            padding: 1rem;
        }
        
        :host ::ng-deep .fc {
            font-family: inherit;
        }
        
        :host ::ng-deep .fc .fc-toolbar-title {
            font-size: 1.5rem;
            font-weight: 600;
        }
        
        :host ::ng-deep .fc .fc-button,
        :host ::ng-deep .fc .fc-button-primary {
            background-color: var(--primary-color) !important;
            border-color: var(--primary-color) !important;
            color: #ffffff !important;
            padding: 0.5rem 1rem;
            text-transform: capitalize;
        }
        
        :host ::ng-deep .fc .fc-button:hover:not(:disabled),
        :host ::ng-deep .fc .fc-button-primary:hover:not(:disabled),
        :host ::ng-deep .fc .fc-button:focus,
        :host ::ng-deep .fc .fc-button-primary:focus {
            background-color: var(--primary-color) !important;
            border-color: var(--primary-color) !important;
            color: #ffffff !important;
            opacity: 0.9;
            filter: brightness(0.92);
        }
        
        :host ::ng-deep .fc .fc-button:disabled {
            opacity: 0.6;
        }
        
        :host ::ng-deep .fc .fc-button-active,
        :host ::ng-deep .fc .fc-button-primary:not(:disabled).fc-button-active,
        :host ::ng-deep .fc .fc-button-primary:not(:disabled):active {
            background-color: var(--primary-color) !important;
            border-color: var(--primary-color) !important;
            color: #ffffff !important;
            opacity: 1;
            filter: brightness(0.85);
        }
        
        :host ::ng-deep .fc-daygrid-event {
            cursor: pointer;
            border-radius: 4px;
            padding: 2px 4px;
            margin: 2px 0;
        }
        
        :host ::ng-deep .fc-event-title {
            font-weight: 500;
        }
        
        :host ::ng-deep .fc-day-today {
            background-color: var(--primary-50) !important;
        }
        
        :host ::ng-deep .dark .fc-list-day-side-text,
        :host ::ng-deep [class*="dark"] .fc-list-day-side-text {
            color: #000000 !important;
        }

        ::ng-deep [class*="dark"] .fc-direction-ltr .fc-list-day-side-text, .fc-direction-rtl .fc-list-day-text {
            color: #000000 !important;
        }

        ::ng-deep [class*="dark"] .fc-list-day-text {
            color: #000000 !important;
        }

        ::ng-deep [class*="dark"] .fc-col-header-cell-cushion {
            color: #000000 !important;
        }
        
        @media (max-width: 768px) {
            :host ::ng-deep .fc-header-toolbar.fc-toolbar.fc-toolbar-ltr {
                display: flex;
                flex-direction: column;
                align-items: start;
                gap: 0.5rem;
                color: black !important;
            }
        }
    `],
    template: `   
        <p-confirmDialog />
        
        <!-- Loading Skeleton -->
        <div *ngIf="isLoading" class="grid grid-cols-12 gap-8">
            <div class="col-span-12">
                <div class="card">
                    <p-skeleton width="40%" height="2rem" styleClass="mb-4"></p-skeleton>
                    <p-skeleton width="60%" height="1rem" styleClass="mb-6"></p-skeleton>
                    <p-skeleton width="100%" height="4rem" styleClass="mb-4"></p-skeleton>
                    <p-skeleton width="100%" height="4rem"></p-skeleton>
                </div>
            </div>
            <div class="col-span-12">
                <div class="card">
                    <p-skeleton width="40%" height="2rem" styleClass="mb-4"></p-skeleton>
                    <p-skeleton width="60%" height="1rem" styleClass="mb-6"></p-skeleton>
                    <p-skeleton width="100%" height="3rem" styleClass="mb-2"></p-skeleton>
                    <p-skeleton width="100%" height="3rem" styleClass="mb-2"></p-skeleton>
                    <p-skeleton width="100%" height="3rem" styleClass="mb-2"></p-skeleton>
                    <p-skeleton width="100%" height="3rem"></p-skeleton>
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <ng-container *ngIf="!isLoading">
        <div class="grid grid-cols-12 gap-8">     
            
            <!-- Project Deadlines Calendar -->
            <div class="col-span-12">
                <div class="card">
                    <div class="flex justify-between items-center mb-6">
                        <div>
                            <h2 class="text-2xl font-semibold text-surface-900 dark:text-surface-0 m-0 mb-2">Project Deadlines</h2>
                            <p class="text-muted-color text-sm m-0">View all project milestones and deadlines in calendar format</p>
                        </div>
                        <p-tag *ngIf="calendarEvents.length > 0" [value]="calendarEvents.length + ' Events'" severity="info"></p-tag>
                    </div>
                    
                    <div *ngIf="calendarEvents.length === 0" class="flex flex-col items-center justify-center py-12">
                        <i class="pi pi-calendar text-5xl text-muted-color mb-4"></i>
                        <span class="text-muted-color text-lg">No project deadlines found</span>
                    </div>
                    
                    <div *ngIf="calendarEvents.length > 0" class="calendar-container">
                        <full-calendar [options]="calendarOptions"></full-calendar>
                    </div>
                </div>
            </div>
            
            <!-- Collaboration Pads Accordion -->
            <div class="col-span-12" *ngIf="pads.length > 0">
                <div class="card">
                    <div class="flex justify-between items-center mb-6">
                        <div>
                            <h2 class="text-2xl font-semibold text-surface-900 dark:text-surface-0 m-0 mb-2">Collaboration Pads</h2>
                            <p class="text-muted-color text-sm m-0">Manage and access your collaborative workspaces</p>
                        </div>
                    </div>
                    
                    <div *ngFor="let pad of pads; let i = index" class="mb-4">
                        <p-panel [header]="pad.name" [toggleable]="true" [collapsed]="true">
                            <div class="pt-4">
                                <div class="flex justify-between items-start mb-4">
                                    <div class="flex-1">
                                        <p class="text-muted-color text-sm m-0 mb-2">{{ pad.description || 'Collaborative workspace' }}</p>
                                        <small class="text-muted-color">Created: {{ pad.createdAt | date:'mediumDate' }}</small>
                                    </div>
                                    <div class="flex gap-2">
                                        <p-button 
                                            icon="pi pi-external-link" 
                                            [text]="true" 
                                            [rounded]="true" 
                                            size="small"
                                            severity="secondary" 
                                            pTooltip="Open in new tab"
                                            (onClick)="openPadInNewTab(pad.url)"
                                        />
                                        <p-button 
                                            icon="pi pi-pencil" 
                                            [text]="true" 
                                            [rounded]="true" 
                                            size="small"
                                            severity="info" 
                                            pTooltip="Edit pad"
                                            (onClick)="openEditPadDialog(pad)"
                                        />
                                        <p-button 
                                            icon="pi pi-trash" 
                                            [text]="true" 
                                            [rounded]="true" 
                                            size="small"
                                            severity="danger" 
                                            pTooltip="Delete pad"
                                            (onClick)="confirmDeletePad(pad)"
                                        />
                                    </div>
                                </div>
                                
                                <div class="border-2 border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden shadow-sm">
                                    <iframe 
                                        [src]="pad.safeUrl"
                                        width="100%" 
                                        height="600px" 
                                        frameborder="0"
                                        class="block"
                                        [title]="pad.name">
                                    </iframe>
                                </div>
                            </div>
                        </p-panel>
                    </div>
                </div>
            </div>
            
            <!-- Add Pad Button -->
            <div class="col-span-12" *ngIf="pads.length === 0">
                <div class="card text-center py-12">
                    <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-2">No Collaboration Pads</h3>
                    <p class="text-muted-color mb-4">Add your first collaboration pad to get started</p>
                    <p-button label="Add Pad" icon="pi pi-plus" (onClick)="openAddPadDialog()" />
                </div>
            </div>
            
            <!-- Floating Add Button (when pads exist) -->
            <div class="col-span-12" *ngIf="pads.length > 0">
                <div class="flex justify-center">
                    <p-button 
                        label="Add Pad" 
                        icon="pi pi-plus" 
                        severity="secondary" 
                        [outlined]="true"
                        (onClick)="openAddPadDialog()"
                    />
                </div>
            </div>
            
            <!-- Join Requests Section -->
            <div class="col-span-12">
                <div class="card">
                    <div class="flex justify-between items-center mb-6">
                        <div>
                            <h2 class="text-2xl font-semibold text-surface-900 dark:text-surface-0 m-0 mb-2">Membership Requests</h2>
                            <p class="text-muted-color text-sm m-0">Review and approve new member applications</p>
                        </div>
                        <p-tag *ngIf="joinRequests.length > 0" [value]="getPendingCount() + ' Pending'" severity="warn"></p-tag>
                    </div>
                    
                    <div *ngIf="joinRequests.length === 0" class="flex flex-col items-center justify-center py-12">
                        <i class="pi pi-inbox text-5xl text-muted-color mb-4"></i>
                        <span class="text-muted-color text-lg">No membership requests found</span>
                    </div>
                    
                    <p-table *ngIf="joinRequests.length > 0" [value]="joinRequests" [paginator]="true" [rows]="10" [tableStyle]="{ 'min-width': '60rem' }">
                        <ng-template #header>
                            <tr>
                                <th>Name</th>
                                <th>ID Number</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Submitted</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                        </ng-template>
                        <ng-template #body let-request>
                            <tr>
                                <td>
                                    <div class="font-semibold">{{ request.fullName }}</div>
                                </td>
                                <td>{{ request.idCardNumber }}</td>
                                <td>{{ request.email }}</td>
                                <td>{{ request.phoneNumber }}</td>
                                <td>{{ request.createdAt | date:'mediumDate' }}</td>
                                <td>
                                    <p-tag 
                                        [value]="request.status" 
                                        [severity]="getStatusSeverity(request.status)"
                                    ></p-tag>
                                </td>
                                <td>
                                    <div class="flex gap-2">
                                        <p-button 
                                            icon="pi pi-eye" 
                                            [text]="true" 
                                            [rounded]="true"
                                            severity="secondary"
                                            (onClick)="viewRequest(request)"
                                        ></p-button>
                                        <p-button 
                                            *ngIf="request.status?.toLowerCase() === 'approved'"
                                            icon="pi pi-download" 
                                            [text]="true" 
                                            [rounded]="true"
                                            severity="success"
                                            pTooltip="Download Application"
                                            (onClick)="downloadMembershipContract(request)"
                                        ></p-button>
                                    </div>
                                </td>
                            </tr>
                        </ng-template>
                    </p-table>
                </div>
            </div>
            
        </div>        </ng-container>        
        <!-- Add/Edit Pad Dialog -->
        <p-dialog [(visible)]="addPadDialogVisible" [header]="padDialogMode === 'add' ? 'Add Collaboration Pad' : 'Edit Collaboration Pad'" [modal]="true" [style]="{width: '40rem'}" [contentStyle]="{'max-height': '70vh', 'overflow': 'visible'}" appendTo="body">
            <div class="flex flex-col gap-4">
                <div>
                    <label for="padName" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Pad Name *</label>
                    <input 
                        pInputText 
                        id="padName" 
                        [(ngModel)]="newPad.name" 
                        placeholder="e.g., Meeting Notes, Project Planning"
                        class="w-full" 
                        required
                    />
                </div>
                
                <div>
                    <label for="padUrl" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">URL *</label>
                    <input 
                        pInputText 
                        id="padUrl" 
                        [(ngModel)]="newPad.url" 
                        placeholder="https://example.com/pad"
                        class="w-full" 
                        required
                    />
                    <small class="text-muted-color">Enter the full URL of the collaboration pad (e.g., Etherpad, Google Docs, etc.)</small>
                </div>
                
                <div>
                    <label for="padDescription" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Description</label>
                    <textarea 
                        pInputTextarea 
                        id="padDescription" 
                        [(ngModel)]="newPad.description" 
                        placeholder="Brief description of the pad's purpose"
                        [rows]="3" 
                        class="w-full"
                    ></textarea>
                </div>
                
                <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <div class="flex items-start gap-2">
                        <i class="pi pi-exclamation-triangle text-yellow-600 dark:text-yellow-400 mt-0.5"></i>
                        <div>
                            <p class="text-sm text-yellow-800 dark:text-yellow-200 font-medium mb-1">Important Note</p>
                            <p class="text-xs text-yellow-700 dark:text-yellow-300">
                                Some websites may not allow embedding in iframes due to security policies. 
                                If the pad doesn't load, try opening it in a new tab using the external link button.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="flex justify-end gap-2 mt-6">
                <p-button label="Cancel" severity="secondary" (onClick)="cancelPadDialog()" />
                <p-button [label]="padDialogMode === 'add' ? 'Add Pad' : 'Update Pad'" [disabled]="!newPad.name || !newPad.url" (onClick)="savePad()" />
            </div>
        </p-dialog>
        
        <!-- View Request Dialog -->
        <p-dialog [(visible)]="viewDialogVisible" [header]="selectedRequest ? selectedRequest.fullName : 'Request Details'" [modal]="true" [style]="{width: '50rem'}" appendTo="body">
            <div *ngIf="selectedRequest" class="flex flex-col gap-4">
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-6">
                        <label class="block text-muted-color text-sm mb-1">Full Name</label>
                        <div class="font-semibold text-surface-900 dark:text-surface-0">{{ selectedRequest.fullName }}</div>
                    </div>
                    
                    <div class="col-span-6">
                        <label class="block text-muted-color text-sm mb-1">Status</label>
                        <p-tag 
                            [value]="selectedRequest.status" 
                            [severity]="getStatusSeverity(selectedRequest.status)"
                        ></p-tag>
                    </div>
                </div>
                
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-6">
                        <label class="block text-muted-color text-sm mb-1">ID Card Number</label>
                        <div class="font-semibold text-surface-900 dark:text-surface-0">{{ selectedRequest.idCardNumber }}</div>
                    </div>
                    
                    <div class="col-span-6">
                        <label class="block text-muted-color text-sm mb-1">Date of Birth</label>
                        <div class="font-semibold text-surface-900 dark:text-surface-0">{{ selectedRequest.dateOfBirth | date:'mediumDate' }}</div>
                    </div>
                </div>
                
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-6">
                        <label class="block text-muted-color text-sm mb-1">Email</label>
                        <div class="font-semibold text-surface-900 dark:text-surface-0">{{ selectedRequest.email }}</div>
                    </div>
                    
                    <div class="col-span-6">
                        <label class="block text-muted-color text-sm mb-1">Phone Number</label>
                        <div class="font-semibold text-surface-900 dark:text-surface-0">{{ selectedRequest.phoneNumber }}</div>
                    </div>
                </div>
                
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-6">
                        <label class="block text-muted-color text-sm mb-1">Address</label>
                        <div class="font-semibold text-surface-900 dark:text-surface-0">{{ selectedRequest.address }}, {{ selectedRequest.city }}</div>
                    </div>
                    
                    <div class="col-span-6">
                        <label class="block text-muted-color text-sm mb-1">School/Company</label>
                        <div class="font-semibold text-surface-900 dark:text-surface-0">{{ selectedRequest.schoolOrCompany }}</div>
                    </div>
                </div>

                <div>
                    <label class="block text-muted-color text-sm mb-1">Submitted Date</label>
                    <div class="font-semibold text-surface-900 dark:text-surface-0">{{ selectedRequest.createdAt | date:'medium' }}</div>
                </div>
                                
                <div>
                    <label class="block text-muted-color text-sm mb-2">Statement</label>
                    <div class="text-surface-700 dark:text-surface-300 leading-relaxed p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
                        {{ selectedRequest.statement }}
                    </div>
                </div>
                
                <ng-container *ngIf="selectedRequest && selectedRequest.status.toLowerCase() === 'pending'">
                    <label for="boardMemberSignature" class="block font-bold">Board Member Signature:</label>
                    <div class="border-2 border-gray-300 rounded-lg bg-white">
                        <canvas 
                            #boardMemberCanvas
                            class="w-full" 
                            style="touch-action: none;">
                        </canvas>
                    </div>
                    <div class="">
                            <button 
                                pButton 
                                type="button" 
                                label="Clear" 
                                icon="pi pi-times"
                                (click)="clearBoardMemberSignature()"
                                class="p-button-sm p-button-outlined p-button-danger"></button>
                        </div>
                </ng-container>
            </div>
            
            <div class="flex justify-end gap-2 mt-6">
                <p-button label="Close" severity="secondary" (onClick)="viewDialogVisible = false" />
                <p-button 
                    *ngIf="selectedRequest?.status?.toLowerCase() === 'approved'"
                    label="View Contract" 
                    severity="info" 
                    icon="pi pi-file-pdf"
                    (onClick)="selectedRequest && viewMembershipContract(selectedRequest)" 
                />
                <p-button 
                    *ngIf="selectedRequest?.status?.toLowerCase() === 'pending'"
                    label="Reject" 
                    severity="danger" 
                    icon="pi pi-times"
                    (onClick)="selectedRequest && rejectRequest(selectedRequest)" 
                />
                <p-button 
                    *ngIf="selectedRequest?.status?.toLowerCase() === 'pending'"
                    label="Approve" 
                    severity="success" 
                    icon="pi pi-check"
                    [disabled]="isSignaturePadEmpty()"
                    (onClick)="selectedRequest && approveRequest(selectedRequest)" 
                />
            </div>
        </p-dialog>

        <!-- Project Event Details Dialog -->
        <p-dialog [(visible)]="eventDialogVisible" [modal]="true" [style]="{width: '40rem'}" appendTo="body">
            <div *ngIf="selectedEvent" class="flex flex-col gap-5">
                <!-- Event Title with Icon -->
                <div class="flex items-start gap-4">
                    <div class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center" 
                         [ngClass]="selectedEvent.type === 'start' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-orange-100 dark:bg-orange-900/30'">
                        <i [class]="selectedEvent.type === 'start' ? 'pi pi-play text-xl text-blue-600 dark:text-blue-400' : 'pi pi-flag text-xl text-orange-600 dark:text-orange-400'"></i>
                    </div>
                    <div class="flex-1">
                        <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 m-0 mb-2">{{ selectedEvent.title }}</h3>
                        <div class="flex flex-wrap items-center gap-2">
                            <p-tag [value]="selectedEvent.type === 'start' ? 'Start Date' : 'Deadline'" 
                                   [severity]="selectedEvent.type === 'start' ? 'info' : 'warn'" 
                                   [rounded]="true"></p-tag>
                            <p-tag [value]="selectedEvent.status" 
                                   [severity]="getProjectStatusSeverity(selectedEvent.status)"
                                   [rounded]="true"></p-tag>
                        </div>
                    </div>
                </div>
                
                <!-- Date -->
                <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-4">
                    <div class="flex items-center gap-3">
                        <i class="pi pi-calendar text-2xl text-surface-500"></i>
                        <div class="text-lg font-semibold text-surface-900 dark:text-surface-0">{{ selectedEvent.date | date:'fullDate' }}</div>
                    </div>
                </div>
                
                <!-- Description -->
                <div *ngIf="selectedEvent.description">
                    <div class="text-xs text-muted-color uppercase tracking-wide mb-2">Description</div>
                    <p class="text-surface-700 dark:text-surface-300 leading-relaxed m-0">{{ selectedEvent.description }}</p>
                </div>
            </div>
            
            <div class="flex justify-end gap-2 mt-6">
                <p-button label="Close" (onClick)="eventDialogVisible = false" />
            </div>
        </p-dialog>
    `
})
export class Dashboard implements OnInit {
    @ViewChild('boardMemberCanvas') boardMemberCanvas?: ElementRef<HTMLCanvasElement>;
    boardMemberSignaturePad!: SignaturePad;

    isLoading = true;
    private padsLoaded = false;
    private requestsLoaded = false;
    private projectsLoaded = false;

    projects: Project[] = [];
    projectDeadlines: ProjectDeadline[] = [];
    calendarEvents: EventInput[] = [];
    calendarOptions: CalendarOptions = {
        plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
        },
        buttonText: {
            today: 'Today',
            month: 'Month',
            week: 'Week',
            day: 'Day',
            list: 'List'
        },
        weekends: true,
        editable: false,
        selectable: true,
        selectMirror: true,
        dayMaxEvents: true,
        events: [],
        eventClick: this.handleEventClick.bind(this),
        height: 'auto'
    };

    viewDialogVisible = false;
    selectedRequest: JoinRequest | null = null;
    
    eventDialogVisible = false;
    selectedEvent: {
        title: string;
        date: Date;
        type: 'start' | 'end';
        status: string;
        description: string;
        projectId: number;
    } | null = null;

    constructor(
        private sanitizer: DomSanitizer,
        private confirmationService: ConfirmationService,
        private collaborationPadsService: CollaborationPadsService,
        private membershipRequestsService: MembershipRequestsService,
        private projectsService: ProjectsService
    ) {}

    ngOnInit() {
        this.loadPads();
        this.loadMembershipRequests();
        this.loadProjects();
    }

    private checkLoadingComplete() {
        if (this.padsLoaded && this.requestsLoaded && this.projectsLoaded) {
            this.isLoading = false;
        }
    }

    loadMembershipRequests() {
        this.membershipRequestsService.getAll(1, 50).subscribe({
            next: (response: any) => {
                console.log('MembershipRequests API response:', response);
                // API returns { requests: [...], totalCount, page, pageSize }
                const requestsArray = response.requests || response.items || [];
                this.joinRequests = requestsArray.map((req: any) => ({
                    id: req.id,
                    fullName: req.fullName,
                    address: req.address,
                    city: req.city,
                    idCardNumber: req.idCardNumber || '',
                    email: req.email,
                    phoneNumber: req.phoneNumber,
                    schoolOrCompany: req.schoolOrCompany,
                    statement: req.statement,
                    dateOfBirth: req.dateOfBirth,
                    status: req.status,
                    createdAt: req.createdAt
                }));
                this.requestsLoaded = true;
                this.checkLoadingComplete();
            },
            error: (err) => {
                console.error('Failed to load membership requests:', err);
                this.requestsLoaded = true;
                this.checkLoadingComplete();
            }
        });
    }

    loadPads() {
        this.collaborationPadsService.getAll(1, 50).subscribe({
            next: (response: any) => {
                console.log('CollaborationPads API response:', response);
                // API returns { collaborationPads: [...], totalCount, page, pageSize }
                const padsArray = response.collaborationPads || response.items || [];
                this.pads = padsArray.map((pad: any) => ({
                    id: pad.id,
                    name: pad.name,
                    url: pad.url,
                    description: pad.description,
                    createdAt: pad.createdAt,
                    safeUrl: this.getSafeUrl(pad.url)
                }));
                this.padsLoaded = true;
                this.checkLoadingComplete();
            },
            error: (err) => {
                console.error('Failed to load pads:', err);
                this.padsLoaded = true;
                this.checkLoadingComplete();
            }
        });
    }

    initializeSignaturePad() {
        // Wait for the canvas to be rendered
        setTimeout(() => {
            if (this.boardMemberCanvas?.nativeElement) {
                this.boardMemberSignaturePad = new SignaturePad(this.boardMemberCanvas.nativeElement, {
                    backgroundColor: 'rgb(255, 255, 255)',
                    penColor: 'rgb(0, 0, 0)'
                });
                this.resizeCanvas(this.boardMemberCanvas.nativeElement);
            }
        }, 100);
    }

    resizeCanvas(canvas: HTMLCanvasElement) {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = 90 * ratio;
        canvas.getContext('2d')!.scale(ratio, ratio);
    }

    // Pad-related properties
    addPadDialogVisible = false;
    padDialogMode: 'add' | 'edit' = 'add';
    currentEditingPad: Pad | null = null;
    pads: Pad[] = [];
    newPad: Omit<Pad, 'id' | 'createdAt'> = {
        name: '',
        url: '',
        description: ''
    };

    joinRequests: JoinRequest[] = [];

    getSafeUrl(url: string): SafeResourceUrl {
        return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }

    getPendingCount(): number {
        return this.joinRequests.filter(r => r.status?.toLowerCase() === 'pending').length;
    }

    getStatusSeverity(status: string): 'success' | 'warn' | 'danger' {
        switch (status?.toLowerCase()) {
            case 'approved': return 'success';
            case 'pending': return 'warn';
            case 'rejected': return 'danger';
            default: return 'warn';
        }
    }

    viewRequest(request: JoinRequest) {
        this.selectedRequest = request;
        this.viewDialogVisible = true;
        // Initialize signature pad when opening dialog for pending requests
        if (request.status?.toLowerCase() === 'pending') {
            this.initializeSignaturePad();
        }
    }

    approveRequest(request: JoinRequest) {
        if (!this.boardMemberSignaturePad || this.boardMemberSignaturePad.isEmpty()) {
            return;
        }

        const signatureDataUrl = this.boardMemberSignaturePad.toDataURL('image/png');
        
        // Convert base64 to blob
        fetch(signatureDataUrl)
            .then(res => res.blob())
            .then(signatureBlob => {
                const formData = new FormData();
                formData.append('BoardMemberSignature', signatureBlob, 'signature.png');

                this.membershipRequestsService.approve(request.id, formData).subscribe({
                    next: () => {
                        this.viewDialogVisible = false;
                        this.loadMembershipRequests();
                    },
                    error: (err) => {
                        console.error('Failed to approve request:', err);
                    }
                });
            });
    }

    rejectRequest(request: JoinRequest) {
        this.membershipRequestsService.reject(request.id).subscribe({
            next: () => {
                this.viewDialogVisible = false;
                this.loadMembershipRequests();
            },
            error: (err) => {
                console.error('Failed to reject request:', err);
            }
        });
    }

    downloadMembershipContract(request: JoinRequest) {
        this.membershipRequestsService.download(request.id).subscribe({
            next: (blob: Blob) => {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `membership-request-${request.fullName.replace(/\s+/g, '-')}.pdf`;
                link.click();
                window.URL.revokeObjectURL(url);
            },
            error: (err: any) => {
                console.error('Failed to download request:', err);
            }
        });
    }

    viewMembershipContract(request: JoinRequest) {
        this.membershipRequestsService.download(request.id).subscribe({
            next: (blob: Blob) => {
                const url = window.URL.createObjectURL(blob);
                window.open(url, '_blank');
            },
            error: (err: any) => {
                console.error('Failed to view contract:', err);
            }
        });
    }

    // Pad management methods
    openAddPadDialog() {
        this.padDialogMode = 'add';
        this.currentEditingPad = null;
        this.newPad = {
            name: '',
            url: '',
            description: ''
        };
        this.addPadDialogVisible = true;
    }

    openEditPadDialog(pad: Pad) {
        this.padDialogMode = 'edit';
        this.currentEditingPad = pad;
        this.newPad = {
            name: pad.name,
            url: pad.url,
            description: pad.description || ''
        };
        this.addPadDialogVisible = true;
    }

    clearBoardMemberSignature() {
        this.boardMemberSignaturePad.clear();
    }

    isSignaturePadEmpty(): boolean {
        return !this.boardMemberSignaturePad || this.boardMemberSignaturePad.isEmpty();
    }

    cancelPadDialog() {
        this.closePadDialog();
    }

    confirmDeletePad(pad: Pad) {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete the pad "${pad.name}"?`,
            header: 'Delete Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.removePad(pad);
            }
        });
    }

    savePad() {
        if (!this.newPad.name || !this.newPad.url) {
            return;
        }

        // Ensure URL has proper protocol
        let url = this.newPad.url.trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        const padData = {
            name: this.newPad.name.trim(),
            url: url,
            description: this.newPad.description?.trim() || ''
        };

        if (this.padDialogMode === 'add') {
            this.collaborationPadsService.create(padData).subscribe({
                next: () => {
                    this.loadPads();
                    this.closePadDialog();
                },
                error: (err) => {
                    console.error('Failed to create pad:', err);
                }
            });
        } else if (this.padDialogMode === 'edit' && this.currentEditingPad) {
            this.collaborationPadsService.update(this.currentEditingPad.id, padData).subscribe({
                next: () => {
                    this.loadPads();
                    this.closePadDialog();
                },
                error: (err) => {
                    console.error('Failed to update pad:', err);
                }
            });
        }
    }

    closePadDialog() {
        this.addPadDialogVisible = false;
        this.padDialogMode = 'add';
        this.currentEditingPad = null;
        this.newPad = {
            name: '',
            url: '',
            description: ''
        };
    }

    removePad(pad: Pad) {
        this.collaborationPadsService.delete(pad.id).subscribe({
            next: () => {
                this.loadPads();
            },
            error: (err) => {
                console.error('Failed to delete pad:', err);
            }
        });
    }

    openPadInNewTab(url: string) {
        window.open(url, '_blank');
    }

    loadProjects() {
        this.projectsService.getProjects().subscribe({
            next: (response: any) => {
                console.log('Projects API response:', response);
                // Handle both array response and paginated response
                const projectsArray = Array.isArray(response) ? response : (response.projects || response.items || []);
                this.projects = projectsArray;
                this.generateProjectDeadlines();
                this.projectsLoaded = true;
                this.checkLoadingComplete();
            },
            error: (err) => {
                console.error('Failed to load projects:', err);
                this.projectsLoaded = true;
                this.checkLoadingComplete();
            }
        });
    }

    generateProjectDeadlines() {
        const deadlines: ProjectDeadline[] = [];
        const events: EventInput[] = [];
        
        this.projects.forEach(project => {
            // Add start date as a deadline event
            if (project.startDate) {
                const startDeadline = {
                    title: project.title,
                    date: new Date(project.startDate),
                    status: project.status,
                    description: project.description || 'No description provided',
                    projectId: project.id,
                    type: 'start' as const
                };
                deadlines.push(startDeadline);
                
                // Add to calendar events
                events.push({
                    id: `start-${project.id}`,
                    title: `▶ ${project.title}`,
                    start: project.startDate,
                    backgroundColor: '#3b82f6',
                    borderColor: '#2563eb',
                    extendedProps: {
                        type: 'start',
                        description: project.description,
                        status: project.status,
                        projectId: project.id
                    }
                });
            }
            
            // Add end date as a deadline event
            if (project.endDate) {
                const endDeadline = {
                    title: project.title,
                    date: new Date(project.endDate),
                    status: project.status,
                    description: project.description || 'No description provided',
                    projectId: project.id,
                    type: 'end' as const
                };
                deadlines.push(endDeadline);
                
                // Determine color based on whether deadline has passed
                const today = new Date();
                const endDate = new Date(project.endDate);
                const isOverdue = endDate < today && project.status.toLowerCase() !== 'completed';
                
                // Add to calendar events
                events.push({
                    id: `end-${project.id}`,
                    title: `🏁 ${project.title}`,
                    start: project.endDate,
                    backgroundColor: isOverdue ? '#ef4444' : '#f97316',
                    borderColor: isOverdue ? '#dc2626' : '#ea580c',
                    extendedProps: {
                        type: 'end',
                        description: project.description,
                        status: project.status,
                        projectId: project.id
                    }
                });
            }
        });
        
        // Sort deadlines by date (ascending)
        this.projectDeadlines = deadlines.sort((a, b) => a.date.getTime() - b.date.getTime());
        
        // Update calendar events
        this.calendarEvents = events;
        this.calendarOptions = {
            ...this.calendarOptions,
            events: events
        };
    }

    getDeadlineMarkerClass(event: ProjectDeadline): string {
        const today = new Date();
        const eventDate = new Date(event.date);
        
        // Check if deadline has passed
        if (eventDate < today && event.type === 'end') {
            return 'bg-red-500';
        }
        
        // Color based on event type
        if (event.type === 'start') {
            return 'bg-blue-500';
        } else {
            return 'bg-orange-500';
        }
    }

    getProjectStatusSeverity(status: string): 'success' | 'warn' | 'info' | 'danger' {
        switch (status?.toLowerCase()) {
            case 'completed': return 'success';
            case 'in-progress': return 'info';
            case 'upcoming': return 'warn';
            default: return 'info';
        }
    }

    handleEventClick(clickInfo: any) {
        const event = clickInfo.event;
        const props = event.extendedProps;
        
        // Remove emoji from title
        const cleanTitle = event.title.replace(/^[\u{1F3C1}\u{25B6}]\s*/u, '');
        
        this.selectedEvent = {
            title: cleanTitle,
            date: event.start || new Date(),
            type: props.type,
            status: props.status,
            description: props.description || 'No description provided',
            projectId: props.projectId
        };
        
        this.eventDialogVisible = true;
    }
}
