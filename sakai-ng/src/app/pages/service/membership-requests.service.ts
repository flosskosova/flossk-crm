import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment.prod';

export interface MembershipRequest {
    id?: string;
    fullName: string;
    address: string;
    city: string;
    phoneNumber: string;
    email: string;
    schoolOrCompany: string;
    dateOfBirth: Date | string;
    statement: string;
    idCardNumber: string;
    status?: string;
    createdAt?: string;
}

@Injectable({
    providedIn: 'root'
})
export class MembershipRequestsService {
    private readonly API_URL = `${environment.apiUrl}/MembershipRequests`;

    constructor(private http: HttpClient) {}

    create(data: FormData): Observable<any> {
        return this.http.post(this.API_URL, data);
    }

    getAll(page: number = 1, pageSize: number = 10, status?: string): Observable<any> {
        let url = `${this.API_URL}?page=${page}&pageSize=${pageSize}`;
        if (status) {
            url += `&status=${status}`;
        }
        return this.http.get(url);
    }

    getById(id: string): Observable<MembershipRequest> {
        return this.http.get<MembershipRequest>(`${this.API_URL}/${id}`);
    }

    approve(id: string, boardMemberSignature: FormData): Observable<any> {
        return this.http.post(`${this.API_URL}/approve/${id}`, boardMemberSignature);
    }

    reject(id: string, rejectionReason?: string): Observable<any> {
        return this.http.post(`${this.API_URL}/reject/${id}`, { rejectionReason: rejectionReason ?? null });
    }

    getApproved(page: number = 1, pageSize: number = 10): Observable<any> {
        return this.http.get(`${this.API_URL}/approved?page=${page}&pageSize=${pageSize}`);
    }

    download(id: string): Observable<Blob> {
        return this.http.get(`${this.API_URL}/contract/${id}`, {
            responseType: 'blob'
        });
    }
}
