import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment.prod';

export interface ElectionCandidate {
    userId: string;
    fullName: string;
    biography?: string;
    votes: number;
}

export interface Election {
    id: string;
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    status: 'upcoming' | 'active' | 'completed';
    totalVotes: number;
    hasVoted: boolean;
    isFinalized: boolean;
    finalizedAt?: string;
    createdAt: string;
    createdByUserId: string;
    createdByName: string;
    candidates: ElectionCandidate[];
}

export interface ElectionSummary {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    status: 'upcoming' | 'active' | 'completed';
    totalVotes: number;
    candidateCount: number;
    isFinalized: boolean;
}

export interface CreateElectionDto {
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    candidateIds: string[];
}

export interface UpdateElectionDto {
    startDate: string;
    endDate: string;
    candidateIds: string[];
}

export interface CastVoteDto {
    candidateUserIds: string[];
}

export interface ElectionCategory {
    id: string;
    title: string;
    description?: string;
    votingRule: 'AdminOnly' | 'FullMembersOnly' | 'AllUsers';
    createdAt: string;
    createdByUserId: string;
    createdByName: string;
}

export interface CreateElectionCategoryDto {
    title: string;
    description?: string;
    votingRule: string;
}

export interface UpdateElectionCategoryDto {
    title: string;
    description?: string;
    votingRule: string;
}

@Injectable({ providedIn: 'root' })
export class ElectionService {
    private readonly API = `${environment.apiUrl}/Elections`;
    private readonly CATEGORY_API = `${environment.apiUrl}/ElectionCategories`;

    constructor(private http: HttpClient) {}

    getAll(): Observable<ElectionSummary[]> {
        return this.http.get<ElectionSummary[]>(this.API);
    }

    getById(id: string): Observable<Election> {
        return this.http.get<Election>(`${this.API}/${id}`);
    }

    create(dto: CreateElectionDto): Observable<Election> {
        return this.http.post<Election>(this.API, dto);
    }

    update(id: string, dto: UpdateElectionDto): Observable<Election> {
        return this.http.put<Election>(`${this.API}/${id}`, dto);
    }

    delete(id: string): Observable<any> {
        return this.http.delete(`${this.API}/${id}`);
    }

    castVote(electionId: string, dto: CastVoteDto): Observable<any> {
        return this.http.post(`${this.API}/${electionId}/vote`, dto);
    }

    getCategories(): Observable<ElectionCategory[]> {
        return this.http.get<ElectionCategory[]>(this.CATEGORY_API);
    }

    createCategory(dto: CreateElectionCategoryDto): Observable<ElectionCategory> {
        return this.http.post<ElectionCategory>(this.CATEGORY_API, dto);
    }

    updateCategory(id: string, dto: UpdateElectionCategoryDto): Observable<ElectionCategory> {
        return this.http.put<ElectionCategory>(`${this.CATEGORY_API}/${id}`, dto);
    }

    deleteCategory(id: string): Observable<any> {
        return this.http.delete(`${this.CATEGORY_API}/${id}`);
    }
}
