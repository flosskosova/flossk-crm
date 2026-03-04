import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment.prod';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { FileUploadModule } from 'primeng/fileupload';
import { RatingModule } from 'primeng/rating';
import { GalleriaModule } from 'primeng/galleria';
import { ConfirmationService, MessageService } from 'primeng/api';
import { InputIcon } from "primeng/inputicon";
import { IconField } from "primeng/iconfield";
import { AvatarModule } from 'primeng/avatar';
import { AuthService } from '@/pages/service/auth.service';
import { HistoryLogEntry, LogDto, PaginatedLogsResponse } from '@interfaces/history-log';

interface User {
    id: number;
    name: string;
    avatar: string;
    email: string;
}

interface InventoryItem {
    id: string;
    name: string;
    description?: string;
    category: string;
    status: string;
    createdAt: string;
    updatedAt?: string;
    currentUserId?: string;
    currentUserEmail?: string;
    currentUserFirstName?: string;
    currentUserLastName?: string;
    currentUserFullName?: string;
    currentUserProfilePictureUrl?: string;
    checkedOutAt?: string;
    condition: 'Good' | 'Damaged';
    createdByUserId?: string;
    createdByUserFullName?: string;
    createdByUserProfilePictureUrl?: string;
    createdByUserEmail?: string;
    createdByUserFirstName?: string;
    createdByUserLastName?: string;
    images?: InventoryItemImage[];
}

interface InventoryItemImage {
    id: string;
    fileId: string;
    fileName: string;
    filePath: string;
    addedAt: string;
}

