import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PosService, PosCustomer } from '@/pages/service/pos.service';

@Component({
    selector: 'app-pos-customers',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, TableModule, DialogModule, InputTextModule, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast />
        <div class="card">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-bold text-surface-900 dark:text-surface-0">Customers</h2>
                <button pButton label="New Customer" icon="pi pi-user-plus" (click)="showDialog = true; editingCustomer = null; form = {firstName:'',lastName:'',email:''}"></button>
            </div>

            <div class="mb-4">
                <span class="relative block max-w-md">
                    <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 text-sm"></i>
                    <input pInputText [(ngModel)]="search" placeholder="Search customers..." class="w-full pl-8"
                        (input)="loadCustomers()" />
                </span>
            </div>

            <p-table [value]="customers()" [paginator]="true" [rows]="20" [loading]="loading()">
                <ng-template pTemplate="header">
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Total Spent</th>
                        <th>Visits</th>
                        <th>Last Visit</th>
                        <th class="text-right">Actions</th>
                    </tr>
                </ng-template>
                <ng-template pTemplate="body" let-c>
                    <tr>
                        <td class="font-medium text-surface-900 dark:text-surface-0">{{ c.firstName }} {{ c.lastName }}</td>
                        <td class="text-surface-500">{{ c.email || '-' }}</td>
                        <td>€{{ c.totalSpent.toFixed(2) }}</td>
                        <td>{{ c.visitCount }}</td>
                        <td>{{ c.lastVisitAt ? (c.lastVisitAt | date:'short') : '-' }}</td>
                        <td class="text-right">
                            <button pButton icon="pi pi-pencil" class="p-button-sm p-button-text" (click)="editCustomer(c)"></button>
                        </td>
                    </tr>
                </ng-template>
                <ng-template pTemplate="emptymessage">
                    <tr>
                        <td colspan="6">
                            <div class="flex flex-col items-center justify-center text-surface-400 py-8">
                                <i class="pi pi-users text-3xl mb-2"></i>
                                <span class="text-sm">No customers found</span>
                            </div>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <p-dialog [header]="editingCustomer ? 'Edit Customer' : 'New Customer'" [(visible)]="showDialog" [modal]="true" [style]="{ width: '400px' }" [breakpoints]="{ '575px': '95vw' }">
            <div class="space-y-3">
                <div>
                    <label class="block text-sm font-medium mb-1">First Name</label>
                    <input pInputText [(ngModel)]="form.firstName" class="w-full" />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Last Name</label>
                    <input pInputText [(ngModel)]="form.lastName" class="w-full" />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Email</label>
                    <input pInputText [(ngModel)]="form.email" class="w-full" />
                </div>
                <div class="flex gap-2 justify-end pt-2 border-t border-surface-200 dark:border-surface-700">
                    <button pButton label="Cancel" [outlined]="true" (click)="showDialog = false"></button>
                    <button pButton [label]="editingCustomer ? 'Update' : 'Create'" [loading]="saving()" (click)="saveCustomer()"></button>
                </div>
            </div>
        </p-dialog>
    `
})
export class PosCustomers implements OnInit {
    customers = signal<PosCustomer[]>([]);
    loading = signal(false);
    saving = signal(false);
    search = '';
    showDialog = false;
    editingCustomer: PosCustomer | null = null;
    form = { firstName: '', lastName: '', email: '' };

    constructor(
        private posService: PosService,
        private messageService: MessageService
    ) {}

    ngOnInit() {
        this.loadCustomers();
    }

    loadCustomers() {
        this.loading.set(true);
        this.posService.getCustomers(this.search || undefined).subscribe({
            next: (c) => { this.customers.set(c); this.loading.set(false); },
            error: () => this.loading.set(false)
        });
    }

    editCustomer(c: PosCustomer) {
        this.editingCustomer = c;
        this.form = { firstName: c.firstName, lastName: c.lastName, email: c.email || '' };
        this.showDialog = true;
    }

    saveCustomer() {
        this.saving.set(true);
        const done = () => { this.saving.set(false); this.showDialog = false; this.loadCustomers(); };
        if (this.editingCustomer) {
            this.posService.updateCustomer(this.editingCustomer.id, this.form).subscribe({
                next: () => { this.messageService.add({ severity: 'success', detail: 'Customer updated' }); done(); },
                error: (err) => { this.saving.set(false); this.messageService.add({ severity: 'error', detail: err.error?.message || 'Failed' }); }
            });
        } else {
            this.posService.createCustomer(this.form).subscribe({
                next: () => { this.messageService.add({ severity: 'success', detail: 'Customer created' }); done(); },
                error: (err) => { this.saving.set(false); this.messageService.add({ severity: 'error', detail: err.error?.message || 'Failed' }); }
            });
        }
    }
}
