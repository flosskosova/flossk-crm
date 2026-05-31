import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment.prod';

export interface InventoryItemImage {
    id: string;
    fileId: string;
    fileName: string;
    filePath: string;
    addedAt: string;
}

export interface InventoryItemCheckout {
    id: string;
    userId: string;
    userEmail: string;
    userFirstName: string;
    userLastName: string;
    userFullName: string;
    userProfilePictureUrl?: string;
    quantity: number;
    checkedOutAt: string;
}

export interface InventoryItem {
    id: string;
    name: string;
    manufacturer?: string;
    description?: string;
    category: string;
    subCategory?: string;
    unit?: string;
    quantity?: number;
    checkedOutQuantity?: number;
    quantityInUse?: number;
    quantityAvailable?: number;
    location?: string;
    electricSpecs?: string;
    status: string;
    createdAt: string;
    updatedAt?: string;
    currentUserId?: string;
    currentUserEmail?: string;
    currentUserFirstName?: string;
    currentUserLastName?: string;
    currentUserFullName?: string;
    currentUserProfilePictureUrl?: string;
    checkedOutAt?: string;
    condition?: 'Good' | 'Damaged' | 'Repaired';
    conditionNotes?: string;
    conditionReportedByUserFullName?: string;
    conditionReportedByUserProfilePictureUrl?: string;
    createdByUserId?: string;
    createdByUserEmail?: string;
    createdByUserFirstName?: string;
    createdByUserLastName?: string;
    createdByUserFullName?: string;
    createdByUserProfilePictureUrl?: string;
    thumbnailPath?: string;
    images?: InventoryItemImage[];
    checkouts?: InventoryItemCheckout[];
    properties?: { [key: string]: any };
}

export interface CheckoutUser {
    id: string;
    fullName: string;
}

export interface PaginatedInventoryResponse {
    data: InventoryItem[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

@Injectable({
    providedIn: 'root'
})
export class InventoryService {
    private readonly API_URL = `${environment.apiUrl}/Inventory`;

    constructor(private http: HttpClient) {}

    getCategories(): Observable<string[]> {
        return this.http.get<string[]>(`${this.API_URL}/categories`);
    }

    exportAll(): Observable<any[]> {
        return this.http.get<any[]>(`${this.API_URL}/export`);
    }

    exportExcel(): Observable<Blob> {
        return this.http.get(`${this.API_URL}/export/excel`, { responseType: 'blob' });
    }

    getInventoryItems(page: number = 1, pageSize: number = 20, search?: string): Observable<PaginatedInventoryResponse> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('pageSize', pageSize.toString());
        
        if (search) {
            params = params.set('search', search);
        }

        return this.http.get<PaginatedInventoryResponse>(this.API_URL, { params });
    }

    getInventoryItem(id: string): Observable<InventoryItem> {
        return this.http.get<InventoryItem>(`${this.API_URL}/${id}`);
    }

    createInventoryItem(item: { properties: { [key: string]: any } }): Observable<any> {
        return this.http.post(this.API_URL, item);
    }

    updateInventoryItem(id: string, properties: { [key: string]: any }): Observable<any> {
        return this.http.put(`${this.API_URL}/${id}`, { properties });
    }

    deleteInventoryItem(id: string): Observable<any> {
        return this.http.delete(`${this.API_URL}/${id}`);
    }

    getMyInventoryItems(): Observable<InventoryItem[]> {
        return this.http.get<InventoryItem[]>(`${this.API_URL}/my-items`);
    }

    getInventoryItemsByUser(userId: string): Observable<InventoryItem[]> {
        return this.http.get<InventoryItem[]>(`${this.API_URL}/user/${userId}`);
    }

    checkInItem(id: string): Observable<any> {
        return this.http.post(`${this.API_URL}/${id}/checkin`, {});
    }

    importInventoryFile(file: File): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post(`${this.API_URL}/import/parse`, formData);
    }

    getUsersWithCheckouts(): Observable<CheckoutUser[]> {
        return this.http.get<CheckoutUser[]>(`${this.API_URL}/checkouts/users`);
    }
}
