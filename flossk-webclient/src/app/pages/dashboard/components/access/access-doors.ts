import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { AccessService, AccessDoor } from '@/pages/service/access.service';

@Component({
    selector: 'app-access-doors',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ButtonModule, TableModule, DialogModule, InputTextModule,
        TextareaModule, TagModule, ToggleSwitchModule, ToastModule, ConfirmDialogModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast />
        <p-confirmDialog />
        <div class="card">
            <div class="flex items-center justify-between gap-3 mb-4">
                <div>
                    <h2 class="text-xl font-bold text-surface-900 dark:text-surface-0">Doors</h2>
                    <p class="text-sm text-surface-500 mt-0.5">Physical doors controlled by ESP32 devices.</p>
                </div>
                <button pButton icon="pi pi-plus" label="Add door" (click)="open()"></button>
            </div>

            <p-table [value]="doors()" [loading]="loading()">
                <ng-template pTemplate="header">
                    <tr><th>Name</th><th>Location</th><th>Devices</th><th>Status</th><th></th></tr>
                </ng-template>
                <ng-template pTemplate="body" let-d>
                    <tr>
                        <td class="font-medium text-surface-900 dark:text-surface-0">{{ d.name }}</td>
                        <td class="text-sm text-surface-500">{{ d.location || '—' }}</td>
                        <td class="text-sm">
                            {{ d.onlineDeviceCount }}/{{ d.deviceCount }} online
                        </td>
                        <td><p-tag [value]="d.isActive ? 'Active' : 'Disabled'" [severity]="d.isActive ? 'success' : 'secondary'" /></td>
                        <td class="text-right whitespace-nowrap">
                            <button pButton icon="pi pi-pencil" class="p-button-sm p-button-text" (click)="open(d)"></button>
                            <button pButton icon="pi pi-trash" class="p-button-sm p-button-text p-button-danger" (click)="remove(d)"></button>
                        </td>
                    </tr>
                </ng-template>
                <ng-template pTemplate="emptymessage"><tr><td colspan="5" class="text-center text-surface-500 py-6">No doors yet.</td></tr></ng-template>
            </p-table>
        </div>

        <p-dialog [header]="form.id ? 'Edit door' : 'Add door'" [(visible)]="show" [modal]="true" [style]="{ width: '440px' }">
            <div class="space-y-3">
                <div>
                    <label class="block text-sm font-medium mb-1">Name <span class="text-red-500">*</span></label>
                    <input pInputText [(ngModel)]="form.name" class="w-full" placeholder="Front door" />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Location</label>
                    <input pInputText [(ngModel)]="form.location" class="w-full" placeholder="Ground floor" />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Description</label>
                    <textarea pTextarea [(ngModel)]="form.description" rows="2" class="w-full"></textarea>
                </div>
                <div class="flex items-center gap-2">
                    <p-toggleswitch [(ngModel)]="form.isActive" inputId="doorActive" />
                    <label for="doorActive" class="text-sm">Active (door can unlock)</label>
                </div>
                <div class="flex gap-2 justify-end pt-2 border-t border-surface-200 dark:border-surface-700">
                    <button pButton label="Cancel" [outlined]="true" (click)="show = false"></button>
                    <button pButton label="Save" [loading]="saving()" (click)="save()"></button>
                </div>
            </div>
        </p-dialog>
    `
})
export class AccessDoors implements OnInit {
    private svc = inject(AccessService);
    private toast = inject(MessageService);
    private confirm = inject(ConfirmationService);

    doors = signal<AccessDoor[]>([]);
    loading = signal(false);
    saving = signal(false);
    show = false;
    form: { id: string | null; name: string; location: string; description: string; isActive: boolean } = this.blank();

    ngOnInit() { this.load(); }

    load() {
        this.loading.set(true);
        this.svc.getDoors().subscribe({
            next: d => { this.doors.set(d); this.loading.set(false); },
            error: () => { this.loading.set(false); this.err('Failed to load doors'); }
        });
    }

    blank() { return { id: null, name: '', location: '', description: '', isActive: true }; }
    open(d?: AccessDoor) {
        this.form = d
            ? { id: d.id, name: d.name, location: d.location ?? '', description: d.description ?? '', isActive: d.isActive }
            : this.blank();
        this.show = true;
    }

    save() {
        if (!this.form.name.trim()) { this.err('Name is required'); return; }
        this.saving.set(true);
        const body = { name: this.form.name.trim(), location: this.form.location.trim(), description: this.form.description.trim(), isActive: this.form.isActive };
        const req = this.form.id ? this.svc.updateDoor(this.form.id, body) : this.svc.createDoor(body);
        req.subscribe({
            next: () => { this.saving.set(false); this.show = false; this.ok('Saved'); this.load(); },
            error: e => { this.saving.set(false); this.err(e?.error?.message ?? 'Failed'); }
        });
    }

    remove(d: AccessDoor) {
        this.confirm.confirm({
            header: 'Delete door',
            message: `Delete "${d.name}" and its ${d.deviceCount} device(s)?`,
            accept: () => this.svc.deleteDoor(d.id).subscribe({ next: () => { this.ok('Deleted'); this.load(); }, error: e => this.err(e?.error?.message ?? 'Failed') })
        });
    }

    private ok(detail: string) { this.toast.add({ severity: 'success', summary: 'Done', detail, life: 2500 }); }
    private err(detail: string) { this.toast.add({ severity: 'error', summary: 'Error', detail, life: 4000 }); }
}
