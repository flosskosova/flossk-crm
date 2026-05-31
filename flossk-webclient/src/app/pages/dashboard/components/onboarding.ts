import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

@Component({
    selector: 'app-onboarding',
    standalone: true,
    imports: [RouterModule, ButtonModule, CardModule],
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
        <div class="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900 p-6">
            <div class="w-full max-w-4xl">
                <div class="text-center mb-8" data-aos="fade-down">
                    <h1 class="text-4xl font-bold text-surface-900 dark:text-surface-0 mb-4">Welcome to FLOSSK</h1>
                    <p class="text-xl text-surface-600 dark:text-surface-400">Choose how you'd like to get started</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Login Card -->
                    <div data-aos="fade-up" data-aos-delay="100">
                        <p-card styleClass="h-full">
                            <div class="flex gap-4 flex-col items-center text-center h-full">
                                <i style="font-size: 2rem;" class="pi pi-sign-in text-5xl text-primary"></i>
                                <h3 class="text-2xl font-semibold text-surface-900 dark:text-surface-0">Already a Member?</h3>
                                <p class="text-surface-600 dark:text-surface-400 grow">
                                    Log in to access your dashboard, manage your projects, and connect with the community.
                                </p>
                                <a routerLink="/auth/login" class="w-full mt-auto">
                                    <p-button label="Log In" icon="pi pi-arrow-right" iconPos="right" styleClass="w-full" />
                                </a>
                            </div>
                        </p-card>
                    </div>

                    <!-- Rent Hackerspace Card -->
                    <div data-aos="fade-up" data-aos-delay="200">
                        <p-card styleClass="h-full">
                            <div class="flex gap-4 flex-col items-center text-center h-full">
                                <i style="font-size: 2rem;" class="pi pi-building text-5xl text-orange-500"></i>
                                <h3 class="text-2xl font-semibold text-surface-900 dark:text-surface-0">Rent the Space</h3>
                                <p class="text-surface-600 dark:text-surface-400 grow">
                                    Looking to rent the hackerspace for personal use or your company's? Explore our rental options.
                                </p>
                                <a routerLink="/rent" class="w-full mt-auto">
                                    <p-button label="View Rental Options" icon="pi pi-arrow-right" iconPos="right" severity="warn" styleClass="w-full" />
                                </a>
                            </div>
                        </p-card>
                    </div>

                    <!-- Membership Application Card -->
                    <div data-aos="fade-up" data-aos-delay="300">
                        <p-card styleClass="h-full">
                            <div class="flex gap-4 flex-col items-center text-center h-full">
                                <i style="font-size: 2rem;" class="pi pi-user-plus text-5xl text-green-500"></i>
                                <h3 class="text-2xl font-semibold text-surface-900 dark:text-surface-0">Become a Member</h3>
                                <p class="text-surface-600 dark:text-surface-400 grow">
                                    Join our community! Apply for membership to get access to tools, workshops, and collaborate with makers.
                                </p>
                                <a routerLink="/apply" class="w-full mt-auto">
                                    <p-button label="Apply for Membership" icon="pi pi-arrow-right" iconPos="right" severity="success" styleClass="w-full" />
                                </a>
                            </div>
                        </p-card>
                    </div>

                    <!-- Donation Card -->
                    <div data-aos="fade-up" data-aos-delay="400">
                        <p-card styleClass="h-full">
                            <div class="flex gap-4 flex-col items-center text-center h-full">
                                <i style="font-size: 2rem;" class="pi pi-heart text-5xl text-pink-500"></i>
                                <h3 class="text-2xl font-semibold text-surface-900 dark:text-surface-0">Support FLOSSK</h3>
                                <p class="text-surface-600 dark:text-surface-400 grow">
                                    Help us grow! Make a monetary donation or contribute equipment to support our NGO mission.
                                </p>
                                <a routerLink="/donate" class="w-full mt-auto">
                                    <p-button label="Make a Donation" icon="pi pi-heart-fill" iconPos="right" severity="help" styleClass="w-full" />
                                </a>
                            </div>
                        </p-card>
                    </div>
                </div>

                <div class="text-center mt-8" data-aos="fade-up" data-aos-delay="500">
                    <p class="text-surface-500 dark:text-surface-400">
                        Have questions? <a href="mailto:info@hackerspace.com" class="text-primary hover:underline">Contact us</a>
                    </p>
                </div>
            </div>
        </div>
    `
})
export class Onboarding {}
