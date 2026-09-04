import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { TabsModule } from 'primeng/tabs';
import { PosService, PosPaymentLog, PosDonationLog } from '@/pages/service/pos.service';

@Component({
    selector: 'app-pos-payment-logs',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, TableModule, InputTextModule, TabsModule],
    template: `
        <div class="card">
            <h2 class="text-xl font-bold text-surface-900 dark:text-surface-0 mb-4">Payment Logs</h2>
            <p class="text-sm text-surface-400 mb-4">All transactions are permanently logged and cannot be deleted.</p>

            <p-tabs value="0">
                <p-tablist>
                    <p-tab value="0">All Payments</p-tab>
                    <p-tab value="1">Donations Only</p-tab>
                </p-tablist>
                <p-tabpanels>
                    <p-tabpanel value="0">
                        <p-table [value]="logs()" [paginator]="true" [rows]="20" [totalRecords]="total()" [lazy]="true"
                            (onLazyLoad)="loadLogs($event)" [loading]="loading()">
                            <ng-template pTemplate="caption">
                                <div class="flex gap-2 items-center">
                                    <input pInputText [(ngModel)]="fromDate" type="date" class="text-sm" (change)="refresh()" />
                                    <span class="text-surface-400">to</span>
                                    <input pInputText [(ngModel)]="toDate" type="date" class="text-sm" (change)="refresh()" />
                                    <button pButton icon="pi pi-refresh" label="Refresh" [outlined]="true" class="p-button-sm" (click)="refresh()"></button>
                                </div>
                            </ng-template>
                            <ng-template pTemplate="header">
                                <tr>
                                    <th>Order #</th>
                                    <th>Customer</th>
                                    <th>Operator</th>
                                    <th>Subtotal</th>
                                    <th>Donation</th>
                                    <th>Total</th>
                                    <th>Given</th>
                                    <th>Change</th>
                                    <th>Method</th>
                                    <th>Date</th>
                                </tr>
                            </ng-template>
                            <ng-template pTemplate="body" let-l>
                                <tr>
                                    <td class="font-medium text-surface-900 dark:text-surface-0">{{ l.orderNumber }}</td>
                                    <td>{{ l.customerName || '-' }}</td>
                                    <td>{{ l.operatorName }}</td>
                                    <td>€{{ l.subtotal.toFixed(2) }}</td>
                                    <td>€{{ l.donation.toFixed(2) }}</td>
                                    <td><strong>€{{ l.total.toFixed(2) }}</strong></td>
                                    <td>€{{ l.amountGiven.toFixed(2) }}</td>
                                    <td>€{{ l.change.toFixed(2) }}</td>
                                    <td>{{ l.paymentMethod }}</td>
                                    <td>{{ l.createdAt | date:'short' }}</td>
                                </tr>
                            </ng-template>
                            <ng-template pTemplate="emptymessage">
                                <tr>
                                    <td colspan="10">
                                        <div class="flex flex-col items-center justify-center text-surface-400 py-8">
                                            <i class="pi pi-receipt text-3xl mb-2"></i>
                                            <span class="text-sm">No payments in this range</span>
                                        </div>
                                    </td>
                                </tr>
                            </ng-template>
                        </p-table>
                    </p-tabpanel>
                    <p-tabpanel value="1">
                        <p-table [value]="donationLogs()" [paginator]="true" [rows]="20" [totalRecords]="donationTotal()" [lazy]="true"
                            (onLazyLoad)="loadDonationLogs($event)" [loading]="donationLoading()">
                            <ng-template pTemplate="caption">
                                <div class="flex gap-2 items-center">
                                    <input pInputText [(ngModel)]="donationFromDate" type="date" class="text-sm" (change)="refreshDonations()" />
                                    <span class="text-surface-400">to</span>
                                    <input pInputText [(ngModel)]="donationToDate" type="date" class="text-sm" (change)="refreshDonations()" />
                                    <button pButton icon="pi pi-refresh" label="Refresh" [outlined]="true" class="p-button-sm" (click)="refreshDonations()"></button>
                                </div>
                            </ng-template>
                            <ng-template pTemplate="header">
                                <tr>
                                    <th>Order #</th>
                                    <th>Customer</th>
                                    <th>Operator</th>
                                    <th>Donation</th>
                                    <th>Subtotal</th>
                                    <th>Total</th>
                                    <th>Method</th>
                                    <th>Date</th>
                                </tr>
                            </ng-template>
                            <ng-template pTemplate="body" let-l>
                                <tr>
                                    <td class="font-medium text-surface-900 dark:text-surface-0">{{ l.orderNumber }}</td>
                                    <td>{{ l.customerName || '-' }}</td>
                                    <td>{{ l.operatorName }}</td>
                                    <td><strong class="text-green-600">€{{ l.donation.toFixed(2) }}</strong></td>
                                    <td>€{{ l.subtotal.toFixed(2) }}</td>
                                    <td>€{{ l.total.toFixed(2) }}</td>
                                    <td>{{ l.paymentMethod }}</td>
                                    <td>{{ l.createdAt | date:'short' }}</td>
                                </tr>
                            </ng-template>
                            <ng-template pTemplate="emptymessage">
                                <tr>
                                    <td colspan="8">
                                        <div class="flex flex-col items-center justify-center text-surface-400 py-8">
                                            <i class="pi pi-heart text-3xl mb-2"></i>
                                            <span class="text-sm">No donations in this range</span>
                                        </div>
                                    </td>
                                </tr>
                            </ng-template>
                        </p-table>
                    </p-tabpanel>
                </p-tabpanels>
            </p-tabs>
        </div>
    `
})
export class PosPaymentLogs implements OnInit {
    // All payments
    logs = signal<PosPaymentLog[]>([]);
    total = signal(0);
    loading = signal(false);
    fromDate = '';
    toDate = '';
    page = 1;
    pageSize = 20;

