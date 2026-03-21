import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { DividerModule } from 'primeng/divider';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';

import { ConfirmationService } from 'primeng/api';
import { AnnouncementsService, Announcement, ReactionSummary } from '@/pages/service/announcements.service';
import { AuthService, getInitials } from '@/pages/service/auth.service';
import { environment } from '@environments/environment.prod';

interface AnnouncementDisplay {
    id: string;
    title: string;
    content: string;
    author: string;
    authorAvatar: string;
    authorInitials: string;
    date: string;
    category: string;
    priority: string;
    views: number;
    reactions: ReactionSummary[];
    isCurrentUserCreator: boolean;
}

@Component({
    selector: 'app-announcements',
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        TagModule,
        AvatarModule,
        DividerModule,
        ConfirmDialogModule,
        DialogModule,
        InputTextModule,
        TextareaModule,
        SelectModule
    ],
    providers: [ConfirmationService],
    template: `
        <p-confirmdialog></p-confirmdialog>
        
        <p-dialog [(visible)]="dialogVisible" [header]="dialogMode === 'add' ? 'New Announcement' : 'Edit Announcement'" [modal]="true" [style]="{width: '50rem'}" [contentStyle]="{'max-height': '70vh', 'overflow': 'visible'}" appendTo="body" [maximizable]="true">
            <div class="flex flex-col gap-4">
                <div>
                    <label for="title" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Title</label>
                    <input pInputText id="title" [(ngModel)]="currentAnnouncement.title" class="w-full" />
                </div>
                
                <div>
                    <label for="content" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Content</label>
                    <textarea pInputTextarea id="content" [(ngModel)]="currentAnnouncement.content" [rows]="5" class="w-full"></textarea>
                </div>
                
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-6">
                        <label for="category" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Category</label>
                        <p-select id="category" [(ngModel)]="currentAnnouncement.category" [options]="categoryOptions" placeholder="Select Category" class="w-full" />
                    </div>
                    
                    <div class="col-span-6">
                        <label for="priority" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Priority</label>
                        <p-select id="priority" [(ngModel)]="currentAnnouncement.priority" [options]="priorityOptions" placeholder="Select Priority" class="w-full" />
                    </div>
                </div>
            </div>
            
            <div class="flex justify-end gap-2 mt-6">
                <p-button label="Cancel" severity="secondary" (onClick)="dialogVisible = false" />
                <p-button [label]="dialogMode === 'add' ? 'Create' : 'Save'" (onClick)="saveAnnouncement()" />
            </div>
        </p-dialog>
        
        <p-dialog [(visible)]="viewDialogVisible" [header]="selectedAnnouncement?.title" [modal]="true" [style]="{width: '50rem'}" appendTo="body">
            <div *ngIf="selectedAnnouncement" class="flex flex-col gap-4">
                <!-- Author Info -->
                <div class="flex items-center gap-3 mb-2">
                    <p-avatar 
                        *ngIf="selectedAnnouncement.authorAvatar"
                        [image]="selectedAnnouncement.authorAvatar" 
                        shape="circle" 
                        size="large"
                    ></p-avatar>
                    <p-avatar 
                        *ngIf="!selectedAnnouncement.authorAvatar"
                        [label]="selectedAnnouncement.authorInitials" 
                        shape="circle" 
                        size="large"
                        [style]="{'background-color': 'var(--primary-color)', 'color': 'var(--primary-color-text)'}"
                    ></p-avatar>
                    <div>
                        <div class="font-semibold text-surface-900 dark:text-surface-0">{{ selectedAnnouncement.author }}</div>
                        <div class="text-sm text-muted-color">{{ selectedAnnouncement.date }}</div>
                    </div>
                </div>
                
                <!-- Tags -->
                <div class="flex items-center gap-2">
                    <p-tag 
                        [value]="selectedAnnouncement.priority.toUpperCase()" 
                        [severity]="getPrioritySeverity(selectedAnnouncement.priority)"
                    ></p-tag>
                    <p-tag [value]="selectedAnnouncement.category"></p-tag>
                    <p-tag icon="pi pi-eye" [value]="selectedAnnouncement.views + ' views'" severity="secondary"></p-tag>
                </div>
                
                <p-divider></p-divider>
                
                <!-- Content -->
                <div class="text-surface-700 dark:text-surface-300 leading-relaxed">
                    {{ selectedAnnouncement.content }}
                </div>
                
                <p-divider></p-divider>
                
                <!-- Reactions Section in Dialog -->
                <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-sm text-muted-color mr-2">React:</span>
                    <div class="flex gap-2">
                        <button 
                            *ngFor="let emoji of availableEmojis" 
                            (pointerenter)="onReactionPointerEnter($event, selectedAnnouncement!, emoji)"
                            (pointerdown)="onReactionPointerDown($event, selectedAnnouncement!, emoji)"
                            (pointerup)="onReactionPointerUp($event, selectedAnnouncement!, emoji)"
                            (pointermove)="onReactionPointerMove($event)"
                            (pointerleave)="onReactionPointerLeave()"
                            (contextmenu)="$event.preventDefault()"
                            class="flex items-center gap-1 text-xl px-3 py-1 rounded-full transition-colors cursor-pointer border-none select-none touch-none"
                            [class.bg-surface-200]="hasUserReacted(selectedAnnouncement!, emoji)"
                            [class.dark:bg-surface-600]="hasUserReacted(selectedAnnouncement!, emoji)"
                            [class.bg-transparent]="!hasUserReacted(selectedAnnouncement!, emoji)"
                            [class.hover:bg-surface-100]="!hasUserReacted(selectedAnnouncement!, emoji)"
                            [class.dark:hover:bg-surface-700]="!hasUserReacted(selectedAnnouncement!, emoji)"
                        >
                            <span>{{ emoji }}</span>
                            <span *ngIf="getReactionCount(selectedAnnouncement, emoji) > 0" class="text-sm font-medium">{{ getReactionCount(selectedAnnouncement, emoji) }}</span>
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="flex justify-end gap-2 mt-6">
                <p-button label="Close" severity="secondary" (onClick)="viewDialogVisible = false" />
            </div>
        </p-dialog>
        
        <div class="card">
            <div class="flex justify-end items-center mb-6" *ngIf="isAdmin()">
                <p-button label="New Announcement" icon="pi pi-plus" size="small" (onClick)="openAddDialog()"></p-button>
            </div>

            <div class="flex flex-col gap-6">
                <div *ngFor="let announcement of announcements" class="p-4 border border-surface rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
                    <div class="cursor-pointer" (click)="viewAnnouncement(announcement)">
                        <div class="flex justify-between items-start mb-3">
                            <div class="flex items-center gap-3">
                                <div>
                                    <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 m-0 mb-1">
                                        {{ announcement.title }}
                                    </h3>
                                <div class="flex flex-col md:flex-row gap-2 text-sm text-muted-color">
                                    <span>{{ announcement.author }}</span>
                                    <span>•</span>
                                    <span>{{ announcement.date }}</span>
                                    <span>•</span>
                                    <span class="flex items-center gap-1"><i class="pi pi-eye"></i> {{ announcement.views }} views</span>
                                </div>
                            </div>
                        </div>
                        <div class="flex flex-col md:flex-row items-center gap-2">
                            <p-tag 
                                [value]="announcement.priority.toUpperCase()" 
                                [severity]="getPrioritySeverity(announcement.priority)"
                            ></p-tag>
                            <p-tag [value]="announcement.category"></p-tag>
                        </div>
                        </div>

                        <p class="text-surface-700 dark:text-surface-300 mb-4 leading-relaxed">
                            {{ announcement.content.length > 200 ? announcement.content.substring(0, 200) + '...' : announcement.content }}
                        </p>
                        
                        <span *ngIf="announcement.content.length > 200" class="text-primary text-sm font-semibold">
                            Read more →
                        </span>
                    </div>

                    <!-- Reactions Section -->
                    <div class="flex items-center gap-2 mt-4" (click)="$event.stopPropagation()">
                        <div class="flex gap-2 flex-wrap">
                            <button 
                                *ngFor="let emoji of availableEmojis" 
                                (pointerenter)="onReactionPointerEnter($event, announcement, emoji)"
                                (pointerdown)="onReactionPointerDown($event, announcement, emoji)"
                                (pointerup)="onReactionPointerUp($event, announcement, emoji)"
                                (pointermove)="onReactionPointerMove($event)"
                                (pointerleave)="onReactionPointerLeave()"
                                (contextmenu)="$event.preventDefault()"
                                class="flex items-center gap-1 text-lg px-2 py-1 rounded-full transition-colors cursor-pointer border-none select-none touch-none"
                                [class.bg-surface-200]="hasUserReacted(announcement, emoji)"
                                [class.dark:bg-surface-600]="hasUserReacted(announcement, emoji)"
                                [class.bg-transparent]="!hasUserReacted(announcement, emoji)"
                                [class.hover:bg-surface-100]="!hasUserReacted(announcement, emoji)"
                                [class.dark:hover:bg-surface-700]="!hasUserReacted(announcement, emoji)"
                            >
                                <span>{{ emoji }}</span>
                                <span *ngIf="getReactionCount(announcement, emoji) > 0" class="text-sm font-medium">{{ getReactionCount(announcement, emoji) }}</span>
                            </button>
                        </div>
                    </div>

                    <p-divider></p-divider>

                    <div class="flex justify-end gap-2 mt-3" *ngIf="announcement.isCurrentUserCreator">
                        <p-button label="Edit" icon="pi pi-pencil" severity="secondary" [text]="true" size="small" (onClick)="openEditDialog(announcement)"></p-button>
                        <p-button label="Delete" icon="pi pi-trash" severity="danger" [text]="true" size="small" (onClick)="confirmDelete(announcement)"></p-button>
                    </div>
                </div>

                <div *ngIf="announcements.length === 0" class="text-center py-8">
                    <i class="pi pi-megaphone text-6xl text-muted-color mb-4"></i>
                    <p class="text-muted-color text-lg">No announcements yet</p>
                </div>
            </div>
        </div>

        <!-- Reactor popup shown on long-press -->
        <div *ngIf="reactorPopup"
             class="fixed z-9999 bg-surface-0 dark:bg-surface-800 border border-surface rounded-lg shadow-xl p-3 text-sm pointer-events-none min-w-28"
             [style.left.px]="reactorPopup.x"
             [style.bottom.px]="reactorPopup.bottom">
            <div class="font-semibold mb-2 text-surface-900 dark:text-surface-0">{{ reactorPopup.emoji }}</div>
            <div *ngFor="let name of reactorPopup.users" class="text-surface-700 dark:text-surface-300 py-0.5">{{ name }}</div>
            <div *ngIf="reactorPopup.users.length === 0" class="text-muted-color italic">No reactions yet</div>
        </div>
    `
})
export class Announcements implements OnInit {
    constructor(
        private confirmationService: ConfirmationService,
        private announcementsService: AnnouncementsService,
        private authService: AuthService
    ) {}

