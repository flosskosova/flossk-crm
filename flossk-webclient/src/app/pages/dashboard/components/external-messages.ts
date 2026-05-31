import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ExternalMessagesService, ExternalMessage } from '@/pages/service/external-messages.service';

@Component({
    selector: 'app-external-messages',
    standalone: true,
    imports: [CommonModule, TableModule, ButtonModule, TagModule, DialogModule],
    template: `
        <div class="card">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h2 class="text-2xl font-semibold text-surface-900 dark:text-surface-0 m-0 mb-2">External Messages</h2>
                    <p class="text-muted-color text-sm m-0">Messages from unauthorized users</p>
                </div>
                <p-tag *ngIf="getUnreadCount() > 0" [value]="getUnreadCount() + ' Unread'" severity="info"></p-tag>
            </div>
            
            <div *ngIf="messages.length === 0" class="flex flex-col items-center justify-center py-12">
                <i class="pi pi-envelope text-5xl text-muted-color mb-4"></i>
                <span class="text-muted-color text-lg">No external messages found</span>
            </div>
            
            <p-table *ngIf="messages.length > 0" [value]="messages" [paginator]="true" [rows]="10" [tableStyle]="{ 'min-width': '50rem' }">
                <ng-template #header>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Message</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th></th>
                    </tr>
                </ng-template>
                <ng-template #body let-message>
                    <tr>
                        <td>
                            <div class="font-semibold">{{ message.firstName }} {{ message.lastName }}</div>
                        </td>
                        <td>
                            <a [href]="'mailto:' + message.email" class="text-primary hover:underline">{{ message.email }}</a>
                        </td>
                        <td>
                            <div class="max-w-xs truncate" [title]="message.message">{{ message.message }}</div>
                        </td>
                        <td>{{ message.createdAt | date:'mediumDate' }}</td>
                        <td>
                            <p-tag 
                                [value]="message.isRead ? 'Read' : 'Unread'" 
                                [severity]="message.isRead ? 'secondary' : 'info'"
                            ></p-tag>
                        </td>
                        <td>
                            <div class="flex gap-2">
                                <p-button 
                                    icon="pi pi-eye" 
                                    [text]="true" 
                                    [rounded]="true"
                                    severity="secondary"
                                    (onClick)="viewMessage(message)"
                                ></p-button>
                                <p-button 
                                    icon="pi pi-trash" 
                                    [text]="true" 
                                    [rounded]="true"
                                    severity="danger"
                                    (onClick)="deleteMessage(message)"
                                ></p-button>
                            </div>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>
        
        <!-- View Message Dialog -->
        <p-dialog [(visible)]="viewDialogVisible" [header]="selectedMessage ? selectedMessage.firstName + ' ' + selectedMessage.lastName : 'Message Details'" [modal]="true" [style]="{width: '40rem'}" appendTo="body">
            <div *ngIf="selectedMessage" class="flex flex-col gap-4">
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-6">
                        <label class="block text-muted-color text-sm mb-1">Full Name</label>
                        <div class="font-semibold text-surface-900 dark:text-surface-0">{{ selectedMessage.firstName }} {{ selectedMessage.lastName }}</div>
                    </div>
                    
                    <div class="col-span-6">
                        <label class="block text-muted-color text-sm mb-1">Email</label>
                        <a [href]="'mailto:' + selectedMessage.email" class="font-semibold text-primary hover:underline">{{ selectedMessage.email }}</a>
                    </div>
                </div>
                
                <div>
                    <label class="block text-muted-color text-sm mb-1">Date Received</label>
                    <div class="font-semibold text-surface-900 dark:text-surface-0">{{ selectedMessage.createdAt | date:'medium' }}</div>
                </div>
                
                <div>
                    <label class="block text-muted-color text-sm mb-1">Message</label>
                    <div class="font-semibold text-surface-900 dark:text-surface-0 whitespace-pre-wrap bg-surface-100 dark:bg-surface-800 p-4 rounded-lg">{{ selectedMessage.message }}</div>
                </div>
            </div>
            
            <div class="flex justify-end gap-2 mt-6">
                <p-button label="Close" severity="secondary" (onClick)="viewDialogVisible = false" />
                <p-button label="Reply" icon="pi pi-reply" (onClick)="replyToMessage(selectedMessage)" />
            </div>
        </p-dialog>
    `
})
export class ExternalMessages implements OnInit {
    messages: ExternalMessage[] = [];
    selectedMessage: ExternalMessage | null = null;
    viewDialogVisible = false;