    // Donation-only
    donationLogs = signal<PosDonationLog[]>([]);
    donationTotal = signal(0);
    donationLoading = signal(false);
    donationFromDate = '';
    donationToDate = '';
    donationPage = 1;

    constructor(private posService: PosService) {}

    ngOnInit() {
        this.loadLogs({ first: 0, rows: 20 });
        this.loadDonationLogs({ first: 0, rows: 20 });
    }

    loadLogs(event: any) {
        this.loading.set(true);
        this.page = Math.floor(event.first / event.rows) + 1;
        this.pageSize = event.rows;
        const from = this.fromDate ? new Date(this.fromDate).toISOString() : undefined;
        const to = this.toDate ? new Date(this.toDate + 'T23:59:59').toISOString() : undefined;
        this.posService.getPaymentLogs(from, to, this.page, this.pageSize).subscribe({
            next: (res) => { this.logs.set(res.data); this.total.set(res.total); this.loading.set(false); },
            error: () => this.loading.set(false)
        });
    }

    loadDonationLogs(event: any) {
        this.donationLoading.set(true);
        this.donationPage = Math.floor(event.first / event.rows) + 1;
        const from = this.donationFromDate ? new Date(this.donationFromDate).toISOString() : undefined;
        const to = this.donationToDate ? new Date(this.donationToDate + 'T23:59:59').toISOString() : undefined;
        this.posService.getDonationLogs(from, to, this.donationPage, event.rows || 20).subscribe({
            next: (res) => { this.donationLogs.set(res.data); this.donationTotal.set(res.total); this.donationLoading.set(false); },
            error: () => this.donationLoading.set(false)
        });
    }

    refresh() {
        this.loadLogs({ first: 0, rows: this.pageSize });
    }

    refreshDonations() {
        this.loadDonationLogs({ first: 0, rows: 20 });
    }
}
