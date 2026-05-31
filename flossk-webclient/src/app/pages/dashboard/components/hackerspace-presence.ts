import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';

interface PresenceMember {
    id: number;
    name: string;
    avatar: string;
    role: string;
    entryTime: Date;
}

interface PresenceHistory {
    id: number;
    name: string;
    avatar: string;
    role: string;
    date: Date;
    entryTime: Date;
    exitTime: Date;
}

@Component({
    selector: 'app-hackerspace-presence',
    imports: [CommonModule, TableModule, ButtonModule, TagModule, AvatarModule, MenuModule],
    styles: [`
        .avatar-container {
            position: relative;
            display: inline-block;
        }
        .status-indicator {
            position: absolute;
            bottom: 0;
            right: 0;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background-color: #22c55e;
            border: 2px solid white;
        }
    `],
    template: `
        <div class="grid grid-cols-12 gap-4">
            <!-- Currently Present Table -->
            <div class="col-span-12 xl:col-span-5">
                <div class="card">
                    <div class="flex justify-between items-center mb-4">
                        <div class="font-semibold text-xl">Currently Present</div>
                        <p-tag [value]="currentlyPresent.length + ' Members'" severity="success"></p-tag>
                    </div>
                    
                    <p-table [value]="currentlyPresent" [tableStyle]="{'min-width': '100%'}">
                        <ng-template pTemplate="header">
                            <tr>
                                <th>Member</th>
                                <th>Entry Time</th>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-member>
                            <tr>
                                <td>
                                    <div class="flex items-center gap-3">
                                        <div class="avatar-container">
                                            <p-avatar [image]="member.avatar" shape="circle" size="normal"></p-avatar>
                                            <div class="status-indicator"></div>
                                        </div>
                                        <span class="font-semibold">{{ member.name }}</span>
                                    </div>
                                </td>
                                <td>{{ member.entryTime | date:'short' }}</td>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="emptymessage">
                            <tr>
                                <td colspan="3" class="text-center text-surface-500 py-4">No members currently present</td>
                            </tr>
                        </ng-template>
                    </p-table>
                </div>
            </div>
            
            <!-- History Table -->
            <div class="col-span-12 xl:col-span-7">
                <div class="card">
                    <div class="flex justify-between items-center mb-4">
                        <div class="font-semibold text-xl">Presence History</div>
                        <div>
                            <p-button label="Export" icon="pi pi-download" size="small" [outlined]="true" (onClick)="exportMenu.toggle($event)" />
                            <p-menu #exportMenu [model]="exportMenuItems" [popup]="true"></p-menu>
                        </div>
                    </div>
                    
                    <p-table [value]="presenceHistory" [paginator]="true" [rows]="10" [tableStyle]="{'min-width': '100%'}">
                        <ng-template pTemplate="header">
                            <tr>
                                <th>Member</th>
                                <th>Date</th>
                                <th>Entry Time</th>
                                <th>Exit Time</th>
                                <th>Duration</th>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-record>
                            <tr>
                                <td>
                                    <div class="flex items-center gap-3">
                                        <p-avatar [image]="record.avatar" shape="circle" size="normal"></p-avatar>
                                        <span class="font-semibold">{{ record.name }}</span>
                                    </div>
                                </td>
                                <td>{{ record.date | date:'MMM d, y' }}</td>
                                <td>{{ record.entryTime | date:'shortTime' }}</td>
                                <td>{{ record.exitTime | date:'shortTime' }}</td>
                                <td>{{ calculateDuration(record.entryTime, record.exitTime) }}</td>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="emptymessage">
                            <tr>
                                <td colspan="6" class="text-center text-surface-500 py-4">No history records found</td>
                            </tr>
                        </ng-template>
                    </p-table>
                </div>
            </div>
        </div>
    `
})
export class HackerspacePresence {
    exportMenuItems: MenuItem[] = [
        {
            label: 'Export as CSV',
            icon: 'pi pi-file',
            command: () => this.exportAsCSV()
        },
        {
            label: 'Export as JSON',
            icon: 'pi pi-file-export',
            command: () => this.exportAsJSON()
        }
    ];

    currentlyPresent: PresenceMember[] = [
        {
            id: 1,
            name: 'Amy Elsner',
            avatar: 'https://primefaces.org/cdn/primeng/images/demo/avatar/amyelsner.png',
            role: 'Project Lead',
            entryTime: new Date(2025, 11, 9, 9, 30)
        },
        {
            id: 2,
            name: 'Bernardo Dominic',
            avatar: 'https://primefaces.org/cdn/primeng/images/demo/avatar/bernardodominic.png',
            role: 'Hardware Engineer',
            entryTime: new Date(2025, 11, 9, 10, 15)
        },
        {
            id: 3,
            name: 'Anna Fali',
            avatar: 'https://primefaces.org/cdn/primeng/images/demo/avatar/annafali.png',
            role: 'Software Developer',
            entryTime: new Date(2025, 11, 9, 11, 0)
        }
    ];