interface PaginatedInventoryResponse {
    data: InventoryItem[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

@Component({
    selector: 'app-inventory',
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        TableModule,
        TagModule,
        DialogModule,
        InputTextModule,
        InputNumberModule,
        TextareaModule,
        SelectModule,
        ConfirmDialogModule,
        ToastModule,
        ToolbarModule,
        FileUploadModule,
        RatingModule,
        GalleriaModule,
        InputIcon,
        IconField,
        AvatarModule
    ],
    providers: [ConfirmationService, MessageService],
    styles: `
        .p-galleria-thumbnail-next-icon {
            display: none !important;
        }
        .p-galleria-thumbnail-prev-icon {
            display: none !important;
        }`,

    template: `
        <p-toast />
        <p-confirmDialog />
        
        <div class="card">
            <p-toolbar class="mb-4">
                <ng-template #start>
                    <span class="font-semibold text-lg">Inventory</span>
                </ng-template>
                <ng-template #end>
                    <div class="flex gap-2">
                        <p-button
                            label="New Item"
                            icon="pi pi-plus"
                            severity="success"
                            (onClick)="openAddDialog()"
                        />
                        <p-button
                            label="Export"
                            icon="pi pi-upload"
                            severity="help"
                            (onClick)="exportData()"
                        />
                    </div>
                </ng-template>
            </p-toolbar>

            <!-- Filter Panel -->
            <div class="flex flex-wrap gap-3 mb-4 p-4 border border-surface-200 dark:border-surface-700 rounded-lg">
                <!-- Search -->
                <div class="flex flex-col gap-1 flex-1" style="min-width:14rem">
                    <label class="text-sm font-medium text-muted-color">Search</label>
                    <p-iconfield>
                        <p-inputicon><i class="pi pi-search"></i></p-inputicon>
                        <input
                            pInputText
                            placeholder="Name or description…"
                            [(ngModel)]="filterSearch"
                            (ngModelChange)="onSearchChange()"
                            class="w-full"
                        />
                    </p-iconfield>
                </div>
                <!-- Category -->
                <div class="flex flex-col gap-1" style="min-width:12rem">
                    <label class="text-sm font-medium text-muted-color">Category</label>
                    <p-select
                        [(ngModel)]="filterCategory"
                        [options]="filterCategoryOptions"
                        placeholder="All categories"
                        (ngModelChange)="applyFilters()"
                        [showClear]="true"
                        appendTo="body"
                        class="w-full"
                    />
                </div>
                <!-- Status -->
                <div class="flex flex-col gap-1" style="min-width:10rem">
                    <label class="text-sm font-medium text-muted-color">Status</label>
                    <p-select
                        [(ngModel)]="filterStatus"
                        [options]="filterStatusOptions"
                        placeholder="All statuses"
                        (ngModelChange)="applyFilters()"
                        [showClear]="true"
                        appendTo="body"
                        class="w-full"
                    />
                </div>
                <!-- Condition -->
                <div class="flex flex-col gap-1" style="min-width:10rem">
                    <label class="text-sm font-medium text-muted-color">Condition</label>
                    <p-select
                        [(ngModel)]="filterCondition"
                        [options]="filterConditionOptions"
                        placeholder="All conditions"
                        (ngModelChange)="applyFilters()"
                        [showClear]="true"
                        appendTo="body"
                        class="w-full"
                    />
                </div>
                <!-- Usage / Only mine -->
                <div class="flex flex-col gap-1" style="min-width:10rem">
                    <label class="text-sm font-medium text-muted-color">Usage</label>
                    <p-select
                        [(ngModel)]="filterUsage"
                        [options]="filterUsageOptions"
                        placeholder="All"
                        (ngModelChange)="applyFilters()"
                        [showClear]="true"
                        appendTo="body"
                        class="w-full"
                    />
                </div>
                <!-- Reset -->
                <div class="flex flex-col justify-end" style="min-width:6rem">
                    <p-button
                        label="Reset"
                        icon="pi pi-filter-slash"
                        severity="secondary"
                        [outlined]="true"
                        (onClick)="resetFilters()"
                        class="w-full"
                    />
                </div>
            </div>

            <p-table 
                [value]="inventoryItems" 
                [paginator]="true" 
                [rows]="10"
                [rowsPerPageOptions]="[5, 10, 20]"
                [tableStyle]="{ 'min-width': '75rem' }"
                [globalFilterFields]="['name', 'category', 'status']"
                #dt
            >
                <ng-template #header>
                    <tr>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Condition</th>
                        <th>Usage</th>
                        <th>Actions</th>
                    </tr>
                </ng-template>

                <ng-template #body let-item>
                    <tr>
                        <td>
                            <div class="flex align-items-center gap-2">
                                <img 
                                    *ngIf="item.images && item.images.length > 0" 
                                    [src]="getImageUrl(item)" 
                                    [alt]="item.name" 
                                    width="50" 
                                    class="shadow-lg rounded cursor-pointer"
                                    (click)="showGallery(item)"
                                />
                                <span class="font-semibold">{{ item.name }}</span>
                            </div>
                        </td>
                        <td>{{ item.category }}</td>
                        <td>
                            <div class="flex items-center gap-2">
                                <p-tag 
                                    [value]="getStatusLabel(item.status)" 
                                    [severity]="getStatusSeverity(item.status)"
                                />
                                <div *ngIf="item.currentUserFullName" class="flex items-center gap-2">
                                    <p-avatar
                                        *ngIf="item.currentUserProfilePictureUrl"
                                        [image]="getProfilePictureUrl(item.currentUserProfilePictureUrl)"
                                        shape="circle"
                                        size="normal"
                                    />
                                    <p-avatar
                                        *ngIf="!item.currentUserProfilePictureUrl"
                                        [label]="getUserInitials(item.currentUserFullName)"
                                        shape="circle"
                                        size="normal"
                                        [style]="{'background-color': 'var(--primary-color)', 'color': 'var(--primary-color-text)'}"
                                    />
                                    <span class="text-sm">
                                        {{ item.currentUserFullName }}
                                    </span>
                                </div>
                            </div>
                        </td>
                        <td>
                            <p-tag
                                [value]="getConditionLabel(item.condition)"
                                [severity]="getConditionSeverity(item.condition)"
                            />
                        </td>
                        <td>
                                <p-button 
                                    *ngIf="item.status === 'Free'"
                                    icon="pi pi-sign-in" 
                                    [rounded]="true" 
                                    [text]="true" 
                                    severity="success"
                                    pTooltip="Check Out"
                                    (onClick)="checkOutItem(item)"
                                />
                                <p-button 
                                    *ngIf="checkedOutByLoggedInUser(item)"
                                    icon="pi pi-sign-out" 
                                    [rounded]="true" 
                                    [text]="true" 
                                    severity="warn"
                                    pTooltip="Check In"
                                    (onClick)="checkInItem(item)"
                                />
                                <td>
                                    <p-button 
                                    icon="pi pi-pencil" 
                                    [rounded]="true" 
                                    [text]="true" 
                                    severity="secondary"
                                    pTooltip="Edit"
                                    (onClick)="openEditDialog(item)"
                                />
                                <p-button 
                                    icon="pi pi-trash" 
                                    [rounded]="true" 
                                    [text]="true" 
                                    severity="danger"
                                    pTooltip="Delete"
                                    (onClick)="confirmDelete(item)"
                                />
                                <p-button
                                    icon="pi pi-history"
                                    [rounded]="true"
                                    [text]="true"
                                    severity="info"
                                    pTooltip="History"
                                    (onClick)="openHistoryDialog(item)"
                                />
                                <p-button
                                    *ngIf="item.condition !== 'Damaged'"
                                    icon="pi pi-exclamation-triangle"
                                    [rounded]="true"
                                    [text]="true"
                                    severity="danger"
                                    pTooltip="Report Damage"
                                    (onClick)="confirmReportDamage(item)"
                                />
                                <p-button
                                    *ngIf="item.condition === 'Damaged'"
                                    icon="pi pi-wrench"
                                    [rounded]="true"
                                    [text]="true"
                                    severity="success"
                                    pTooltip="Report Repair"
                                    (onClick)="confirmReportRepair(item)"
                                />
                                </td>
                    </tr>
                </ng-template>

                <ng-template #emptymessage>
                    <tr>
                        <td colspan="7" class="text-center py-6">
                            <div class="flex flex-col items-center gap-3">
                                <i class="pi pi-inbox text-6xl text-muted-color"></i>
                                <p class="text-xl text-muted-color">No items found</p>
                            </div>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <!-- Add/Edit Dialog -->
        <p-dialog 
            [(visible)]="dialogVisible" 
            [header]="dialogMode === 'add' ? 'Add New Item' : 'Edit Item'"
            [modal]="true" 
            [style]="{ width: '50rem' }"
            [breakpoints]="{ '1199px': '75vw', '575px': '90vw' }"
            [contentStyle]="{ 'max-height': '70vh', 'overflow-y': 'auto' }"
        >
            <div class="flex flex-col gap-4">
                <div class="flex flex-col gap-2">
                    <label for="name" class="font-semibold">Name</label>
                    <input 
                        pInputText 
                        id="name" 
                        [(ngModel)]="currentItem.name" 
                        required 
                        class="w-full"
                    />
                </div>

                <div class="flex flex-col gap-2">
                    <label for="description" class="font-semibold">Description</label>
                    <textarea 
                        pTextarea 
                        id="description" 
                        [(ngModel)]="currentItem.description" 
                        rows="3"
                        class="w-full"
                    ></textarea>
                </div>

                <div class="flex flex-col gap-2">
                    <label for="category" class="font-semibold">Category</label>
                    <p-select 
                        id="category"
                        [(ngModel)]="currentItem.category" 
                        [options]="categories"
                        placeholder="Select a category"
                        class="w-full"
                        appendTo="body"
                    />
                </div>

                <div class="flex flex-col gap-2">
                    <label for="rating" class="font-semibold">Rating</label>
                </div>

                <div class="flex flex-col gap-2">
                    <label class="font-semibold">Product Images</label>
                    <p-fileUpload
                        mode="basic"
                        chooseLabel="Upload Images"
                        accept="image/*"
                        [maxFileSize]="5000000"
                        [multiple]="true"
                        (onSelect)="onImagesSelect($event)"
                        [auto]="true"
                        styleClass="w-full mb-2"
                    />
                    <div class="flex flex-col gap-2">
                        <div *ngIf="existingImages.length > 0">
                            <p class="text-sm font-medium mb-1">Existing images</p>
                            <div *ngFor="let img of existingImages; let i = index" class="flex gap-2 align-items-center border rounded p-2 mb-2">
                                <img
                                    [src]="getExistingImageSrc(img)"
                                    [alt]="img.fileName || 'Image ' + (i+1)"
                                    class="w-20 h-20 object-cover rounded"
                                />
                                <span class="flex-1 text-sm truncate">{{ img.fileName || 'Image ' + (i+1) }}</span>
                                <p-button
                                    icon="pi pi-times"
                                    [rounded]="true"
                                    [text]="true"
                                    severity="danger"
                                    (onClick)="removeExistingImage(img, i)"
                                />
                            </div>
                        </div>
                        <div *ngIf="newImagePreviews.length > 0">
                            <p class="text-sm font-medium mb-1">New images</p>
                            <div *ngFor="let preview of newImagePreviews; let i = index" class="flex gap-2 align-items-center border rounded p-2 mb-2">
                                <img
                                    [src]="preview"
                                    [alt]="selectedFiles[i]?.name || 'New image ' + (i+1)"
                                    class="w-20 h-20 object-cover rounded"
                                />
                                <span class="flex-1 text-sm truncate">{{ selectedFiles[i]?.name || 'New image ' + (i+1) }}</span>
                                <p-button
                                    icon="pi pi-times"
                                    [rounded]="true"
                                    [text]="true"
                                    severity="danger"
                                    (onClick)="removeNewImage(i)"
                                />
                            </div>
                        </div>
                        <div *ngIf="existingImages.length === 0 && newImagePreviews.length === 0" class="text-muted-color text-sm">
                            No images uploaded
                        </div>
                    </div>
                </div>
            </div>

            <ng-template #footer>
                <div class="flex justify-end gap-2 mt-4">
                    <p-button 
                        label="Cancel" 
                        severity="secondary" 
                        (onClick)="dialogVisible = false"
                    />
                    <p-button 
                        [label]="dialogMode === 'add' ? 'Create' : 'Update'" 
                        (onClick)="saveItem()"
                    />
                </div>
            </ng-template>
        </p-dialog>

        <!-- Single Image Dialog -->
        <p-dialog 
            [(visible)]="singleImageVisible" 
            [header]="selectedItem?.name"
            [modal]="true" 
            [contentStyle]="{ 'padding': '1rem', 'display': 'flex', 'justify-content': 'center' }"
        >
            <img 
                *ngIf="selectedItem"
                [src]="getImageUrl(selectedItem)" 
                [alt]="selectedItem.name"
                style="max-width: 100%; max-height: 70vh; object-fit: contain;"
            />
        </p-dialog>

        <!-- History Log Dialog -->
        <p-dialog
            [(visible)]="historyVisible"
            [header]="'History \u2014 ' + (historyItem?.name || '')"
            [modal]="true"
            [style]="{ width: '38rem' }"
            [breakpoints]="{ '575px': '95vw' }"
            [contentStyle]="{ 'max-height': '70vh', 'overflow-y': 'auto'}"
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
                    <!-- Single row: log icon + action + avatar + full name -->
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
                                [image]="getProfilePictureUrl(entry.userProfilePictureUrl)"
                                shape="circle"
                                size="normal"
                            />
                            <p-avatar
                                *ngIf="!entry.userProfilePictureUrl"
                                [label]="getUserInitials(entry.userFullName)"
                                shape="circle"
                                size="normal"
                                [style]="{'background-color': 'var(--primary-color)', 'color': 'var(--primary-color-text)'}"
                            />
                            <span class="text-sm text-muted-color">{{ entry.userFullName }}</span>
                        </ng-container>
                    </div>
                    <!-- Detail image or text -->
                    <img *ngIf="entry.detailImageUrl" [src]="entry.detailImageUrl" [alt]="entry.detail" class="rounded-md max-h-32 object-cover border border-surface-200 dark:border-surface-700" />
                    <p *ngIf="entry.detail && !entry.detailImageUrl" class="text-sm text-muted-color mb-0">{{ entry.detail }}</p>
                    <!-- Timestamp -->
                    <p class="text-xs text-muted-color mb-0">{{ entry.date | date:'MMM d, y, h:mm a' }}</p>
                </div>
                <!-- Load More -->
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

        <!-- Damage Report Dialog -->
        <p-dialog
            [(visible)]="damageReportVisible"
            header="Report Damage"
            [modal]="true"
            [style]="{ width: '30rem' }"
            [breakpoints]="{ '575px': '95vw' }"
        >
            <div class="flex flex-col gap-4">
                <p class="text-sm text-muted-color">
                    Are you sure you want to report <strong>{{ damageReportItem?.name }}</strong> as damaged?
                </p>
            </div>
            <ng-template #footer>
                <div class="flex justify-end gap-2 mt-4">
                    <p-button
                        label="Cancel"
                        severity="secondary"
                        (onClick)="damageReportVisible = false"
                    />
                    <p-button
                        label="Report Damage"
                        severity="danger"
                        (onClick)="submitDamageReport()"
                    />
                </div>
            </ng-template>
        </p-dialog>

        <!-- Repair Report Dialog -->
        <p-dialog
            [(visible)]="repairReportVisible"
            header="Report Repair"
            [modal]="true"
            [style]="{ width: '30rem' }"
            [breakpoints]="{ '575px': '95vw' }"
        >
            <div class="flex flex-col gap-4">
                <p class="text-sm text-muted-color">
                    Are you sure you want to report <strong>{{ repairReportItem?.name }}</strong> as repaired?
                </p>
            </div>
            <ng-template #footer>
                <div class="flex justify-end gap-2 mt-4">
                    <p-button
                        label="Cancel"
                        severity="secondary"
                        (onClick)="repairReportVisible = false"
                    />
                    <p-button
                        label="Report Repair"
                        severity="success"
                        (onClick)="submitRepairReport()"
                    />
                </div>
            </ng-template>
        </p-dialog>

        <!-- Gallery Dialog -->
        <p-dialog 
            [(visible)]="galleryVisible" 
            [header]="galleryItem?.name"
            [modal]="true" 
            [contentStyle]="{ 'padding': '0' }"
        >
            <p-galleria 
                *ngIf="galleryItem"
                [value]="getGalleryImages(galleryItem)" 
                [numVisible]="5"
                [responsiveOptions]="responsiveOptions"
                [circular]="true"
                [showItemNavigators]="true"
                [showThumbnails]="true"
                [containerStyle]="{ 'max-width': '100%' }"
            >
                <ng-template #item let-image>
                    <img [src]="image" style="width: 100%; max-height: 500px; object-fit: contain; display: block;" />
                </ng-template>
                <ng-template #thumbnail let-image>
                    <img [src]="image" style="width: 100%; height: 60px; object-fit: cover; display: block;" />
                </ng-template>
            </p-galleria>
        </p-dialog>
    `
})
export class Inventory implements OnInit {
    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private apiUrl = `${environment.apiUrl}/Inventory`;

