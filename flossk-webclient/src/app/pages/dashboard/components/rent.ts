import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { StepperModule } from 'primeng/stepper';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { RouterModule } from '@angular/router';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TagModule } from 'primeng/tag';

interface RentApplication {
    rentalMode: 'personal' | 'company' | null;
    // Personal fields
    fullName: string;
    personalEmail: string;
    personalPhone: string;
    // Company fields
    companyName: string;
    companyEmail: string;
    companyPhone: string;
    companyWebsite: string;
    companyAddress: string;
    contactPersonName: string;
    contactPersonRole: string;
    contactPersonEmail: string;
    contactPersonPhone: string;
    // Rental details
    rentalType: string;
    startDate: Date | null;
    endDate: Date | null;
    expectedAttendees: number | null;
    purpose: string;
    requirements: string;
    additionalServices: string[];
    // Pricing
    selectedTier: string;
    agreeToTerms: boolean;
}

interface PricingTier {
    id: string;
    name: string;
    price: number;
    period: string;
    description: string;
    features: string[];
    excludedFeatures: string[];
    popular?: boolean;
}

@Component({
    selector: 'app-rent',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        InputTextModule,
        TextareaModule,
        SelectModule,
        DatePickerModule,
        CheckboxModule,
        DividerModule,
        StepperModule,
        InputNumberModule,
        MessageModule,
        RouterModule,
        RadioButtonModule,
        TagModule
    ],
    template: `
        <div class="bg-surface-50 dark:bg-surface-950 min-h-screen py-8 px-4">
            <div class="max-w-4xl mx-auto">
                <!-- Header -->
                <div class="text-center mb-8">
                    <div class="flex justify-center mb-4">
                        <div class="bg-primary text-primary-contrast rounded-full p-4">
                            <i class="pi pi-building text-4xl"></i>
                        </div>
                    </div>
                    <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 mb-2">Rent Prishtina Hackerspace</h1>
                    <p class="text-muted-color">Host your events, workshops, or meetings at our fully-equipped space</p>
                </div>

                <!-- Success Message -->
                <div *ngIf="submitted" class="bg-surface-0 dark:bg-surface-900 rounded-xl shadow-md p-8 text-center">
                    <div class="flex justify-center mb-4">
                        <div class="bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full p-4">
                            <i class="pi pi-check text-4xl"></i>
                        </div>
                    </div>
                    <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0 mb-2">Application Submitted!</h2>
                    <p class="text-muted-color mb-6">Thank you for your interest in renting Prishtina Hackerspace. We'll review your application and get back to you within 2-3 business days.</p>
                    <div class="flex justify-center gap-4">
                        <p-button label="Submit Another" icon="pi pi-plus" (onClick)="resetForm()" [outlined]="true" />
                        <p-button label="Back to Home" icon="pi pi-arrow-left" routerLink="/onboarding" />
                    </div>
                </div>

                <!-- Application Form -->
                <div *ngIf="!submitted" class="bg-surface-0 dark:bg-surface-900 rounded-xl shadow-md p-6 md:p-8">
                    <!-- Rental Mode Selection -->
                    <div *ngIf="!application.rentalMode" class="text-center">
                        <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-6">How would you like to rent?</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                            <!-- Personal Option -->
                            <div 
                                class="border-2 rounded-xl p-6 cursor-pointer transition-all hover:border-primary"
                                [class.border-primary]="application.rentalMode === 'personal'"
                                [class.border-surface-200]="application.rentalMode !== 'personal'"
                                [class.dark:border-surface-700]="application.rentalMode !== 'personal'"
                                (click)="selectRentalMode('personal')">
                                <div class="flex flex-col items-center">
                                    <div class="bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full p-4 mb-4">
                                        <i class="pi pi-user text-3xl"></i>
                                    </div>
                                    <h4 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-2">Personal Use</h4>
                                    <p class="text-sm text-muted-color text-center">Rent the space for personal projects, small gatherings, or individual work</p>
                                </div>
                            </div>
                            
                            <!-- Company Option -->
                            <div 
                                class="border-2 rounded-xl p-6 cursor-pointer transition-all hover:border-primary"
                                [class.border-primary]="application.rentalMode === 'company'"
                                [class.border-surface-200]="application.rentalMode !== 'company'"
                                [class.dark:border-surface-700]="application.rentalMode !== 'company'"
                                (click)="selectRentalMode('company')">
                                <div class="flex flex-col items-center">
                                    <div class="bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-full p-4 mb-4">
                                        <i class="pi pi-building text-3xl"></i>
                                    </div>
                                    <h4 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-2">Company/Organization</h4>
                                    <p class="text-sm text-muted-color text-center">Rent for corporate events, team meetings, workshops, or company activities</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Stepper Form (shown after mode selection) -->
                    <div *ngIf="application.rentalMode">
                        <div class="flex items-center gap-2 mb-6">
                            <p-button icon="pi pi-arrow-left" [rounded]="true" [text]="true" (onClick)="application.rentalMode = null" />
                            <span class="text-muted-color">{{ application.rentalMode === 'personal' ? 'Personal Rental' : 'Company Rental' }}</span>
                        </div>
                        
                        <p-stepper [value]="activeStep" (valueChange)="onStepChange($event)">
                            <p-step-list>
                                <p-step [value]="1">{{ application.rentalMode === 'personal' ? 'Personal Info' : 'Company Info' }}</p-step>
                                <p-step [value]="2" *ngIf="application.rentalMode === 'company'">Contact Person</p-step>
                                <p-step [value]="application.rentalMode === 'personal' ? 2 : 3">Rental Details</p-step>
                                <p-step [value]="application.rentalMode === 'personal' ? 3 : 4">Select Plan</p-step>
                                <p-step [value]="application.rentalMode === 'personal' ? 4 : 5">Review</p-step>
                            </p-step-list>
                            
                            <p-step-panels>
                                <!-- Step 1: Personal Info (Personal Mode) -->
                                <p-step-panel [value]="1" *ngIf="application.rentalMode === 'personal'">
                                    <ng-template #content let-activateCallback="activateCallback">
                                        <div class="flex flex-col gap-4">
                                            <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-2">Personal Information</h3>
                                            
                                            <div>
                                                <label class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Full Name *</label>
                                                <input pInputText [(ngModel)]="application.fullName" class="w-full" placeholder="Enter your full name" />
                                            </div>
                                            
                                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Email *</label>
                                                    <input pInputText [(ngModel)]="application.personalEmail" type="email" class="w-full" placeholder="your@email.com" />
                                                </div>
                                                <div>
                                                    <label class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Phone *</label>
                                                    <input pInputText [(ngModel)]="application.personalPhone" class="w-full" placeholder="+383 xx xxx xxx" />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div class="flex justify-end mt-6">
                                            <p-button label="Next" icon="pi pi-arrow-right" iconPos="right" (onClick)="activateCallback(2)" />
                                        </div>
                                    </ng-template>
                                </p-step-panel>

                                <!-- Step 1: Company Information (Company Mode) -->
                                <p-step-panel [value]="1" *ngIf="application.rentalMode === 'company'">
                                <ng-template #content let-activateCallback="activateCallback">
                                    <div class="flex flex-col gap-4">
                                        <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-2">Company Information</h3>
                                        
                                        <div>
                                            <label class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Company Name *</label>
                                            <input pInputText [(ngModel)]="application.companyName" class="w-full" placeholder="Enter company name" />
                                        </div>
                                        
                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Company Email *</label>
                                                <input pInputText [(ngModel)]="application.companyEmail" type="email" class="w-full" placeholder="company@example.com" />
                                            </div>
                                            <div>
                                                <label class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Company Phone *</label>
                                                <input pInputText [(ngModel)]="application.companyPhone" class="w-full" placeholder="+383 xx xxx xxx" />
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <label class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Company Website</label>
                                            <input pInputText [(ngModel)]="application.companyWebsite" class="w-full" placeholder="https://example.com" />
                                        </div>
                                        
                                        <div>
                                            <label class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Company Address *</label>
                                            <input pInputText [(ngModel)]="application.companyAddress" class="w-full" placeholder="Street, City, Country" />
                                        </div>
                                    </div>
                                    
                                    <div class="flex justify-end mt-6">
                                        <p-button label="Next" icon="pi pi-arrow-right" iconPos="right" (onClick)="activateCallback(2)" />
                                    </div>
                                </ng-template>
                            </p-step-panel>

                            <!-- Step 2: Contact Person (Company Mode Only) -->
                            <p-step-panel [value]="2" *ngIf="application.rentalMode === 'company'">
                                <ng-template #content let-activateCallback="activateCallback">
                                    <div class="flex flex-col gap-4">
                                        <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-2">Contact Person</h3>
                                        
                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Full Name *</label>
                                                <input pInputText [(ngModel)]="application.contactPersonName" class="w-full" placeholder="John Doe" />
                                            </div>
                                            <div>
                                                <label class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Role/Position *</label>
                                                <input pInputText [(ngModel)]="application.contactPersonRole" class="w-full" placeholder="Event Manager" />
                                            </div>
                                        </div>
                                        
                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Email *</label>
                                                <input pInputText [(ngModel)]="application.contactPersonEmail" type="email" class="w-full" placeholder="contact@example.com" />
                                            </div>
                                            <div>
                                                <label class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Phone *</label>
                                                <input pInputText [(ngModel)]="application.contactPersonPhone" class="w-full" placeholder="+383 xx xxx xxx" />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="flex justify-between mt-6">
                                        <p-button label="Back" icon="pi pi-arrow-left" (onClick)="activateCallback(1)" [outlined]="true" />
                                        <p-button label="Next" icon="pi pi-arrow-right" iconPos="right" (onClick)="activateCallback(3)" />
                                    </div>
                                </ng-template>
                            </p-step-panel>

                            <!-- Rental Details Step (Step 2 for personal, Step 3 for company) -->
                            <p-step-panel [value]="application.rentalMode === 'personal' ? 2 : 3">
                                <ng-template #content let-activateCallback="activateCallback">
                                    <div class="flex flex-col gap-4">
                                        <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-2">Rental Details</h3>
                                        
                                        <div>
                                            <label class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Rental Type *</label>
                                            <p-select [(ngModel)]="application.rentalType" [options]="rentalTypeOptions" placeholder="Select rental type" class="w-full" />
                                        </div>
                                        
                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Start Date *</label>
                                                <p-datepicker [(ngModel)]="application.startDate" [showIcon]="true" dateFormat="M d, yy" class="w-full" [minDate]="minDate" />
                                            </div>
                                            <div>
                                                <label class="block text-surface-900 dark:text-surface-0 font-medium mb-2">End Date *</label>
                                                <p-datepicker [(ngModel)]="application.endDate" [showIcon]="true" dateFormat="M d, yy" class="w-full" [minDate]="application.startDate || minDate" />
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <label class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Expected Number of Attendees *</label>
                                            <p-inputNumber [(ngModel)]="application.expectedAttendees" [min]="1" [max]="100" placeholder="Number of people" class="w-full" />
                                        </div>
                                        
                                        <div>
                                            <label class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Purpose of Rental *</label>
                                            <textarea pTextarea [(ngModel)]="application.purpose" [rows]="3" class="w-full" placeholder="Describe the purpose of your rental (workshop, meeting, event, etc.)"></textarea>
                                        </div>
                                        
                                        <div>
                                            <label class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Special Requirements</label>
                                            <textarea pTextarea [(ngModel)]="application.requirements" [rows]="2" class="w-full" placeholder="Any special equipment or setup requirements"></textarea>
                                        </div>
                                        
                                        <div>
                                            <label class="block text-surface-900 dark:text-surface-0 font-medium mb-3">Additional Services</label>
                                            <div class="flex flex-col gap-3">
                                                <div *ngFor="let service of additionalServicesOptions" class="flex items-center">
                                                    <p-checkbox [(ngModel)]="application.additionalServices" [value]="service.value" [inputId]="service.value" />
                                                    <label [for]="service.value" class="ml-2">{{ service.label }}</label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="flex justify-between mt-6">
                                        <p-button label="Back" icon="pi pi-arrow-left" (onClick)="activateCallback(application.rentalMode === 'personal' ? 1 : 2)" [outlined]="true" />
                                        <p-button label="Next" icon="pi pi-arrow-right" iconPos="right" (onClick)="activateCallback(application.rentalMode === 'personal' ? 3 : 4)" />
                                    </div>
                                </ng-template>
                            </p-step-panel>

                            <!-- Select Plan Step (Step 3 for personal, Step 4 for company) -->
                            <p-step-panel [value]="application.rentalMode === 'personal' ? 3 : 4">
                                <ng-template #content let-activateCallback="activateCallback">
                                    <div class="flex flex-col gap-4">
                                        <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-2">Select Your Plan</h3>
                                        <p class="text-muted-color mb-4">Choose the pricing tier that best fits your needs</p>
                                        
                                        <!-- Personal Tiers -->
                                        <div *ngIf="application.rentalMode === 'personal'" class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div *ngFor="let tier of personalTiers" 
                                                class="border-2 rounded-xl p-5 cursor-pointer transition-all relative"
                                                [class.border-primary]="application.selectedTier === tier.id"
                                                [class.bg-primary-50]="application.selectedTier === tier.id"
                                                [class.dark:bg-primary-900/20]="application.selectedTier === tier.id"
                                                [class.border-surface-200]="application.selectedTier !== tier.id"
                                                [class.dark:border-surface-700]="application.selectedTier !== tier.id"
                                                (click)="application.selectedTier = tier.id">
                                                <p-tag *ngIf="tier.popular" value="POPULAR" severity="warn" styleClass="absolute -top-2 right-4" />
                                                <div class="flex items-center gap-2 mb-3">
                                                    <p-radioButton [inputId]="tier.id" name="personalTier" [value]="tier.id" [(ngModel)]="application.selectedTier" />
                                                    <label [for]="tier.id" class="font-semibold text-surface-900 dark:text-surface-0">{{ tier.name }}</label>
                                                </div>
                                                <div class="flex items-baseline gap-1 mb-3">
                                                    <span class="text-3xl font-bold text-surface-900 dark:text-surface-0">€{{ tier.price }}</span>
                                                    <span class="text-muted-color">/{{ tier.period }}</span>
                                                </div>
                                                <p class="text-sm text-muted-color mb-3">{{ tier.description }}</p>
                                                <ul class="list-none p-0 m-0 text-sm">
                                                    <li *ngFor="let feature of tier.features" class="flex items-center gap-2 mb-2">
                                                        <i class="pi pi-check-circle text-green-500"></i>
                                                        <span>{{ feature }}</span>
                                                    </li>
                                                    <li *ngFor="let feature of tier.excludedFeatures" class="flex items-center gap-2 mb-2 text-muted-color">
                                                        <i class="pi pi-times-circle"></i>
                                                        <span>{{ feature }}</span>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>

                                        <!-- Company Tiers -->
                                        <div *ngIf="application.rentalMode === 'company'" class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div *ngFor="let tier of companyTiers" 
                                                class="border-2 rounded-xl p-5 cursor-pointer transition-all relative"
                                                [class.border-primary]="application.selectedTier === tier.id"
                                                [class.bg-primary-50]="application.selectedTier === tier.id"
                                                [class.dark:bg-primary-900/20]="application.selectedTier === tier.id"
                                                [class.border-surface-200]="application.selectedTier !== tier.id"
                                                [class.dark:border-surface-700]="application.selectedTier !== tier.id"
                                                (click)="application.selectedTier = tier.id">
                                                <p-tag *ngIf="tier.popular" value="POPULAR" severity="warn" styleClass="absolute -top-2 right-4" />
                                                <div class="flex items-center gap-2 mb-3">
                                                    <p-radioButton [inputId]="tier.id" name="companyTier" [value]="tier.id" [(ngModel)]="application.selectedTier" />
                                                    <label [for]="tier.id" class="font-semibold text-surface-900 dark:text-surface-0">{{ tier.name }}</label>
                                                </div>
                                                <div class="flex items-baseline gap-1 mb-3">
                                                    <span class="text-3xl font-bold text-surface-900 dark:text-surface-0">€{{ tier.price }}</span>
                                                    <span class="text-muted-color">/{{ tier.period }}</span>
                                                </div>
                                                <p class="text-sm text-muted-color mb-3">{{ tier.description }}</p>
                                                <ul class="list-none p-0 m-0 text-sm">
                                                    <li *ngFor="let feature of tier.features" class="flex items-center gap-2 mb-2">
                                                        <i class="pi pi-check-circle text-green-500"></i>
                                                        <span>{{ feature }}</span>
                                                    </li>
                                                    <li *ngFor="let feature of tier.excludedFeatures" class="flex items-center gap-2 mb-2 text-muted-color">
                                                        <i class="pi pi-times-circle"></i>
                                                        <span>{{ feature }}</span>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="flex justify-between mt-6">
                                        <p-button label="Back" icon="pi pi-arrow-left" (onClick)="activateCallback(application.rentalMode === 'personal' ? 2 : 3)" [outlined]="true" />
                                        <p-button label="Review" icon="pi pi-arrow-right" iconPos="right" (onClick)="activateCallback(application.rentalMode === 'personal' ? 4 : 5)" [disabled]="!application.selectedTier" />
                                    </div>
                                </ng-template>
                            </p-step-panel>

                            <!-- Review Step (Step 4 for personal, Step 5 for company) -->
                            <p-step-panel [value]="application.rentalMode === 'personal' ? 4 : 5">
                                <ng-template #content let-activateCallback="activateCallback">
                                    <div class="flex flex-col gap-4">
                                        <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-2">Review Your Application</h3>
                                        
                                        <!-- Personal Info Summary (Personal Mode) -->
                                        <div *ngIf="application.rentalMode === 'personal'" class="bg-surface-50 dark:bg-surface-800 rounded-lg p-4">
                                            <h4 class="font-semibold text-surface-900 dark:text-surface-0 mb-3 flex items-center gap-2">
                                                <i class="pi pi-user"></i> Personal Information
                                            </h4>
                                            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                                <div><span class="text-muted-color">Name:</span> {{ application.fullName }}</div>
                                                <div><span class="text-muted-color">Email:</span> {{ application.personalEmail }}</div>
                                                <div><span class="text-muted-color">Phone:</span> {{ application.personalPhone }}</div>
                                            </div>
                                        </div>

                                        <!-- Company Info Summary (Company Mode) -->
                                        <div *ngIf="application.rentalMode === 'company'" class="bg-surface-50 dark:bg-surface-800 rounded-lg p-4">
                                            <h4 class="font-semibold text-surface-900 dark:text-surface-0 mb-3 flex items-center gap-2">
                                                <i class="pi pi-building"></i> Company Information
                                            </h4>
                                            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                                <div><span class="text-muted-color">Company:</span> {{ application.companyName }}</div>
                                                <div><span class="text-muted-color">Email:</span> {{ application.companyEmail }}</div>
                                                <div><span class="text-muted-color">Phone:</span> {{ application.companyPhone }}</div>
                                                <div><span class="text-muted-color">Website:</span> {{ application.companyWebsite || 'N/A' }}</div>
                                                <div class="md:col-span-2"><span class="text-muted-color">Address:</span> {{ application.companyAddress }}</div>
                                            </div>
                                        </div>
                                        
                                        <!-- Contact Person Summary (Company Mode Only) -->
                                        <div *ngIf="application.rentalMode === 'company'" class="bg-surface-50 dark:bg-surface-800 rounded-lg p-4">
                                            <h4 class="font-semibold text-surface-900 dark:text-surface-0 mb-3 flex items-center gap-2">
                                                <i class="pi pi-user"></i> Contact Person
                                            </h4>
                                            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                                <div><span class="text-muted-color">Name:</span> {{ application.contactPersonName }}</div>
                                                <div><span class="text-muted-color">Role:</span> {{ application.contactPersonRole }}</div>
                                                <div><span class="text-muted-color">Email:</span> {{ application.contactPersonEmail }}</div>
                                                <div><span class="text-muted-color">Phone:</span> {{ application.contactPersonPhone }}</div>
                                            </div>
                                        </div>
                                        
                                        <!-- Rental Details Summary -->
                                        <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-4">
                                            <h4 class="font-semibold text-surface-900 dark:text-surface-0 mb-3 flex items-center gap-2">
                                                <i class="pi pi-calendar"></i> Rental Details
                                            </h4>
                                            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                                <div><span class="text-muted-color">Type:</span> {{ application.rentalType }}</div>
                                                <div><span class="text-muted-color">Attendees:</span> {{ application.expectedAttendees }}</div>
                                                <div><span class="text-muted-color">Start:</span> {{ application.startDate | date:'mediumDate' }}</div>
                                                <div><span class="text-muted-color">End:</span> {{ application.endDate | date:'mediumDate' }}</div>
                                                <div class="md:col-span-2"><span class="text-muted-color">Purpose:</span> {{ application.purpose }}</div>
                                                <div *ngIf="application.requirements" class="md:col-span-2"><span class="text-muted-color">Requirements:</span> {{ application.requirements }}</div>
                                                <div *ngIf="application.additionalServices.length > 0" class="md:col-span-2">
                                                    <span class="text-muted-color">Additional Services:</span> {{ application.additionalServices.join(', ') }}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <!-- Selected Plan Summary -->
                                        <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-4">
                                            <h4 class="font-semibold text-surface-900 dark:text-surface-0 mb-3 flex items-center gap-2">
                                                <i class="pi pi-credit-card"></i> Selected Plan
                                            </h4>
                                            <div class="text-sm">
                                                <div class="flex items-baseline gap-2">
                                                    <span class="font-semibold text-lg text-surface-900 dark:text-surface-0">{{ getSelectedTier()?.name }}</span>
                                                    <span class="text-primary font-bold">€{{ getSelectedTier()?.price }}/{{ getSelectedTier()?.period }}</span>
                                                </div>
                                                <p class="text-muted-color mt-1">{{ getSelectedTier()?.description }}</p>
                                            </div>
                                        </div>
                                        
                                        <!-- Terms Agreement -->
                                        <div class="flex items-start gap-3 mt-4">
                                            <p-checkbox [(ngModel)]="application.agreeToTerms" [binary]="true" inputId="terms" />
                                            <label for="terms" class="text-sm">
                                                I agree to the <a href="#" class="text-primary">Terms and Conditions</a> and <a href="#" class="text-primary">Rental Policy</a> of FLOSSK and Prishtina Hackerspace. *
                                            </label>
                                        </div>
                                    </div>
                                    
                                    <div class="flex justify-between mt-6">
                                        <p-button label="Back" icon="pi pi-arrow-left" (onClick)="activateCallback(application.rentalMode === 'personal' ? 3 : 4)" [outlined]="true" />
                                        <p-button label="Submit Application" icon="pi pi-send" (onClick)="submitApplication()" [disabled]="!application.agreeToTerms" />
                                    </div>
                                </ng-template>
                            </p-step-panel>
                        </p-step-panels>
                    </p-stepper>
                    </div>
                </div>

                <!-- Info Cards -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                    <div class="bg-surface-0 dark:bg-surface-900 rounded-lg p-4 text-center">
                        <i style="font-size: 1.5rem" class="pi pi-users text-primary text-2xl mb-2"></i>
                        <h4 class="font-semibold text-surface-900 dark:text-surface-0 mb-1">Capacity</h4>
                        <p class="text-sm text-muted-color">Up to 50 people for events</p>
                    </div>
                    <div class="bg-surface-0 dark:bg-surface-900 rounded-lg p-4 text-center">
                        <i style="font-size: 1.5rem" class="pi pi-wifi text-primary text-2xl mb-2"></i>
                        <h4 class="font-semibold text-surface-900 dark:text-surface-0 mb-1">Amenities</h4>
                        <p class="text-sm text-muted-color">High-speed WiFi, projector, whiteboard</p>
                    </div>
                    <div class="bg-surface-0 dark:bg-surface-900 rounded-lg p-4 text-center">
                        <i style="font-size: 1.5rem" class="pi pi-phone text-primary text-2xl mb-2"></i>
                        <h4 class="font-semibold text-surface-900 dark:text-surface-0 mb-1">Support</h4>
                        <p class="text-sm text-muted-color">Contact us: rent&#64;flossk.org</p>
                    </div>
                </div>

                <!-- Back to Login -->
                <div class="text-center mt-6">
                    <a routerLink="/onboarding" class="text-primary hover:underline">
                        <i class="pi pi-arrow-left mr-2"></i>Back to Home
                    </a>
                </div>
            </div>
        </div>
    `
})
export class Rent {
    activeStep: number = 1;
    submitted: boolean = false;
    minDate: Date = new Date();

