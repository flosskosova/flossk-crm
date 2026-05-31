import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment.prod';

export interface CollaborationPad {
    id: string;
    name: string;
    url: string;
    description?: string;
    createdAt?: string;
    createdBy?: string;
}

export interface CreateCollaborationPadDto {
    name: string;
    url: string;
    description?: string;
}

export interface UpdateCollaborationPadDto {
    name: string;
    url: string;
    description?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

@Injectable({
    providedIn: 'root'
})
export class CollaborationPadsService {
    private readonly API_URL = `${environment.apiUrl}/CollaborationPads`;

    constructor(private http: HttpClient) {}

    getAll(page: number = 1, pageSize: number = 10, search?: string): Observable<PaginatedResponse<CollaborationPad>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('pageSize', pageSize.toString());

        if (search) {
            params = params.set('search', search);
        }

        return this.http.get<PaginatedResponse<CollaborationPad>>(this.API_URL, { params });
    }

    getById(id: string): Observable<CollaborationPad> {
        return this.http.get<CollaborationPad>(`${this.API_URL}/${id}`);
    }

    create(pad: CreateCollaborationPadDto): Observable<CollaborationPad> {
        return this.http.post<CollaborationPad>(this.API_URL, pad);
    }

    update(id: string, pad: UpdateCollaborationPadDto): Observable<CollaborationPad> {
        return this.http.put<CollaborationPad>(`${this.API_URL}/${id}`, pad);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.API_URL}/${id}`);
    }
}