    constructor(
        private confirmationService: ConfirmationService,
        private messageService: MessageService
    ) { }

    ngOnInit() {
        this.loadInventoryItems();
    }

    loadInventoryItems() {
        const params: string[] = [
            `page=${this.currentPage}`,
            `pageSize=${this.pageSize}`
        ];
        if (this.filterSearch) params.push(`search=${encodeURIComponent(this.filterSearch)}`);
        if (this.filterCategory) params.push(`category=${encodeURIComponent(this.filterCategory)}`);
        if (this.filterStatus) params.push(`status=${encodeURIComponent(this.filterStatus)}`);
        if (this.filterCondition) params.push(`condition=${encodeURIComponent(this.filterCondition)}`);
        if (this.filterUsage === 'mine') {
            const uid = this.authService.currentUser()?.id;
            if (uid) params.push(`currentUserId=${encodeURIComponent(uid)}`);
        }
        this.http.get<PaginatedInventoryResponse>(
            `${this.apiUrl}?${params.join('&')}`
        ).subscribe({
            next: (response) => {
                console.log('Inventory API response:', response);
                this.inventoryItems = response.data;
                this.totalRecords = response.totalCount;
                this.inventoryItems.forEach(item => {
                    if (item.status === 'InUse') {
                        console.log(`[${item.name}] checkedOutByLoggedInUser:`, this.checkedOutByLoggedInUser(item));
                    }
                });
            },
            error: (error) => {
                console.error('Error loading inventory:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load inventory items'
                });
            }
        });
    }

