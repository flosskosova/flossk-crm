import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment.prod';
import { forkJoin, Observable, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';

export type CourseStatus = 'draft' | 'active' | 'completed';
export type CourseResourceType = 'documentation' | 'tutorial' | 'tool' | 'reference' | 'other';
export type CourseSessionType = 'InPerson' | 'Online';

export interface Instructor {
    userId: string;
    name: string;
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
    moduleId: string;
    moduleTitle: string;
    title: string;
    urls: string[];
    files: CourseResourceFile[];
    description: string;
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
    notes: string;
}

export interface Course {
    id: string;
    title: string;
    description: string;
    level: string;
    status: CourseStatus;
    projectId: string;
    projectTitle: string;
    communicationChannels: string[];
    instructors: Instructor[];
    modules: CourseModule[];
    sessions: CourseSession[];
    createdAt: string;
    updatedAt: string | null;
    moduleCount: number;
    resourceCount: number;
    sessionCount: number;
}

export interface CourseInstructorPayload {
    userId: string;
    role: string;
}

export interface CreateCoursePayload {
    title: string;
    description: string;
    level: string;
    status: CourseStatus;
    projectId: string;
    instructors: CourseInstructorPayload[];
    communicationChannels?: string[];
}

export interface UpdateCoursePayload {
    title: string;
    description: string;
    level: string;
    status: CourseStatus;
    instructors: CourseInstructorPayload[];
    communicationChannels?: string[];
}

export interface CourseModulePayload {
    title: string;
    description: string;
}

export interface CourseResourcePayload {
    title: string;
    urls: string[];
    fileIds: string[];
    description: string;
    type: CourseResourceType;
}

export interface CourseSessionPayload {
    title: string;
    date: string;
    hour: string;
    type: CourseSessionType;
    location: string;
    notes?: string;
}

interface CourseListApi {
    id: string;
}

interface CourseDtoApi {
    id: string;
    title: string;
    description: string;
    level: string;
    status: string;
    communicationChannels: string[];
    createdAt: string;
    updatedAt: string | null;
    projectId: string;
    projectTitle: string;
    instructors: CourseInstructorApi[];
    modules: CourseModuleApi[];
    sessions: CourseSessionApi[];
}

interface CourseInstructorApi {
    userId: string;
    firstName: string;
    lastName: string;
    role: string;
}

interface CourseModuleApi {
    id: string;
    title: string;
    description: string;
    order: number;
    resources: CourseResourceApi[];
}

interface CourseResourceApi {
    id: string;
    title: string;
    urls: string[];
    files: CourseResourceFileApi[];
    description?: string | null;
    type: string;
}

interface CourseResourceFileApi {
    id: string;
    fileId: string;
    fileName: string;
    originalFileName: string;
    contentType: string;
    fileSize: number;
    filePath: string;
}

interface CourseSessionApi {
    id: string;
    title: string;
    date: string;
    hour: string;
    type: string;
    location: string;
    notes?: string | null;
}

@Injectable({ providedIn: 'root' })
export class CourseService {
    private readonly apiUrl = `${environment.apiUrl}/Courses`;
    private readonly _courses = signal<Course[]>([]);

    readonly courses = this._courses.asReadonly();

    constructor(private http: HttpClient) {}

    loadCourses(): Observable<Course[]> {
        return this.http.get<CourseListApi[]>(this.apiUrl).pipe(
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

    createCourse(payload: CreateCoursePayload): Observable<Course> {
        return this.http.post<CourseDtoApi>(this.apiUrl, payload).pipe(
            map((course) => this.mapCourse(course)),
            tap((course) => this.upsertCourse(course, true))
        );
    }

    updateCourse(id: string, payload: UpdateCoursePayload): Observable<Course> {
        return this.http.put<CourseDtoApi>(`${this.apiUrl}/${id}`, payload).pipe(
            map((course) => this.mapCourse(course)),
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

    addModule(courseId: string, payload: CourseModulePayload): Observable<Course> {
        return this.http.post(`${this.apiUrl}/${courseId}/modules`, payload).pipe(
            switchMap(() => this.refreshCourse(courseId))
        );
    }

    updateModule(courseId: string, moduleId: string, payload: CourseModulePayload): Observable<Course> {
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

    addResource(courseId: string, moduleId: string, payload: CourseResourcePayload): Observable<Course> {
        const body = { ...payload, type: this.capitalizeResourceType(payload.type) };
        return this.http.post(`${this.apiUrl}/${courseId}/modules/${moduleId}/resources`, body).pipe(
            switchMap(() => this.refreshCourse(courseId))
        );
    }

    updateResource(courseId: string, moduleId: string, resourceId: string, payload: CourseResourcePayload): Observable<Course> {
        const body = { ...payload, type: this.capitalizeResourceType(payload.type) };
        return this.http.put(`${this.apiUrl}/${courseId}/modules/${moduleId}/resources/${resourceId}`, body).pipe(
            switchMap(() => this.refreshCourse(courseId))
        );
    }

    deleteResource(courseId: string, moduleId: string, resourceId: string): Observable<Course> {
        return this.http.delete<void>(`${this.apiUrl}/${courseId}/modules/${moduleId}/resources/${resourceId}`).pipe(
            switchMap(() => this.refreshCourse(courseId))
        );
    }

    addSession(courseId: string, payload: CourseSessionPayload): Observable<Course> {
        return this.http.post(`${this.apiUrl}/${courseId}/sessions`, payload).pipe(
            switchMap(() => this.refreshCourse(courseId))
        );
    }

    updateSession(courseId: string, sessionId: string, payload: CourseSessionPayload): Observable<Course> {
        return this.http.put(`${this.apiUrl}/${courseId}/sessions/${sessionId}`, payload).pipe(
            switchMap(() => this.refreshCourse(courseId))
        );
    }

    deleteSession(courseId: string, sessionId: string): Observable<Course> {
        return this.http.delete<void>(`${this.apiUrl}/${courseId}/sessions/${sessionId}`).pipe(
            switchMap(() => this.refreshCourse(courseId))
        );
    }

    private refreshCourse(courseId: string): Observable<Course> {
        return this.fetchCourse(courseId).pipe(
            tap((course) => this.upsertCourse(course))
        );
    }

    private fetchCourse(courseId: string): Observable<Course> {
        return this.http.get<CourseDtoApi>(`${this.apiUrl}/${courseId}`).pipe(
            map((course) => this.mapCourse(course))
        );
    }

    private upsertCourse(course: Course, prepend: boolean = false): void {
        this._courses.update((courses) => {
            const withoutCurrent = courses.filter((item) => item.id !== course.id);
            return prepend ? [course, ...withoutCurrent] : [...withoutCurrent, course];
        });
    }

    private mapCourse(course: CourseDtoApi): Course {
        const modules = [...course.modules]
            .sort((left, right) => left.order - right.order)
            .map((module) => this.mapModule(module));
        const sessions = [...course.sessions]
            .map((session) => this.mapSession(session))
            .sort((left, right) => `${left.date}T${left.hour}`.localeCompare(`${right.date}T${right.hour}`));

        return {
            id: course.id,
            title: course.title,
            description: course.description ?? '',
            level: course.level,
            status: this.normalizeStatus(course.status),
            projectId: course.projectId,
            projectTitle: course.projectTitle,
            communicationChannels: course.communicationChannels ?? [],
            instructors: course.instructors.map((instructor) => ({
                userId: instructor.userId,
                name: `${instructor.firstName} ${instructor.lastName}`.trim(),
                role: instructor.role
            })),
            modules,
            sessions,
            createdAt: course.createdAt,
            updatedAt: course.updatedAt,
            moduleCount: modules.length,
            resourceCount: modules.reduce((count, module) => count + module.resources.length, 0),
            sessionCount: sessions.length
        };
    }

    private mapModule(module: CourseModuleApi): CourseModule {
        return {
            id: module.id,
            title: module.title,
            description: module.description ?? '',
            order: module.order,
            resources: (module.resources ?? []).map((resource) => ({
                id: resource.id,
                moduleId: module.id,
                moduleTitle: module.title,
                title: resource.title,
                urls: resource.urls ?? [],
                files: (resource.files ?? []).map((f) => ({
                    id: f.id,
                    fileId: f.fileId,
                    fileName: f.fileName,
                    originalFileName: f.originalFileName,
                    contentType: f.contentType,
                    fileSize: f.fileSize,
                    filePath: f.filePath
                })),
                description: resource.description ?? '',
                type: this.normalizeResourceType(resource.type)
            }))
        };
    }

    private mapSession(session: CourseSessionApi): CourseSession {
        return {
            id: session.id,
            title: session.title,
            date: session.date,
            hour: session.hour,
            type: this.normalizeSessionType(session.type),
            location: session.location,
            notes: session.notes ?? ''
        };
    }

    private normalizeStatus(status: string): CourseStatus {
        switch (status.toLowerCase()) {
            case 'active':
                return 'active';
            case 'completed':
                return 'completed';
            default:
                return 'draft';
        }
    }

    private capitalizeResourceType(type: CourseResourceType): string {
        return type.charAt(0).toUpperCase() + type.slice(1);
    }

    private normalizeResourceType(type: string): CourseResourceType {
        switch (type.toLowerCase()) {
            case 'documentation':
                return 'documentation';
            case 'tutorial':
                return 'tutorial';
            case 'tool':
                return 'tool';
            case 'reference':
                return 'reference';
            default:
                return 'other';
        }
    }

    private normalizeSessionType(type: string): CourseSessionType {
        return type.toLowerCase() === 'online' ? 'Online' : 'InPerson';
    }
}