    application: RentApplication = {
        rentalMode: null,
        fullName: '',
        personalEmail: '',
        personalPhone: '',
        companyName: '',
        companyEmail: '',
        companyPhone: '',
        companyWebsite: '',
        companyAddress: '',
        contactPersonName: '',
        contactPersonRole: '',
        contactPersonEmail: '',
        contactPersonPhone: '',
        rentalType: '',
        startDate: null,
        endDate: null,
        expectedAttendees: null,
        purpose: '',
        requirements: '',
        additionalServices: [],
        selectedTier: '',
        agreeToTerms: false
    };

    personalTiers: PricingTier[] = [
        {
            id: 'personal-basic',
            name: 'Day Pass',
            price: 15,
            period: 'day',
            description: 'Perfect for a single day use',
            features: [
                'Access during open hours',
                'Basic workspace',
                'WiFi access',
                'Coffee & tea'
            ],
            excludedFeatures: [
                'Equipment access',
                'Meeting room'
            ]
        },
        {
            id: 'personal-standard',
            name: 'Weekly',
            price: 50,
            period: 'week',
            description: 'Ideal for short-term projects',
            features: [
                'Full week access',
                'Dedicated desk space',
                'WiFi & printing',
                'Basic equipment access',
                'Meeting room (2h/week)'
            ],
            excludedFeatures: [
                'After-hours access'
            ],
            popular: true
        },
        {
            id: 'personal-premium',
            name: 'Monthly',
            price: 150,
            period: 'month',
            description: 'Best value for regular use',
            features: [
                '24/7 key card access',
                'Dedicated desk space',
                'All equipment access',
                'Meeting room (8h/month)',
                'Storage locker',
                'Guest passes (2/month)'
            ],
            excludedFeatures: []
        }
    ];