    dialogVisible = false;
    dialogMode: 'add' | 'edit' = 'add';
    currentItem: any = this.getEmptyItem();
    selectedFiles: File[] = [];
    existingImages: InventoryItemImage[] = [];
    newImagePreviews: string[] = [];
    historyVisible = false;
    historyItem: InventoryItem | null = null;
    historyLog: HistoryLogEntry[] = [];
    historyLoading = false;
    historyLoadingMore = false;
    historyPage = 1;
    historyPageSize = 5;
    historyTotalCount = 0;
    get historyHasMore(): boolean { return this.historyLog.length < this.historyTotalCount; }
    galleryVisible = false;
    galleryItem: InventoryItem | null = null;
    singleImageVisible = false;
    selectedItem: InventoryItem | null = null;
    damageReportVisible = false;
    damageReportItem: InventoryItem | null = null;
    repairReportVisible = false;
    repairReportItem: InventoryItem | null = null;
    inventoryItems: InventoryItem[] = [];
    totalRecords = 0;
    currentPage = 1;
    pageSize = 20;

    // Filters
    filterSearch = '';
    filterCategory = '';
    filterStatus = '';
    filterCondition = '';
    filterUsage = '';
    private searchTimer: any = null;

    filterCategoryOptions = [
        { label: 'Electronic', value: 'Electronic' },
        { label: 'Tool', value: 'Tool' },
        { label: 'Components', value: 'Components' },
        { label: 'Furniture', value: 'Furniture' },
        { label: 'Hardware', value: 'Hardware' },
        { label: 'Office Supplies', value: 'OfficeSupplies' }
    ];
    filterStatusOptions = [
        { label: 'Free', value: 'Free' },
        { label: 'In Use', value: 'InUse' }
    ];
    filterConditionOptions = [
        { label: 'Good', value: 'Good' },
        { label: 'Damaged', value: 'Damaged' }
    ];
    filterUsageOptions = [
        { label: 'Checked out by me', value: 'mine' }
    ];

