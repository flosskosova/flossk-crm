import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { PanelModule } from 'primeng/panel';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { CollaborationPadsService } from '@/pages/service/collaboration-pads.service';

interface Pad {
    id: string;
    name: string;
    url: string;
    safeUrl?: SafeResourceUrl;
    description?: string;
    createdAt?: string;
}

@Component({
    selector: 'app-collaboration-pads',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, DialogModule, InputTextModule, TextareaModule, PanelModule, ConfirmDialogModule, SkeletonModule, TooltipModule],
    providers: [ConfirmationService],
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
        </div>

        <!-- Main Content -->
        <ng-container *ngIf="!isLoading">
        <div class="grid grid-cols-12 gap-8">

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

            <!-- Add Pad Button (when no pads exist) -->
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

        </div>
        </ng-container>

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
    `
})
export class CollaborationPads implements OnInit {
    isLoading = true;
    pads: Pad[] = [];
    addPadDialogVisible = false;
    padDialogMode: 'add' | 'edit' = 'add';
    currentEditingPad: Pad | null = null;
    newPad: Omit<Pad, 'id' | 'createdAt'> = {
        name: '',
        url: '',
        description: ''
    };

    constructor(
        private sanitizer: DomSanitizer,
        private confirmationService: ConfirmationService,
        private collaborationPadsService: CollaborationPadsService
    ) {}

    ngOnInit() {
        this.loadPads();
    }

    loadPads() {
        this.collaborationPadsService.getAll(1, 50).subscribe({
            next: (response: any) => {
                console.log('CollaborationPads API response:', response);
                const padsArray = response.collaborationPads || response.items || [];
                this.pads = padsArray.map((pad: any) => ({
                    id: pad.id,
                    name: pad.name,
                    url: pad.url,
                    description: pad.description,
                    createdAt: pad.createdAt,
                    safeUrl: this.getSafeUrl(pad.url)
                }));
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Failed to load pads:', err);
                this.isLoading = false;
            }
        });
    }

    getSafeUrl(url: string): SafeResourceUrl {
        return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }

    openAddPadDialog() {
        this.padDialogMode = 'add';
        this.currentEditingPad = null;
        this.newPad = { name: '', url: '', description: '' };
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
        this.newPad = { name: '', url: '', description: '' };
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
}
