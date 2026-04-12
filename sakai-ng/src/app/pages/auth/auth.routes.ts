import { Routes } from '@angular/router';
import { Access } from './access';
import { Login } from './login';
import { Error } from './error';
import { ResetPassword } from './reset-password';
import { CourseLogin } from './course-login';

export default [
    { path: 'access', component: Access },
    { path: 'error', component: Error },
    { path: 'login', component: Login },
    { path: 'reset-password', component: ResetPassword },
    { path: 'course-login', component: CourseLogin }
] as Routes;
