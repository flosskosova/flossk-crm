import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { EventsService, CalendarEvent } from '@/pages/service/events.service';
import { AuthService } from '@/pages/service/auth.service';

@Component({
    selector: 'app-events',
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        DialogModule,
        InputTextModule,
        ConfirmDialogModule,
        ToastModule
    ],
    providers: [ConfirmationService],
    template: `
        <p-confirmdialog></p-confirmdialog>
        
        <div class="card">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-semibold m-0"></h2>
                <div class="flex gap-2" *ngIf="isAdmin()">
                    <p-button 
                        *ngIf="!calendarEvent" 
                        label="Add Calendar" 
                        icon="pi pi-plus" 
                        size="small" 
                        (onClick)="openAddDialog()">
                    </p-button>
                    <p-button 
                        *ngIf="calendarEvent" 
                        icon="pi pi-pencil" 
                        size="small" 
                        severity="secondary"
                        (onClick)="openEditDialog()">
                    </p-button>
                    <p-button 
                        *ngIf="calendarEvent" 
                        icon="pi pi-trash" 
                        size="small" 
                        severity="danger"
                        (onClick)="confirmDelete()">
                    </p-button>
                </div>
            </div>
            
            <div *ngIf="loading" class="flex justify-center items-center py-12">
                <i class="pi pi-spin pi-spinner text-4xl"></i>
            </div>
            
            <div *ngIf="!loading && !calendarEvent" class="flex flex-col items-center justify-center py-12 text-surface-500">
                <i class="pi pi-calendar text-6xl mb-4"></i>
                <p class="text-xl">No calendar has been added yet.</p>
                <p *ngIf="isAdmin()" class="text-sm">Click "Add Calendar" to embed a calendar.</p>
            </div>
            
            <div *ngIf="!loading && calendarEvent && safeCalendarUrl" class="calendar-container">
                <h3 *ngIf="calendarEvent.title" class="text-lg font-medium mb-4">{{ calendarEvent.title }}</h3>
                <iframe 
                    [src]="safeCalendarUrl" 
                    width="100%" 
                    height="600" 
                    frameborder="0" 
                    scrolling="no"
                    class="rounded-lg border border-surface-200 dark:border-surface-700">
                </iframe>
            </div>
        </div>
        
        <p-dialog 
            [(visible)]="dialogVisible" 
            [header]="dialogMode === 'add' ? 'Add Calendar' : 'Edit Calendar'" 
            [modal]="true" 
            [style]="{width: '30rem'}">
            <div class="flex flex-col gap-4">
                <div>
                    <label for="title" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Title (Optional)</label>
                    <input pInputText id="title" [(ngModel)]="formData.title" class="w-full" placeholder="e.g., FLOSSK Events Calendar" />
                </div>
                
                <div>
                    <label for="calendarUrl" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Calendar Embed URL</label>
                    <input pInputText id="calendarUrl" [(ngModel)]="formData.calendarUrl" class="w-full" placeholder="https://calendar.google.com/calendar/embed?src=..." />
                    <small class="text-surface-500">Paste the iframe embed URL from Google Calendar or similar service</small>
                </div>
            </div>
            
            <ng-template #footer>
                <div class="flex justify-end gap-2">
                    <p-button label="Cancel" severity="secondary" (onClick)="dialogVisible = false"></p-button>
                    <p-button [label]="dialogMode === 'add' ? 'Add' : 'Save'" (onClick)="saveCalendar()"></p-button>
                </div>
            </ng-template>
        </p-dialog>
    `
})
export class Events implements OnInit {
    calendarEvent: CalendarEvent | null = null;
    safeCalendarUrl: SafeResourceUrl | null = null;
    loading = true;
    
    dialogVisible = false;
    dialogMode: 'add' | 'edit' = 'add';
    formData = {
        title: '',
        calendarUrl: ''
    };
    
    isAdmin = computed(() => {
        const currentUser = this.authService.currentUser();
        return currentUser?.role === 'Admin' || currentUser?.roles?.includes('Admin') || false;
    });

    constructor(
        private eventsService: EventsService,
        private authService: AuthService,
        private sanitizer: DomSanitizer,
        private confirmationService: ConfirmationService,
        private messageService: MessageService
    ) {}

    ngOnInit() {
        this.loadCalendar();
    }

    loadCalendar() {
        this.loading = true;
        this.eventsService.get().subscribe({
            next: (data) => {
                this.calendarEvent = data;
                if (data?.calendarUrl) {
                    this.safeCalendarUrl = this.sanitizer.bypassSecurityTrustResourceUrl(data.calendarUrl);
                }
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading calendar:', err);
                this.loading = false;
            }
        });
    }

    openAddDialog() {
        this.dialogMode = 'add';
        this.formData = { title: '', calendarUrl: '' };
        this.dialogVisible = true;
    }

    openEditDialog() {
        this.dialogMode = 'edit';
        this.formData = {
            title: this.calendarEvent?.title || '',
            calendarUrl: this.calendarEvent?.calendarUrl || ''
        };
        this.dialogVisible = true;
    }

    saveCalendar() {
        if (!this.formData.calendarUrl.trim()) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Calendar URL is required' });
            return;
        }

        if (this.dialogMode === 'add') {
            this.eventsService.create(this.formData).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Calendar added successfully' });
                    this.dialogVisible = false;
                    this.loadCalendar();
                },
                error: (err) => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.Error || 'Failed to add calendar' });
                }
            });
        } else {
            this.eventsService.update(this.calendarEvent!.id!, this.formData).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Calendar updated successfully' });
                    this.dialogVisible = false;
                    this.loadCalendar();
                },
                error: (err) => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.Error || 'Failed to update calendar' });
                }
            });
        }
    }

    confirmDelete() {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete this calendar?',
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonProps: {
                severity: 'danger'
            },
            accept: () => {
                this.deleteCalendar();
            }
        });
    }

    deleteCalendar() {
        this.eventsService.delete(this.calendarEvent!.id!).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Calendar deleted successfully' });
                this.calendarEvent = null;
                this.safeCalendarUrl = null;
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.Error || 'Failed to delete calendar' });
            }
        });
    }
}
