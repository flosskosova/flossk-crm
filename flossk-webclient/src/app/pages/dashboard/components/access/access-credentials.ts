import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { AccessService, AccessCredential, AccessDoor, AccessCredentialType } from '@/pages/service/access.service';

@Component({
    selector: 'app-access-credentials',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ButtonModule, TableModule, DialogModule, SelectModule,
        MultiSelectModule, InputTextModule, TextareaModule, TagModule, ToggleSwitchModule,
        ToastModule, ConfirmDialogModule, TooltipModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast />
        <p-confirmDialog />
        <div class="card">
            <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                    <h2 class="text-xl font-bold text-surface-900 dark:text-surface-0">Access Credentials</h2>
                    <p class="text-sm text-surface-500 mt-0.5">NFC cards and Aliro / Apple Home Key credentials. The door only unlocks for an <b>Active</b> credential.</p>
                </div>
                <button pButton icon="pi pi-plus" label="Assign credential" (click)="openAssign()"></button>
            </div>

            <p-table [value]="credentials()" [loading]="loading()" [paginator]="true" [rows]="15" dataKey="id">
                <ng-template pTemplate="header">
                    <tr>
                        <th>Member</th>
                        <th>Type</th>
                        <th>Identifier</th>
                        <th>Doors</th>
                        <th>Slot</th>
                        <th>Status</th>
                        <th></th>
                    </tr>
                </ng-template>
                <ng-template pTemplate="body" let-c>
                    <tr>
                        <td class="font-medium text-surface-900 dark:text-surface-0">
                            {{ c.userFullName || c.userEmail || '—' }}
                            <span *ngIf="c.memberCode" class="ml-2 text-xs font-mono text-surface-400">{{ c.memberCode }}</span>
                        </td>
                        <td>
                            <p-tag [value]="c.credentialType === 'HomeKey' ? 'Home Key' : 'NFC card'"
                                   [severity]="c.credentialType === 'HomeKey' ? 'info' : 'secondary'" />
                        </td>
                        <td class="font-mono text-xs">{{ c.cardIdentifier }}</td>
                        <td class="text-sm">
                            <span *ngIf="c.allDoors" class="text-surface-500">All doors</span>
                            <span *ngIf="!c.allDoors">{{ c.doors.length ? namesOf(c.doors) : '—' }}</span>
                        </td>
                        <td class="text-xs text-surface-500">
                            <span *ngIf="c.userNumber != null">U{{ c.userNumber }}</span><span *ngIf="c.credentialNumber != null"> / C{{ c.credentialNumber }}</span>
                            <span *ngIf="c.userNumber == null">—</span>
                        </td>
                        <td>
                            <p-tag [value]="statusLabel(c)" [severity]="statusSeverity(c.status)" />
                            <div *ngIf="c.credentialType === 'HomeKey' && !c.homeKeyProvisionedAt" class="text-[11px] text-amber-600 mt-1">Home Key not provisioned</div>
                        </td>
                        <td class="text-right whitespace-nowrap">
                            <button pButton icon="pi pi-key" class="p-button-sm p-button-text" pTooltip="Provision Home Key"
                                    *ngIf="c.credentialType === 'HomeKey' && !c.homeKeyProvisionedAt"
                                    (click)="provision(c)"></button>
                            <button pButton icon="pi pi-check" class="p-button-sm p-button-text p-button-success"
                                    *ngIf="c.status === 'Pending' || c.status === 'Declined' || c.status === 'Disabled'"
                                    (click)="accept(c)" pTooltip="Accept / enable"></button>
                            <button pButton icon="pi pi-ban" class="p-button-sm p-button-text p-button-warn"
                                    *ngIf="c.status === 'Active'" (click)="disable(c)" pTooltip="Disable"></button>
                            <button pButton icon="pi pi-times" class="p-button-sm p-button-text p-button-danger"
                                    *ngIf="c.status !== 'Declined' && c.status !== 'Revoked'"
                                    (click)="decline(c)" pTooltip="Decline"></button>
                            <button pButton icon="pi pi-sitemap" class="p-button-sm p-button-text" (click)="openDoors(c)" pTooltip="Door access"></button>
                            <button pButton icon="pi pi-history" class="p-button-sm p-button-text" (click)="openLogs(c)" pTooltip="Logs"></button>
                        </td>
                    </tr>
                </ng-template>
                <ng-template pTemplate="emptymessage">
                    <tr><td colspan="7" class="text-center text-surface-500 py-6">No credentials yet.</td></tr>
                </ng-template>
            </p-table>
        </div>

        <!-- Assign dialog -->
        <p-dialog header="Assign credential" [(visible)]="showAssign" [modal]="true" [style]="{ width: '480px' }">
            <div class="space-y-3">
                <div>
                    <label class="block text-sm font-medium mb-1">Member <span class="text-red-500">*</span></label>
                    <p-select [options]="users()" [(ngModel)]="form.userId" optionLabel="label" optionValue="value"
                              [filter]="true" placeholder="Select member" styleClass="w-full" appendTo="body" />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Type</label>
                    <p-select [options]="typeOptions" [(ngModel)]="form.credentialType" optionLabel="label" optionValue="value"
                              styleClass="w-full" appendTo="body" />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">
                        {{ form.credentialType === 'HomeKey' ? 'Endpoint id (optional)' : 'Card UUID' }}
                        <span class="text-red-500" *ngIf="form.credentialType === 'NfcCard'">*</span>
                    </label>
                    <input pInputText [(ngModel)]="form.cardIdentifier" class="w-full" placeholder="04:A1:B2:C3:D4:E5:F6" />
                </div>
                <div class="flex items-center gap-2">
                    <p-toggleswitch [(ngModel)]="form.allDoors" inputId="allDoors" />
                    <label for="allDoors" class="text-sm">Grant access to all doors</label>
                </div>
                <div *ngIf="!form.allDoors">
                    <label class="block text-sm font-medium mb-1">Doors</label>
                    <p-multiselect [options]="doors()" [(ngModel)]="form.doorIds" optionLabel="name" optionValue="id"
                                   placeholder="Select doors" styleClass="w-full" appendTo="body" />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Notes</label>
                    <textarea pTextarea [(ngModel)]="form.notes" rows="2" class="w-full"></textarea>
                </div>
                <p class="text-xs text-surface-500">The credential is created as <b>Pending</b>. A board member must accept it
                    (and provision the Home Key) before the door will open.</p>
                <div class="flex gap-2 justify-end pt-2 border-t border-surface-200 dark:border-surface-700">
                    <button pButton label="Cancel" [outlined]="true" (click)="showAssign = false"></button>
                    <button pButton label="Assign" [loading]="saving()" (click)="submitAssign()"></button>
                </div>
            </div>
        </p-dialog>

        <!-- Doors dialog -->
        <p-dialog header="Door access" [(visible)]="showDoors" [modal]="true" [style]="{ width: '420px' }">
            <div class="space-y-3" *ngIf="selected() as c">
                <div class="flex items-center gap-2">
                    <p-toggleswitch [(ngModel)]="doorsForm.allDoors" inputId="edAll" />
                    <label for="edAll" class="text-sm">All doors</label>
                </div>
                <div *ngIf="!doorsForm.allDoors">
                    <p-multiselect [options]="doors()" [(ngModel)]="doorsForm.doorIds" optionLabel="name" optionValue="id"
                                   placeholder="Select doors" styleClass="w-full" appendTo="body" />
                </div>
                <div class="flex gap-2 justify-end pt-2 border-t border-surface-200 dark:border-surface-700">
                    <button pButton label="Cancel" [outlined]="true" (click)="showDoors = false"></button>
                    <button pButton label="Save" [loading]="saving()" (click)="submitDoors()"></button>
                </div>
            </div>
        </p-dialog>

        <!-- Logs dialog -->
        <p-dialog header="Credential logs" [(visible)]="showLogs" [modal]="true" [style]="{ width: '640px' }">
            <p-table [value]="logs()" [rows]="10" [paginator]="logs().length > 10" [scrollable]="true" scrollHeight="420px">
                <ng-template pTemplate="header">
                    <tr><th>When</th><th>Event</th><th>Result</th><th>Detail</th></tr>
                </ng-template>
                <ng-template pTemplate="body" let-l>
                    <tr>
                        <td class="text-xs whitespace-nowrap">{{ l.timestamp | date:'short' }}</td>
                        <td class="text-sm">{{ l.eventType }}</td>
                        <td><p-tag *ngIf="l.granted != null" [value]="l.granted ? 'granted' : 'denied'" [severity]="l.granted ? 'success' : 'danger'" /></td>
                        <td class="text-xs text-surface-500">{{ l.reason }}</td>
                    </tr>
                </ng-template>
                <ng-template pTemplate="emptymessage"><tr><td colspan="4" class="text-center text-surface-500 py-4">No log entries.</td></tr></ng-template>
            </p-table>
        </p-dialog>
    `
})
export class AccessCredentials implements OnInit {
    private svc = inject(AccessService);
    private toast = inject(MessageService);
    private confirm = inject(ConfirmationService);

    credentials = signal<AccessCredential[]>([]);
    doors = signal<AccessDoor[]>([]);
    users = signal<{ label: string; value: string }[]>([]);
    logs = signal<any[]>([]);
    loading = signal(false);
    saving = signal(false);
    selected = signal<AccessCredential | null>(null);

    showAssign = false;
    showDoors = false;
    showLogs = false;

    typeOptions = [
        { label: 'NFC card', value: 'NfcCard' as AccessCredentialType },
        { label: 'Aliro / Home Key', value: 'HomeKey' as AccessCredentialType }
    ];

    form: { userId: string | null; credentialType: AccessCredentialType; cardIdentifier: string; allDoors: boolean; doorIds: string[]; notes: string } = this.blankForm();
    doorsForm = { allDoors: false, doorIds: [] as string[] };

    ngOnInit() {
        this.load();
        this.svc.getDoors().subscribe(d => this.doors.set(d));
        this.svc.getUsers().subscribe(r => {
            const list = r.users ?? r.data ?? [];
            this.users.set(list.map((u: any) => ({ label: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email, value: u.id })));
        });
    }

    load() {
        this.loading.set(true);
        this.svc.getCredentials().subscribe({
            next: r => { this.credentials.set(r.data ?? []); this.loading.set(false); },
            error: () => { this.loading.set(false); this.err('Failed to load credentials'); }
        });
    }

    namesOf(doors: { name: string }[]) { return doors.map(d => d.name).join(', '); }

    statusLabel(c: AccessCredential) { return c.status; }
    statusSeverity(s: string): any {
        const map: Record<string, string> = { Active: 'success', Pending: 'warn', Declined: 'danger', Disabled: 'secondary', Revoked: 'contrast' };
        return map[s] ?? 'secondary';
    }

    openAssign() { this.form = this.blankForm(); this.showAssign = true; }
    blankForm() { return { userId: null, credentialType: 'NfcCard' as AccessCredentialType, cardIdentifier: '', allDoors: false, doorIds: [], notes: '' }; }

    submitAssign() {
        if (!this.form.userId) { this.err('Select a member'); return; }
        if (this.form.credentialType === 'NfcCard' && !this.form.cardIdentifier.trim()) { this.err('Card UUID is required'); return; }
        this.saving.set(true);
        this.svc.assignCredential({
            userId: this.form.userId,
            credentialType: this.form.credentialType,
            cardIdentifier: this.form.cardIdentifier.trim() || undefined,
            allDoors: this.form.allDoors,
            doorIds: this.form.doorIds,
            notes: this.form.notes.trim() || undefined
        }).subscribe({
            next: () => { this.saving.set(false); this.showAssign = false; this.ok('Credential assigned (pending)'); this.load(); },
            error: e => { this.saving.set(false); this.err(e?.error?.message ?? 'Failed to assign'); }
        });
    }

    accept(c: AccessCredential) {
        this.svc.accept(c.id).subscribe({ next: () => { this.ok('Credential enabled'); this.load(); }, error: e => this.err(e?.error?.message ?? 'Failed') });
    }
    disable(c: AccessCredential) {
        this.svc.disable(c.id).subscribe({ next: () => { this.ok('Credential disabled'); this.load(); }, error: e => this.err(e?.error?.message ?? 'Failed') });
    }
    decline(c: AccessCredential) {
        this.confirm.confirm({
            header: 'Decline credential',
            message: `The door will not open for ${c.userFullName || 'this member'}. Continue?`,
            accept: () => this.svc.decline(c.id).subscribe({ next: () => { this.ok('Credential declined'); this.load(); }, error: e => this.err(e?.error?.message ?? 'Failed') })
        });
    }
    provision(c: AccessCredential) {
        this.svc.provisionHomeKey(c.id).subscribe({
            next: () => { this.ok('Home Key provisioned'); this.load(); },
            error: e => { this.err(e?.error?.message ?? 'Provisioning did not fully succeed'); this.load(); }
        });
    }

    openDoors(c: AccessCredential) {
        this.selected.set(c);
        this.doorsForm = { allDoors: c.allDoors, doorIds: c.doors.map(d => d.id) };
        this.showDoors = true;
    }
    submitDoors() {
        const c = this.selected(); if (!c) return;
        this.saving.set(true);
        this.svc.setDoors(c.id, { allDoors: this.doorsForm.allDoors, doorIds: this.doorsForm.doorIds }).subscribe({
            next: () => { this.saving.set(false); this.showDoors = false; this.ok('Door access updated'); this.load(); },
            error: e => { this.saving.set(false); this.err(e?.error?.message ?? 'Failed'); }
        });
    }

    openLogs(c: AccessCredential) {
        this.selected.set(c);
        this.logs.set([]);
        this.showLogs = true;
        this.svc.credentialLogs(c.id).subscribe(l => this.logs.set(l));
    }

    private ok(detail: string) { this.toast.add({ severity: 'success', summary: 'Done', detail, life: 2500 }); }
    private err(detail: string) { this.toast.add({ severity: 'error', summary: 'Error', detail, life: 4000 }); }
}
