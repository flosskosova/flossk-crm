import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { isSameDay, isSameMonth } from 'date-fns';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { CreateEventPayload, EventsService, EventDto, RecurringTypeValue, UpdateEventPayload } from '@/pages/service/events.service';
import { EventColor } from 'calendar-utils';
import {
    CalendarDatePipe,
    CalendarDayViewComponent,
    CalendarEvent,
    CalendarEventTimesChangedEvent,
    CalendarMonthViewComponent,
    CalendarMonthViewDay,
    CalendarNextViewDirective,
    CalendarPreviousViewDirective,
    CalendarTodayDirective,
    CalendarView,
    CalendarWeekViewComponent,
    DateAdapter,
    provideCalendar
} from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';

interface DashboardEventMeta {
    eventId: string;
    projectId?: string | null;
    isRecurring: boolean;
}

interface EventEditDraft {
    eventName: string;
    startDate: Date | null;
    endDate: Date | null;
    isRecurring: boolean;
    recurringDateTime: Date | null;
    recurringType: RecurringSelection | null;
    projectId: string | null;
}

type RecurringSelection = Exclude<RecurringTypeValue, 'None'>;

const colors: {
    project: EventColor;
    general: EventColor;
} = {
    project: {
        primary: '#2563eb',
        secondary: '#dbeafe'
    },
    general: {
        primary: '#ea580c',
        secondary: '#ffedd5'
    }
};

