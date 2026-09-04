import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment.prod';

export type AccessCredentialType = 'NfcCard' | 'HomeKey';
export type AccessCredentialStatus = 'Pending' | 'Active' | 'Declined' | 'Disabled' | 'Revoked';

export interface AccessDoorRef {
    id: string;
    name: string;
}

export interface AccessCredential {
    id: string;
    cardIdentifier: string;
    credentialType: AccessCredentialType;
    status: AccessCredentialStatus;
    declineReason?: string;
    userNumber?: number;
    credentialNumber?: number;
    homeKeyProvisionedAt?: string;
    allDoors: boolean;
    lastUsedAt?: string;
    doors: AccessDoorRef[];
    isActive: boolean;
    isUsable: boolean;
    notes?: string;
    userId?: string;
    memberCode?: string;
    userEmail?: string;
    userFullName?: string;
    assignedAt?: string;
    registeredAt: string;
    revokedAt?: string;
    revocationReason?: string;
}

export interface AccessDoor {
    id: string;
    name: string;
    location?: string;
    description?: string;
    isActive: boolean;
    createdAt: string;
    createdByName?: string;
    deviceCount: number;
    onlineDeviceCount: number;
}

export interface AccessDevice {
    id: string;
    name: string;
    doorId: string;
    doorName?: string;
    ipAddress: string;
    port: number;
    isAllowed: boolean;
    enforceIpCheck: boolean;
    createdAt: string;
    lastSeenAt?: string;
    lastSyncAt?: string;
    firmwareVersion?: string;
    isOnline: boolean;
    secret?: string;
}

export interface AccessLog {
    id: string;
    eventType: string;
    granted?: boolean;
    reason?: string;
    doorId?: string;
    doorName?: string;
    deviceId?: string;
    rfidCardId?: string;
    credentialType?: string;
    credentialIdentifier?: string;
    userId?: string;
    userName?: string;
    actorName?: string;
    metadata?: string;
    timestamp: string;
}

export interface AccessLogPage {
    data: AccessLog[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class AccessService {
    private http = inject(HttpClient);
    private readonly api = environment.apiUrl;

    // ─── Doors ───
    getDoors(): Observable<AccessDoor[]> {
        return this.http.get<AccessDoor[]>(`${this.api}/AccessDoors`);
    }
    createDoor(body: { name: string; location?: string; description?: string; isActive: boolean }): Observable<AccessDoor> {
        return this.http.post<AccessDoor>(`${this.api}/AccessDoors`, body);
    }
    updateDoor(id: string, body: Partial<{ name: string; location: string; description: string; isActive: boolean }>): Observable<AccessDoor> {
        return this.http.put<AccessDoor>(`${this.api}/AccessDoors/${id}`, body);
    }
    deleteDoor(id: string): Observable<any> {
        return this.http.delete(`${this.api}/AccessDoors/${id}`);
    }

    // ─── Devices (ESP32) ───
    getDevices(doorId?: string): Observable<AccessDevice[]> {
        const q = doorId ? `?doorId=${doorId}` : '';
        return this.http.get<AccessDevice[]>(`${this.api}/AccessDevices${q}`);
    }
    createDevice(body: { name: string; doorId: string; ipAddress: string; port: number; secret?: string; isAllowed: boolean; enforceIpCheck: boolean }): Observable<AccessDevice> {
        return this.http.post<AccessDevice>(`${this.api}/AccessDevices`, body);
    }
    updateDevice(id: string, body: Partial<{ name: string; doorId: string; ipAddress: string; port: number; isAllowed: boolean; enforceIpCheck: boolean; rotateSecret: boolean }>): Observable<AccessDevice> {
        return this.http.put<AccessDevice>(`${this.api}/AccessDevices/${id}`, body);
    }
    deleteDevice(id: string): Observable<any> {
        return this.http.delete(`${this.api}/AccessDevices/${id}`);
    }
    syncDevice(id: string): Observable<any> {
        return this.http.post(`${this.api}/AccessDevices/${id}/sync`, {});
    }

    // ─── Credentials (NFC + Home Key) ───
    getCredentials(page = 1, pageSize = 100): Observable<{ data: AccessCredential[]; totalCount: number }> {
        return this.http.get<{ data: AccessCredential[]; totalCount: number }>(
            `${this.api}/RfidCards?page=${page}&pageSize=${pageSize}`
        );
    }
    assignCredential(body: {
        userId: string;
        credentialType: AccessCredentialType;
        cardIdentifier?: string;
        allDoors: boolean;
        doorIds: string[];
        notes?: string;
    }): Observable<AccessCredential> {
        return this.http.post<AccessCredential>(`${this.api}/RfidCards/credentials/assign`, body);
    }
    accept(id: string): Observable<AccessCredential> {
        return this.http.patch<AccessCredential>(`${this.api}/RfidCards/${id}/accept`, {});
    }
    decline(id: string, reason?: string): Observable<AccessCredential> {
        return this.http.patch<AccessCredential>(`${this.api}/RfidCards/${id}/decline`, { reason: reason ?? null });
    }
    disable(id: string): Observable<AccessCredential> {
        return this.http.patch<AccessCredential>(`${this.api}/RfidCards/${id}/disable`, {});
    }
    enable(id: string): Observable<AccessCredential> {
        return this.http.patch<AccessCredential>(`${this.api}/RfidCards/${id}/enable`, {});
    }
    provisionHomeKey(id: string): Observable<any> {
        return this.http.post(`${this.api}/RfidCards/${id}/provision-homekey`, {});
    }
    setDoors(id: string, body: { allDoors: boolean; doorIds: string[] }): Observable<AccessCredential> {
        return this.http.put<AccessCredential>(`${this.api}/RfidCards/${id}/doors`, body);
    }
    revoke(id: string, reason?: string): Observable<any> {
        return this.http.patch(`${this.api}/RfidCards/${id}/revoke`, { reason: reason ?? null });
    }
    credentialLogs(id: string): Observable<AccessLog[]> {
        return this.http.get<AccessLog[]>(`${this.api}/RfidCards/${id}/logs`);
    }

    // ─── Logs ───
    getLogs(params: Record<string, string | number | boolean | undefined>): Observable<AccessLogPage> {
        const q = Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== '')
            .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
            .join('&');
        return this.http.get<AccessLogPage>(`${this.api}/AccessLogs${q ? '?' + q : ''}`);
    }

    // ─── Members (for the assign dropdown) ───
    getUsers(): Observable<any> {
        return this.http.get<any>(`${this.api}/Auth/users?page=1&pageSize=200`);
    }
}