    responsiveOptions = [
        {
            breakpoint: '1024px',
            numVisible: 4
        },
        {
            breakpoint: '768px',
            numVisible: 3
        },
        {
            breakpoint: '560px',
            numVisible: 2
        }
    ];

    categories = [
        { label: 'Electronic', value: 'Electronic' },
        { label: 'Tool', value: 'Tool' },
        { label: 'Components', value: 'Components' },
        { label: 'Furniture', value: 'Furniture' },
        { label: 'Hardware', value: 'Hardware' },
        { label: 'Office Supplies', value: 'OfficeSupplies' }
    ];

    statusOptions = [
        { label: 'Free', value: 'Free' },
        { label: 'In Use', value: 'InUse' }
    ];

    applyFilters() {
        this.currentPage = 1;
        this.loadInventoryItems();
    }

    onSearchChange() {
        clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(() => this.applyFilters(), 350);
    }

    resetFilters() {
        this.filterSearch = '';
        this.filterCategory = '';
        this.filterStatus = '';
        this.filterCondition = '';
        this.filterUsage = '';
        this.applyFilters();
    }

    showGallery(item: InventoryItem) {
        // Check if item has images
        const imageCount = item.images?.length || 0;

        if (imageCount > 1) {
            // Show gallery for multiple images
            this.galleryItem = item;
            this.galleryVisible = true;
        } else if (imageCount === 1) {
            // Show single image dialog
            this.selectedItem = item;
            this.singleImageVisible = true;
        }
    }

