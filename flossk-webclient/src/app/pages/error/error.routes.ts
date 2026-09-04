import { Routes } from '@angular/router';
import { Error } from './error';
import { Access } from './access';

export default [
    { path: '', component: Error },
    { path: 'access', component: Access }
] as Routes;
