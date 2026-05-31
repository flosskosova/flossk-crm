import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment.prod';
import { Observable } from 'rxjs';

export type RecurringTypeValue = 'None' | 'Daily' | 'Monthly' | 'Weekly' | 'Annually';
export type RecurringSelectionValue = Exclude<RecurringTypeValue, 'None'>;

interface EventPayloadBase {
    eventName: string;
    projectId?: string | null;
}

export interface NonRecurringEventPayload extends EventPayloadBase {
    recurringType: 'None';
    startDate: string;
    endDate: string;
    recurringDate?: null;
}

export interface RecurringEventPayload extends EventPayloadBase {
    recurringType: RecurringSelectionValue;
    recurringDate: string;
    startDate?: null;
    endDate?: null;
}

export interface EventDto {
    id: string;
    eventName: string;
    startDate?: string | null;
    endDate?: string | null;
    recurringDate?: string | null;
    isRecurring?: boolean;
    recurringType?: RecurringTypeValue | number | null;
    createdAt: string;
    updatedAt?: string | null;
    projectId?: string | null;
    projectTitle?: string | null;
}

export type UpdateEventPayload = NonRecurringEventPayload | RecurringEventPayload;

export type CreateEventPayload = NonRecurringEventPayload | RecurringEventPayload;

@Injectable({
    providedIn: 'root'
})
export class EventsService {
    private readonly API_URL = `${environment.apiUrl}/Events`;

    constructor(private http: HttpClient) {}

    getEvents(): Observable<EventDto[]> {
        return this.http.get<EventDto[]>(this.API_URL);
    }

    createEvent(payload: CreateEventPayload): Observable<EventDto> {
        return this.http.post<EventDto>(this.API_URL, payload);
    }

    updateEvent(id: string, payload: UpdateEventPayload): Observable<EventDto> {
        return this.http.put<EventDto>(`${this.API_URL}/${id}`, payload);
    }

    deleteEvent(id: string): Observable<void> {
        return this.http.delete<void>(`${this.API_URL}/${id}`);
    }
}
