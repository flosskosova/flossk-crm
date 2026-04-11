import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { SkeletonModule } from 'primeng/skeleton';
import { ProjectsService } from '@/pages/service/projects.service';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';

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
    imports: [CommonModule, ButtonModule, TagModule, DialogModule, SkeletonModule, FullCalendarModule],
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
            
        </div>        </ng-container>
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
    isLoading = true;
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
        private projectsService: ProjectsService
    ) { }

    ngOnInit() {
        this.loadProjects();
    }

    private checkLoadingComplete() {
        if (this.projectsLoaded) {
            this.isLoading = false;
        }
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