    openHistoryDialog(item: InventoryItem) {
        this.historyItem = item;
        this.historyLog = [];
        this.historyPage = 1;
        this.historyTotalCount = 0;
        this.historyLoading = true;
        this.historyVisible = true;

        this.http.get<PaginatedLogsResponse>(
            `${environment.apiUrl}/logs?entityType=Inventory&entityId=${item.id}&page=1&pageSize=${this.historyPageSize}`
        ).subscribe({
            next: (res) => {
                this.historyLog = res.data.map(log => this.mapLogToHistoryEntry(log));
                this.historyTotalCount = res.totalCount;
                this.historyLoading = false;
            },
            error: () => {
                this.historyLog = [];
                this.historyLoading = false;
            }
        });
    }

    loadMoreHistory() {
        if (!this.historyItem || this.historyLoadingMore) return;
        this.historyLoadingMore = true;
        this.historyPage++;

        this.http.get<PaginatedLogsResponse>(
            `${environment.apiUrl}/logs?entityType=Inventory&entityId=${this.historyItem.id}&page=${this.historyPage}&pageSize=${this.historyPageSize}`
        ).subscribe({
            next: (res) => {
                this.historyLog.push(...res.data.map(log => this.mapLogToHistoryEntry(log)));
                this.historyTotalCount = res.totalCount;
                this.historyLoadingMore = false;
            },
            error: () => {
                this.historyPage--;
                this.historyLoadingMore = false;
            }
        });
    }