    companyTiers: PricingTier[] = [
        {
            id: 'company-startup',
            name: 'Startup',
            price: 200,
            period: 'day',
            description: 'For small teams and workshops',
            features: [
                'Up to 15 attendees',
                'Full day access (8h)',
                'Projector & whiteboard',
                'WiFi access',
                'Basic catering included'
            ],
            excludedFeatures: [
                'Recording equipment',
                'Technical support'
            ]
        },
        {
            id: 'company-business',
            name: 'Business',
            price: 400,
            period: 'day',
            description: 'For medium events and meetings',
            features: [
                'Up to 30 attendees',
                'Full day access (10h)',
                'Full AV equipment',
                'Premium catering',
                'Recording equipment',
                'Dedicated support staff'
            ],
            excludedFeatures: [
                'Live streaming'
            ],
            popular: true
        },
        {
            id: 'company-enterprise',
            name: 'Enterprise',
            price: 750,
            period: 'day',
            description: 'For large events and conferences',
            features: [
                'Up to 50 attendees',
                'Flexible hours',
                'Full AV & streaming setup',
                'Premium catering',
                'Dedicated event coordinator',
                'Professional recording',
                'Custom branding options'
            ],
            excludedFeatures: []
        }
    ];

    rentalTypeOptions = [
        { label: 'Single Day Event', value: 'Single Day Event' },
        { label: 'Multi-Day Event', value: 'Multi-Day Event' },
        { label: 'Weekly Rental', value: 'Weekly Rental' },
        { label: 'Monthly Rental', value: 'Monthly Rental' },
        { label: 'Workshop/Training', value: 'Workshop/Training' },
        { label: 'Corporate Meeting', value: 'Corporate Meeting' },
        { label: 'Hackathon', value: 'Hackathon' },
        { label: 'Other', value: 'Other' }
    ];

