import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { PosService, PosAnalytics as PosAnalyticsData } from '@/pages/service/pos.service';

@Component({
    selector: 'app-pos-analytics',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, TableModule, InputTextModule],
    template: `
        <div class="card">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-bold text-surface-900 dark:text-surface-0">Analytics</h2>
                <div class="flex gap-2 items-center">
                    <input pInputText [(ngModel)]="fromDate" type="date" class="text-sm" (change)="loadAnalytics()" />
                    <span class="text-surface-400">to</span>
                    <input pInputText [(ngModel)]="toDate" type="date" class="text-sm" (change)="loadAnalytics()" />
                    <button pButton icon="pi pi-refresh" label="Refresh" [outlined]="true" [loading]="loading()" class="p-button-sm" (click)="loadAnalytics()"></button>
                </div>
            </div>

            @if (analytics(); as a) {
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div class="bg-primary/10 rounded-xl p-4">
                        <div class="text-2xl font-bold text-primary">€{{ a.totalRevenue.toFixed(2) }}</div>
                        <div class="text-sm text-surface-500 mt-0.5">Total Revenue</div>
                    </div>
                    <div class="bg-green-500/10 rounded-xl p-4">
                        <div class="text-2xl font-bold text-green-600">€{{ a.totalDonations.toFixed(2) }}</div>
                        <div class="text-sm text-surface-500 mt-0.5">Total Donations</div>
                    </div>
                    <div class="bg-orange-500/10 rounded-xl p-4">
                        <div class="text-2xl font-bold text-orange-600">{{ a.totalOrders }}</div>
                        <div class="text-sm text-surface-500 mt-0.5">Total Orders</div>
                    </div>
                    <div class="bg-purple-500/10 rounded-xl p-4">
                        <div class="text-2xl font-bold text-purple-600">€{{ a.averageOrderValue.toFixed(2) }}</div>
                        <div class="text-sm text-surface-500 mt-0.5">Avg Order Value</div>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-6">
                    <div>
                        <h3 class="font-bold text-surface-900 dark:text-surface-0 mb-2">Current Month Summary</h3>
                        <p-table [value]="[a.currentMonth]" [paginator]="false">
                            <ng-template pTemplate="header">
                                <tr>
                                    <th>Sales</th>
                                    <th>Donations</th>
                                    <th>Revenue</th>
                                    <th>Orders</th>
                                    <th>Customers</th>
                                    <th>Avg/Order</th>
                                </tr>
                            </ng-template>
                            <ng-template pTemplate="body" let-m>
                                <tr>
                                    <td>€{{ m.totalSales.toFixed(2) }}</td>
                                    <td>€{{ m.totalDonations.toFixed(2) }}</td>
                                    <td>€{{ m.totalRevenue.toFixed(2) }}</td>
                                    <td>{{ m.orderCount }}</td>
                                    <td>{{ m.customerCount }}</td>
                                    <td>€{{ m.averageOrderValue.toFixed(2) }}</td>
                                </tr>
                            </ng-template>
                        </p-table>
                    </div>

                    <div>
                        <h3 class="font-bold text-surface-900 dark:text-surface-0 mb-2">Payment Methods</h3>
                        <p-table [value]="a.paymentMethodBreakdown" [paginator]="false">
                            <ng-template pTemplate="header">
                                <tr>
                                    <th>Method</th>
                                    <th>Total</th>
                                    <th>Count</th>
                                </tr>
                            </ng-template>
                            <ng-template pTemplate="body" let-p>
                                <tr>
                                    <td>{{ p.method }}</td>
                                    <td>€{{ p.total.toFixed(2) }}</td>
                                    <td>{{ p.count }}</td>
                                </tr>
                            </ng-template>
                        </p-table>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-6 mt-6">
                    <div>
                        <h3 class="font-bold text-surface-900 dark:text-surface-0 mb-2">Top Products</h3>
                        <p-table [value]="a.topProducts" [paginator]="false">
                            <ng-template pTemplate="header">
                                <tr>
                                    <th>Product</th>
                                    <th>Sold</th>
                                    <th>Revenue</th>
                                </tr>
                            </ng-template>
                            <ng-template pTemplate="body" let-p>
                                <tr>
                                    <td>{{ p.productName }}</td>
                                    <td>{{ p.totalQuantity }}</td>
                                    <td>€{{ p.totalRevenue.toFixed(2) }}</td>
                                </tr>
                            </ng-template>
                        </p-table>
                    </div>

                    <div>
                        <h3 class="font-bold text-surface-900 dark:text-surface-0 mb-2">Top Customers</h3>
                        <p-table [value]="a.topCustomers" [paginator]="false">
                            <ng-template pTemplate="header">
                                <tr>
                                    <th>Customer</th>
                                    <th>Spent</th>
                                    <th>Visits</th>
                                </tr>
                            </ng-template>
                            <ng-template pTemplate="body" let-c>
                                <tr>
                                    <td>{{ c.customerName }}</td>
                                    <td>€{{ c.totalSpent.toFixed(2) }}</td>
                                    <td>{{ c.visitCount }}</td>
                                </tr>
                            </ng-template>
                        </p-table>
                    </div>
                </div>

                @if (a.peakHours.length > 0) {
                    <div class="mt-6">
                        <h3 class="font-bold text-surface-900 dark:text-surface-0 mb-2">Peak Hours</h3>
                        <p-table [value]="a.peakHours" [paginator]="false">
                            <ng-template pTemplate="header">
                                <tr>
                                    <th>Hour</th>
                                    <th>Orders</th>
                                    <th>Revenue</th>
                                </tr>
                            </ng-template>
                            <ng-template pTemplate="body" let-h>
                                <tr>
                                    <td>{{ h.hour }}:00</td>
                                    <td>{{ h.orderCount }}</td>
                                    <td>€{{ h.revenue.toFixed(2) }}</td>
                                </tr>
                            </ng-template>
                        </p-table>
                    </div>
                }

                <div class="mt-6">
                    <h3 class="font-bold text-surface-900 dark:text-surface-0 mb-2">Monthly History</h3>
                    <p-table [value]="a.monthlyHistory" [paginator]="false">
                        <ng-template pTemplate="header">
                            <tr>
                                <th>Month</th>
                                <th>Sales</th>
                                <th>Donations</th>
                                <th>Revenue</th>
                                <th>Orders</th>
                                <th>Customers</th>
                                <th>Avg/Order</th>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-m>
                            <tr>
                                <td>{{ m.month }}/{{ m.year }}</td>
                                <td>€{{ m.totalSales.toFixed(2) }}</td>
                                <td>€{{ m.totalDonations.toFixed(2) }}</td>
                                <td>€{{ m.totalRevenue.toFixed(2) }}</td>
                                <td>{{ m.orderCount }}</td>
                                <td>{{ m.customerCount }}</td>
                                <td>€{{ m.averageOrderValue.toFixed(2) }}</td>
                            </tr>
                        </ng-template>
                    </p-table>
                </div>

                <div class="mt-6">
                    <h3 class="font-bold text-surface-900 dark:text-surface-0 mb-2">Daily Sales (Last 30 Days)</h3>
                    <p-table [value]="a.dailySales" [paginator]="false">
                        <ng-template pTemplate="header">
                            <tr>
                                <th>Date</th>
                                <th>Sales</th>
                                <th>Donations</th>
                                <th>Orders</th>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-d>
                            <tr>
                                <td>{{ d.date | date:'mediumDate' }}</td>
                                <td>€{{ d.totalSales.toFixed(2) }}</td>
                                <td>€{{ d.totalDonations.toFixed(2) }}</td>
                                <td>{{ d.orderCount }}</td>
                            </tr>
                        </ng-template>
                    </p-table>
                </div>
            } @else {
                <div class="flex flex-col items-center justify-center text-surface-400 py-16">
                    <i class="pi pi-spin pi-spinner text-3xl mb-2"></i>
                    <span class="text-sm">Loading analytics...</span>
                </div>
            }
        </div>
    `
})
export class PosAnalytics implements OnInit {
    analytics = signal<PosAnalyticsData | null>(null);
    loading = signal(false);
    fromDate = '';
    toDate = '';

    constructor(private posService: PosService) {}

    ngOnInit() {
        this.loadAnalytics();
    }

    loadAnalytics() {
        this.loading.set(true);
        const from = this.fromDate ? new Date(this.fromDate).toISOString() : undefined;
        const to = this.toDate ? new Date(this.toDate + 'T23:59:59').toISOString() : undefined;
        this.posService.getAnalytics(from, to).subscribe({
            next: (a) => { this.analytics.set(a); this.loading.set(false); },
            error: () => this.loading.set(false)
        });
    }
}
