import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import SignaturePad from 'signature_pad';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { TooltipModule } from 'primeng/tooltip';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { InputGroup } from 'primeng/inputgroup';
import { InputGroupAddon } from 'primeng/inputgroupaddon';
import { MembershipRequestsService } from '@/pages/service/membership-requests.service';

@Component({
    selector: 'app-membership-application-form',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        InputTextModule,
        TextareaModule,
        ButtonModule,
        CardModule,
        DatePickerModule,
        TooltipModule,
        MessageModule,
        SelectModule,
        InputGroup,
        InputGroupAddon,
        RouterLink
    ],
    template: ` 
    <div class="flex flex-col items-center justify-center min-h-screen overflow-hidden p-4">
        <div class="card w-full max-w-5xl">
            
            <h2 class="text-center text-3xl font-bold mb-6">Membership Application Form</h2>
            
            <form #applicationForm="ngForm" (ngSubmit)="onSubmit()">
                <!-- Row 1: Name and Address -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div class="field">
                        <label for="fullName" class="block font-bold mb-2">First Name and Last Name:</label>
                        <input 
                            pInputText 
                            id="fullName" 
                            [(ngModel)]="formData.fullName" 
                            name="fullName" 
                            #fullName="ngModel"
                            pattern="^[a-zA-Z ,.'-]+$"
                            class="w-full"
                            [class.ng-invalid]="fullName.invalid && fullName.touched"
                            required />
                        <small *ngIf="fullName.invalid && fullName.touched" class="text-red-500">
                            <span *ngIf="fullName.errors?.['required']">Name is required.</span>
                            <span *ngIf="fullName.errors?.['pattern']">Name can only contain letters and spaces.</span>
                        </small>
                    </div>
                    <div class="field">
                        <label for="address" class="block font-bold mb-2">Address:</label>
                        <input 
                            pInputText 
                            id="address" 
                            [(ngModel)]="formData.address" 
                            name="address" 
                            #address="ngModel"
                            class="w-full"
                            [class.ng-invalid]="address.invalid && address.touched"
                            required />
                        <small *ngIf="address.invalid && address.touched" class="text-red-500">
                            <span *ngIf="address.errors?.['required']">Address is required.</span>
                        </small>
                    </div>
                </div>

                <!-- Row 2: City and Personal ID -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div class="field">
                        <label for="city" class="block font-bold mb-2">City:</label>
                        <input 
                            pInputText 
                            id="city" 
                            [(ngModel)]="formData.city" 
                            name="city" 
                            #city="ngModel"
                            pattern="^[a-zA-ZÀ-ÿ\s]+$"
                            class="w-full"
                            [class.ng-invalid]="city.invalid && city.touched"
                            required />
                        <small *ngIf="city.invalid && city.touched" class="text-red-500">
                            <span *ngIf="city.errors?.['required']">City is required.</span>
                            <span *ngIf="city.errors?.['pattern']">City can only contain letters and spaces.</span>
                        </small>
                    </div>
                    <div class="field">
                        <label for="idNumber" class="block font-bold mb-2">ID Number:</label>
                        <input 
                            pInputText 
                            id="idNumber" 
                            [(ngModel)]="formData.idNumber" 
                            name="idNumber" 
                            #idNumber="ngModel"
                            type="text"
                            pattern="^[0-9]+$"
                            class="w-full"
                            [class.ng-invalid]="idNumber.invalid && idNumber.touched"
                            [disabled]="!formData.applicantDateofBirth"
                            required />
                        <small *ngIf="!formData.applicantDateofBirth" class="text-orange-500">
                            Please fill Date of Birth first.
                        </small>
                        <small *ngIf="formData.applicantDateofBirth && isUnder16()" class="text-orange-500">
                            Requires guardian ID number.
                        </small>
                        <small *ngIf="idNumber.invalid && idNumber.touched && formData.applicantDateofBirth" class="text-red-500">
                            <span *ngIf="idNumber.errors?.['required']">ID number is required.</span>
                            <span *ngIf="idNumber.errors?.['pattern']">ID number can only contain numbers.</span>
                        </small>
                    </div>
                </div>

                <!-- Row 3: Phone and Email -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div class="field">
                        <label for="phoneNumber" class="block font-bold mb-2">Phone:</label>
                        <p-inputgroup class="w-full" style="height: 2.5rem;">
                            <p-inputgroup-addon [style]="{'padding': '0', 'min-width': '0'}">
                                <p-select
                                    [(ngModel)]="selectedCountry"
                                    name="countryCode"
                                    [options]="countries"
                                    optionLabel="label"
                                    [filter]="true"
                                    filterBy="label,dial_code,code"
                                    [showClear]="false"
                                    [style]="{'min-width': '70px', 'width': '55px', 'height': '100%', 'border': 'none', 'box-shadow': 'none'}"
                                    [panelStyle]="{'z-index': '9999'}"
                                    [appendTo]="'body'"
                                    (onChange)="onCountryChange()">
                                    <ng-template pTemplate="selectedItem">
                                        <span *ngIf="selectedCountry">{{ selectedCountry.flag }}</span>
                                    </ng-template>
                                    <ng-template pTemplate="item" let-country>
                                        <div class="flex items-center gap-2">
                                            <span>{{ country.flag }}</span>
                                            <span>{{ country.name }}</span>
                                            <span class="text-gray-400 ml-auto">{{ country.dial_code }}</span>
                                        </div>
                                    </ng-template>
                                </p-select>
                            </p-inputgroup-addon>
                            <input
                                pInputText
                                id="phoneNumber"
                                [(ngModel)]="formData.phoneNumber"
                                name="phoneNumber"
                                #phoneNumber="ngModel"
                                type="tel"
                                pattern="^[0-9 ]+$"
                                placeholder="44 123 456"
                                [class.ng-invalid]="phoneNumber.invalid && phoneNumber.touched"
                                required />
                        </p-inputgroup>
                        <small *ngIf="phoneNumber.invalid && phoneNumber.touched" class="text-red-500">
                            <span *ngIf="phoneNumber.errors?.['required']">Phone is required.</span>
                            <span *ngIf="phoneNumber.errors?.['pattern']">Phone can only contain numbers and spaces.</span>
                        </small>
                    </div>
                    <div class="field">
                        <label for="email" class="block font-bold mb-2">Email:</label>
                        <input 
                            pInputText 
                            id="email" 
                            [(ngModel)]="formData.email" 
                            name="email" 
                            #email="ngModel"
                            type="email"
                            pattern="[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}"
                            class="w-full"
                            [class.ng-invalid]="email.invalid && email.touched"
                            required />
                        <small *ngIf="email.invalid && email.touched" class="text-red-500">
                            <span *ngIf="email.errors?.['required']">Email is required.</span>
                            <span *ngIf="email.errors?.['pattern']">Please enter a valid email address.</span>
                        </small>
                    </div>
                </div>

                <!-- Row 4: School/Company and Date of Birth -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div class="field">
                        <label for="schoolCompany" class="block font-bold mb-2">School/Company:</label>
                        <input 
                            pInputText 
                            id="schoolCompany" 
                            [(ngModel)]="formData.schoolCompany" 
                            name="schoolCompany" 
                            #schoolCompany="ngModel"
                            class="w-full"
                            [class.ng-invalid]="schoolCompany.invalid && schoolCompany.touched"
                            required />
                        <small *ngIf="schoolCompany.invalid && schoolCompany.touched" class="text-red-500">
                            <span *ngIf="schoolCompany.errors?.['required']">School/Company is required.</span>
                        </small>
                    </div>
                    <div class="field">
                        <label for="applicantDate" class="block font-bold mb-2">Date of Birth:</label>
                        <p-datepicker
                            [(ngModel)]="formData.applicantDateofBirth" 
                            (ngModelChange)="onDateOfBirthChange()"
                            [iconDisplay]="'input'" 
                            [showIcon]="true" 
                            id="applicantDate"
                            inputId="icondisplay" 
                            name="applicantDate" 
                            #applicantDate="ngModel"
                            dateFormat="dd.mm.yy"
                            fluid
                            required
                        />
                        <small *ngIf="applicantDate.invalid && applicantDate.touched" class="text-red-500">
                            <span *ngIf="applicantDate.errors?.['required']">Date of Birth is required.</span>
                        </small>
                    </div>
                </div>

                <!-- Statement -->
                <div class="field mb-4">
                    <label for="statement" class="block font-bold mb-2">
                        Statement: <span class="font-normal">(Please explain why you would like to be a member of FLOSSK)</span>
                    </label>
                    <textarea 
                        pInputTextarea 
                        id="statement" 
                        [(ngModel)]="formData.statement" 
                        name="statement" 
                        #statement="ngModel"
                        rows="5"
                        class="w-full"
                        [class.ng-invalid]="statement.invalid && statement.touched"
                        required></textarea>
                    <small *ngIf="statement.invalid && statement.touched" class="text-red-500">
                        <span *ngIf="statement.errors?.['required']">Statement is required.</span>
                    </small>
                </div>

                <!-- Signatures Section -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <!-- Applicant Signature -->
                    <div class="field">
                        <label for="applicantSignature" class="block font-bold mb-2">Applicant Signature:</label>
                        <div class="border-2 border-gray-300 rounded-lg bg-white" [class.opacity-50]="!formData.applicantDateofBirth || isUnder14()">
                            <canvas 
                                #applicantCanvas
                                class="w-full" 
                                style="touch-action: none;"
                                [class.pointer-events-none]="!formData.applicantDateofBirth || isUnder14()"></canvas>
                        </div>
                        <div class="mt-2">
                            <button 
                                pButton 
                                type="button" 
                                label="Clear" 
                                icon="pi pi-times"
                                (click)="clearApplicantSignature()"
                                [disabled]="!formData.applicantDateofBirth || isUnder14()"
                                class="p-button-sm p-button-outlined p-button-danger"></button>
                        </div>
                        @if (!formData.applicantDateofBirth) {
                            <small class="text-orange-500">
                                Please fill in Date of Birth first.
                            </small>
                        }
                        @if (formData.applicantDateofBirth && isUnder14()) {
                            <small class="text-orange-500">
                                Applicants under 14 require parent/guardian signature instead.
                            </small>
                        }
                    </div>

                    <!-- Parent/Guardian -->
                    <div class="field">
                        <label for="parentGuardian" class="block font-bold mb-2">
                            Parent/Guardian Signature: <span class="font-normal">(Required if under 14 y/o)</span>
                        </label>
                        <div class="border-2 border-gray-300 rounded-lg bg-white" [class.opacity-50]="!formData.applicantDateofBirth || !isUnder14()">
                            <canvas 
                                #guardianCanvas
                                class="w-full" 
                                style="touch-action: none;"
                                [class.pointer-events-none]="!formData.applicantDateofBirth || !isUnder14()"></canvas>
                        </div>
                        <div class="mt-2">
                            <button 
                                pButton 
                                type="button" 
                                label="Clear" 
                                icon="pi pi-times"
                                (click)="clearGuardianSignature()"
                                [disabled]="!formData.applicantDateofBirth || !isUnder14()"
                                class="p-button-sm p-button-outlined p-button-danger"></button>
                        </div>
                        @if (!formData.applicantDateofBirth) {
                            <small class="text-orange-500">
                                Please fill in Date of Birth first.
                            </small>
                        }
                        @if (formData.applicantDateofBirth && !isUnder14()) {
                            <small class="text-orange-500">
                                Parent/guardian signature not required for applicants 14 or older.
                            </small>
                        }
                    </div>
                </div>

                <!-- Submit Button -->
                <div class="flex flex-col items-center mt-6 gap-4">
                    @if (errorMessage) {
                        <p-message severity="error" [text]="errorMessage" styleClass="w-full max-w-md"></p-message>
                    }
                    @if (successMessage) {
                        <p-message severity="success" [text]="successMessage" styleClass="w-full max-w-md"></p-message>
                    }
                    <button 
                        pButton 
                        type="submit" 
                        label="Submit Application" 
                        icon="pi pi-check"
                        [disabled]="!applicationForm.valid || isSubmitting"
                        [loading]="isSubmitting"
                        class="p-button-lg"></button>
                </div>
            </form>
        </div>
        <a routerLink="/" class="flex items-center justify-center gap-2 text-primary hover:underline mt-6 text-sm font-medium">
                <i class="pi pi-arrow-left"></i>
                <span>Back home</span>
            </a>
    </div>`
})
export class MembershipApplicationForm implements AfterViewInit {
    @ViewChild('applicantCanvas') applicantCanvas!: ElementRef<HTMLCanvasElement>;
    @ViewChild('guardianCanvas') guardianCanvas!: ElementRef<HTMLCanvasElement>;