@Component({
    selector: 'app-dashboard',
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
        TagModule,
        SkeletonModule,
        TableModule,
        DialogModule,
        InputTextModule,
        DatePickerModule,
        CheckboxModule,
        ButtonModule,
        SelectModule,
        CalendarPreviousViewDirective,
        CalendarTodayDirective,
        CalendarNextViewDirective,
        CalendarMonthViewComponent,
        CalendarWeekViewComponent,
        CalendarDayViewComponent,
        CalendarDatePipe
    ],
    providers: [
        provideCalendar({
            provide: DateAdapter,
            useFactory: adapterFactory
        })
    ],
    styles: [
        `
            .calendar-container {
                padding: 1rem;
            }

            .calendar-toolbar {
                border: 1px solid var(--surface-200);
                border-radius: 0.75rem;
                padding: 0.75rem;
                margin-bottom: 1rem;
            }

            .btn-group {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                flex-wrap: wrap;
            }

            .nav-btn-group {
                border: 1px solid var(--primary-color);
                border-radius: 0.65rem;
                padding: 0.25rem;
                gap: 0.35rem;
            }

            .calendar-button-groups {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 1rem;
                flex-wrap: wrap;
            }

            .calendar-title-col {
                display: flex;
                justify-content: center;
                align-items: center;
            }

            .calendar-title-col h3 {
                margin: 0;
                text-align: center;
            }

            .calendar-nav-button,
            .calendar-view-button {
                border: 1px solid var(--surface-300);
                border-radius: 0.5rem;
                background: var(--surface-0);
                color: var(--text-color);
                padding: 0.4rem 0.75rem;
                font-weight: 600;
                cursor: pointer;
            }

            .calendar-nav-button:hover,
            .calendar-view-button:hover {
                border-color: var(--primary-color);
            }

            .nav-btn-group .calendar-nav-button {
                border-color: transparent;
            }

            .nav-btn-group .calendar-nav-button:hover {
                background: var(--primary-color);
                border-color: var(--primary-color);
                color: #ffffff;
            }

            .calendar-view-button.active {
                background: var(--primary-color);
                border-color: var(--primary-color);
                color: #ffffff;
            }

            :host ::ng-deep .cal-month-view .cal-day-cell.cal-today,
            :host ::ng-deep .cal-week-view .cal-day-headers .cal-header.cal-today {
                background-color: var(--primary-50);
            }

            :host ::ng-deep .cal-month-view .cal-day-cell {
                min-height: 7rem;
            }

            :host ::ng-deep .cal-event {
                border-radius: 0.4rem;
                padding: 0.15rem 0.35rem;
                font-weight: 600;
                cursor: pointer;
            }

            :host ::ng-deep .cal-event-title {
                white-space: normal;
            }

            :host ::ng-deep .cal-month-view .cal-open-day-events,
            :host ::ng-deep .cal-week-view .cal-time-events {
                border: 1px solid var(--surface-200);
                background: var(--surface-0);
                color: var(--text-color) !important;
            }

            :host ::ng-deep .cal-month-view .cal-open-day-events .cal-event {
                background: var(--surface-100);
                color: var(--text-color) !important;
            }

            :host ::ng-deep .cal-month-view .cal-open-day-events .cal-event:hover {
                background: var(--surface-200);
            }

            :host ::ng-deep .cal-month-view .cal-open-day-events .cal-event-title,
            :host ::ng-deep .cal-month-view .cal-open-day-events .cal-event-title a,
            :host ::ng-deep .cal-month-view .cal-open-day-events .cal-event-action,
            :host ::ng-deep .cal-month-view .cal-open-day-events .cal-day-heading,
            :host ::ng-deep .cal-month-view .cal-open-day-events .cal-day-number {
                color: var(--text-color) !important;
            }

            .event-table-wrapper {
                margin-top: 1.5rem;
                border: 1px solid var(--surface-200);
                border-radius: 0.75rem;
                overflow: hidden;
            }

            .event-table-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 0.75rem;
                padding: 0.9rem 1rem;
                border-bottom: 1px solid var(--surface-200);
                background: var(--surface-50);
            }

            .event-table-header h4 {
                margin: 0;
            }

            .event-table-meta {
                display: flex;
                align-items: center;
                gap: 0.6rem;
            }

            .dashboard-actions {
                display: flex;
                justify-content: flex-end;
                margin-bottom: 0.75rem;
            }

            :host ::ng-deep .event-prime-table .p-datatable-table {
                min-width: 42rem;
            }

            :host ::ng-deep .event-prime-table .p-datatable-thead > tr > th,
            :host ::ng-deep .event-prime-table .p-datatable-tbody > tr > td {
                padding: 0.75rem 1rem;
                border-bottom: 1px solid var(--surface-200);
                vertical-align: middle;
            }

            :host ::ng-deep .event-prime-table .p-datatable-thead > tr > th {
                text-align: left;
                background: var(--surface-0);
            }

            :host ::ng-deep .event-prime-table .p-datatable-tbody > tr:last-child > td {
                border-bottom: none;
            }

            .table-actions {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                flex-wrap: wrap;
            }

            .table-action {
                border: 1px solid var(--surface-300);
                border-radius: 0.45rem;
                background: var(--surface-0);
                color: var(--text-color);
                padding: 0.3rem 0.6rem;
                font-size: 0.85rem;
                font-weight: 600;
                cursor: pointer;
            }

            .table-action:hover {
                border-color: var(--primary-color);
            }

            .table-action.delete {
                border-color: #ef4444;
                color: #b91c1c;
            }

            .table-action.delete:hover {
                background: #fef2f2;
            }

            .project-link {
                color: var(--primary-color);
                text-decoration: none;
                font-weight: 600;
            }

            .project-link:hover {
                text-decoration: underline;
            }

            .event-edit-title {
                margin-bottom: 0.75rem;
                font-weight: 700;
            }

            .event-edit-grid {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
            }

            .event-edit-field {
                display: flex;
                flex-direction: column;
                gap: 0.35rem;
            }

            .event-edit-field input[type='text'],
            .event-edit-field input[type='date'] {
                border: 1px solid var(--surface-300);
                border-radius: 0.45rem;
                padding: 0.45rem 0.55rem;
                background: var(--surface-0);
                color: var(--text-color);
            }

            :host ::ng-deep .event-edit-field .p-inputtext,
            :host ::ng-deep .event-edit-field .p-datepicker,
            :host ::ng-deep .event-edit-field .p-select {
                width: 100%;
            }

            .event-edit-field.checkbox-field {
                flex-direction: row;
                align-items: center;
                margin-top: 0;
            }

            .event-edit-actions {
                margin-top: 1rem;
                display: flex;
                justify-content: flex-end;
                gap: 0.5rem;
            }

            .event-action-error {
                margin: 0.75rem 1rem;
                border: 1px solid #fecaca;
                border-radius: 0.5rem;
                background: #fef2f2;
                color: #991b1b;
                padding: 0.55rem 0.7rem;
                font-size: 0.9rem;
            }

            @media (max-width: 768px) {
                .calendar-toolbar {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 0.75rem;
                }

                .calendar-button-groups {
                    justify-content: flex-start;
                }
            }
        `
    ],
    template: `
        <div *ngIf="isLoading" class="grid grid-cols-12 gap-8">
            <div class="col-span-12">
                <div class="card">
                    <p-skeleton width="40%" height="2rem" styleClass="mb-4"></p-skeleton>
                    <p-skeleton width="100%" height="4rem" styleClass="mb-4"></p-skeleton>
                    <p-skeleton width="100%" height="24rem"></p-skeleton>
                </div>
            </div>
        </div>

        <ng-container *ngIf="!isLoading">
            <div class="card">
                <div class="dashboard-actions">
                    <p-button label="Add Event" icon="pi pi-plus" (onClick)="openCreate()" />
                </div>

                <div *ngIf="events.length === 0" class="flex flex-col items-center justify-center py-12">
                    <i class="pi pi-calendar text-5xl text-muted-color mb-4"></i>
                    <span class="text-muted-color text-lg">No events found</span>
                </div>

                <div *ngIf="events.length > 0" class="calendar-container">
                    <div class="calendar-toolbar row align-items-center">
                        <div class="col-md-6 calendar-title-col mb-3">
                            <h3>{{ viewDate | calendarDate:(view + 'ViewTitle'):'en' }}</h3>
                        </div>

                        <div class="col-md-6">
                            <div class="calendar-button-groups">
                                <div class="btn-group">
                                    <button
                                        type="button"
                                        class="calendar-view-button"
                                        (click)="setView(CalendarView.Month)"
                                        [class.active]="view === CalendarView.Month"
                                    >
                                        Month
                                    </button>
                                    <button
                                        type="button"
                                        class="calendar-view-button"
                                        (click)="setView(CalendarView.Week)"
                                        [class.active]="view === CalendarView.Week"
                                    >
                                        Week
                                    </button>
                                    <button
                                        type="button"
                                        class="calendar-view-button"
                                        (click)="setView(CalendarView.Day)"
                                        [class.active]="view === CalendarView.Day"
                                    >
                                        Day
                                    </button>
                                </div>

                                <div class="btn-group nav-btn-group">
                                    <button
                                        type="button"
                                        class="calendar-nav-button"
                                        mwlCalendarPreviousView
                                        [view]="view"
                                        [(viewDate)]="viewDate"
                                        (viewDateChange)="closeOpenMonthViewDay()"
                                    >
                                        Previous
                                    </button>
                                    <button type="button" class="calendar-nav-button" mwlCalendarToday [(viewDate)]="viewDate">
                                        Today
                                    </button>
                                    <button
                                        type="button"
                                        class="calendar-nav-button"
                                        mwlCalendarNextView
                                        [view]="view"
                                        [(viewDate)]="viewDate"
                                        (viewDateChange)="closeOpenMonthViewDay()"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        @switch (view) {
                            @case (CalendarView.Month) {
                                <mwl-calendar-month-view
                                    [viewDate]="viewDate"
                                    [events]="monthEvents"
                                    [refresh]="refresh"
                                    [activeDayIsOpen]="activeDayIsOpen"
                                    (dayClicked)="dayClicked($event.day)"
                                    (eventClicked)="eventClicked($event.event)"
                                    (eventTimesChanged)="eventTimesChanged($event)"
                                />
                            }
                            @case (CalendarView.Week) {
                                <mwl-calendar-week-view
                                    [viewDate]="viewDate"
                                    [events]="events"
                                    [refresh]="refresh"
                                    (eventClicked)="eventClicked($event.event)"
                                    (eventTimesChanged)="eventTimesChanged($event)"
                                />
                            }
                            @case (CalendarView.Day) {
                                <mwl-calendar-day-view
                                    [viewDate]="viewDate"
                                    [events]="events"
                                    [refresh]="refresh"
                                    (eventClicked)="eventClicked($event.event)"
                                    (eventTimesChanged)="eventTimesChanged($event)"
                                />
                            }
                        }
                    </div>

                    <div class="event-table-wrapper">
                        <div class="event-table-header">
                            <h4>All Events</h4>
                            <div class="event-table-meta">
                                <span class="text-muted-color">{{ eventRows.length }} total</span>
                            </div>
                        </div>

                        <div *ngIf="actionErrorMessage" class="event-action-error">{{ actionErrorMessage }}</div>

                        <p-table [value]="eventRows" styleClass="event-prime-table" [scrollable]="true" scrollHeight="flex">
                            <ng-template pTemplate="header">
                                <tr>
                                    <th>Event</th>
                                    <th>Date</th>
                                    <th>Recurring</th>
                                    <th>Project</th>
                                    <th>Actions</th>
                                </tr>
                            </ng-template>
                            <ng-template pTemplate="body" let-event>
                                <tr>
                                    <td>{{ event.eventName }}</td>
                                    <td>{{ formatEventDateLabel(event) }}</td>
                                    <td>{{ isRecurringEvent(event) ? 'Yes' : 'No' }}</td>
                                    <td>
                                        <a *ngIf="event.projectId" [routerLink]="['/dashboard/projects', event.projectId]" class="project-link">
                                            {{ event.projectTitle || 'View project' }}
                                        </a>
                                        <span *ngIf="!event.projectId" class="text-muted-color">-</span>
                                    </td>
                                    <td>
                                        <div class="table-actions">
                                            <button type="button" class="table-action" (click)="openEdit(event)">Edit</button>
                                            <button type="button" class="table-action delete" (click)="deleteEvent(event)">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            </ng-template>
                        </p-table>

                    </div>
                </div>
            </div>

            <p-dialog
                [header]="editingEvent ? 'Edit Event' : 'Add Event'"
                [(visible)]="isEditModalVisible"
                [modal]="true"
                [closable]="!isSaving"
                [style]="{ width: '42rem' }"
                [contentStyle]="{ overflow: 'visible' }"
                [draggable]="false"
                [resizable]="false"
                (onHide)="cancelEdit()"
            >
                <ng-container *ngIf="isEditModalVisible">
                    <div class="event-edit-grid">
                        <label class="event-edit-field">
                            <span>Event Name</span>
                            <input pInputText type="text" [(ngModel)]="editDraft.eventName" />
                        </label>

                        <ng-container *ngIf="!editDraft.isRecurring">
                            <label class="event-edit-field">
                                <span>Start Date</span>
                                <p-datepicker
                                    [(ngModel)]="editDraft.startDate"
                                    dateFormat="yy-mm-dd"
                                    [showIcon]="true"
                                    [showButtonBar]="true"
                                    appendTo="body"
                                />
                            </label>

                            <label class="event-edit-field">
                                <span>End Date</span>
                                <p-datepicker
                                    [(ngModel)]="editDraft.endDate"
                                    dateFormat="yy-mm-dd"
                                    [showIcon]="true"
                                    [showButtonBar]="true"
                                    appendTo="body"
                                />
                            </label>
                        </ng-container>

                        <div class="event-edit-field checkbox-field">
                            <p-checkbox
                                inputId="event-recurring"
                                [(ngModel)]="editDraft.isRecurring"
                                [binary]="true"
                                (ngModelChange)="onRecurringToggle($event)"
                            />
                            <label for="event-recurring">Recurring Event</label>
                        </div>

                        <ng-container *ngIf="editDraft.isRecurring">
                            <label class="event-edit-field">
                                <span>Recurring Date & Time</span>
                                <p-datepicker
                                    [(ngModel)]="editDraft.recurringDateTime"
                                    dateFormat="yy-mm-dd"
                                    [showTime]="true"
                                    hourFormat="24"
                                    [showIcon]="true"
                                    [showButtonBar]="true"
                                    appendTo="body"
                                    (ngModelChange)="onRecurringDateTimeChange($event)"
                                />
                            </label>

                            <label class="event-edit-field">
                                <span>Recurring Type</span>
                                <p-select
                                    [(ngModel)]="editDraft.recurringType"
                                    [options]="recurringTypeOptions"
                                    optionLabel="label"
                                    optionValue="value"
                                    placeholder="Select recurring type"
                                    appendTo="body"
                                />
                            </label>
                        </ng-container>
                    </div>

                    <div class="event-edit-actions">
                        <p-button label="Cancel" severity="secondary" (onClick)="cancelEdit()" [disabled]="isSaving" />
                        <p-button
                            [label]="isSaving ? (editingEvent ? 'Saving...' : 'Creating...') : (editingEvent ? 'Save' : 'Create')"
                            (onClick)="saveEvent()"
                            [disabled]="isSaving || !isEditDraftValid()"
                        />
                    </div>
                </ng-container>
            </p-dialog>

            <p-dialog
                [(visible)]="isDeleteModalVisible"
                [modal]="true"
                [closable]="!isDeleting"
                [style]="{ width: '30rem' }"
                [draggable]="false"
                [resizable]="false"
                (onHide)="cancelDelete()"
            >
                <p class="m-0">
                    Are you sure you want to delete
                    <strong>{{ eventToDelete?.eventName }}</strong>
                    ?
                </p>

                <div class="event-edit-actions">
                    <button type="button" class="table-action" (click)="cancelDelete()" [disabled]="isDeleting">Cancel</button>
                    <button type="button" class="table-action delete" (click)="confirmDeleteEvent()" [disabled]="isDeleting">
                        {{ isDeleting ? 'Deleting...' : 'Delete' }}
                    </button>
                </div>
            </p-dialog>
        </ng-container>
    `
})
export class Dashboard implements OnInit {
    isLoading = true;
    readonly CalendarView = CalendarView;

