import { Routes } from '@angular/router';
import { Login } from './login';
import { ResetPassword } from './reset-password';
import { CourseLogin } from './course-login';

export default [
    { path: 'login', component: Login },
    { path: 'reset-password', component: ResetPassword },
    { path: 'course-login', component: CourseLogin }
] as Routes;