    additionalServicesOptions = [
        { label: 'Catering/Refreshments', value: 'catering' },
        { label: 'Technical Support', value: 'tech-support' },
        { label: 'Video Recording', value: 'recording' },
        { label: 'Live Streaming Setup', value: 'streaming' },
        { label: '3D Printing Access', value: '3d-printing' },
        { label: 'After-hours Access', value: 'after-hours' }
    ];

    submitApplication() {
        // Here you would typically send the application to a backend
        console.log('Submitting application:', this.application);
        this.submitted = true;
    }

    onStepChange(step: number | undefined) {
        if (step !== undefined) {
            this.activeStep = step;
        }
    }

    selectRentalMode(mode: 'personal' | 'company') {
        this.application.rentalMode = mode;
        this.activeStep = 1;
        this.application.selectedTier = '';
    }

    getSelectedTier(): PricingTier | undefined {
        if (this.application.rentalMode === 'personal') {
            return this.personalTiers.find(t => t.id === this.application.selectedTier);
        }
        return this.companyTiers.find(t => t.id === this.application.selectedTier);
    }

    resetForm() {
        this.application = {
            rentalMode: null,
            fullName: '',
            personalEmail: '',
            personalPhone: '',
            companyName: '',
            companyEmail: '',
            companyPhone: '',
            companyWebsite: '',
            companyAddress: '',
            contactPersonName: '',
            contactPersonRole: '',
            contactPersonEmail: '',
            contactPersonPhone: '',
            rentalType: '',
            startDate: null,
            endDate: null,
            expectedAttendees: null,
            purpose: '',
            requirements: '',
            additionalServices: [],
            selectedTier: '',
            agreeToTerms: false
        };
        this.activeStep = 1;
        this.submitted = false;
    }
}
