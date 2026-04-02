import { Injectable, signal, OnDestroy, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '@environments/environment.prod';
import { AuthService } from './auth.service';
import * as signalR from '@microsoft/signalr';

export interface AppNotification {
    id: string;
    type: string;
    priority: string;
    title: string;
    body: string;
    metadata?: string;
    isRead: boolean;
    createdAt: string;
    readAt?: string;
}

const VAPID_PUBLIC_KEY = 'BB8NnwQMo5myzAh82O_ZIpL8kPHjc2iG4LD7NqTEe56njtgrAOttPYwJqUkzkJO1OFwoEzUtPl8jRKSQ6A0L7Ig';

@Injectable({
    providedIn: 'root'
})
export class NotificationService implements OnDestroy {
    private readonly API_URL = `${environment.apiUrl}/Notifications`;
    hubConnection: signalR.HubConnection | null = null;

    notifications = signal<AppNotification[]>([]);
    unreadCount = signal<number>(0);

    constructor(private http: HttpClient, private authService: AuthService, private ngZone: NgZone) {}

    // ── SignalR Connection ──────────────────────────────────────────

    startConnection(): Promise<void> {
        const token = this.authService.getToken();
        if (!token || this.hubConnection) return Promise.resolve();

        this.hubConnection = new signalR.HubConnectionBuilder()
            .withUrl(`${environment.baseUrl}/hubs/notifications`, {
                accessTokenFactory: () => this.authService.getToken() ?? ''
            })
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Information)
            .build();

        this.hubConnection.on('ReceiveNotification', (notification: AppNotification) => {
            this.ngZone.run(() => {
                this.notifications.update(list => [notification, ...list]);
                this.unreadCount.update(count => count + 1);
            });
        });

        return this.hubConnection.start()
            .then(() => console.log('SignalR connected'))
            .catch(err => console.error('SignalR connection error:', err));
    }

    stopConnection(): void {
        if (this.hubConnection) {
            this.hubConnection.stop();
            this.hubConnection = null;
        }
    }

    ngOnDestroy(): void {
        this.stopConnection();
    }

    // ── REST API ────────────────────────────────────────────────────

    loadUnread(): void {
        this.http.get<AppNotification[]>(`${this.API_URL}/unread`).subscribe({
            next: data => this.notifications.set(data),
            error: err => console.error('Failed to load notifications:', err)
        });
    }

    loadAll(page = 1, pageSize = 20): Observable<{ items: AppNotification[]; totalCount: number; page: number; pageSize: number }> {
        return this.http.get<{ items: AppNotification[]; totalCount: number; page: number; pageSize: number }>(`${this.API_URL}?page=${page}&pageSize=${pageSize}`);
    }

    refreshUnreadCount(): void {
        this.http.get<{ count: number }>(`${this.API_URL}/unread-count`).subscribe({
            next: data => this.unreadCount.set(data.count),
            error: err => console.error('Failed to load unread count:', err)
        });
    }

    markAsRead(id: string): Observable<any> {
        return this.http.patch(`${this.API_URL}/${id}/read`, {}).pipe(
            tap(() => {
                this.notifications.update(list =>
                    list.map(n => n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)
                );
                this.unreadCount.update(count => Math.max(0, count - 1));
            })
        );
    }

    markAllAsRead(): Observable<any> {
        return this.http.patch(`${this.API_URL}/read-all`, {}).pipe(
            tap(() => {
                this.notifications.update(list =>
                    list.map(n => ({ ...n, isRead: true, readAt: n.readAt ?? new Date().toISOString() }))
                );
                this.unreadCount.set(0);
            })
        );
    }

    delete(id: string): Observable<any> {
        return this.http.delete(`${this.API_URL}/${id}`).pipe(
            tap(() => {
                const removed = this.notifications().find(n => n.id === id);
                this.notifications.update(list => list.filter(n => n.id !== id));
                if (removed && !removed.isRead) {
                    this.unreadCount.update(count => Math.max(0, count - 1));
                }
            })
        );
    }

    // ── Web Push Subscription ───────────────────────────────────────

    async subscribePush(): Promise<void> {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.warn('Push notifications not supported');
            return;
        }

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });

        const json = subscription.toJSON();
        this.http.post(`${this.API_URL}/push/subscribe`, {
            endpoint: json.endpoint,
            p256dh: json.keys?.['p256dh'],
            auth: json.keys?.['auth']
        }).subscribe({
            error: err => console.error('Failed to register push subscription:', err)
        });
    }

    async unsubscribePush(): Promise<void> {
        if (!('serviceWorker' in navigator)) return;

        const registration = await navigator.serviceWorker.getRegistration();
        const subscription = await registration?.pushManager.getSubscription();
        if (!subscription) return;

        await subscription.unsubscribe();
        this.http.post(`${this.API_URL}/push/unsubscribe`, {
            endpoint: subscription.endpoint
        }).subscribe();
    }

    private urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray as Uint8Array<ArrayBuffer>;
    }
}
