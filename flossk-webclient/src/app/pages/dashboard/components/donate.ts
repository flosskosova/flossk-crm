import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { RadioButtonModule } from 'primeng/radiobutton';
import { DividerModule } from 'primeng/divider';
import { MessageModule } from 'primeng/message';

interface MonetaryDonation {
    amount: number | null;
    customAmount: number | null;
    donorName: string;
    donorEmail: string;
    message: string;
    anonymous: boolean;
}

@Component({
    selector: 'app-donate',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        ButtonModule,
        CardModule,
        InputTextModule,
        InputNumberModule,
        TextareaModule,
        RadioButtonModule,
        DividerModule,
        MessageModule
    ],
    styles: [
        `
            :host ::ng-deep .p-card {
                height: 100%;
                display: flex;
                flex-direction: column;
            }
            :host ::ng-deep .p-card-body {
                flex: 1;
                display: flex;
                flex-direction: column;
            }
            :host ::ng-deep .p-card-content {
                flex: 1;
                display: flex;
                flex-direction: column;
            }
        `
    ],
    template: `
        <div class="bg-surface-50 dark:bg-surface-950 min-h-screen py-8 px-4">
            <div class="max-w-4xl mx-auto">
                <!-- Header -->
                <div class="text-center mb-8">
                    <div class="flex justify-center mb-4">
                        <div class="bg-pink-100 dark:bg-pink-900/30 text-pink-600 rounded-full p-4">
                            <i class="pi pi-heart-fill text-4xl"></i>
                        </div>
                    </div>
                    <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 mb-2">Support FLOSSK</h1>
                    <p class="text-muted-color">Your contribution helps us promote free and open source software in Kosovo</p>
                </div>

                <!-- Success Message -->
                <div *ngIf="submitted" class="bg-surface-0 dark:bg-surface-900 rounded-xl shadow-md p-8 text-center">
                    <div class="flex justify-center mb-4">
                        <div class="bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full p-4">
                            <i class="pi pi-check text-4xl"></i>
                        </div>
                    </div>
                    <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0 mb-2">Thank You!</h2>
                    <p class="text-muted-color mb-6">Your generosity helps us continue our mission. We truly appreciate your support!</p>
                    <div class="flex justify-center gap-4">
                        <p-button label="Make Another Donation" icon="pi pi-heart" (onClick)="resetForm()" [outlined]="true" />
                        <p-button label="Back to Home" icon="pi pi-home" routerLink="/onboarding" />
                    </div>
                </div>

                <!-- Donation Type Selection -->
                <div *ngIf="!submitted && !donationType" class="bg-surface-0 dark:bg-surface-900 rounded-xl shadow-md p-6 md:p-8">
                    <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-6 text-center">How would you like to contribute?</h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Monetary Donation -->
                        <div 
                            class="border-2 rounded-xl p-6 cursor-pointer transition-all hover:border-primary hover:shadow-lg"
                            [class.border-surface-200]="true"
                            [class.dark:border-surface-700]="true"
                            (click)="selectDonationType('monetary')">
                            <div class="flex flex-col items-center text-center">
                                <div class="bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full p-4 mb-4">
                                    <i class="pi pi-wallet text-3xl"></i>
                                </div>
                                <h4 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-2">Monetary Donation</h4>
                                <p class="text-sm text-muted-color">Support us with a financial contribution to help fund our programs and operations</p>
                            </div>
                        </div>
                        
                        <!-- Equipment/Other Donation -->
                        <div 
                            class="border-2 rounded-xl p-6 cursor-pointer transition-all hover:border-primary hover:shadow-lg"
                            [class.border-surface-200]="true"
                            [class.dark:border-surface-700]="true"
                            (click)="selectDonationType('equipment')">
                            <div class="flex flex-col items-center text-center">
                                <div class="bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full p-4 mb-4">
                                    <i class="pi pi-box text-3xl"></i>
                                </div>
                                <h4 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-2">Equipment Donation</h4>
                                <p class="text-sm text-muted-color">Donate tech books, electronics, laptops, tools, or office furniture</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Monetary Donation Form -->
                <div *ngIf="!submitted && donationType === 'monetary'" class="bg-surface-0 dark:bg-surface-900 rounded-xl shadow-md p-6 md:p-8">
                    <div class="flex items-center gap-2 mb-6">
                        <p-button icon="pi pi-arrow-left" [rounded]="true" [text]="true" (onClick)="donationType = null" />
                        <span class="text-muted-color">Monetary Donation</span>
                    </div>

                    <div class="flex flex-col gap-6">
                        <!-- Preset Amounts -->
                        <div>
                            <label class="block text-surface-900 dark:text-surface-0 font-medium mb-3">Select Amount</label>
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div *ngFor="let preset of presetAmounts"
                                    class="border-2 rounded-lg p-4 cursor-pointer transition-all text-center"
                                    [class.border-primary]="monetaryDonation.amount === preset"
                                    [class.bg-primary-50]="monetaryDonation.amount === preset"
                                    [class.dark:bg-primary-900/20]="monetaryDonation.amount === preset"
                                    [class.border-surface-200]="monetaryDonation.amount !== preset"
                                    [class.dark:border-surface-700]="monetaryDonation.amount !== preset"
                                    (click)="selectAmount(preset)">
                                    <span class="text-xl font-bold text-surface-900 dark:text-surface-0">€{{ preset }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Custom Amount -->
                        <div>
                            <label class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Or enter a custom amount</label>
                            <p-inputNumber [(ngModel)]="monetaryDonation.customAmount" mode="currency" currency="EUR" locale="de-DE" placeholder="Custom amount" class="w-full" (onInput)="monetaryDonation.amount = null" />
                        </div>

                        <p-divider />

                        <!-- Donor Information -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Your Name</label>
                                <input pInputText [(ngModel)]="monetaryDonation.donorName" class="w-full" placeholder="John Doe" [disabled]="monetaryDonation.anonymous" />
                            </div>
                            <div>
                                <label class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Email Address *</label>
                                <input pInputText [(ngModel)]="monetaryDonation.donorEmail" type="email" class="w-full" placeholder="your@email.com" />
                            </div>
                        </div>

                        <div>
                            <label class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Message (Optional)</label>
                            <textarea pTextarea [(ngModel)]="monetaryDonation.message" [rows]="3" class="w-full" placeholder="Leave a message of support..."></textarea>
                        </div>

                        <div class="flex items-center gap-3">
                            <p-radioButton [(ngModel)]="monetaryDonation.anonymous" [value]="true" inputId="anonymous" name="anonymousGroup" />
                            <label for="anonymous" class="cursor-pointer">Make this donation anonymous</label>
                        </div>

                        <!-- Summary -->
                        <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-4">
                            <div class="flex justify-between items-center">
                                <span class="text-surface-900 dark:text-surface-0 font-medium">Donation Amount:</span>
                                <span class="text-2xl font-bold text-primary">€{{ getSelectedAmount() || 0 }}</span>
                            </div>
                        </div>

                        <p-button 
                            label="Complete Donation" 
                            icon="pi pi-heart-fill" 
                            styleClass="w-full" 
                            (onClick)="submitMonetaryDonation()"
                            [disabled]="!canSubmitMonetary()" />
                    </div>
                </div>

                <!-- Equipment Donation Contact -->
                <div *ngIf="!submitted && donationType === 'equipment'" class="bg-surface-0 dark:bg-surface-900 rounded-xl shadow-md p-6 md:p-8">
                    <div class="flex items-center gap-2 mb-6">
                        <p-button icon="pi pi-arrow-left" [rounded]="true" [text]="true" (onClick)="donationType = null" />
                        <span class="text-muted-color">Equipment Donation</span>
                    </div>

                    <div class="text-center mb-8">
                        <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-2">We Accept Equipment Donations</h3>
                        <p class="text-muted-color">Help us equip our hackerspace with the tools and resources our community needs</p>
                    </div>

                    <!-- Items We Accept -->
                    <div class="mb-8">
                        <h4 class="font-semibold text-surface-900 dark:text-surface-0 mb-4">Items We Accept:</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div *ngFor="let item of acceptedItems" class="flex items-center gap-3 bg-surface-50 dark:bg-surface-800 rounded-lg p-4">
                                <i [class]="item.icon + ' text-primary text-xl'"></i>
                                <span class="text-surface-900 dark:text-surface-0">{{ item.name }}</span>
                            </div>
                        </div>
                    </div>

                    <p-divider />

                    <!-- Contact Information -->
                    <div class="text-center">
                        <h4 class="font-semibold text-surface-900 dark:text-surface-0 mb-4">Contact Us to Arrange Your Donation</h4>
                        <p class="text-muted-color mb-6">Please reach out to us to discuss your donation and arrange a drop-off or pickup</p>
                        
                        <div class="flex flex-col md:flex-row justify-center gap-4 mb-6">
                            <!-- Phone -->
                            <a href="tel:+38344233967" class="flex items-center justify-center gap-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl p-4 hover:shadow-lg transition-all">
                                <i class="pi pi-phone text-2xl"></i>
                                <div class="text-left">
                                    <div class="text-sm opacity-80">Call us</div>
                                    <div class="font-semibold">+383 44 233 967</div>
                                </div>
                            </a>
                            
                            <!-- Email -->
                            <a href="mailto:info@flossk.org" class="flex items-center justify-center gap-3 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-xl p-4 hover:shadow-lg transition-all">
                                <i class="pi pi-envelope text-2xl"></i>
                                <div class="text-left">
                                    <div class="text-sm opacity-80">Email us</div>
                                    <div class="font-semibold">info&#64;flossk.org</div>
                                </div>
                            </a>
                        </div>

                        <p-message severity="info" styleClass="w-full">
                            <span class="text-sm">Please include a description of the items you'd like to donate and your preferred contact method</span>
                        </p-message>
                    </div>
                </div>

                <!-- Back to Onboarding -->
                <div class="text-center mt-6">
                    <a routerLink="/onboarding" class="text-primary hover:underline">
                        <i class="pi pi-arrow-left mr-2"></i>Back to Home
                    </a>
                </div>
            </div>
        </div>
    `
})
export class Donate {
    donationType: 'monetary' | 'equipment' | null = null;
    submitted = false;

