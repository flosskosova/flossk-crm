import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PosService, PosOperator } from '@/pages/service/pos.service';

@Component({
    selector: 'app-pos-operators',
    standalone: true,
    imports: [CommonModule, ButtonModule, TableModule, ToastModule, TagModule, ConfirmDialogModule],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast />
        <p-confirmdialog />
        <div class="card">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-bold text-surface-900 dark:text-surface-0">POS Operators</h2>
            </div>

            <p class="text-sm text-surface-500 mb-4">Only Full Members and other non-board roles can be assigned as POS operators. Admins and Leaders are excluded.</p>

            <p-table [value]="eligibleOperators()" [paginator]="true" [rows]="20" [loading]="loading()">
                <ng-template pTemplate="header">
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Roles</th>
                        <th>Status</th>
                        <th class="text-right">Actions</th>
                    </tr>
                </ng-template>
                <ng-template pTemplate="body" let-op>
                    <tr>
                        <td class="font-medium text-surface-900 dark:text-surface-0">{{ op.firstName }} {{ op.lastName }}</td>
                        <td class="text-surface-500">{{ op.email }}</td>
                        <td>
                            <div class="flex gap-1 flex-wrap">
                                @for (role of op.roles; track role) {
                                    <p-tag [value]="role" severity="info" />
                                }
                            </div>
                        </td>
                        <td>
                            <p-tag [value]="op.isPosOperator ? 'Operator' : 'Not Assigned'"
                                [severity]="op.isPosOperator ? 'success' : 'secondary'" />
                        </td>
                        <td class="text-right">
                            @if (op.isPosOperator) {
                                <button pButton label="Remove" icon="pi pi-user-minus" severity="danger" [outlined]="true" class="p-button-sm"
                                    (click)="confirmRemove(op)"></button>
                            } @else {
                                <button pButton label="Add as Operator" icon="pi pi-user-plus" [outlined]="true" class="p-button-sm"
                                    (click)="addOperator(op)"></button>
                            }
                        </td>
                    </tr>
                </ng-template>
                <ng-template pTemplate="emptymessage">
                    <tr>
                        <td colspan="5">
                            <div class="flex flex-col items-center justify-center text-surface-400 py-8">
                                <i class="pi pi-users text-3xl mb-2"></i>
                                <span class="text-sm">No eligible members found</span>
                            </div>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>
    `
})
export class PosOperators implements OnInit {
    operators = signal<PosOperator[]>([]);
    loading = signal(false);

    eligibleOperators = computed(() =>
        this.operators().filter(op => !op.roles || (!op.roles.includes('Admin') && !op.roles.includes('Leader')))
    );

    constructor(
        private posService: PosService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadOperators();
    }

    loadOperators() {
        this.loading.set(true);
        this.posService.getOperators().subscribe({
            next: (ops) => { this.operators.set(ops); this.loading.set(false); },
            error: () => this.loading.set(false)
        });
    }

    addOperator(op: PosOperator) {
        this.posService.addOperator(op.id).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', detail: `${op.firstName} ${op.lastName} is now a POS operator` });
                this.loadOperators();
            },
            error: () => this.messageService.add({ severity: 'error', detail: 'Failed to add operator' })
        });
    }

    confirmRemove(op: PosOperator) {
        this.confirmationService.confirm({
            message: `Remove ${op.firstName} ${op.lastName} as POS operator?`,
            accept: () => {
                this.posService.removeOperator(op.id).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', detail: 'Operator removed' });
                        this.loadOperators();
                    },
                    error: () => this.messageService.add({ severity: 'error', detail: 'Failed to remove operator' })
                });
            }
        });
    }
}
