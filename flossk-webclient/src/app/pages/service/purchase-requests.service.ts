import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment.prod';

export interface PurchaseRequest {
    id: string;
    itemName: string;
    reason: string;
    link?: string;
    price: number;
    quantity: number;
    total: number;
    neededByDate: string;
    status: string;
    createdAt: string;
    createdByFirstName?: string;
    createdByLastName?: string;
    reviewedAt?: string;
    reviewedByFirstName?: string;
    reviewedByLastName?: string;
    rejectionReason?: string;
}

export interface PurchaseRequestList {
    requests: PurchaseRequest[];
    totalCount: number;
    page: number;
    pageSize: number;
}

@Injectable({ providedIn: 'root' })
export class PurchaseRequestsService {
    private readonly API = `${environment.apiUrl}/PurchaseRequests`;

    constructor(private http: HttpClient) {}

    create(data: {
        itemName: string;
        reason: string;
        link?: string;
        price: number;
        quantity: number;
        neededByDate: string;
    }): Observable<PurchaseRequest> {
        return this.http.post<PurchaseRequest>(this.API, data);
    }

    getMine(page = 1, pageSize = 20): Observable<PurchaseRequestList> {
        return this.http.get<PurchaseRequestList>(`${this.API}/mine?page=${page}&pageSize=${pageSize}`);
    }

    getAll(status?: string, page = 1, pageSize = 20): Observable<PurchaseRequestList> {
        let url = `${this.API}?page=${page}&pageSize=${pageSize}`;
        if (status) url += `&status=${status}`;
        return this.http.get<PurchaseRequestList>(url);
    }

    getById(id: string): Observable<PurchaseRequest> {
        return this.http.get<PurchaseRequest>(`${this.API}/${id}`);
    }

    approve(id: string): Observable<any> {
        return this.http.post(`${this.API}/approve/${id}`, {});
    }

    reject(id: string, rejectionReason?: string): Observable<any> {
        return this.http.post(`${this.API}/reject/${id}`, { rejectionReason: rejectionReason ?? null });
    }
}
