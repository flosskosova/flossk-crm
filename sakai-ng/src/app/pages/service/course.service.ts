import { Injectable, signal } from '@angular/core';

export interface Instructor {
    name: string;
    role: string;
}

export interface CourseModule {
    id: number;
    title: string;
    description: string;
}

export interface CourseResource {
    id: number;
    title: string;
    url: string;
    description: string;
    type: 'video' | 'document' | 'link' | 'other';
}

export interface Course {
    id: number;
    title: string;
    description: string;
    level: string;
    status: 'draft' | 'active' | 'completed';
    instructors: Instructor[];
    modules: CourseModule[];
    resources: CourseResource[];
    scheduledDates: Date[];
    createdAt: Date;
}

@Injectable({ providedIn: 'root' })
export class CourseService {
    private _courses = signal<Course[]>([]);
    readonly courses = this._courses.asReadonly();

    private nextId = 1;
    private nextModuleId = 1;
    private nextResourceId = 1;

    getCourseById(id: number): Course | undefined {
        return this._courses().find(c => c.id === id);
    }

    addCourse(data: Pick<Course, 'title' | 'description' | 'level' | 'status' | 'instructors'>): Course {
        const course: Course = {
            ...data,
            id: this.nextId++,
            modules: [],
            resources: [],
            scheduledDates: [],
            createdAt: new Date()
        };
        this._courses.update(cs => [...cs, course]);
        return course;
    }

    updateCourse(id: number, data: Pick<Course, 'title' | 'description' | 'level' | 'status' | 'instructors'>): void {
        this._courses.update(cs => cs.map(c => c.id === id ? { ...c, ...data } : c));
    }

    deleteCourse(id: number): void {
        this._courses.update(cs => cs.filter(c => c.id !== id));
    }

    // Module CRUD (operates on a course reference already in the signal array)
    addModule(courseId: number, data: Pick<CourseModule, 'title' | 'description'>): void {
        this._courses.update(cs => cs.map(c => {
            if (c.id !== courseId) return c;
            return { ...c, modules: [...c.modules, { id: this.nextModuleId++, ...data }] };
        }));
    }

    updateModule(courseId: number, moduleId: number, data: Pick<CourseModule, 'title' | 'description'>): void {
        this._courses.update(cs => cs.map(c => {
            if (c.id !== courseId) return c;
            return { ...c, modules: c.modules.map(m => m.id === moduleId ? { ...m, ...data } : m) };
        }));
    }

    deleteModule(courseId: number, moduleId: number): void {
        this._courses.update(cs => cs.map(c => {
            if (c.id !== courseId) return c;
            return { ...c, modules: c.modules.filter(m => m.id !== moduleId) };
        }));
    }

    moveModule(courseId: number, fromIndex: number, toIndex: number): void {
        this._courses.update(cs => cs.map(c => {
            if (c.id !== courseId) return c;
            const mods = [...c.modules];
            [mods[fromIndex], mods[toIndex]] = [mods[toIndex], mods[fromIndex]];
            return { ...c, modules: mods };
        }));
    }

    // Resource CRUD
    addResource(courseId: number, data: Pick<CourseResource, 'title' | 'url' | 'description' | 'type'>): void {
        this._courses.update(cs => cs.map(c => {
            if (c.id !== courseId) return c;
            return { ...c, resources: [...c.resources, { id: this.nextResourceId++, ...data }] };
        }));
    }

    updateResource(courseId: number, resourceId: number, data: Pick<CourseResource, 'title' | 'url' | 'description' | 'type'>): void {
        this._courses.update(cs => cs.map(c => {
            if (c.id !== courseId) return c;
            return { ...c, resources: c.resources.map(r => r.id === resourceId ? { ...r, ...data } : r) };
        }));
    }

    deleteResource(courseId: number, resourceId: number): void {
        this._courses.update(cs => cs.map(c => {
            if (c.id !== courseId) return c;
            return { ...c, resources: c.resources.filter(r => r.id !== resourceId) };
        }));
    }

    // Schedule
    setScheduledDates(courseId: number, dates: Date[]): void {
        this._courses.update(cs => cs.map(c => c.id === courseId ? { ...c, scheduledDates: [...dates] } : c));
    }
}
