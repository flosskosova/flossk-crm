import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { TextareaModule } from 'primeng/textarea';
import SignaturePad from 'signature_pad';
import { MembershipRequestsService } from '@/pages/service/membership-requests.service';

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
    rejectionReason?: string;
}

@Component({
    selector: 'app-membership-requests',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, TagModule, DialogModule, TableModule, SkeletonModule, TooltipModule, TextareaModule],
    template: `
        <!-- Loading Skeleton -->
        <div *ngIf="isLoading" class="grid grid-cols-12 gap-8">
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

        </div>
        </ng-container>

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

                <ng-container *ngIf="selectedRequest && selectedRequest.status.toLowerCase() === 'rejected' && selectedRequest.rejectionReason">
                    <div class="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg p-4">
                        <p class="font-semibold text-red-700 dark:text-red-400 mb-1">Rejection Reason</p>
                        <p class="text-red-600 dark:text-red-300">{{ selectedRequest.rejectionReason }}</p>
                    </div>
                </ng-container>

                <ng-container *ngIf="selectedRequest && selectedRequest.status.toLowerCase() === 'pending'">
                    <div class="field">
                        <label for="rejectionReason" class="block font-bold mb-2">Rejection Reason <span class="font-normal text-muted-color">(optional)</span></label>
                        <textarea
                            pTextarea
                            id="rejectionReason"
                            [(ngModel)]="rejectionReason"
                            rows="3"
                            class="w-full"
                            placeholder="Provide a reason for rejection (will be included in the notification email)..."
                        ></textarea>
                    </div>
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
                    [loading]="isRejecting"
                    (onClick)="selectedRequest && rejectRequest(selectedRequest)"
                />
                <p-button
                    *ngIf="selectedRequest?.status?.toLowerCase() === 'pending'"
                    label="Approve"
                    severity="success"
                    icon="pi pi-check"
                    [disabled]="isSignaturePadEmpty()"
                    [loading]="isApproving"
                    (onClick)="selectedRequest && approveRequest(selectedRequest)"
                />
            </div>
        </p-dialog>
    `
})
export class MembershipRequests implements OnInit {
    @ViewChild('boardMemberCanvas') boardMemberCanvas?: ElementRef<HTMLCanvasElement>;
    boardMemberSignaturePad!: SignaturePad;

    isLoading = true;
    isApproving = false;
    isRejecting = false;
    rejectionReason = '';
    joinRequests: JoinRequest[] = [];
    viewDialogVisible = false;
    selectedRequest: JoinRequest | null = null;

    constructor(private membershipRequestsService: MembershipRequestsService) {}

    ngOnInit() {
        this.loadMembershipRequests();
    }

    loadMembershipRequests() {
        this.membershipRequestsService.getAll(1, 50).subscribe({
            next: (response: any) => {
                console.log('MembershipRequests API response:', response);
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
                    createdAt: req.createdAt,
                    rejectionReason: req.rejectionReason ?? undefined
                }));
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Failed to load membership requests:', err);
                this.isLoading = false;
            }
        });
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
        this.rejectionReason = '';
        this.viewDialogVisible = true;
        if (request.status?.toLowerCase() === 'pending') {
            this.initializeSignaturePad();
        }
    }

    initializeSignaturePad() {
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

    clearBoardMemberSignature() {
        this.boardMemberSignaturePad.clear();
    }

    isSignaturePadEmpty(): boolean {
        return !this.boardMemberSignaturePad || this.boardMemberSignaturePad.isEmpty();
    }

    approveRequest(request: JoinRequest) {
        if (!this.boardMemberSignaturePad || this.boardMemberSignaturePad.isEmpty()) {
            return;
        }

        const signatureDataUrl = this.boardMemberSignaturePad.toDataURL('image/png');

        this.isApproving = true;
        fetch(signatureDataUrl)
            .then(res => res.blob())
            .then(signatureBlob => {
                const formData = new FormData();
                formData.append('BoardMemberSignature', signatureBlob, 'signature.png');

                this.membershipRequestsService.approve(request.id, formData).subscribe({
                    next: () => {
                        this.isApproving = false;
                        this.viewDialogVisible = false;
                        this.loadMembershipRequests();
                    },
                    error: (err) => {
                        console.error('Failed to approve request:', err);
                        this.isApproving = false;
                    }
                });
            })
            .catch(() => { this.isApproving = false; });
    }

    rejectRequest(request: JoinRequest) {
        this.isRejecting = true;
        this.membershipRequestsService.reject(request.id, this.rejectionReason || undefined).subscribe({
            next: () => {
                this.isRejecting = false;
                this.rejectionReason = '';
                this.viewDialogVisible = false;
                this.loadMembershipRequests();
            },
            error: (err) => {
                console.error('Failed to reject request:', err);
                this.isRejecting = false;
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
}
