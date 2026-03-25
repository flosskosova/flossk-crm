import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { Documentation } from './app/pages/documentation/documentation';
import { Landing } from './app/pages/landing/landing';
import { Notfound } from './app/pages/notfound/notfound';
import { Users } from '@/pages/dashboard/components/users';
import { Inventory } from '@/pages/dashboard/components/inventory';
import { HackerspacePresence } from '@/pages/dashboard/components/hackerspace-presence';
import { Settings } from '@/pages/dashboard/components/settings';
import { Events } from '@/pages/dashboard/components/events';
import { Announcements } from '@/pages/dashboard/components/announcements';
import { Profile } from '@/pages/dashboard/components/profile';
import { Notifications } from '@/pages/dashboard/components/notifications';
import { Statistics } from '@/pages/dashboard/components/statistics';
import { Leaderboard } from '@/pages/dashboard/components/leaderboard';
import { MembershipApplicationForm } from '@/pages/dashboard/components/membership-application-form';
import { authGuard, roleGuard } from '@/pages/service/auth.guard';
import { ExternalMessages } from '@/pages/dashboard/components/external-messages';
import { Expenses } from '@/pages/dashboard/components/expenses';
import { Rent } from '@/pages/dashboard/components/rent';
import { Onboarding } from '@/pages/dashboard/components/onboarding';
import { Donate } from '@/pages/dashboard/components/donate';
import { Projects } from '@/pages/dashboard/components/projects';
import { Elections } from '@/pages/dashboard/components/elections';
import { Integrations } from '@/pages/dashboard/components/integrations';
import { CertBuilder } from '@/pages/dashboard/components/cert-builder';
import { Plugins } from '@/pages/dashboard/components/plugins';

export const appRoutes: Routes = [
    { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
    {
        path: 'dashboard',
        component: AppLayout,
        canActivate: [authGuard],
        children: [
            { path: '', component: Dashboard },
            { path: 'profile', component: Profile },
            { path: 'profile/:userId', component: Profile },
            { path: 'notifications', component: Notifications },
            { path: 'announcements', component: Announcements },
            { path: 'users', component: Users },
            { path: 'elections', component: Elections, canActivate: [roleGuard(['Admin', 'Full Member'])] },
            { path: 'inventory', component: Inventory },
            { path: 'integrations', component: Integrations },
            { path: 'cert-builder', component: CertBuilder },
            { path: 'hackerspace-presence', component: HackerspacePresence },
            // { path: 'rfid-configurer', component: RfidConfigurer },
            { path: 'events', component: Events },
            { path: 'projects', component: Projects },
            { path: 'plugins', component: Plugins },
            { path: 'statistics', component: Statistics },
            { path: 'leaderboard', component: Leaderboard },
            { path: 'external-messages', component: ExternalMessages },
            { path: 'expenses', component: Expenses },
            { path: 'settings', component: Settings, canActivate: [roleGuard(['Admin'])] },
            { path: 'uikit', loadChildren: () => import('./app/pages/uikit/uikit.routes') },
            { path: 'documentation', component: Documentation },
            { path: 'pages', loadChildren: () => import('./app/pages/pages.routes') }
        ]
    },
    { path: 'onboarding', component: Onboarding },
    { path: 'rent', component: Rent },
    { path: 'donate', component: Donate },
    { path: 'apply', component: MembershipApplicationForm },
    { path: 'landing', canActivate: [authGuard], component: Landing },
    { path: 'notfound', component: Notfound },
    { path: 'auth', loadChildren: () => import('./app/pages/auth/auth.routes') },
    { path: '**', redirectTo: '/notfound' }
];
