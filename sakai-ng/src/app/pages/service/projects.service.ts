import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment.prod';
import { Observable } from 'rxjs';

export interface TeamMember {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    role?: string;
    joinedAt: string;
}

export interface GitHubCommit {
    sha: string;
    commit: {
        author: {
            name: string;
            email: string;
            date: string;
        };
        message: string;
    };
    html_url: string;
    author?: {
        login: string;
        avatar_url: string;
    };
}

export interface GitHubRepo {
    name: string;
    full_name: string;
    html_url: string;
    updated_at: string;
}

export interface UserDto {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    biography?: string;
    phoneNumber?: string;
    location?: string;
    rfid: boolean;
    websiteUrl?: string;
    socialLinks?: string[];
    skills?: string[];
    createdAt: string;
    roles: string[];
    profilePictureUrl?: string;
}

export interface UsersResponse {
    users: UserDto[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface Member {
    id?: string;
    userId?: string;
    name: string;
    avatar: string;
    role: string;
}

export interface ResourceFile {
    id: string;
    fileName: string;
    contentType: string;
    fileSize: number;
    uploadedAt: string;
}

export interface Resource {
    id: number;
    title: string;
    urls: string[];
    description: string;
    type: 'documentation' | 'tutorial' | 'tool' | 'reference' | 'other';
    files?: ResourceFile[];
    createdByUserId?: string;
    createdByUserName?: string;
}

export interface Objective {
    id: number;
    title: string;
    description: string;
    status: 'todo' | 'in-progress' | 'completed';
    points?: number;
    createdAt?: string;
    assignedTo: Member;
    members?: Member[];
    resources?: Resource[];
    createdByUserId?: string;
    createdByFirstName?: string;
    createdByLastName?: string;
}

export interface ModeratorInfo {
    userId: string;
    firstName: string;
    lastName: string;
}

export interface Project {
    id: number;
    title: string;
    description: string;
    status: 'upcoming' | 'in-progress' | 'completed';
    startDate: string;
    endDate: string;
    progress: number;
    types?: string[];
    participants: Member[];
    objectives: Objective[];
    resources?: Resource[];
    githubRepo?: string; // GitHub repository URL for tracking commits
    bannerUrl?: string; // Project banner/wallpaper image URL
    createdByUserId?: string; // Project creator user ID
    createdByFirstName?: string; // Project creator first name
    createdByLastName?: string; // Project creator last name
    moderators?: ModeratorInfo[]; // Project moderators
}

@Injectable({
    providedIn: 'root'
})
export class ProjectsService {
    private readonly API_URL = `${environment.apiUrl}/Projects`;
    private readonly AUTH_API_URL = `${environment.apiUrl}/Auth`;

    constructor(private http: HttpClient) {}

    getProjects(status?: 'Upcoming' | 'InProgress' | 'Completed'): Observable<any[]> {
        if (status) {
            return this.http.get<any[]>(`${this.API_URL}?status=${status}`);
        }
        return this.http.get<any[]>(this.API_URL);
    }

    getProjectById(id: number): Observable<any> {
        return this.http.get<any>(`${this.API_URL}/${id}`);
    }

    getProjectsByUserId(userId: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.API_URL}/user/${userId}`);
    }

    createProject(payload: { title: string; description: string; startDate: string; endDate: string; status: string; types: string[] }): Observable<any> {
        return this.http.post<any>(this.API_URL, payload);
    }

    updateProject(id: number | string, payload: { title: string; description: string; startDate: string; endDate: string; status: string; types: string[] }): Observable<any> {
        return this.http.put<any>(`${this.API_URL}/${id}`, payload);
    }

    updateProjectStatus(id: number, status: string): Observable<any> {
        return this.http.patch<any>(`${this.API_URL}/${id}/status?status=${status}`, {});
    }

    updateObjectiveStatus(id: number, status: string): Observable<any> {
        return this.http.patch<any>(`${this.API_URL}/objectives/${id}/status?status=${status}`, {});
    }

    deleteProject(id: string): Observable<any> {
        return this.http.delete<any>(`${this.API_URL}/${id}`);
    }

    joinProject(projectId: number | string): Observable<any> {
        return this.http.post<any>(`${this.API_URL}/${projectId}/join`, {});
    }

    leaveProject(projectId: number | string): Observable<any> {
        return this.http.post<any>(`${this.API_URL}/${projectId}/leave`, {});
    }

    joinObjective(objectiveId: number | string): Observable<any> {
        return this.http.post<any>(`${this.API_URL}/objectives/${objectiveId}/join`, {});
    }

    leaveObjective(objectiveId: number | string): Observable<any> {
        return this.http.post<any>(`${this.API_URL}/objectives/${objectiveId}/leave`, {});
    }

    assignTeamMemberToObjective(objectiveId: number | string, userId: string): Observable<any> {
        return this.http.post<any>(`${this.API_URL}/objectives/${objectiveId}/team-members`, { userId });
    }

    removeTeamMemberFromObjective(objectiveId: number | string, userId: string): Observable<any> {
        return this.http.delete<any>(`${this.API_URL}/objectives/${objectiveId}/team-members/${userId}`);
    }

    removeTeamMember(projectId: number | string, userId: string): Observable<any> {
        return this.http.delete<any>(`${this.API_URL}/${projectId}/team-members/${userId}`);
    }

    createObjective(payload: { projectId: string; title: string; description: string; status: string }): Observable<any> {
        return this.http.post<any>(`${this.API_URL}/objectives`, payload);
    }

    updateObjective(objectiveId: number | string, payload: { projectId: string; title: string; description: string; status: string }): Observable<any> {
        return this.http.put<any>(`${this.API_URL}/objectives/${objectiveId}`, payload);
    }

    deleteObjective(objectiveId: number | string): Observable<any> {
        return this.http.delete<any>(`${this.API_URL}/objectives/${objectiveId}`);
    }

    getAllUsers(page: number = 1, pageSize: number = 100): Observable<UsersResponse> {
        return this.http.get<UsersResponse>(`${this.AUTH_API_URL}/users?page=${page}&pageSize=${pageSize}`);
    }

    createResource(payload: { projectId?: number; objectiveId?: number; title: string; urls: string[]; description: string; type: string; fileIds?: string[] }): Observable<any> {
        return this.http.post<any>(`${this.API_URL}/resources`, payload);
    }

    updateResource(id: number, payload: { title: string; urls: string[]; description: string; type: string; fileIdsToAdd?: string[]; fileIdsToRemove?: string[] }): Observable<any> {
        return this.http.put<any>(`${this.API_URL}/resources/${id}`, payload);
    }

    deleteResource(id: number): Observable<any> {
        return this.http.delete<any>(`${this.API_URL}/resources/${id}`);
    }

    addModerator(projectId: number | string, moderatorUserId: string): Observable<any> {
        return this.http.post<any>(`${this.API_URL}/${projectId}/moderators`, { moderatorUserId });
    }

    removeModerator(projectId: number | string, moderatorUserId: string): Observable<any> {
        return this.http.delete<any>(`${this.API_URL}/${projectId}/moderators/${moderatorUserId}`);
    }

    uploadBanner(projectId: string, file: File): Observable<any> {
        const formData = new FormData();
        formData.append('bannerFile', file);
        return this.http.post<any>(`${this.API_URL}/${projectId}/banner`, formData);
    }

    deleteBanner(projectId: string): Observable<any> {
        return this.http.delete<any>(`${this.API_URL}/${projectId}/banner`);
    }

    uploadFiles(files: File[]): Observable<any> {
        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });
        return this.http.post<any>(`${environment.apiUrl}/Files/upload-multiple`, formData);
    }
}