    view: CalendarView = CalendarView.Month;
    viewDate: Date = new Date();
    activeDayIsOpen = false;

    events: CalendarEvent<DashboardEventMeta>[] = [];
    monthEvents: CalendarEvent<DashboardEventMeta>[] = [];
    eventRows: EventDto[] = [];
    editingEvent: EventDto | null = null;
    eventToDelete: EventDto | null = null;
    editDraft: EventEditDraft = this.createEmptyEditDraft();
    isEditModalVisible = false;
    isDeleteModalVisible = false;
    isSaving = false;
    isDeleting = false;
    actionErrorMessage = '';
    readonly recurringTypeOptions: { label: string; value: RecurringSelection }[] = [
        { label: 'Daily', value: 'Daily' },
        { label: 'Monthly', value: 'Monthly' },
        { label: 'Weekly', value: 'Weekly' },
        { label: 'Annually', value: 'Annually' }
    ];

    refresh = new Subject<void>();

    constructor(private eventsService: EventsService) {}

    ngOnInit(): void {
        this.loadEvents();
    }

    loadEvents(): void {
        this.eventsService.getEvents().subscribe({
            next: (response: unknown) => {
                const eventsArray = this.extractEvents(response);
                this.applyEvents(eventsArray);
                this.isLoading = false;
            },
            error: () => {
                this.events = [];
                this.monthEvents = [];
                this.eventRows = [];
                this.isLoading = false;
            }
        });
    }

