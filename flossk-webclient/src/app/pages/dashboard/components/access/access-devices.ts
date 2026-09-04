import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { AccessService, AccessDevice, AccessDoor } from '@/pages/service/access.service';

@Component({
    selector: 'app-access-devices',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ButtonModule, TableModule, DialogModule, SelectModule,
        InputTextModule, InputNumberModule, TagModule, ToggleSwitchModule, ToastModule, ConfirmDialogModule, TooltipModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast />
        <p-confirmDialog />
        <div class="card">
            <div class="flex items-center justify-between gap-3 mb-4">
                <div>
                    <h2 class="text-xl font-bold text-surface-900 dark:text-surface-0">ESP32 Devices</h2>
                    <p class="text-sm text-surface-500 mt-0.5">Register each lock controller's IP. Only <b>allowed</b> devices whose IP and key match may talk to the door webhook.</p>
                </div>
                <button pButton icon="pi pi-plus" label="Add device" (click)="open()"></button>
            </div>

            <p-table [value]="devices()" [loading]="loading()">
                <ng-template pTemplate="header">
                    <tr><th>Name</th><th>Door</th><th>Address</th><th>Firmware</th><th>Last seen</th><th>Allowed</th><th></th></tr>
                </ng-template>
                <ng-template pTemplate="body" let-d>
                    <tr>
                        <td class="font-medium text-surface-900 dark:text-surface-0">
                            {{ d.name }}
                            <p-tag *ngIf="d.isOnline" value="online" severity="success" class="ml-2" />
                        </td>
                        <td class="text-sm">{{ d.doorName }}</td>
                        <td class="font-mono text-xs">{{ d.ipAddress }}:{{ d.port }}</td>
                        <td class="text-xs text-surface-500">{{ d.firmwareVersion || '—' }}</td>
                        <td class="text-xs text-surface-500">{{ d.lastSeenAt ? (d.lastSeenAt | date:'short') : 'never' }}</td>
                        <td><p-tag [value]="d.isAllowed ? 'Allowed' : 'Blocked'" [severity]="d.isAllowed ? 'success' : 'danger'" /></td>
                        <td class="text-right whitespace-nowrap">
                            <button pButton icon="pi pi-sync" class="p-button-sm p-button-text" (click)="sync(d)" pTooltip="Grab data"></button>
                            <button pButton icon="pi pi-pencil" class="p-button-sm p-button-text" (click)="open(d)"></button>
                            <button pButton icon="pi pi-trash" class="p-button-sm p-button-text p-button-danger" (click)="remove(d)"></button>
                        </td>
                    </tr>
                </ng-template>
                <ng-template pTemplate="emptymessage"><tr><td colspan="7" class="text-center text-surface-500 py-6">No devices registered.</td></tr></ng-template>
            </p-table>
        </div>

        <p-dialog [header]="form.id ? 'Edit device' : 'Add device'" [(visible)]="show" [modal]="true" [style]="{ width: '460px' }">
            <div class="space-y-3">
                <div>
                    <label class="block text-sm font-medium mb-1">Name <span class="text-red-500">*</span></label>
                    <input pInputText [(ngModel)]="form.name" class="w-full" placeholder="Front door ESP32" />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Door <span class="text-red-500">*</span></label>
                    <p-select [options]="doors()" [(ngModel)]="form.doorId" optionLabel="name" optionValue="id"
                              placeholder="Select door" styleClass="w-full" appendTo="body" />
                </div>
                <div class="flex gap-3">
                    <div class="flex-1">
                        <label class="block text-sm font-medium mb-1">IP address <span class="text-red-500">*</span></label>
                        <input pInputText [(ngModel)]="form.ipAddress" class="w-full" placeholder="192.168.1.50" />
                    </div>
                    <div style="width: 110px">
                        <label class="block text-sm font-medium mb-1">Port</label>
                        <p-inputNumber [(ngModel)]="form.port" [min]="1" [max]="65535" [useGrouping]="false" styleClass="w-full" />
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <p-toggleswitch [(ngModel)]="form.isAllowed" inputId="devAllowed" />
                    <label for="devAllowed" class="text-sm">Allowed (accept &amp; provision)</label>
                </div>
                <div class="flex items-center gap-2">
                    <p-toggleswitch [(ngModel)]="form.enforceIpCheck" inputId="devEnforceIp" />
                    <label for="devEnforceIp" class="text-sm">Also require this exact source IP</label>
                </div>
                <div *ngIf="form.id" class="flex items-center gap-2">
                    <p-toggleswitch [(ngModel)]="form.rotateSecret" inputId="devRotate" />
                    <label for="devRotate" class="text-sm">Rotate shared secret</label>
                </div>
                <div *ngIf="newSecret()" class="bg-surface-100 dark:bg-surface-800 rounded p-3 text-xs">
                    <div class="font-medium mb-1">Device key — copy it into the ESP32 now, it is shown once:</div>
                    <code class="break-all">{{ newSecret() }}</code>
                </div>
                <div class="flex gap-2 justify-end pt-2 border-t border-surface-200 dark:border-surface-700">
                    <button pButton label="Close" [outlined]="true" (click)="show = false"></button>
                    <button pButton label="Save" [loading]="saving()" (click)="save()"></button>
                </div>
            </div>
        </p-dialog>
    `
})
export class AccessDevices implements OnInit {
    private svc = inject(AccessService);
    private toast = inject(MessageService);
    private confirm = inject(ConfirmationService);

    devices = signal<AccessDevice[]>([]);
    doors = signal<AccessDoor[]>([]);
    loading = signal(false);
    saving = signal(false);
    newSecret = signal<string | null>(null);
    show = false;
    form: { id: string | null; name: string; doorId: string | null; ipAddress: string; port: number; isAllowed: boolean; enforceIpCheck: boolean; rotateSecret: boolean } = this.blank();

    ngOnInit() {
        this.load();
        this.svc.getDoors().subscribe(d => this.doors.set(d));
    }

    load() {
        this.loading.set(true);
        this.svc.getDevices().subscribe({
            next: d => { this.devices.set(d); this.loading.set(false); },
            error: () => { this.loading.set(false); this.err('Failed to load devices'); }
        });
    }

    blank() { return { id: null, name: '', doorId: null, ipAddress: '', port: 80, isAllowed: true, enforceIpCheck: false, rotateSecret: false }; }
    open(d?: AccessDevice) {
        this.newSecret.set(null);
        this.form = d
            ? { id: d.id, name: d.name, doorId: d.doorId, ipAddress: d.ipAddress, port: d.port, isAllowed: d.isAllowed, enforceIpCheck: d.enforceIpCheck, rotateSecret: false }
            : this.blank();
        this.show = true;
    }

    save() {
        if (!this.form.name.trim() || !this.form.doorId || !this.form.ipAddress.trim()) { this.err('Name, door and IP are required'); return; }
        this.saving.set(true);
        const req = this.form.id
            ? this.svc.updateDevice(this.form.id, {
                name: this.form.name.trim(), doorId: this.form.doorId, ipAddress: this.form.ipAddress.trim(),
                port: this.form.port, isAllowed: this.form.isAllowed, enforceIpCheck: this.form.enforceIpCheck, rotateSecret: this.form.rotateSecret
              })
            : this.svc.createDevice({
                name: this.form.name.trim(), doorId: this.form.doorId, ipAddress: this.form.ipAddress.trim(),
                port: this.form.port, isAllowed: this.form.isAllowed, enforceIpCheck: this.form.enforceIpCheck
              });
        req.subscribe({
            next: (dev: AccessDevice) => {
                this.saving.set(false);
                if (dev?.secret) { this.newSecret.set(dev.secret); } else { this.show = false; }
                this.ok('Saved');
                this.load();
            },
            error: e => { this.saving.set(false); this.err(e?.error?.message ?? 'Failed'); }
        });
    }

    sync(d: AccessDevice) {
        this.svc.syncDevice(d.id).subscribe({
            next: (r: any) => { this.ok(r?.message ?? 'Synced'); this.load(); },
            error: e => this.err(e?.error?.message ?? 'Device unreachable')
        });
    }

    remove(d: AccessDevice) {
        this.confirm.confirm({
            header: 'Remove device',
            message: `Remove "${d.name}"?`,
            accept: () => this.svc.deleteDevice(d.id).subscribe({ next: () => { this.ok('Removed'); this.load(); }, error: e => this.err(e?.error?.message ?? 'Failed') })
        });
    }

    private ok(detail: string) { this.toast.add({ severity: 'success', summary: 'Done', detail, life: 2500 }); }
    private err(detail: string) { this.toast.add({ severity: 'error', summary: 'Error', detail, life: 4000 }); }
}
