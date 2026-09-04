import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';

@Component({
    selector: 'app-error',
    imports: [CommonModule, FormsModule, ButtonModule, RouterModule, DialogModule, InputTextModule, TextareaModule, AppFloatingConfigurator],
    standalone: true,
    template: ` <app-floating-configurator />
        <div class="min-h-screen min-w-screen overflow-hidden bg-surface-50 dark:bg-surface-950 flex items-center justify-center p-6">
            <div class="w-full max-w-lg">
                <div class="rounded-3xl bg-surface-0 dark:bg-surface-900 shadow-lg shadow-surface-200/50 dark:shadow-surface-950/50 overflow-hidden">
                    <div class="relative h-48 bg-gradient-to-br from-pink-500/10 via-primary/5 to-transparent dark:from-pink-500/20 dark:via-primary/10 flex items-center justify-center">
                        <div class="absolute inset-0 overflow-hidden">
                            <svg class="w-full h-full opacity-[0.04] dark:opacity-[0.08]" viewBox="0 0 400 200" fill="none">
                                <circle cx="50" cy="50" r="60" stroke="currentColor" stroke-width="0.5"/>
                                <circle cx="350" cy="150" r="80" stroke="currentColor" stroke-width="0.5"/>
                                <circle cx="200" cy="100" r="40" stroke="currentColor" stroke-width="0.5"/>
                                <line x1="0" y1="180" x2="400" y2="160" stroke="currentColor" stroke-width="0.5"/>
                            </svg>
                        </div>
                        <div class="relative z-10 flex flex-col items-center gap-2">
                            <div class="w-16 h-16 rounded-2xl bg-pink-500/10 dark:bg-pink-500/20 flex items-center justify-center ring-2 ring-pink-500/20">
                                <svg class="w-8 h-8 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m0 0v2m0-2h2m-2 0H10m9.364-7.364A9 9 0 1112 3a9 9 0 017.364 4.636z"/>
                                </svg>
                            </div>
                            <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0">Access Denied</h1>
                        </div>
                    </div>
                    <div class="px-8 pb-8 pt-6 text-center space-y-6">
                        <div class="space-y-2">
                            <p class="text-surface-700 dark:text-surface-200 font-medium">You need to be logged in to access this page.</p>
                            <p class="text-sm text-surface-500 dark:text-surface-400">If you think there's been a mistake, please contact an admin.</p>
                        </div>

                        <div class="flex flex-col sm:flex-row gap-3 justify-center">
                            <p-button label="Login" routerLink="/auth/login" styleClass="w-full sm:w-auto" />
                            <p-button label="Contact an Admin" [outlined]="true" severity="secondary" styleClass="w-full sm:w-auto" (onClick)="showContactDialog()" />
                        </div>

                        <div class="pt-4 border-t border-surface-100 dark:border-surface-800">
                            <a routerLink="/apply" class="text-sm text-primary hover:underline inline-flex items-center gap-1.5">
                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                                </svg>
                                Apply for Membership
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <p-dialog [(visible)]="contactDialogVisible" header="Contact an Admin" [modal]="true" [style]="{width: '28rem'}" [breakpoints]="{ '575px': '95vw' }" [dismissableMask]="true" appendTo="body">
            <div class="flex flex-col gap-5">
                <div>
                    <label for="contactName" class="block text-surface-700 dark:text-surface-200 text-sm font-medium mb-1.5">Name</label>
                    <input pInputText id="contactName" [(ngModel)]="contactForm.name" type="text" placeholder="Your name" class="w-full" />
                </div>
                <div>
                    <label for="contactEmail" class="block text-surface-700 dark:text-surface-200 text-sm font-medium mb-1.5">Email</label>
                    <input pInputText id="contactEmail" [(ngModel)]="contactForm.email" type="email" placeholder="Your email" class="w-full" />
                </div>
                <div>
                    <label for="contactMessage" class="block text-surface-700 dark:text-surface-200 text-sm font-medium mb-1.5">Message</label>
                    <textarea pTextarea id="contactMessage" [(ngModel)]="contactForm.message" rows="4" placeholder="Describe your issue..." class="w-full"></textarea>
                </div>
            </div>
            <div class="flex justify-end gap-2 pt-2">
                <p-button label="Cancel" severity="secondary" [text]="true" (onClick)="contactDialogVisible = false" />
                <p-button label="Send Message" [disabled]="!isFormValid()" (onClick)="sendMessage()" />
            </div>
        </p-dialog>`
})
export class Error {
    contactDialogVisible = false;
    contactForm = {
        name: '',
        email: '',
        message: ''
    };

    showContactDialog() {
        this.contactDialogVisible = true;
    }

    isFormValid(): boolean {
        return this.contactForm.name.trim() !== '' &&
               this.contactForm.email.trim() !== '' &&
               this.contactForm.message.trim() !== '';
    }

    sendMessage() {
        console.log('Sending message:', this.contactForm);
        this.contactForm = { name: '', email: '', message: '' };
        this.contactDialogVisible = false;
    }
}
