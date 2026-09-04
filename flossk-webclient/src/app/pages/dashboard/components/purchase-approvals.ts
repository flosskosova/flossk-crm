import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PurchaseRequestsService, PurchaseRequest } from '@/pages/service/purchase-requests.service';

@Component({
    selector: 'app-purchase-approvals',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ButtonModule, TableModule, DialogModule,
        TextareaModule, TagModule, SelectButtonModule, ToastModule
    ],
    providers: [MessageService],
    template: `
        <p-toast />
        <div class="card">
            <div class="flex items-center justify-between mb-4">
                <div>
                    <h2 class="text-xl font-bold text-surface-900 dark:text-surface-0">Purchase Approvals</h2>
                    <p class="text-sm text-surface-500 mt-0.5">Review and decide on purchase requests from members.</p>
                </div>
                <p-selectButton [options]="statusOptions" [(ngModel)]="filter" optionLabel="label" optionValue="value"
                    (onChange)="load()" [allowEmpty]="false" />
            </div>

            <p-table [value]="requests()" [paginator]="true" [rows]="15" [loading]="loading()">
                <ng-template pTemplate="header">
                    <tr>
                        <th>Item</th>
                        <th>Requested By</th>
                        <th>Total</th>
                        <th>Needed By</th>
                        <th>Submitted</th>
                        <th>Status</th>
                        <th></th>
                    </tr>
                </ng-template>
                <ng-template pTemplate="body" let-r>
                    <tr>
                        <td class="font-medium text-surface-900 dark:text-surface-0">{{ r.itemName }}</td>
                        <td>{{ r.createdByFirstName }} {{ r.createdByLastName }}</td>
                        <td class="font-semibold">€{{ r.total.toFixed(2) }} <span class="text-xs text-surface-400 font-normal">({{ r.quantity }} × €{{ r.price.toFixed(2) }})</span></td>
                        <td>{{ r.neededByDate | date:'mediumDate' }}</td>
                        <td>{{ r.createdAt | date:'short' }}</td>
                        <td>
                            <p-tag [value]="r.status" [severity]="statusSeverity(r.status)" />
                        </td>
                        <td>
                            <button pButton icon="pi pi-eye" class="p-button-sm p-button-text" (click)="view(r)"></button>
                        </td>
                    </tr>
                </ng-template>
                <ng-template pTemplate="emptymessage">
                    <tr>
                        <td colspan="7">
                            <div class="flex flex-col items-center justify-center text-surface-400 py-8">
                                <i class="pi pi-check-square text-3xl mb-2"></i>
                                <span class="text-sm">No requests here</span>
                            </div>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <p-dialog header="Purchase Request" [(visible)]="showView" [modal]="true" [style]="{ width: '480px' }" [breakpoints]="{ '575px': '95vw' }">
            @if (selected(); as r) {
                <div class="space-y-3 text-sm">
                    <div class="flex justify-between"><span class="text-surface-500">Item</span><span class="font-medium">{{ r.itemName }}</span></div>
                    <div class="flex justify-between"><span class="text-surface-500">Requested by</span><span>{{ r.createdByFirstName }} {{ r.createdByLastName }}</span></div>
                    <div class="flex justify-between"><span class="text-surface-500">Price</span><span>€{{ r.price.toFixed(2) }}</span></div>
                    <div class="flex justify-between"><span class="text-surface-500">Quantity</span><span>{{ r.quantity }}</span></div>
                    <div class="flex justify-between font-semibold"><span class="text-surface-500">Total</span><span>€{{ r.total.toFixed(2) }}</span></div>
                    <div class="flex justify-between"><span class="text-surface-500">Needed By</span><span>{{ r.neededByDate | date:'mediumDate' }}</span></div>
                    <div>
                        <span class="text-surface-500">Reason</span>
                        <p class="mt-1 text-surface-800 dark:text-surface-200">{{ r.reason }}</p>
                    </div>
                    @if (r.link) {
                        <div>
                            <span class="text-surface-500">Link</span>
                            <a [href]="r.link" target="_blank" rel="noopener" class="block mt-1 text-primary hover:underline break-all">{{ r.link }}</a>
                        </div>
                    }
                    <div class="flex justify-between items-center pt-2 border-t border-surface-200 dark:border-surface-700">
                        <span class="text-surface-500">Status</span>
                        <p-tag [value]="r.status" [severity]="statusSeverity(r.status)" />
                    </div>

                    @if (r.status === 'Pending') {
                        @if (rejecting) {
                            <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-3 space-y-2">
                                <label class="block text-sm font-medium">Rejection reason (optional)</label>
                                <textarea pTextarea [(ngModel)]="rejectReason" rows="3" class="w-full" placeholder="Why is this being rejected?"></textarea>
                                <div class="flex gap-2 justify-end">
                                    <button pButton label="Back" [outlined]="true" size="small" (click)="rejecting = false"></button>
                                    <button pButton label="Confirm Reject" icon="pi pi-times" severity="danger" size="small" [loading]="acting()" (click)="doReject(r)"></button>
                                </div>
                            </div>
                        } @else {
                            <div class="flex gap-2 justify-end pt-2 border-t border-surface-200 dark:border-surface-700">
                                <button pButton label="Reject" icon="pi pi-times" severity="danger" [outlined]="true" (click)="rejecting = true"></button>
                                <button pButton label="Approve" icon="pi pi-check" severity="success" [loading]="acting()" (click)="doApprove(r)"></button>
                            </div>
                        }
                    } @else {
                        <div class="text-xs text-surface-500 pt-2 border-t border-surface-200 dark:border-surface-700">
                            Reviewed by {{ r.reviewedByFirstName }} {{ r.reviewedByLastName }} on {{ r.reviewedAt | date:'short' }}
                            @if (r.rejectionReason) {
                                <div class="mt-2 bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-surface-800 dark:text-surface-200">{{ r.rejectionReason }}</div>
                            }
                        </div>
                    }
                </div>
            }
        </p-dialog>
    `
})
export class PurchaseApprovals implements OnInit {
    requests = signal<PurchaseRequest[]>([]);
    loading = signal(false);
    acting = signal(false);
    selected = signal<PurchaseRequest | null>(null);

