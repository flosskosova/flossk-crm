import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AccessService, AccessLog, AccessDoor } from '@/pages/service/access.service';

@Component({
    selector: 'app-access-logs',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, TableModule, SelectModule, DatePickerModule, TagModule, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast />
        <div class="card">
            <div class="mb-4">
                <h2 class="text-xl font-bold text-surface-900 dark:text-surface-0">Access Logs</h2>
                <p class="text-sm text-surface-500 mt-0.5">Every unlock, denial and credential change.</p>
            </div>

            <div class="flex flex-wrap gap-3 mb-4">
                <p-select [options]="doorOptions()" [(ngModel)]="filters.doorId" optionLabel="label" optionValue="value"
                          placeholder="All doors" [showClear]="true" (onChange)="reload()" styleClass="w-48" />
                <p-select [options]="eventOptions" [(ngModel)]="filters.eventType" optionLabel="label" optionValue="value"
                          placeholder="All events" [showClear]="true" (onChange)="reload()" styleClass="w-52" />
                <p-select [options]="resultOptions" [(ngModel)]="filters.granted" optionLabel="label" optionValue="value"
                          placeholder="Any result" [showClear]="true" (onChange)="reload()" styleClass="w-40" />
                <p-datepicker [(ngModel)]="filters.dateFrom" placeholder="From" dateFormat="yy-mm-dd" [showIcon]="true"
                              (onSelect)="reload()" appendTo="body" />
                <p-datepicker [(ngModel)]="filters.dateTo" placeholder="To" dateFormat="yy-mm-dd" [showIcon]="true"
                              (onSelect)="reload()" appendTo="body" />
                <button pButton icon="pi pi-refresh" label="Refresh" [text]="true" (click)="reload()"></button>
                <button pButton icon="pi pi-times" label="Clear" [text]="true" (click)="clear()"></button>
            </div>

            <p-table [value]="logs()" [loading]="loading()" [paginator]="true" [rows]="rows" [totalRecords]="total()"
                     [lazy]="true" (onLazyLoad)="onPage($event)">
                <ng-template pTemplate="header">
                    <tr><th>When</th><th>Event</th><th>Door</th><th>Member</th><th>Credential</th><th>Result</th><th>Detail</th></tr>
                </ng-template>
                <ng-template pTemplate="body" let-l>
                    <tr>
                        <td class="text-xs whitespace-nowrap">{{ l.timestamp | date:'medium' }}</td>
                        <td class="text-sm font-medium">{{ l.eventType }}</td>
                        <td class="text-sm">{{ l.doorName || '—' }}</td>
                        <td class="text-sm">{{ l.userName || '—' }}<span *ngIf="l.actorName" class="text-xs text-surface-400"> · by {{ l.actorName }}</span></td>
                        <td class="text-xs">
                            <span *ngIf="l.credentialType">{{ l.credentialType === 'HomeKey' ? 'Home Key' : 'NFC' }}</span>
                            <span *ngIf="l.credentialIdentifier" class="font-mono text-surface-400"> {{ l.credentialIdentifier }}</span>
                        </td>
                        <td>
                            <p-tag *ngIf="l.granted != null" [value]="l.granted ? 'granted' : 'denied'" [severity]="l.granted ? 'success' : 'danger'" />
                        </td>
                        <td class="text-xs text-surface-500">{{ l.reason }}</td>
                    </tr>
                </ng-template>
                <ng-template pTemplate="emptymessage"><tr><td colspan="7" class="text-center text-surface-500 py-6">No log entries.</td></tr></ng-template>
            </p-table>
        </div>
    `
})
export class AccessLogs implements OnInit {
    private svc = inject(AccessService);
    private toast = inject(MessageService);

    logs = signal<AccessLog[]>([]);
    total = signal(0);
    doorOptions = signal<{ label: string; value: string }[]>([]);
    loading = signal(false);
    rows = 25;
    page = 1;

    filters: { doorId?: string; eventType?: string; granted?: boolean; dateFrom?: Date; dateTo?: Date } = {};

    eventOptions = [
        { label: 'Unlock', value: 'Unlock' },
        { label: 'Denied', value: 'Denied' },
        { label: 'Door forced', value: 'DoorForced' },
        { label: 'Credential assigned', value: 'CredentialAssigned' },
        { label: 'Credential accepted', value: 'CredentialAccepted' },
        { label: 'Credential declined', value: 'CredentialDeclined' },
        { label: 'Home Key provisioned', value: 'HomeKeyProvisioned' },
        { label: 'Provisioning failed', value: 'ProvisioningFailed' },
        { label: 'Device heartbeat', value: 'DeviceHeartbeat' },
        { label: 'Device rejected', value: 'DeviceRejected' }
    ];
    resultOptions = [
        { label: 'Granted', value: true },
        { label: 'Denied', value: false }
    ];

    ngOnInit() {
        this.svc.getDoors().subscribe((d: AccessDoor[]) =>
            this.doorOptions.set(d.map(x => ({ label: x.name, value: x.id }))));
        this.reload();
    }

    onPage(e: any) {
        this.page = Math.floor((e.first ?? 0) / (e.rows ?? this.rows)) + 1;
        this.rows = e.rows ?? this.rows;
        this.load();
    }

    reload() { this.page = 1; this.load(); }
    clear() { this.filters = {}; this.reload(); }

    private fmt(d?: Date) {
        return d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : undefined;
    }

    load() {
        this.loading.set(true);
        this.svc.getLogs({
            page: this.page,
            pageSize: this.rows,
            doorId: this.filters.doorId,
            eventType: this.filters.eventType,
            granted: this.filters.granted,
            dateFrom: this.fmt(this.filters.dateFrom),
            dateTo: this.fmt(this.filters.dateTo)
        }).subscribe({
            next: r => { this.logs.set(r.data ?? []); this.total.set(r.totalCount ?? 0); this.loading.set(false); },
            error: () => { this.loading.set(false); this.toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load logs' }); }
        });
    }
}