    private mapLogToHistoryEntry(log: LogDto): HistoryLogEntry {
        const isImageAction = log.action === 'Image added' || log.action === 'Image removed';
        const isImageUrl = log.detail?.startsWith('/uploads/');

        const iconMap: Record<string, { icon: string; color: string }> = {
            'Item created': { icon: 'pi pi-plus', color: '#22c55e' },
            'Item updated': { icon: 'pi pi-pencil', color: '#f59e0b' },
            'Field updated': { icon: 'pi pi-pen-to-square', color: '#f59e0b' },
            'Item deleted': { icon: 'pi pi-trash', color: '#ef4444' },
            'Checked out': { icon: 'pi pi-sign-in', color: '#ef4444' },
            'Checked in': { icon: 'pi pi-sign-out', color: '#22c55e' },
            'Image added': { icon: 'pi pi-image', color: '#3b82f6' },
            'Image removed': { icon: 'pi pi-times', color: '#f97316' },
            'Damage reported': { icon: 'pi pi-exclamation-triangle', color: '#ef4444' },
        };
        const meta = iconMap[log.action] ?? { icon: 'pi pi-info-circle', color: '#94a3b8' };

        return {
            date: log.timestamp,
            action: log.action,
            detail: (isImageAction && isImageUrl) ? undefined : log.detail,
            detailImageUrl: (isImageAction && isImageUrl)
                ? `${environment.baseUrl}${log.detail}`
                : undefined,
            userFullName: log.userFullName || undefined,
            userProfilePictureUrl: log.userProfilePictureUrl,
            icon: meta.icon,
            color: meta.color
        };
    }

    getImageUrl(item: InventoryItem, index: number = 0): string {
        if (item.images && item.images.length > index) {
            return `${environment.baseUrl}${item.images[index].filePath}`;
        }
        return '';
    }

    getGalleryImages(item: InventoryItem): string[] {
        if (item.images && item.images.length > 0) {
            return item.images.map(img => `${environment.baseUrl}${img.filePath}`);
        }
        return [];
    }

    getEmptyItem(): any {
        return {
            name: '',
            description: '',
            category: '',
            status: 'Free'
        };
    }

    openAddDialog() {
        this.dialogMode = 'add';
        this.currentItem = this.getEmptyItem();
        this.selectedFiles = [];
        this.existingImages = [];
        this.newImagePreviews = [];
        this.dialogVisible = true;
    }

    openEditDialog(item: InventoryItem) {
        this.dialogMode = 'edit';
        this.currentItem = { ...item };
        this.existingImages = item.images ? [...item.images] : [];
        this.newImagePreviews = [];
        this.selectedFiles = [];
        this.dialogVisible = true;
    }

