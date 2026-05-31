import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment.prod';

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    biography: string;
    phoneNumber: string;
    location: string;
    websiteUrl: string;
    socialLinks: string[];
    skills: string[];
    createdAt: string;
    roles: string[];
    profilePictureUrl: string;
    cvUrl?: string;
    bannerUrl?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ProfileService {
    constructor(private http: HttpClient) {}

    getUserById(userId: string): Observable<User> {
        return this.http.get<User>(`${environment.apiUrl}/Auth/users/${userId}`);
    }
}
