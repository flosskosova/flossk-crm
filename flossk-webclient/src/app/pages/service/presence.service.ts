import { Injectable, signal, NgZone, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment.prod';
import { NotificationService } from './notification.service';
import * as signalR from '@microsoft/signalr';

export type UserStatus = 'Online' | 'Idle' | 'Offline';

export interface UserPresence {
    status: UserStatus;
    lastActivityAt: string | null;
}

const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const HEARTBEAT_INTERVAL_MS = 30 * 1000; // 30 seconds

@Injectable({ providedIn: 'root' })
export class PresenceService implements OnDestroy {
    /** Map of userId → presence state, updated in real-time via SignalR */
    presences = signal<Record<string, UserPresence>>({});

    private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    private idleTimer: ReturnType<typeof setTimeout> | null = null;
    private isIdle = false;
    private activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    private boundOnActivity = this.onUserActivity.bind(this);
    private listening = false;

    constructor(
        private http: HttpClient,
        private notificationService: NotificationService,
        private ngZone: NgZone
    ) {}

    /** Call once after SignalR is connected (from topbar effect) */
    start(currentUserId?: string): void {
        this.listenForPresenceChanges();
        this.startActivityTracking();
        this.startHeartbeat();

        // Immediately mark current user as Online locally
        // (UserStatusChanged is only sent to Others, so we'd never see our own)
        if (currentUserId) {
            this.presences.update((current) => ({
                ...current,
                [currentUserId]: { status: 'Online', lastActivityAt: null }
            }));
        }
    }

    stop(): void {
        this.stopActivityTracking();
        this.stopHeartbeat();
    }

    ngOnDestroy(): void {
        this.stop();
    }

    // ── Fetch bulk statuses via REST ────────────────────────────

    fetchStatuses(userIds: string[]): void {
        if (userIds.length === 0) return;
        this.http
            .get<Record<string, { status: UserStatus; lastActivityAt: string | null }>>(
                `${environment.apiUrl}/Presence/statuses?userIds=${userIds.join(',')}`
            )
            .subscribe({
                next: (data) => {
                    this.presences.update((current) => {
                        const updated = { ...current };
                        for (const [id, info] of Object.entries(data)) {
                            updated[id] = { status: info.status, lastActivityAt: info.lastActivityAt };
                        }
                        return updated;
                    });
                },
                error: (err) => console.error('Failed to fetch presence statuses:', err)
            });
    }

    getPresence(userId: string): UserPresence {
        return this.presences()[userId] ?? { status: 'Offline', lastActivityAt: null };
    }

    // ── SignalR listener ────────────────────────────────────────

    private listenForPresenceChanges(): void {
        const hub = this.notificationService.hubConnection;
        if (!hub) return;

        hub.on('UserStatusChanged', (userId: string, status: UserStatus, lastActivityAt: string | null) => {
            this.ngZone.run(() => {
                this.presences.update((current) => ({
                    ...current,
                    [userId]: { status, lastActivityAt }
                }));
            });
        });
    }

    // ── Activity tracking (idle detection) ──────────────────────

    private startActivityTracking(): void {
        if (this.listening) return;
        this.listening = true;
        this.activityEvents.forEach((evt) => document.addEventListener(evt, this.boundOnActivity, { passive: true }));
        this.resetIdleTimer();
    }

    private stopActivityTracking(): void {
        this.listening = false;
        this.activityEvents.forEach((evt) => document.removeEventListener(evt, this.boundOnActivity));
        if (this.idleTimer) {
            clearTimeout(this.idleTimer);
            this.idleTimer = null;
        }
    }

    private onUserActivity(): void {
        if (this.isIdle) {
            this.isIdle = false;
            this.sendReportActive();
        }
        this.resetIdleTimer();
    }

    private resetIdleTimer(): void {
        if (this.idleTimer) clearTimeout(this.idleTimer);
        this.idleTimer = setTimeout(() => {
            this.isIdle = true;
            this.sendReportIdle();
        }, IDLE_TIMEOUT_MS);
    }

    // ── Heartbeat ───────────────────────────────────────────────

    private startHeartbeat(): void {
        if (this.heartbeatTimer) return;
        this.heartbeatTimer = setInterval(() => {
            if (!this.isIdle) {
                this.sendHeartbeat();
            }
        }, HEARTBEAT_INTERVAL_MS);
    }

    private stopHeartbeat(): void {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    // ── Hub invocations ─────────────────────────────────────────

    private getHub(): signalR.HubConnection | null {
        return this.notificationService.hubConnection;
    }

    private sendHeartbeat(): void {
        this.getHub()?.invoke('Heartbeat').catch(() => {});
    }

    private sendReportIdle(): void {
        this.getHub()?.invoke('ReportIdle').catch(() => {});
    }

    private sendReportActive(): void {
        this.getHub()?.invoke('ReportActive').catch(() => {});
    }
}