    setView(view: CalendarView): void {
        this.view = view;
    }

    closeOpenMonthViewDay(): void {
        this.activeDayIsOpen = false;
    }

    dayClicked(day: CalendarMonthViewDay): void {
        const clickedDate = day.date;

        if (!isSameMonth(clickedDate, this.viewDate)) {
            return;
        }

        if ((isSameDay(this.viewDate, clickedDate) && this.activeDayIsOpen) || day.events.length === 0) {
            this.activeDayIsOpen = false;
        } else {
            this.activeDayIsOpen = true;
        }

        this.viewDate = clickedDate;
    }

    eventClicked(event: CalendarEvent<DashboardEventMeta>): void {
        const eventDate = event.start ?? this.viewDate;

        if (!isSameMonth(eventDate, this.viewDate)) {
            this.viewDate = eventDate;
        }

        if (isSameDay(this.viewDate, eventDate) && this.activeDayIsOpen) {
            this.activeDayIsOpen = false;
        } else {
            this.activeDayIsOpen = true;
        }

        this.viewDate = eventDate;
    }

    eventTimesChanged({ event, newStart, newEnd }: CalendarEventTimesChangedEvent): void {
        this.events = this.events.map((existingEvent) => {
            if (existingEvent === event) {
                return {
                    ...event,
                    start: newStart,
                    end: newEnd
                };
            }

            return existingEvent;
        });

        this.monthEvents = this.buildMonthEvents(this.events);

        this.refresh.next();
    }