    applicantSignaturePad!: SignaturePad;
    guardianSignaturePad!: SignaturePad;
    
    isSubmitting = false;
    errorMessage = '';
    successMessage = '';

    formData = {
        fullName: '',
        address: '',
        city: '',
        idNumber: '',
        phoneNumber: '',
        email: '',
        schoolCompany: '',
        statement: '',
        applicantSignature: '',
        parentGuardian: '',
        applicantDateofBirth: '',
        boardMember: '',
    };

    countries = [
        { name: 'Afghanistan', code: 'AF', dial_code: '+93', flag: '🇦🇫', label: 'Afghanistan +93' },
        { name: 'Albania', code: 'AL', dial_code: '+355', flag: '🇦🇱', label: 'Albania +355' },
        { name: 'Algeria', code: 'DZ', dial_code: '+213', flag: '🇩🇿', label: 'Algeria +213' },
        { name: 'Argentina', code: 'AR', dial_code: '+54', flag: '🇦🇷', label: 'Argentina +54' },
        { name: 'Australia', code: 'AU', dial_code: '+61', flag: '🇦🇺', label: 'Australia +61' },
        { name: 'Austria', code: 'AT', dial_code: '+43', flag: '🇦🇹', label: 'Austria +43' },
        { name: 'Belgium', code: 'BE', dial_code: '+32', flag: '🇧🇪', label: 'Belgium +32' },
        { name: 'Bosnia and Herzegovina', code: 'BA', dial_code: '+387', flag: '🇧🇦', label: 'Bosnia and Herzegovina +387' },
        { name: 'Brazil', code: 'BR', dial_code: '+55', flag: '🇧🇷', label: 'Brazil +55' },
        { name: 'Canada', code: 'CA', dial_code: '+1', flag: '🇨🇦', label: 'Canada +1' },
        { name: 'China', code: 'CN', dial_code: '+86', flag: '🇨🇳', label: 'China +86' },
        { name: 'Croatia', code: 'HR', dial_code: '+385', flag: '🇭🇷', label: 'Croatia +385' },
        { name: 'Czech Republic', code: 'CZ', dial_code: '+420', flag: '🇨🇿', label: 'Czech Republic +420' },
        { name: 'Denmark', code: 'DK', dial_code: '+45', flag: '🇩🇰', label: 'Denmark +45' },
        { name: 'Egypt', code: 'EG', dial_code: '+20', flag: '🇪🇬', label: 'Egypt +20' },
        { name: 'Finland', code: 'FI', dial_code: '+358', flag: '🇫🇮', label: 'Finland +358' },
        { name: 'France', code: 'FR', dial_code: '+33', flag: '🇫🇷', label: 'France +33' },
        { name: 'Germany', code: 'DE', dial_code: '+49', flag: '🇩🇪', label: 'Germany +49' },
        { name: 'Greece', code: 'GR', dial_code: '+30', flag: '🇬🇷', label: 'Greece +30' },
        { name: 'Hungary', code: 'HU', dial_code: '+36', flag: '🇭🇺', label: 'Hungary +36' },
        { name: 'India', code: 'IN', dial_code: '+91', flag: '🇮🇳', label: 'India +91' },
        { name: 'Indonesia', code: 'ID', dial_code: '+62', flag: '🇮🇩', label: 'Indonesia +62' },
        { name: 'Iran', code: 'IR', dial_code: '+98', flag: '🇮🇷', label: 'Iran +98' },
        { name: 'Iraq', code: 'IQ', dial_code: '+964', flag: '🇮🇶', label: 'Iraq +964' },
        { name: 'Ireland', code: 'IE', dial_code: '+353', flag: '🇮🇪', label: 'Ireland +353' },
        { name: 'Israel', code: 'IL', dial_code: '+972', flag: '🇮🇱', label: 'Israel +972' },
        { name: 'Italy', code: 'IT', dial_code: '+39', flag: '🇮🇹', label: 'Italy +39' },
        { name: 'Japan', code: 'JP', dial_code: '+81', flag: '🇯🇵', label: 'Japan +81' },
        { name: 'Jordan', code: 'JO', dial_code: '+962', flag: '🇯🇴', label: 'Jordan +962' },
        { name: 'Kosovo', code: 'XK', dial_code: '+383', flag: '🇽🇰', label: 'Kosovo +383' },
        { name: 'Kuwait', code: 'KW', dial_code: '+965', flag: '🇰🇼', label: 'Kuwait +965' },
        { name: 'Lebanon', code: 'LB', dial_code: '+961', flag: '🇱🇧', label: 'Lebanon +961' },
        { name: 'Libya', code: 'LY', dial_code: '+218', flag: '🇱🇾', label: 'Libya +218' },
        { name: 'Luxembourg', code: 'LU', dial_code: '+352', flag: '🇱🇺', label: 'Luxembourg +352' },
        { name: 'Malaysia', code: 'MY', dial_code: '+60', flag: '🇲🇾', label: 'Malaysia +60' },
        { name: 'Mexico', code: 'MX', dial_code: '+52', flag: '🇲🇽', label: 'Mexico +52' },
        { name: 'Montenegro', code: 'ME', dial_code: '+382', flag: '🇲🇪', label: 'Montenegro +382' },
        { name: 'Morocco', code: 'MA', dial_code: '+212', flag: '🇲🇦', label: 'Morocco +212' },
        { name: 'Netherlands', code: 'NL', dial_code: '+31', flag: '🇳🇱', label: 'Netherlands +31' },
        { name: 'New Zealand', code: 'NZ', dial_code: '+64', flag: '🇳🇿', label: 'New Zealand +64' },
        { name: 'Nigeria', code: 'NG', dial_code: '+234', flag: '🇳🇬', label: 'Nigeria +234' },
        { name: 'North Macedonia', code: 'MK', dial_code: '+389', flag: '🇲🇰', label: 'North Macedonia +389' },
        { name: 'Norway', code: 'NO', dial_code: '+47', flag: '🇳🇴', label: 'Norway +47' },
        { name: 'Pakistan', code: 'PK', dial_code: '+92', flag: '🇵🇰', label: 'Pakistan +92' },
        { name: 'Philippines', code: 'PH', dial_code: '+63', flag: '🇵🇭', label: 'Philippines +63' },
        { name: 'Poland', code: 'PL', dial_code: '+48', flag: '🇵🇱', label: 'Poland +48' },
        { name: 'Portugal', code: 'PT', dial_code: '+351', flag: '🇵🇹', label: 'Portugal +351' },
        { name: 'Romania', code: 'RO', dial_code: '+40', flag: '🇷🇴', label: 'Romania +40' },
        { name: 'Russia', code: 'RU', dial_code: '+7', flag: '🇷🇺', label: 'Russia +7' },
        { name: 'Saudi Arabia', code: 'SA', dial_code: '+966', flag: '🇸🇦', label: 'Saudi Arabia +966' },
        { name: 'Serbia', code: 'RS', dial_code: '+381', flag: '🇷🇸', label: 'Serbia +381' },
        { name: 'Singapore', code: 'SG', dial_code: '+65', flag: '🇸🇬', label: 'Singapore +65' },
        { name: 'Slovenia', code: 'SI', dial_code: '+386', flag: '🇸🇮', label: 'Slovenia +386' },
        { name: 'South Africa', code: 'ZA', dial_code: '+27', flag: '🇿🇦', label: 'South Africa +27' },
        { name: 'South Korea', code: 'KR', dial_code: '+82', flag: '🇰🇷', label: 'South Korea +82' },
        { name: 'Spain', code: 'ES', dial_code: '+34', flag: '🇪🇸', label: 'Spain +34' },
        { name: 'Sweden', code: 'SE', dial_code: '+46', flag: '🇸🇪', label: 'Sweden +46' },
        { name: 'Switzerland', code: 'CH', dial_code: '+41', flag: '🇨🇭', label: 'Switzerland +41' },
        { name: 'Syria', code: 'SY', dial_code: '+963', flag: '🇸🇾', label: 'Syria +963' },
        { name: 'Tunisia', code: 'TN', dial_code: '+216', flag: '🇹🇳', label: 'Tunisia +216' },
        { name: 'Turkey', code: 'TR', dial_code: '+90', flag: '🇹🇷', label: 'Turkey +90' },
        { name: 'Ukraine', code: 'UA', dial_code: '+380', flag: '🇺🇦', label: 'Ukraine +380' },
        { name: 'United Arab Emirates', code: 'AE', dial_code: '+971', flag: '🇦🇪', label: 'United Arab Emirates +971' },
        { name: 'United Kingdom', code: 'GB', dial_code: '+44', flag: '🇬🇧', label: 'United Kingdom +44' },
        { name: 'United States', code: 'US', dial_code: '+1', flag: '🇺🇸', label: 'United States +1' },
    ];