    // Mock data - replace with API call when endpoint is ready
    private mockMessages: ExternalMessage[] = [
        {
            id: '1',
            firstName: 'John',
            lastName: 'Smith',
            email: 'john.smith@example.com',
            message: 'Hello, I am interested in joining your hackerspace. Could you please provide more information about membership fees and available facilities?',
            createdAt: '2025-12-30T14:30:00Z',
            isRead: false
        },
        {
            id: '2',
            firstName: 'Emily',
            lastName: 'Johnson',
            email: 'emily.j@gmail.com',
            message: 'Hi there! I would like to know if you offer any workshops for beginners in electronics. I am completely new to this field but very eager to learn.',
            createdAt: '2025-12-29T10:15:00Z',
            isRead: true
        },
        {
            id: '3',
            firstName: 'Michael',
            lastName: 'Brown',
            email: 'michael.brown@company.org',
            message: 'Our company is interested in sponsoring some of your events. Please contact me to discuss potential partnership opportunities.',
            createdAt: '2025-12-28T16:45:00Z',
            isRead: false
        },
        {
            id: '4',
            firstName: 'Sarah',
            lastName: 'Davis',
            email: 'sarah.davis@university.edu',
            message: 'I am a computer science student looking for a place to work on my final year project. Do you allow students to use the space for academic projects?',
            createdAt: '2025-12-27T09:00:00Z',
            isRead: true
        },
        {
            id: '5',
            firstName: 'David',
            lastName: 'Wilson',
            email: 'dwilson@tech.io',
            message: 'Quick question: What are your operating hours during the holidays? I would like to visit and see the space before deciding to join.',
            createdAt: '2025-12-26T11:20:00Z',
            isRead: false
        }
    ];

    constructor(private externalMessagesService: ExternalMessagesService) {}

    ngOnInit() {
        this.loadMessages();
    }

    loadMessages() {
        // Using mock data for now - uncomment API call when endpoint is ready
        this.messages = [...this.mockMessages];
        
        /*
        this.externalMessagesService.getAll(1, 50).subscribe({
            next: (response: any) => {
                console.log('ExternalMessages API response:', response);
                const messagesArray = response.messages || response.externalMessages || response.items || [];
                this.messages = messagesArray;
            },
            error: (err) => {
                console.error('Failed to load external messages:', err);
            }
        });
        */
    }

    getUnreadCount(): number {
        return this.messages.filter(m => !m.isRead).length;
    }

    viewMessage(message: ExternalMessage) {
        this.selectedMessage = message;
        this.viewDialogVisible = true;
        
        // Mark as read when viewing
        if (!message.isRead) {
            this.externalMessagesService.markAsRead(message.id).subscribe({
                next: () => {
                    message.isRead = true;
                },
                error: (err) => {
                    console.error('Failed to mark message as read:', err);
                }
            });
        }
    }

    deleteMessage(message: ExternalMessage) {
        this.externalMessagesService.delete(message.id).subscribe({
            next: () => {
                this.loadMessages();
            },
            error: (err) => {
                console.error('Failed to delete message:', err);
            }
        });
    }

    replyToMessage(message: ExternalMessage | null) {
        if (message) {
            window.location.href = `mailto:${message.email}?subject=Re: Your message to Hackerspace`;
        }
    }
}