    trackByEventId(_: number, event: EventDto): string {
        return event.id;
    }

    openEdit(event: EventDto): void {
        this.actionErrorMessage = '';
        this.editingEvent = event;
        const eventRecurringType = this.getRecurringSelection(event.recurringType);
        const isRecurring = eventRecurringType !== null || !!event.isRecurring;
        const parsedStartDate = this.parseDate(event.startDate);
        const parsedEndDate = this.parseDate(event.endDate);
        const parsedRecurringDate = this.parseDate(event.recurringDate);

        this.editDraft = {
            eventName: event.eventName,
            startDate: isRecurring ? null : parsedStartDate,
            endDate: isRecurring ? null : parsedEndDate,
            isRecurring,
            recurringDateTime: isRecurring ? (parsedRecurringDate ?? parsedStartDate) : null,
            recurringType: eventRecurringType,
            projectId: event.projectId ?? null
        };

        if (this.editDraft.isRecurring && !this.editDraft.recurringType) {
            this.editDraft.recurringType = 'Daily';
        }

        this.isEditModalVisible = true;
    }

    openCreate(): void {
        this.actionErrorMessage = '';
        this.editingEvent = null;
        this.editDraft = this.createEmptyEditDraft();
        this.isEditModalVisible = true;
    }

    cancelEdit(): void {
        this.isEditModalVisible = false;
        this.editingEvent = null;
        this.isSaving = false;
        this.editDraft = this.createEmptyEditDraft();
    }