    dialogVisible = false;
    viewDialogVisible = false;
    dialogMode: 'add' | 'edit' = 'add';
    currentAnnouncement: AnnouncementDisplay = {
        id: '',
        title: '',
        content: '',
        author: '',
        authorAvatar: '',
        authorInitials: '',
        date: '',
        category: 'General',
        priority: 'normal',
        views: 0,
        reactions: [],
        isCurrentUserCreator: true
    };
    selectedAnnouncement: AnnouncementDisplay | null = null;
    
    // Computed admin check - reactive to auth state changes
    isAdmin = computed(() => {
        const currentUser = this.authService.currentUser();
        return currentUser?.role === 'Admin' || currentUser?.roles?.includes('Admin') || false;
    });
    
    // Available emoji reactions
    availableEmojis = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

    // Long-press state
    reactorPopup: { emoji: string; users: string[]; x: number; bottom: number } | null = null;
    private longPressTimer: any = null;
    private longPressActive = false;
    private longPressStartX = 0;
    private longPressStartY = 0;
    private dismissPopupTimer: any = null;
    
    categoryOptions = [
        { label: 'General', value: 'General' },
        { label: 'Events', value: 'Events' },
        { label: 'Updates', value: 'Updates' },
        { label: 'Maintenance', value: 'Maintenance' },
        { label: 'Meetings', value: 'Meetings' }
    ];
    
