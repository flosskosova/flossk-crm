import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';

@Component({
    selector: 'app-notfound',
    standalone: true,
    imports: [RouterModule, AppFloatingConfigurator, ButtonModule],
    template: ` <app-floating-configurator />
        <div class="min-h-screen min-w-screen overflow-hidden bg-surface-50 dark:bg-surface-950 flex items-center justify-center p-6">
            <div class="w-full max-w-lg">
                <div class="rounded-3xl bg-surface-0 dark:bg-surface-900 shadow-lg shadow-surface-200/50 dark:shadow-surface-950/50 overflow-hidden">
                    <div class="relative h-48 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent dark:from-primary/20 dark:via-primary/10 flex items-center justify-center">
                        <div class="absolute inset-0 overflow-hidden">
                            <svg class="w-full h-full opacity-[0.04] dark:opacity-[0.08]" viewBox="0 0 400 200" fill="none">
                                <circle cx="50" cy="30" r="40" stroke="currentColor" stroke-width="0.5"/>
                                <circle cx="350" cy="170" r="60" stroke="currentColor" stroke-width="0.5"/>
                                <circle cx="200" cy="100" r="30" stroke="currentColor" stroke-width="0.5"/>
                                <line x1="0" y1="150" x2="400" y2="130" stroke="currentColor" stroke-width="0.5"/>
                            </svg>
                        </div>
                        <div class="relative z-10 flex flex-col items-center gap-1">
                            <span class="text-6xl font-black text-primary/30 dark:text-primary/40 select-none">404</span>
                            <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0 -mt-2">Not Found</h1>
                        </div>
                    </div>
                    <div class="px-8 pb-8 pt-6 text-center space-y-6">
                        <p class="text-surface-500 dark:text-surface-400">The page you're looking for doesn't exist or has been moved.</p>
                        <p-button label="Go to Dashboard" routerLink="/" styleClass="w-full sm:w-auto" />
                    </div>
                </div>
            </div>
        </div>`
})
export class Notfound {}
