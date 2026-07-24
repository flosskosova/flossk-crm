import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PosService, PosShift } from '@/pages/service/pos.service';

@Component({
    selector: 'app-pos-shifts',
    standalone: true,
    imports: [CommonModule, TableModule, TagModule, ButtonModule, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast />
        <div class="card">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-bold text-surface-900 dark:text-surface-0">Shift History</h2>
                <button pButton icon="pi pi-refresh" label="Refresh" [outlined]="true" size="small" (click)="loadShifts()"></button>
            </div>

            <p-table [value]="shifts()" [paginator]="true" [rows]="20" [loading]="loading()">
                <ng-template pTemplate="header">
                    <tr>
                        <th>Operator</th>
                        <th>Start</th>
                        <th>End</th>
                        <th>Starting Cash</th>
                        <th>Ending Cash</th>
                        <th>Expected Cash</th>
                        <th>Over / Short</th>
                        <th>Sales</th>
                        <th>Donations</th>
                        <th>Orders</th>
                        <th>Status</th>
                    </tr>
                </ng-template>
                <ng-template pTemplate="body" let-s>
                    <tr>
                        <td>{{ s.operatorName }}</td>
                        <td>{{ s.startedAt | date:'short' }}</td>
                        <td>{{ s.endedAt ? (s.endedAt | date:'short') : '-' }}</td>
                        <td>€{{ s.startingCash.toFixed(2) }}</td>
                        <td>{{ s.endingCash != null ? '€' + s.endingCash.toFixed(2) : '-' }}</td>
                        <td>{{ s.expectedCash != null ? '€' + s.expectedCash.toFixed(2) : '-' }}</td>
                        <td>
                            @if (s.endingCash != null && s.expectedCash != null) {
                                @let variance = s.endingCash - s.expectedCash;
                                <span class="font-semibold"
                                    [class.text-green-600]="variance > 0"
                                    [class.text-red-500]="variance < 0"
                                    [class.text-surface-400]="variance === 0">
                                    {{ variance > 0 ? '+' : '' }}€{{ variance.toFixed(2) }}
                                </span>
                            } @else {
                                <span class="text-surface-300">-</span>
                            }
                        </td>
                        <td>{{ s.totalSales != null ? '€' + s.totalSales.toFixed(2) : '-' }}</td>
                        <td>{{ s.totalDonations != null ? '€' + s.totalDonations.toFixed(2) : '-' }}</td>
                        <td>{{ s.orderCount ?? '-' }}</td>
                        <td>
                            <p-tag [value]="s.status === 'open' ? 'Open' : 'Closed'" [severity]="s.status === 'open' ? 'success' : 'secondary'" />
                        </td>
                    </tr>
                </ng-template>
                <ng-template pTemplate="emptymessage">
                    <tr>
                        <td colspan="11">
                            <div class="flex flex-col items-center justify-center text-surface-400 py-8">
                                <i class="pi pi-clock text-3xl mb-2"></i>
                                <span class="text-sm">No shifts recorded yet</span>
                            </div>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>
    `
})
export class PosShifts implements OnInit {
    shifts = signal<PosShift[]>([]);
    loading = signal(false);

    constructor(
        private posService: PosService,
        private messageService: MessageService
    ) {}

    ngOnInit() {
        this.loadShifts();
    }

    loadShifts() {
        this.loading.set(true);
        this.posService.getShifts().subscribe({
            next: (res) => { this.shifts.set(res.data); this.loading.set(false); },
            error: (err) => {
                this.loading.set(false);
                this.messageService.add({ severity: 'error', detail: err.error?.message || 'Failed to load shifts' });
            }
        });
    }
}