    priorityOptions = [
        { label: 'Normal', value: 'normal' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
        { label: 'Urgent', value: 'urgent' }
    ];

    announcements: AnnouncementDisplay[] = [];

    ngOnInit() {
        this.loadAnnouncements();
    }

    loadAnnouncements() {
        this.announcementsService.getAll(1, 50).subscribe({
            next: (response: any) => {
                console.log('Announcements API response:', response);
                // Adjust based on actual API response structure
                const announcementsArray = response.announcements || response.items || response || [];
                this.announcements = announcementsArray.map((a: any) => this.mapToDisplay(a));
            },
            error: (err) => {
                console.error('Failed to load announcements:', err);
            }
        });
    }

    mapToDisplay(a: any): AnnouncementDisplay {
        const authorName = a.createdByFirstName && a.createdByLastName 
            ? `${a.createdByFirstName} ${a.createdByLastName}` 
            : 'Unknown';
        
        let authorAvatar = '';
        if (a.createdByProfilePicture) {
            authorAvatar = a.createdByProfilePicture.startsWith('http')
                ? a.createdByProfilePicture
                : `${environment.baseUrl}${a.createdByProfilePicture}`;
        }
        
        return {
            id: a.id,
            title: a.title,
            content: a.body || a.content,
            author: authorName,
            authorAvatar: authorAvatar,
            authorInitials: getInitials(authorName),
            date: a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '',
            category: a.category || 'General',
            priority: a.importance?.toLowerCase() || a.priority?.toLowerCase() || 'normal',
            views: a.viewCount || a.views || 0,
            reactions: a.reactions || [],
            isCurrentUserCreator: a.isCurrentUserCreator || false
        };
    }

    getPrioritySeverity(priority: string): 'success' | 'info' | 'warn' | 'danger' {
        switch(priority?.toLowerCase()) {
            case 'urgent': return 'danger';
            case 'high': return 'warn';
            case 'normal': return 'info';
            case 'low': return 'success';
            default: return 'info';
        }
    }

    getEmptyAnnouncement(): AnnouncementDisplay {
        const currentUser = this.authService.currentUser();
        const authorName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Current User';
        
        let authorAvatar = '';
        if (currentUser?.profilePictureUrl) {
            authorAvatar = currentUser.profilePictureUrl.startsWith('http')
                ? currentUser.profilePictureUrl
                : `${environment.baseUrl}${currentUser.profilePictureUrl}`;
        }
        
        return {
            id: '',
            title: '',
            content: '',
            author: authorName,
            authorAvatar: authorAvatar,
            authorInitials: getInitials(authorName),
            date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
            category: 'General',
            priority: 'normal',
            views: 0,
            reactions: [],
            isCurrentUserCreator: true
        };
    }

    // Long-press / hover reaction handlers
    onReactionPointerEnter(event: PointerEvent, announcement: AnnouncementDisplay, emoji: string) {
        if (event.pointerType === 'mouse') {
            clearTimeout(this.dismissPopupTimer);
            this.showReactorPopup(event, announcement, emoji);
        }
    }

    onReactionPointerDown(event: PointerEvent, announcement: AnnouncementDisplay, emoji: string) {
        this.longPressActive = false;
        this.longPressStartX = event.clientX;
        this.longPressStartY = event.clientY;
        clearTimeout(this.dismissPopupTimer);
        if (event.pointerType !== 'mouse') {
            this.reactorPopup = null;
            this.longPressTimer = setTimeout(() => {
                this.longPressActive = true;
                this.showReactorPopup(event, announcement, emoji);
            }, 500);
        }
    }

    onReactionPointerUp(event: PointerEvent, announcement: AnnouncementDisplay, emoji: string) {
        clearTimeout(this.longPressTimer);
        if (!this.longPressActive) {
            this.toggleReaction(announcement, emoji);
        } else {
            this.dismissPopupTimer = setTimeout(() => {
                this.reactorPopup = null;
            }, 2000);
        }
        this.longPressActive = false;
    }

    onReactionPointerMove(event: PointerEvent) {
        if (!this.longPressActive) {
            const dx = event.clientX - this.longPressStartX;
            const dy = event.clientY - this.longPressStartY;
            if (dx * dx + dy * dy > 100) {
                clearTimeout(this.longPressTimer);
            }
        }
    }

    onReactionPointerLeave() {
        clearTimeout(this.longPressTimer);
        clearTimeout(this.dismissPopupTimer);
        this.reactorPopup = null;
        this.longPressActive = false;
    }

    private showReactorPopup(event: PointerEvent, announcement: AnnouncementDisplay, emoji: string) {
        const reaction = announcement.reactions?.find(r => r.emoji === emoji);
        const users = reaction?.users?.map((u: any) => `${u.firstName} ${u.lastName}`) || [];
        const target = (event.target as HTMLElement).closest('button') ?? (event.target as HTMLElement);
        const rect = target.getBoundingClientRect();
        this.reactorPopup = {
            emoji,
            users,
            x: Math.min(rect.left, window.innerWidth - 160),
            bottom: window.innerHeight - rect.top + 8
        };
    }

    // Reaction helper methods
    hasUserReacted(announcement: AnnouncementDisplay, emoji: string): boolean {
        const reaction = announcement.reactions?.find(r => r.emoji === emoji);
        return reaction?.currentUserReacted || false;
    }

    getReactionTooltip(reaction: ReactionSummary): string {
        if (!reaction.users || reaction.users.length === 0) {
            return '';
        }
        const names = reaction.users.slice(0, 5).map(u => `${u.firstName} ${u.lastName}`);
        if (reaction.users.length > 5) {
            names.push(`and ${reaction.users.length - 5} more`);
        }
        return names.join(', ');
    }

    getReactionCount(announcement: AnnouncementDisplay, emoji: string): number {
        const reaction = announcement.reactions?.find(r => r.emoji === emoji);
        return reaction?.count || 0;
    }

    getEmojiTooltip(announcement: AnnouncementDisplay, emoji: string): string {
        const reaction = announcement.reactions?.find(r => r.emoji === emoji);
        if (!reaction || !reaction.users || reaction.users.length === 0) {
            return `React with ${emoji}`;
        }
        return this.getReactionTooltip(reaction);
    }

    toggleReaction(announcement: AnnouncementDisplay, emoji: string) {
        this.announcementsService.addReaction(announcement.id, emoji).subscribe({
            next: (response: any) => {
                // Refresh the announcement to get updated reactions
                this.announcementsService.getById(announcement.id).subscribe({
                    next: (updated: any) => {
                        const updatedDisplay = this.mapToDisplay(updated);
                        // Update in the list
                        const index = this.announcements.findIndex(a => a.id === announcement.id);
                        if (index !== -1) {
                            this.announcements[index] = updatedDisplay;
                        }
                        // Update selected if viewing
                        if (this.selectedAnnouncement?.id === announcement.id) {
                            this.selectedAnnouncement = updatedDisplay;
                        }
                    }
                });
            },
            error: (err) => {
                console.error('Failed to toggle reaction:', err);
            }
        });
    }
    
    openAddDialog() {
        this.dialogMode = 'add';
        this.currentAnnouncement = this.getEmptyAnnouncement();
        this.dialogVisible = true;
    }
    
    openEditDialog(announcement: AnnouncementDisplay) {
        this.dialogMode = 'edit';
        this.currentAnnouncement = { ...announcement };
        this.dialogVisible = true;
    }
    
    saveAnnouncement() {
        const announcementData = {
            title: this.currentAnnouncement.title,
            body: this.currentAnnouncement.content,
            category: this.currentAnnouncement.category,
            importance: this.currentAnnouncement.priority
        };

        if (this.dialogMode === 'add') {
            this.announcementsService.create(announcementData).subscribe({
                next: () => {
                    this.dialogVisible = false;
                    this.loadAnnouncements();
                },
                error: (err) => {
                    console.error('Failed to create announcement:', err);
                }
            });
        } else {
            this.announcementsService.update(this.currentAnnouncement.id, announcementData).subscribe({
                next: () => {
                    this.dialogVisible = false;
                    this.loadAnnouncements();
                },
                error: (err) => {
                    console.error('Failed to update announcement:', err);
                }
            });
        }
    }

    viewAnnouncement(announcement: AnnouncementDisplay) {
        // Increment view count
        this.announcementsService.incrementViewCount(announcement.id).subscribe({
            next: (response) => {
                console.log('View count incremented', response);
                // Fetch updated view count
                this.announcementsService.getViewCount(announcement.id).subscribe({
                    next: (viewCountResponse: any) => {
                        // Update the announcement in the list
                        const index = this.announcements.findIndex(a => a.id === announcement.id);
                        if (index !== -1) {
                            this.announcements[index].views = viewCountResponse.viewCount;
                        }
                        // Update selected announcement if it's the same one
                        if (this.selectedAnnouncement?.id === announcement.id) {
                            this.selectedAnnouncement.views = viewCountResponse.viewCount;
                        }
                    },
                    error: (err) => {
                        console.error('Failed to fetch view count:', err);
                    }
                });
            },
            error: (err) => {
                console.error('Failed to increment view count:', err);
            }
        });

        // Fetch full details from API
        this.announcementsService.getById(announcement.id).subscribe({
            next: (response: any) => {
                this.selectedAnnouncement = this.mapToDisplay(response);
                this.viewDialogVisible = true;
            },
            error: (err) => {
                console.error('Failed to fetch announcement details:', err);
                // Fallback to local data
                this.selectedAnnouncement = announcement;
                this.viewDialogVisible = true;
            }
        });
    }

    confirmDelete(announcement: AnnouncementDisplay) {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete "${announcement.title}"?`,
            header: 'Delete Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.deleteAnnouncement(announcement);
            }
        });
    }

    deleteAnnouncement(announcement: AnnouncementDisplay) {
        this.announcementsService.delete(announcement.id).subscribe({
            next: () => {
                this.loadAnnouncements();
            },
            error: (err) => {
                console.error('Failed to delete announcement:', err);
            }
        });
    }
}
