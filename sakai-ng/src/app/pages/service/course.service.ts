import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment.prod';
import { forkJoin, Observable, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';

export interface UploadedFileResult {
    fileId: string;
    fileName: string;
    originalFileName: string;
    contentType: string;
    fileSize: number;
}

export type CourseResourceType = 'Documentation' | 'Tutorial' | 'Tool' | 'Reference' | 'Other';
export type CourseSessionType = 'InPerson' | 'Online';

export interface CourseInstructor {
    userId: string;
    firstName?: string;
    lastName?: string;
    role: string;
}

export interface CourseResourceFile {
    id: string;
    fileId: string;
    fileName: string;
    originalFileName: string;
    contentType: string;
    fileSize: number;
    filePath: string;
}

export interface CourseResource {
    id: string;
    title: string;
    urls: string[];
    files: CourseResourceFile[];
    description: string | null;
    type: CourseResourceType;
}

export interface CourseModule {
    id: string;
    title: string;
    description: string;
    order: number;
    resources: CourseResource[];
}

export interface CourseSession {
    id: string;
    title: string;
    date: string;
    hour: string;
    type: CourseSessionType;
    location: string;
    notes: string | null;
}

export interface CourseVoucher {
    id: string;
    courseId: string;
    code: string;
    isMultiUse: boolean;
    isUsed: boolean;
    usedCount: number;
    createdAt: string;
    redeemedByEmails: string[];
}

export interface Course {
    id: string;
    title: string;
    description: string;
    projectId: string;
    projectTitle: string;
    communicationChannels: string[];
    createdByUserId: string;
    createdByFirstName: string;
    createdByLastName: string;
    instructors: CourseInstructor[];
    modules: CourseModule[];
    sessions: CourseSession[];
    vouchers: CourseVoucher[];
    createdAt: string;
    updatedAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class CourseService {
    private readonly apiUrl = `${environment.apiUrl}/Courses`;
    private readonly _courses = signal<Course[]>([]);

    readonly courses = this._courses.asReadonly();

    constructor(private http: HttpClient) {}

    loadCourses(): Observable<Course[]> {
        return this.http.get<{ items: Array<Pick<Course, 'id'>> }>(this.apiUrl).pipe(
            map((response) => response.items ?? []),
            switchMap((courses) => {
                if (courses.length === 0) {
                    return of([] as Course[]);
                }

                return forkJoin(courses.map((course) => this.fetchCourse(course.id)));
            }),
            tap((courses) => this._courses.set(courses))
        );
    }

    getCourseById(id: string): Course | undefined {
        return this._courses().find((course) => course.id === id);
    }

    getCourse(id: string, forceRefresh: boolean = false): Observable<Course> {
        const cached = this.getCourseById(id);
        if (cached && !forceRefresh) {
            return of(cached);
        }

        return this.refreshCourse(id);
    }

    createCourse(payload: Pick<Course, 'title' | 'description' | 'projectId' | 'communicationChannels'> & { instructors: Array<Pick<CourseInstructor, 'userId' | 'role'>> }): Observable<Course> {
        return this.http.post<Course>(this.apiUrl, payload).pipe(
            tap((course) => this.upsertCourse(course, true))
        );
    }

    updateCourse(id: string, payload: Pick<Course, 'title' | 'description' | 'communicationChannels'> & { instructors: Array<Pick<CourseInstructor, 'userId' | 'role'>> }): Observable<Course> {
        return this.http.put<Course>(`${this.apiUrl}/${id}`, payload).pipe(
            tap((course) => this.upsertCourse(course))
        );
    }

    deleteCourse(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
            tap(() => {
                this._courses.update((courses) => courses.filter((course) => course.id !== id));
            })
        );
    }

    addModule(courseId: string, payload: Pick<CourseModule, 'title' | 'description'>): Observable<Course> {
        return this.http.post(`${this.apiUrl}/${courseId}/modules`, payload).pipe(
            switchMap(() => this.refreshCourse(courseId))
        );
    }

    updateModule(courseId: string, moduleId: string, payload: Pick<CourseModule, 'title' | 'description'>): Observable<Course> {
        return this.http.put(`${this.apiUrl}/${courseId}/modules/${moduleId}`, payload).pipe(
            switchMap(() => this.refreshCourse(courseId))
        );
    }

    deleteModule(courseId: string, moduleId: string): Observable<Course> {
        return this.http.delete<void>(`${this.apiUrl}/${courseId}/modules/${moduleId}`).pipe(
            switchMap(() => this.refreshCourse(courseId))
        );
    }

    reorderModules(courseId: string, orderedModuleIds: string[]): Observable<Course> {
        return this.http.put<void>(`${this.apiUrl}/${courseId}/modules/reorder`, orderedModuleIds).pipe(
            switchMap(() => this.refreshCourse(courseId))
        );
    }

    addResource(courseId: string, moduleId: string, payload: Pick<CourseResource, 'title' | 'urls' | 'description' | 'type'> & { fileIds: string[] }): Observable<Course> {
        return this.http.post(`${this.apiUrl}/${courseId}/modules/${moduleId}/resources`, payload).pipe(
            switchMap(() => this.refreshCourse(courseId))
        );
    }

    uploadFiles(files: File[]): Observable<UploadedFileResult[]> {
        const form = new FormData();
        files.forEach((f) => form.append('files', f, f.name));
        return this.http.post<{ results: { success: boolean; fileId: string; fileName: string; originalFileName: string; contentType: string; fileSize: number }[] }>(
            `${environment.apiUrl}/Files/upload-multiple`, form
        ).pipe(
            map((res) =>
                res.results
                    .filter((r) => r.success)
                    .map((r) => ({
                        fileId: r.fileId,
                        fileName: r.fileName,
                        originalFileName: r.originalFileName,
                        contentType: r.contentType,
                        fileSize: r.fileSize
                    }))
            )
        );
    }

    updateResource(courseId: string, moduleId: string, resourceId: string, payload: Pick<CourseResource, 'title' | 'urls' | 'description' | 'type'> & { fileIds: string[] }): Observable<Course> {
        return this.http.put(`${this.apiUrl}/${courseId}/modules/${moduleId}/resources/${resourceId}`, payload).pipe(
            switchMap(() => this.refreshCourse(courseId))
        );
    }

    deleteResource(courseId: string, moduleId: string, resourceId: string): Observable<Course> {
        return this.http.delete<void>(`${this.apiUrl}/${courseId}/modules/${moduleId}/resources/${resourceId}`).pipe(
            switchMap(() => this.refreshCourse(courseId))
        );
    }

    addSession(courseId: string, payload: Pick<CourseSession, 'title' | 'date' | 'hour' | 'type' | 'location' | 'notes'>): Observable<Course> {
        return this.http.post(`${this.apiUrl}/${courseId}/sessions`, payload).pipe(
            switchMap(() => this.refreshCourse(courseId))
        );
    }

    updateSession(courseId: string, sessionId: string, payload: Pick<CourseSession, 'title' | 'date' | 'hour' | 'type' | 'location' | 'notes'>): Observable<Course> {
        return this.http.put(`${this.apiUrl}/${courseId}/sessions/${sessionId}`, payload).pipe(
            switchMap(() => this.refreshCourse(courseId))
        );
    }

    deleteSession(courseId: string, sessionId: string): Observable<Course> {
        return this.http.delete<void>(`${this.apiUrl}/${courseId}/sessions/${sessionId}`).pipe(
            switchMap(() => this.refreshCourse(courseId))
        );
    }

    getVouchers(courseId: string): Observable<CourseVoucher[]> {
        return this.http.get<CourseVoucher[]>(`${this.apiUrl}/${courseId}/vouchers`);
    }

    createVouchers(courseId: string, payload: { isMultiUse: boolean; count: number }): Observable<CourseVoucher[]> {
        return this.http.post<CourseVoucher[]>(`${this.apiUrl}/${courseId}/vouchers`, payload);
    }

    private refreshCourse(courseId: string): Observable<Course> {
        return this.fetchCourse(courseId).pipe(
            tap((course) => this.upsertCourse(course))
        );
    }

    private fetchCourse(courseId: string): Observable<Course> {
        return this.http.get<Course>(`${this.apiUrl}/${courseId}`);
    }

    private upsertCourse(course: Course, prepend: boolean = false): void {
        this._courses.update((courses) => {
            const withoutCurrent = courses.filter((item) => item.id !== course.id);
            return prepend ? [course, ...withoutCurrent] : [...withoutCurrent, course];
        });
    }
}