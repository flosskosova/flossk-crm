import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment.prod';

export interface ExternalMessage {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    message: string;
    createdAt: string;
    isRead?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class ExternalMessagesService {
    private readonly API_URL = `${environment.apiUrl}/ExternalMessages`;

    constructor(private http: HttpClient) {}

    getAll(page: number = 1, pageSize: number = 10): Observable<any> {
        return this.http.get(`${this.API_URL}?page=${page}&pageSize=${pageSize}`);
    }

    getById(id: string): Observable<ExternalMessage> {
        return this.http.get<ExternalMessage>(`${this.API_URL}/${id}`);
    }

    markAsRead(id: string): Observable<any> {
        return this.http.post(`${this.API_URL}/${id}/read`, {});
    }

    delete(id: string): Observable<any> {
        return this.http.delete(`${this.API_URL}/${id}`);
    }
}