    presenceHistory: PresenceHistory[] = [
        {
            id: 1,
            name: 'Ioni Bowcher',
            avatar: 'https://primefaces.org/cdn/primeng/images/demo/avatar/ionibowcher.png',
            role: 'Technician',
            date: new Date(2025, 11, 8),
            entryTime: new Date(2025, 11, 8, 14, 30),
            exitTime: new Date(2025, 11, 8, 18, 45)
        },
        {
            id: 2,
            name: 'Elwin Sharvill',
            avatar: 'https://primefaces.org/cdn/primeng/images/demo/avatar/elwinsharvill.png',
            role: 'Lead Engineer',
            date: new Date(2025, 11, 8),
            entryTime: new Date(2025, 11, 8, 9, 0),
            exitTime: new Date(2025, 11, 8, 17, 30)
        },
        {
            id: 3,
            name: 'Asiya Javayant',
            avatar: 'https://primefaces.org/cdn/primeng/images/demo/avatar/asiyajavayant.png',
            role: 'UI/UX Designer',
            date: new Date(2025, 11, 7),
            entryTime: new Date(2025, 11, 7, 10, 15),
            exitTime: new Date(2025, 11, 7, 16, 0)
        },
        {
            id: 4,
            name: 'Amy Elsner',
            avatar: 'https://primefaces.org/cdn/primeng/images/demo/avatar/amyelsner.png',
            role: 'Project Lead',
            date: new Date(2025, 11, 7),
            entryTime: new Date(2025, 11, 7, 8, 30),
            exitTime: new Date(2025, 11, 7, 19, 15)
        },
        {
            id: 5,
            name: 'Bernardo Dominic',
            avatar: 'https://primefaces.org/cdn/primeng/images/demo/avatar/bernardodominic.png',
            role: 'Hardware Engineer',
            date: new Date(2025, 11, 6),
            entryTime: new Date(2025, 11, 6, 13, 0),
            exitTime: new Date(2025, 11, 6, 20, 30)
        },
        {
            id: 6,
            name: 'Anna Fali',
            avatar: 'https://primefaces.org/cdn/primeng/images/demo/avatar/annafali.png',
            role: 'Software Developer',
            date: new Date(2025, 11, 6),
            entryTime: new Date(2025, 11, 6, 11, 45),
            exitTime: new Date(2025, 11, 6, 17, 0)
        },
        {
            id: 7,
            name: 'Ioni Bowcher',
            avatar: 'https://primefaces.org/cdn/primeng/images/demo/avatar/ionibowcher.png',
            role: 'Technician',
            date: new Date(2025, 11, 5),
            entryTime: new Date(2025, 11, 5, 9, 30),
            exitTime: new Date(2025, 11, 5, 15, 45)
        },
        {
            id: 8,
            name: 'Elwin Sharvill',
            avatar: 'https://primefaces.org/cdn/primeng/images/demo/avatar/elwinsharvill.png',
            role: 'Lead Engineer',
            date: new Date(2025, 11, 5),
            entryTime: new Date(2025, 11, 5, 10, 0),
            exitTime: new Date(2025, 11, 5, 18, 20)
        }
    ];

    calculateDuration(entryTime: Date, exitTime: Date): string {
        const diff = exitTime.getTime() - entryTime.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    }

    exportAsCSV() {
        const headers = ['Name', 'Role', 'Date', 'Entry Time', 'Exit Time', 'Duration'];
        const csvData = this.presenceHistory.map(record => [
            record.name,
            record.role,
            this.formatDate(record.date),
            this.formatTime(record.entryTime),
            this.formatTime(record.exitTime),
            this.calculateDuration(record.entryTime, record.exitTime)
        ]);

        let csv = headers.join(',') + '\n';
        csvData.forEach(row => {
            csv += row.map(cell => `"${cell}"`).join(',') + '\n';
        });

        this.downloadFile(csv, 'presence-history.csv', 'text/csv');
    }

    exportAsJSON() {
        const jsonData = this.presenceHistory.map(record => ({
            name: record.name,
            role: record.role,
            date: this.formatDate(record.date),
            entryTime: this.formatTime(record.entryTime),
            exitTime: this.formatTime(record.exitTime),
            duration: this.calculateDuration(record.entryTime, record.exitTime)
        }));

        const json = JSON.stringify(jsonData, null, 2);
        this.downloadFile(json, 'presence-history.json', 'application/json');
    }

    private downloadFile(content: string, fileName: string, contentType: string) {
        const blob = new Blob([content], { type: contentType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        window.URL.revokeObjectURL(url);
    }

    private formatDate(date: Date): string {
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    private formatTime(date: Date): string {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
}
