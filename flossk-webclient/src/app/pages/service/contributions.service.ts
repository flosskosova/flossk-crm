import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment.prod';
import { Observable } from 'rxjs';

export interface LeaderboardEntry {
    userId: string;
    firstName: string;
    lastName: string;
    email: string | null;
    profilePictureUrl: string | null;
    totalScore: number;
    projectsCompleted: number;
    totalObjectivesCompleted: number;
    totalResourcesCreated: number;
    rank: number;
}

export interface UserContribution {
    id: string;
    projectId: string;
    projectTitle: string;
    userId: string;
    firstName: string;
    lastName: string;
    profilePictureUrl: string | null;
    objectivesCompleted: number;
    resourcesCreated: number;
    isProjectCreator: boolean;
    score: number;
    calculatedAt: string;
}

@Injectable({
    providedIn: 'root'
})
export class ContributionsService {
    private readonly API_URL = `${environment.apiUrl}/Contributions`;

    constructor(private http: HttpClient) {}

    getLeaderboard(): Observable<LeaderboardEntry[]> {
        return this.http.get<LeaderboardEntry[]>(`${this.API_URL}/leaderboard`);
    }

    getProjectContributions(projectId: string): Observable<UserContribution[]> {
        return this.http.get<UserContribution[]>(`${this.API_URL}/project/${projectId}`);
    }

    getUserContributions(userId: string): Observable<UserContribution[]> {
        return this.http.get<UserContribution[]>(`${this.API_URL}/user/${userId}`);
    }

    calculateProjectContributions(projectId: string): Observable<UserContribution[]> {
        return this.http.post<UserContribution[]>(`${this.API_URL}/project/${projectId}/calculate`, {});
    }

    recalculateProjectContributions(projectId: string): Observable<UserContribution[]> {
        return this.http.post<UserContribution[]>(`${this.API_URL}/project/${projectId}/recalculate`, {});
    }
}