    isEditDraftValid(): boolean {
        const hasName = this.editDraft.eventName.trim().length > 0;
        if (!hasName) {
            return false;
        }

        if (this.editDraft.isRecurring) {
            return !!this.editDraft.recurringDateTime && !!this.editDraft.recurringType;
        }

        return !!this.editDraft.startDate && !!this.editDraft.endDate;
    }

    onRecurringToggle(isRecurring: boolean): void {
        if (!isRecurring) {
            this.editDraft.recurringType = null;
            this.editDraft.recurringDateTime = null;
        }
    }

    onRecurringDateTimeChange(value: Date | null): void {
        if (!this.editDraft.isRecurring || !value) {
            return;
        }

        this.editDraft.recurringDateTime = value;
    }

    isRecurringEvent(event: EventDto): boolean {
        return this.normalizeRecurringType(event.recurringType) !== 'None' || !!event.isRecurring;
    }

    saveEvent(): void {
        if (this.isSaving || !this.isEditDraftValid()) {
            return;
        }

        this.isSaving = true;
        this.actionErrorMessage = '';

        if (this.editingEvent) {
            const payload = this.buildUpdatePayload(this.editDraft);
            this.eventsService.updateEvent(this.editingEvent.id, payload).subscribe({
                next: () => {
                    this.cancelEdit();
                    this.loadEvents();
                },
                error: () => {
                    this.isSaving = false;
                    this.actionErrorMessage = 'Unable to update event. Please try again.';
                }
            });

            return;
        }

        const payload = this.buildCreatePayload(this.editDraft);
        console.log('Creating event payload:', payload);
        this.eventsService.createEvent(payload).subscribe({
            next: () => {
                this.cancelEdit();
                this.loadEvents();
            },
            error: () => {
                this.isSaving = false;
                this.actionErrorMessage = 'Unable to create event. Please try again.';
            }
        });
    }