    onImagesSelect(event: any) {
        const files = event.files;
        for (let file of files) {
            this.selectedFiles.push(file);
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.newImagePreviews.push(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    }

    removeNewImage(index: number) {
        this.newImagePreviews.splice(index, 1);
        this.selectedFiles.splice(index, 1);
    }

    removeExistingImage(img: InventoryItemImage, index: number) {
        this.http.delete(`${this.apiUrl}/${this.currentItem.id}/images/${img.id}`).subscribe({
            next: () => {
                this.existingImages.splice(index, 1);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Image removed'
                });
                // Refresh the list so the table reflects the change
                const listIdx = this.inventoryItems.findIndex(i => i.id === this.currentItem.id);
                if (listIdx !== -1) {
                    this.inventoryItems[listIdx].images = [...this.existingImages];
                }
            },
            error: (error) => {
                console.error('Error removing image:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to remove image'
                });
            }
        });
    }

    getExistingImageSrc(img: InventoryItemImage): string {
        return `${environment.baseUrl}${img.filePath}`;
    }

    saveItem() {
        if (!this.currentItem.name || !this.currentItem.category) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation Error',
                detail: 'Name and Category are required'
            });
            return;
        }

        const formData = new FormData();
        formData.append('Name', this.currentItem.name);
        formData.append('Description', this.currentItem.description || '');
        formData.append('Category', this.currentItem.category);

        for (const file of this.selectedFiles) {
            formData.append('Images', file, file.name);
        }

        if (this.dialogMode === 'add') {
            this.http.post(this.apiUrl, formData).subscribe({
                next: (response) => {
                    console.log('Item created:', response);
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Item added successfully'
                    });
                    this.dialogVisible = false;
                    this.loadInventoryItems();
                },
                error: (error) => {
                    console.error('Error creating item:', error);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: error.error?.Errors?.[0] || 'Failed to create item'
                    });
                }
            });
        } else {
            this.http.put(`${this.apiUrl}/${this.currentItem.id}`, formData).subscribe({
                next: (response) => {
                    console.log('Item updated:', response);
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Item updated successfully'
                    });
                    this.dialogVisible = false;
                    this.loadInventoryItems();
                },
                error: (error) => {
                    console.error('Error updating item:', error);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: error.error?.Errors?.[0] || 'Failed to update item'
                    });
                }
            });
        }
    }

    confirmDelete(item: InventoryItem) {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete "${item.name}"?`,
            header: 'Delete Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.deleteItem(item);
            }
        });
    }

    deleteItem(item: InventoryItem) {
        this.http.delete(`${this.apiUrl}/${item.id}`).subscribe({
            next: () => {
                console.log('Item deleted:', item.id);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Item deleted successfully'
                });
                this.loadInventoryItems();
            },
            error: (error) => {
                console.error('Error deleting item:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error.error?.Errors?.[0] || 'Failed to delete item'
                });
            }
        });
    }

    getStatusLabel(status: string): string {
        const labels: { [key: string]: string } = {
            'Free': 'Free',
            'InUse': 'In Use'
        };
        return labels[status] || status;
    }

    getConditionLabel(condition: string): string {
        return condition === 'Damaged' ? 'Damaged' : 'Good';
    }

    getConditionSeverity(condition: string): 'success' | 'danger' {
        return condition === 'Damaged' ? 'danger' : 'success';
    }

    confirmReportDamage(item: InventoryItem) {
        this.damageReportItem = item;
        this.damageReportVisible = true;
    }

    submitDamageReport() {
        if (!this.damageReportItem) return;
        this.http.post(`${this.apiUrl}/${this.damageReportItem.id}/report-damage`, {}).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Damage Reported',
                    detail: `${this.damageReportItem!.name} has been marked as damaged`
                });
                this.damageReportVisible = false;
                this.loadInventoryItems();
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error.error?.message || 'Failed to submit damage report'
                });
            }
        });
    }

    confirmReportRepair(item: InventoryItem) {
        this.repairReportItem = item;
        this.repairReportVisible = true;
    }

    submitRepairReport() {
        if (!this.repairReportItem) return;
        this.http.post(`${this.apiUrl}/${this.repairReportItem.id}/report-repair`, {}).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Repair Reported',
                    detail: `${this.repairReportItem!.name} has been marked as repaired`
                });
                this.repairReportVisible = false;
                this.loadInventoryItems();
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error.error?.message || 'Failed to submit repair report'
                });
            }
        });
    }

    getStatusSeverity(status: string): 'success' | 'warn' | 'danger' {
        const severities: { [key: string]: 'success' | 'warn' | 'danger' } = {
            'Free': 'success',
            'InUse': 'warn'
        };
        return severities[status] || 'success';
    }

    exportData() {
        const dataStr = JSON.stringify(this.inventoryItems, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'inventory_export.json';
        link.click();
        URL.revokeObjectURL(url);

        this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Inventory exported successfully'
        });
    }

    checkOutItem(item: InventoryItem) {
        this.http.post(`${this.apiUrl}/${item.id}/checkout`, {}).subscribe({
            next: (response) => {
                console.log('Check-out response:', response);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: `${item.name} checked out successfully`
                });
                this.loadInventoryItems();
            },
            error: (error) => {
                console.error('Error checking out item:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to check out item'
                });
            }
        });
    }

    checkInItem(item: InventoryItem) {
        this.http.post(`${this.apiUrl}/${item.id}/checkin`, {}).subscribe({
            next: (response) => {
                console.log('Check-in response:', response);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: `${item.name} checked in successfully`
                });
                this.loadInventoryItems();
            },
            error: (error) => {
                console.error('Error checking in item:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to check in item'
                });
            }
        });
    }

    getProfilePictureUrl(url: string | undefined): string {
        if (!url) return '';
        return url.startsWith('http') ? url : `${environment.baseUrl}${url}`;
    }

    getUserInitials(fullName: string | undefined): string {
        if (!fullName) return '?';
        const names = fullName.trim().split(' ');
        if (names.length === 1) return names[0].charAt(0).toUpperCase();
        return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase()
    }

    checkedOutByLoggedInUser(item: InventoryItem): boolean {
        const loggedInUserId = this.authService.currentUser()?.id;
        return item.status === 'InUse' && !!loggedInUserId && item.currentUserId === loggedInUserId;
    }
}