    showView = false;
    rejecting = false;
    rejectReason = '';
    filter = 'Pending';
    statusOptions = [
        { label: 'Pending', value: 'Pending' },
        { label: 'Approved', value: 'Approved' },
        { label: 'Rejected', value: 'Rejected' },
        { label: 'All', value: '' }
    ];

    constructor(
        private service: PurchaseRequestsService,
        private messageService: MessageService
    ) {}

    ngOnInit() {
        this.load();
    }

    load() {
        this.loading.set(true);
        this.service.getAll(this.filter || undefined).subscribe({
            next: (res) => { this.requests.set(res.requests); this.loading.set(false); },
            error: () => this.loading.set(false)
        });
    }

    view(r: PurchaseRequest) {
        this.selected.set(r);
        this.rejecting = false;
        this.rejectReason = '';
        this.showView = true;
    }

    statusSeverity(status: string): 'success' | 'warn' | 'danger' | 'secondary' {
        switch (status) {
            case 'Approved': return 'success';
            case 'Pending': return 'warn';
            case 'Rejected': return 'danger';
            default: return 'secondary';
        }
    }

    doApprove(r: PurchaseRequest) {
        this.acting.set(true);
        this.service.approve(r.id).subscribe({
            next: () => {
                this.acting.set(false);
                this.showView = false;
                this.messageService.add({ severity: 'success', detail: 'Request approved' });
                this.load();
            },
            error: (err) => {
                this.acting.set(false);
                this.messageService.add({ severity: 'error', detail: err.error?.message || 'Failed to approve' });
            }
        });
    }

    doReject(r: PurchaseRequest) {
        this.acting.set(true);
        this.service.reject(r.id, this.rejectReason || undefined).subscribe({
            next: () => {
                this.acting.set(false);
                this.showView = false;
                this.messageService.add({ severity: 'success', detail: 'Request rejected' });
                this.load();
            },
            error: (err) => {
                this.acting.set(false);
                this.messageService.add({ severity: 'error', detail: err.error?.message || 'Failed to reject' });
            }
        });
    }
}
