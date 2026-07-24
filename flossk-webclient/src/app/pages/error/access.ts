import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';

@Component({
    selector: 'app-access',
    standalone: true,
    imports: [ButtonModule, RouterModule, AppFloatingConfigurator],
    template: ` <app-floating-configurator />
        <div class="min-h-screen min-w-screen overflow-hidden bg-surface-50 dark:bg-surface-950 flex items-center justify-center p-6">
            <div class="w-full max-w-lg">
                <div class="rounded-3xl bg-surface-0 dark:bg-surface-900 shadow-lg shadow-surface-200/50 dark:shadow-surface-950/50 overflow-hidden">
                    <div class="relative h-48 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent dark:from-orange-500/20 dark:via-amber-500/10 flex items-center justify-center">
                        <div class="absolute inset-0 overflow-hidden">
                            <svg class="w-full h-full opacity-[0.04] dark:opacity-[0.08]" viewBox="0 0 400 200" fill="none">
                                <circle cx="50" cy="50" r="60" stroke="currentColor" stroke-width="0.5"/>
                                <circle cx="350" cy="150" r="80" stroke="currentColor" stroke-width="0.5"/>
                                <line x1="50" y1="180" x2="350" y2="20" stroke="currentColor" stroke-width="0.5"/>
                            </svg>
                        </div>
                        <div class="relative z-10 flex flex-col items-center gap-2">
                            <div class="w-16 h-16 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center ring-2 ring-orange-500/20">
                                <svg class="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m0 0v2m0-2h2m-2 0H10m9.364-7.364A9 9 0 1112 3a9 9 0 017.364 4.636z"/>
                                </svg>
                            </div>
                            <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0">Access Denied</h1>
                        </div>
                    </div>
                    <div class="px-8 pb-8 pt-6 text-center space-y-6">
                        <p class="text-surface-500 dark:text-surface-400">You do not have the necessary permissions to access this page. Please contact an admin if you think this is a mistake.</p>
                        <p-button label="Go to Dashboard" routerLink="/" styleClass="w-full sm:w-auto" />
                    </div>
                </div>
            </div>
        </div>`
})
export class Access {}