    selectedCountry = this.countries.find(c => c.code === 'XK')!;

    constructor(
        private membershipRequestsService: MembershipRequestsService,
        private router: Router
    ) {}

    ngAfterViewInit() {
        this.applicantSignaturePad = new SignaturePad(this.applicantCanvas.nativeElement, {
            backgroundColor: 'rgb(255, 255, 255)',
            penColor: 'rgb(0, 0, 0)'
        });
        this.resizeCanvas(this.applicantCanvas.nativeElement);

        this.guardianSignaturePad = new SignaturePad(this.guardianCanvas.nativeElement, {
            backgroundColor: 'rgb(255, 255, 255)',
            penColor: 'rgb(0, 0, 0)'
        });
        this.resizeCanvas(this.guardianCanvas.nativeElement);
    }

    resizeCanvas(canvas: HTMLCanvasElement) {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = 90 * ratio;
        canvas.getContext('2d')!.scale(ratio, ratio);
    }

    clearApplicantSignature() {
        this.applicantSignaturePad.clear();
    }

    clearGuardianSignature() {
        this.guardianSignaturePad.clear();
    }

    onCountryChange() {
        // no-op, selectedCountry is used directly on submit
    }

    onDateOfBirthChange() {
        if (this.applicantSignaturePad) {
            this.applicantSignaturePad.clear();
        }
        if (this.guardianSignaturePad) {
            this.guardianSignaturePad.clear();
        }
    }