    presetAmounts = [10, 25, 50, 100];

    monetaryDonation: MonetaryDonation = {
        amount: null,
        customAmount: null,
        donorName: '',
        donorEmail: '',
        message: '',
        anonymous: false
    };

    acceptedItems = [
        { name: 'Tech Books', icon: 'pi pi-book' },
        { name: 'Electronics', icon: 'pi pi-microchip-ai' },
        { name: 'Usable Laptops', icon: 'pi pi-desktop' },
        { name: 'Electrical/Power Tools', icon: 'pi pi-wrench' },
        { name: 'Office Furniture', icon: 'pi pi-objects-column' }
    ];

    selectDonationType(type: 'monetary' | 'equipment') {
        this.donationType = type;
    }

    selectAmount(amount: number) {
        this.monetaryDonation.amount = amount;
        this.monetaryDonation.customAmount = null;
    }

    getSelectedAmount(): number {
        return this.monetaryDonation.amount || this.monetaryDonation.customAmount || 0;
    }

    canSubmitMonetary(): boolean {
        return (this.getSelectedAmount() > 0) && !!this.monetaryDonation.donorEmail;
    }

    submitMonetaryDonation() {
        if (this.canSubmitMonetary()) {
            console.log('Submitting monetary donation:', {
                donationAmount: this.getSelectedAmount(),
                donorName: this.monetaryDonation.donorName,
                donorEmail: this.monetaryDonation.donorEmail,
                message: this.monetaryDonation.message,
                anonymous: this.monetaryDonation.anonymous
            });
            this.submitted = true;
        }
    }

    resetForm() {
        this.donationType = null;
        this.submitted = false;
        this.monetaryDonation = {
            amount: null,
            customAmount: null,
            donorName: '',
            donorEmail: '',
            message: '',
            anonymous: false
        };
    }
}