    deleteEvent(event: EventDto): void {
        this.actionErrorMessage = '';
        this.eventToDelete = event;
        this.isDeleteModalVisible = true;
    }

    cancelDelete(): void {
        this.isDeleteModalVisible = false;
        this.eventToDelete = null;
        this.isDeleting = false;
    }

    confirmDeleteEvent(): void {
        if (!this.eventToDelete || this.isDeleting) {
            return;
        }

        this.isDeleting = true;
        this.actionErrorMessage = '';
        const eventId = this.eventToDelete.id;

        this.eventsService.deleteEvent(eventId).subscribe({
            next: () => {
                if (this.editingEvent?.id === eventId) {
                    this.cancelEdit();
                }
                this.cancelDelete();
                this.loadEvents();
            },
            error: () => {
                this.isDeleting = false;
                this.actionErrorMessage = 'Unable to delete event. Please try again.';
            }
        });
    }

    formatEventDateLabel(event: EventDto): string {
        const recurringDate = this.parseDate(event.recurringDate);
        if (this.isRecurringEvent(event) && recurringDate) {
            return `Recurring ${this.formatDateTime(recurringDate)}`;
        }

        const startDate = this.parseDate(event.startDate);
        const endDate = this.parseDate(event.endDate);

        if (startDate && endDate) {
            return `${this.formatDate(startDate)} - ${this.formatDate(endDate)}`;
        }

        if (startDate) {
            return `Starts ${this.formatDate(startDate)}`;
        }

        if (endDate) {
            return `Ends ${this.formatDate(endDate)}`;
        }

        return 'No date';
    }

    private applyEvents(eventsArray: EventDto[]): void {
        const sortedEvents = this.sortEventsByDate(eventsArray);
        this.eventRows = sortedEvents;
        this.events = sortedEvents
            .map((event) => this.toCalendarEvent(event))
            .filter((event): event is CalendarEvent<DashboardEventMeta> => event !== null);
        this.monthEvents = this.buildMonthEvents(this.events);
        this.refresh.next();
    }

    private buildMonthEvents(events: CalendarEvent<DashboardEventMeta>[]): CalendarEvent<DashboardEventMeta>[] {
        const monthEvents: CalendarEvent<DashboardEventMeta>[] = [];

        for (const event of events) {
            if (!event.end || isSameDay(event.start, event.end)) {
                monthEvents.push(event);
                continue;
            }

            monthEvents.push({
                ...event,
                end: undefined
            });

            monthEvents.push({
                ...event,
                id: `${String(event.id)}-end`,
                start: event.end,
                end: undefined
            });
        }

        return monthEvents;
    }

    private extractEvents(response: unknown): EventDto[] {
        if (Array.isArray(response)) {
            return response as EventDto[];
        }

        if (response && typeof response === 'object') {
            const maybeItems = (response as { items?: unknown }).items;
            if (Array.isArray(maybeItems)) {
                return maybeItems as EventDto[];
            }

            const maybeEvents = (response as { events?: unknown }).events;
            if (Array.isArray(maybeEvents)) {
                return maybeEvents as EventDto[];
            }
        }

        return [];
    }

    private sortEventsByDate(eventsArray: EventDto[]): EventDto[] {
        return [...eventsArray].sort((first, second) => this.getEventSortTimestamp(first) - this.getEventSortTimestamp(second));
    }

    private getEventSortTimestamp(event: EventDto): number {
        const primaryDate = this.getEventPrimaryDate(event);
        return primaryDate ? primaryDate.getTime() : Number.MAX_SAFE_INTEGER;
    }

    private getEventPrimaryDate(event: EventDto): Date | null {
        return this.parseDate(event.recurringDate) ?? this.parseDate(event.startDate) ?? this.parseDate(event.endDate);
    }