    isUnder14(): boolean {
        if (!this.formData.applicantDateofBirth) {
            return false;
        }

        const birthDate = new Date(this.formData.applicantDateofBirth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age < 14;
    }

    isUnder16(): boolean {
        if (!this.formData.applicantDateofBirth) {
            return false;
        }

        const birthDate = new Date(this.formData.applicantDateofBirth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age < 16;
    }

    onSubmit() {
        this.errorMessage = '';
        this.successMessage = '';

        // Check if required signatures are provided
        if (!this.isUnder14() && this.applicantSignaturePad.isEmpty()) {
            this.errorMessage = 'Please provide your signature.';
            return;
        }

        if (this.isUnder14() && this.guardianSignaturePad.isEmpty()) {
            this.errorMessage = 'Parent/Guardian signature is required for applicants under 14.';
            return;
        }

        this.isSubmitting = true;

        // Get signature as blob
        const signaturePad = this.isUnder14() ? this.guardianSignaturePad : this.applicantSignaturePad;
        const signatureDataUrl = signaturePad.toDataURL('image/png');
        
        // Convert base64 to blob
        fetch(signatureDataUrl)
            .then(res => res.blob())
            .then(signatureBlob => {
                // Create FormData for multipart/form-data request
                const formData = new FormData();
                formData.append('FullName', this.formData.fullName);
                formData.append('Address', this.formData.address);
                formData.append('City', this.formData.city);
                formData.append('PhoneNumber', `${this.selectedCountry.dial_code}${this.formData.phoneNumber.replace(/\s/g, '')}`);
                formData.append('Email', this.formData.email);
                formData.append('SchoolOrCompany', this.formData.schoolCompany);
                formData.append('DateOfBirth', new Date(this.formData.applicantDateofBirth).toISOString());
                formData.append('Statement', this.formData.statement);
                formData.append('IdCardNumber', this.formData.idNumber);
                formData.append('SignatureFile', signatureBlob, 'signature.png');

                this.membershipRequestsService.create(formData).subscribe({
                    next: (response) => {
                        this.isSubmitting = false;
                        this.successMessage = 'Your application has been submitted successfully!';
                        // Optionally redirect after a delay
                        setTimeout(() => {
                            this.router.navigate(['/auth/login']);
                        }, 2000);
                    },
                    error: (err) => {
                        this.isSubmitting = false;
                        this.errorMessage = err.error?.message || 'Failed to submit application. Please try again.';
                        console.error('Submission error:', err);
                    }
                });
            })
            .catch(err => {
                this.isSubmitting = false;
                this.errorMessage = 'Failed to process signature. Please try again.';
                console.error('Signature processing error:', err);
            });
    }
}
