import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment.prod';

export interface LogEntry {
    id: string;
    entityType: string;
    entityId: string;
    entityName: string;
    action: string;
    detail?: string;
    userId: string;
    userFullName: string;
    userProfilePictureUrl?: string;
    timestamp: string;
}

export interface PaginatedLogsResponse {
    data: LogEntry[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

@Injectable({
    providedIn: 'root'
})
export class LogService {
    private readonly API_URL = `${environment.apiUrl}/Logs`;

    constructor(private http: HttpClient) {}

    getLogs(params: {
        entityType?: string;
        entityId?: string;
        userId?: string;
        page?: number;
        pageSize?: number;
        dateFrom?: string;
        dateTo?: string;
    }): Observable<PaginatedLogsResponse> {
        let httpParams = new HttpParams();
        if (params.entityType) httpParams = httpParams.set('entityType', params.entityType);
        if (params.entityId)   httpParams = httpParams.set('entityId', params.entityId);
        if (params.userId)     httpParams = httpParams.set('userId', params.userId);
        if (params.page)       httpParams = httpParams.set('page', params.page.toString());
        if (params.pageSize)   httpParams = httpParams.set('pageSize', params.pageSize.toString());
        if (params.dateFrom)   httpParams = httpParams.set('dateFrom', params.dateFrom);
        if (params.dateTo)     httpParams = httpParams.set('dateTo', params.dateTo);
        console.log('LogService.getLogs HttpParams:', httpParams.toString());
        return this.http.get<PaginatedLogsResponse>(this.API_URL, { params: httpParams });
    }
}
