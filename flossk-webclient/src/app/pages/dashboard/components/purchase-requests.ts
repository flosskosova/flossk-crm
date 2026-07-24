import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PurchaseRequestsService, PurchaseRequest } from '@/pages/service/purchase-requests.service';

@Component({
    selector: 'app-purchase-requests',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ButtonModule, TableModule, DialogModule, InputTextModule,
        TextareaModule, InputNumberModule, DatePickerModule, TagModule, ToastModule
    ],
    providers: [MessageService],
    template: `
        <p-toast />
        <div class="card">
            <div class="flex items-center justify-between mb-4">
                <div>
                    <h2 class="text-xl font-bold text-surface-900 dark:text-surface-0">Purchase Requests</h2>
                    <p class="text-sm text-surface-500 mt-0.5">Request something to buy — the board will review it.</p>
                </div>
                <button pButton label="New Request" icon="pi pi-plus" (click)="openCreate()"></button>
            </div>

            <p-table [value]="requests()" [paginator]="true" [rows]="15" [loading]="loading()">
                <ng-template pTemplate="header">
                    <tr>
                        <th>Item</th>
                        <th>Price</th>
                        <th>Qty</th>
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
                        <td>€{{ r.price.toFixed(2) }}</td>
                        <td>{{ r.quantity }}</td>
                        <td class="font-semibold">€{{ r.total.toFixed(2) }}</td>
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
                        <td colspan="8">
                            <div class="flex flex-col items-center justify-center text-surface-400 py-8">
                                <i class="pi pi-shopping-bag text-3xl mb-2"></i>
                                <span class="text-sm">You haven't submitted any requests yet</span>
                            </div>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <!-- Create dialog -->
        <p-dialog header="New Purchase Request" [(visible)]="showCreate" [modal]="true" [style]="{ width: '480px' }" [breakpoints]="{ '575px': '95vw' }">
            <div class="space-y-3">
                <div>
                    <label class="block text-sm font-medium mb-1">Item Name <span class="text-red-500">*</span></label>
                    <input pInputText [(ngModel)]="form.itemName" class="w-full" placeholder="What do you want to buy?" />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Reason <span class="text-red-500">*</span></label>
                    <textarea pTextarea [(ngModel)]="form.reason" rows="3" class="w-full" placeholder="Why is this needed?"></textarea>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Link (where to buy)</label>
                    <input pInputText [(ngModel)]="form.link" class="w-full" placeholder="https://..." />
                </div>
                <div class="flex flex-col sm:flex-row gap-3">
                    <div class="flex-1">
                        <label class="block text-sm font-medium mb-1">Price (€) <span class="text-red-500">*</span></label>
                        <p-inputNumber [(ngModel)]="form.price" [min]="0" mode="currency" currency="EUR" styleClass="w-full"></p-inputNumber>
                    </div>
                    <div class="flex-1">
                        <label class="block text-sm font-medium mb-1">Quantity <span class="text-red-500">*</span></label>
                        <p-inputNumber [(ngModel)]="form.quantity" [min]="1" styleClass="w-full"></p-inputNumber>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Needed By <span class="text-red-500">*</span></label>
                    <p-datepicker [(ngModel)]="form.neededByDate" [showIcon]="true" dateFormat="M d, yy" styleClass="w-full" [minDate]="today"></p-datepicker>
                </div>
                <div class="flex gap-2 justify-end pt-2 border-t border-surface-200 dark:border-surface-700">
                    <button pButton label="Cancel" [outlined]="true" (click)="showCreate = false"></button>
                    <button pButton label="Submit Request" icon="pi pi-send" [loading]="saving()" (click)="submit()"></button>
                </div>
            </div>
        </p-dialog>

        <!-- View dialog -->
        <p-dialog header="Request Details" [(visible)]="showView" [modal]="true" [style]="{ width: '460px' }" [breakpoints]="{ '575px': '95vw' }">
            @if (selected(); as r) {
                <div class="space-y-3 text-sm">
                    <div class="flex justify-between"><span class="text-surface-500">Item</span><span class="font-medium">{{ r.itemName }}</span></div>
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
                    @if (r.status === 'Rejected' && r.rejectionReason) {
                        <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                            <span class="text-xs font-medium text-red-600 dark:text-red-400">Rejection reason</span>
                            <p class="text-sm text-surface-800 dark:text-surface-200 mt-1">{{ r.rejectionReason }}</p>
                        </div>
                    }
                </div>
            }
        </p-dialog>
    `
})
export class PurchaseRequests implements OnInit {
    requests = signal<PurchaseRequest[]>([]);
    loading = signal(false);
    saving = signal(false);
    selected = signal<PurchaseRequest | null>(null);

    showCreate = false;
    showView = false;
    today = new Date();
    form = { itemName: '', reason: '', link: '', price: 0, quantity: 1, neededByDate: null as Date | null };

    constructor(
        private service: PurchaseRequestsService,
        private messageService: MessageService
    ) {}

    ngOnInit() {
        this.load();
    }

    load() {
        this.loading.set(true);
        this.service.getMine().subscribe({
            next: (res) => { this.requests.set(res.requests); this.loading.set(false); },
            error: () => this.loading.set(false)
        });
    }

    openCreate() {
        this.form = { itemName: '', reason: '', link: '', price: 0, quantity: 1, neededByDate: null };
        this.showCreate = true;
    }

    view(r: PurchaseRequest) {
        this.selected.set(r);
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

    submit() {
        if (!this.form.itemName.trim() || !this.form.reason.trim() || !this.form.neededByDate) {
            this.messageService.add({ severity: 'warn', detail: 'Please fill in item name, reason, and needed-by date.' });
            return;
        }
        this.saving.set(true);
        this.service.create({
            itemName: this.form.itemName,
            reason: this.form.reason,
            link: this.form.link || undefined,
            price: this.form.price,
            quantity: this.form.quantity,
            neededByDate: (this.form.neededByDate as Date).toISOString()
        }).subscribe({
            next: () => {
                this.saving.set(false);
                this.showCreate = false;
                this.messageService.add({ severity: 'success', detail: 'Request submitted' });
                this.load();
            },
            error: (err) => {
                this.saving.set(false);
                this.messageService.add({ severity: 'error', detail: err.error?.message || 'Failed to submit' });
            }
        });
    }
}
