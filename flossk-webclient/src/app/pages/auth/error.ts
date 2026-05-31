import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';

@Component({
    selector: 'app-error',
    imports: [CommonModule, FormsModule, ButtonModule, RippleModule, RouterModule, DialogModule, InputTextModule, TextareaModule, AppFloatingConfigurator],
    standalone: true,
    template: ` <app-floating-configurator />
        <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-screen overflow-hidden">
            <div class="flex flex-col items-center justify-center">
                <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, rgba(233, 30, 99, 0.4) 10%, rgba(33, 150, 243, 0) 30%)">
                    <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20 flex flex-col items-center" style="border-radius: 53px">
                        <div class="gap-4 flex flex-col items-center">
                            <div class="flex justify-center items-center border-2 border-pink-500 rounded-full" style="height: 3.2rem; width: 3.2rem">
                                <i class="pi pi-fw pi-exclamation-circle text-2xl! text-pink-500"></i>
                            </div>
                            <h1 class="text-surface-900 dark:text-surface-0 font-bold text-5xl mb-2">Access Denied</h1>
                            <span class="text-muted-color mb-4">You need to be logged in to access this page.</span>
                            <span class="text-muted-color mb-8">If you think there's been a mistake, please contact an admin.</span>
                            <img src="https://primefaces.org/cdn/templates/sakai/auth/asset-error.svg" alt="Error" class="mb-8" width="80%" />
                            <div class="col-span-12 mt-8 text-center flex flex-col gap-4">
                                <p-button label="Login" routerLink="/auth/login" severity="danger" />
                                <span class="text-muted-color">or</span>
                                <p-button label="Contact an Admin" [outlined]="true" severity="secondary" (onClick)="showContactDialog()" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Contact Admin Dialog -->
        <p-dialog [(visible)]="contactDialogVisible" header="Contact an Admin" [modal]="true" [style]="{width: '30rem'}" appendTo="body">
            <div class="flex flex-col gap-4">
                <div>
                    <label for="contactName" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Name</label>
                    <input pInputText id="contactName" [(ngModel)]="contactForm.name" type="text" placeholder="Your name" class="w-full" />
                </div>
                <div>
                    <label for="contactEmail" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Email</label>
                    <input pInputText id="contactEmail" [(ngModel)]="contactForm.email" type="email" placeholder="Your email" class="w-full" />
                </div>
                <div>
                    <label for="contactMessage" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Message</label>
                    <textarea pTextarea id="contactMessage" [(ngModel)]="contactForm.message" rows="4" placeholder="Describe your issue..." class="w-full"></textarea>
                </div>
            </div>
            <div class="flex justify-end gap-2 mt-6">
                <p-button label="Cancel" severity="secondary" (onClick)="contactDialogVisible = false" />
                <p-button label="Send Message" [disabled]="!isFormValid()" severity="danger" (onClick)="sendMessage()" />
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
        // TODO: Connect to API endpoint when ready
        console.log('Sending message:', this.contactForm);
        
        // Reset form and close dialog
        this.contactForm = { name: '', email: '', message: '' };
        this.contactDialogVisible = false;
    }
}