    private toCalendarEvent(event: EventDto): CalendarEvent<DashboardEventMeta> | null {
        const start = this.getEventPrimaryDate(event);
        if (!start) {
            return null;
        }

        const end = this.parseDate(event.endDate);

        return {
            id: event.id,
            title: event.eventName,
            start,
            end: end ?? undefined,
            allDay: true,
            color: event.projectId ? colors.project : colors.general,
            meta: {
                eventId: event.id,
                projectId: event.projectId ?? null,
                isRecurring: this.isRecurringEvent(event)
            }
        };
    }

    private parseDate(value?: string | null): Date | null {
        if (!value) {
            return null;
        }

        const parsedDate = new Date(value);
        return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
    }

    private formatDate(value: Date): string {
        return value.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    private formatDateTime(value: Date): string {
        return value.toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }

    private toIsoDateString(value: Date | null): string | null {
        if (!value) {
            return null;
        }

        const parsedDate = new Date(value);
        return Number.isNaN(parsedDate.getTime()) ? null : parsedDate.toISOString();
    }

    private toRequiredIsoDateString(value: Date | null, fieldName: string): string {
        const isoDate = this.toIsoDateString(value);
        if (!isoDate) {
            throw new Error(`${fieldName} is required.`);
        }

        return isoDate;
    }

    private createEmptyEditDraft(): EventEditDraft {
        return {
            eventName: '',
            startDate: null,
            endDate: null,
            isRecurring: false,
            recurringDateTime: null,
            recurringType: null,
            projectId: null
        };
    }

    private buildUpdatePayload(draft: EventEditDraft): UpdateEventPayload {
        if (draft.isRecurring) {
            const recurringDate = this.toRequiredIsoDateString(draft.recurringDateTime, 'RecurringDate');

            return {
                eventName: draft.eventName.trim(),
                recurringType: draft.recurringType ?? 'Daily',
                recurringDate,
                projectId: draft.projectId
            };
        }

        const startDate = this.toRequiredIsoDateString(draft.startDate, 'StartDate');
        const endDate = this.toRequiredIsoDateString(draft.endDate, 'EndDate');

        return {
            eventName: draft.eventName.trim(),
            recurringType: 'None',
            startDate,
            endDate,
            projectId: draft.projectId
        };
    }

    private buildCreatePayload(draft: EventEditDraft): CreateEventPayload {
        if (draft.isRecurring) {
            const recurringDate = this.toRequiredIsoDateString(draft.recurringDateTime, 'RecurringDate');

            return {
                eventName: draft.eventName.trim(),
                recurringType: draft.recurringType ?? 'Daily',
                recurringDate,
                projectId: draft.projectId
            };
        }

        const startDate = this.toRequiredIsoDateString(draft.startDate, 'StartDate');
        const endDate = this.toRequiredIsoDateString(draft.endDate, 'EndDate');

        return {
            eventName: draft.eventName.trim(),
            recurringType: 'None',
            startDate,
            endDate,
            projectId: draft.projectId
        };
    }

    private getRecurringSelection(value: EventDto['recurringType']): RecurringSelection | null {
        const normalizedValue = this.normalizeRecurringType(value);
        return normalizedValue === 'None' ? null : normalizedValue;
    }

    private normalizeRecurringType(value: EventDto['recurringType']): RecurringTypeValue {
        if (typeof value === 'number') {
            switch (value) {
                case 1:
                    return 'Daily';
                case 2:
                    return 'Monthly';
                case 3:
                    return 'Weekly';
                case 4:
                    return 'Annually';
                default:
                    return 'None';
            }
        }

        if (typeof value === 'string') {
            const normalizedValue = value.trim().toLowerCase();

            switch (normalizedValue) {
                case 'daily':
                    return 'Daily';
                case 'monthly':
                    return 'Monthly';
                case 'weekly':
                    return 'Weekly';
                case 'annually':
                    return 'Annually';
                default:
                    return 'None';
            }
        }

        return 'None';
    }
}
