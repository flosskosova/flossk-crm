import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-terms-of-service',
    standalone: true,
    imports: [RouterModule, ButtonModule],
    template: `
        <div class="min-h-screen bg-surface-50 dark:bg-surface-950">
            <div class="max-w-3xl mx-auto px-6 py-16">
                <p-button label="&larr; Back" severity="secondary" variant="text" routerLink="/auth/login" class="mb-8 block" />

                <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 mb-2">Terms of Service</h1>
                <p class="text-sm text-surface-500 dark:text-surface-400 mb-12">Effective June 25, 2026</p>

                <div class="space-y-10 text-surface-700 dark:text-surface-300 leading-relaxed">
                    <section>
                        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-3">1. Acceptance of Terms</h2>
                        <p class="mb-2">By accessing or using the FLOSSK CRM platform ("the Service"), operated by FLOSSK (Free Libre Open Source Software Kosova), you agree to be bound by these Terms of Service. If you do not agree, you may not use the Service.</p>
                        <p>These Terms are governed by the laws of the Republic of Kosovo, including Law No. 04/L-123 on Electronic Communications and Law No. 06/L-082 on Personal Data Protection, as well as Regulation (EU) 2016/679 (GDPR) where applicable.</p>
                    </section>

                    <section>
                        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-3">2. Description of Service</h2>
                        <p class="mb-2">FLOSSK CRM is a community management platform that provides tools for:</p>
                        <ul class="list-disc pl-6 space-y-1">
                            <li>User and membership management</li>
                            <li>Project collaboration and resource sharing</li>
                            <li>Event and course management</li>
                            <li>Hackerspace operations (inventory, presence tracking, rentals)</li>
                            <li>Community elections and voting</li>
                            <li>Certificate generation and verification</li>
                            <li>Internal communications and announcements</li>
                        </ul>
                    </section>

                    <section>
                        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-3">3. Eligibility</h2>
                        <p>In accordance with Kosovo Law No. 06/L-082 and GDPR, you must be at least 14 years of age to use the Service. If you are between 14 and 17, you must have parental or guardian consent. If you are under 14, your parent or guardian must submit a membership application on your behalf. By using the Service, you represent that you meet these requirements.</p>
                    </section>

                    <section>
                        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-3">4. Account Registration</h2>
                        <ul class="list-disc pl-6 space-y-1">
                            <li>You must provide accurate and complete registration information</li>
                            <li>You are responsible for maintaining the confidentiality of your credentials</li>
                            <li>You must notify us immediately of any unauthorized use of your account</li>
                            <li>Email pre-approval is required; registration is subject to administrative approval</li>
                            <li>You may not create accounts by automated means</li>
                        </ul>
                    </section>

                    <section>
                        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-3">5. Membership Types</h2>
                        <ul class="list-disc pl-6 space-y-1">
                            <li><strong>User</strong> &mdash; basic account with limited platform access</li>
                            <li><strong>Trainee</strong> &mdash; course-based access via voucher code, email-only login</li>
                            <li><strong>Full Member</strong> &mdash; requires successful membership application including identity verification, physical address, and board approval</li>
                            <li><strong>Admin</strong> &mdash; platform administrators with elevated privileges</li>
                        </ul>
                        <p class="mt-2">Membership status and associated privileges are determined at the sole discretion of FLOSSK.</p>
                    </section>

                    <section>
                        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-3">6. Acceptable Use</h2>
                        <p class="mb-2">You agree not to:</p>
                        <ul class="list-disc pl-6 space-y-1">
                            <li>Use the Service for any unlawful purpose or in violation of applicable laws</li>
                            <li>Impersonate any person or entity</li>
                            <li>Upload or share malicious code, viruses, or harmful content</li>
                            <li>Attempt to gain unauthorized access to any part of the Service</li>
                            <li>Interfere with or disrupt the operation of the Service</li>
                            <li>Use the Service to harass, abuse, or harm others</li>
                            <li>Upload content that infringes on intellectual property rights</li>
                            <li>Use automated scripts or bots without explicit permission</li>
                        </ul>
                    </section>

                    <section>
                        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-3">7. User Content</h2>
                        <ul class="list-disc pl-6 space-y-1">
                            <li>You retain ownership of content you submit to the Service</li>
                            <li>You grant FLOSSK a non-exclusive license to store, display, and process your content as necessary to provide the Service</li>
                            <li>You represent that your content does not violate any third-party rights or applicable laws</li>
                            <li>We reserve the right to remove content that violates these Terms without prior notice</li>
                        </ul>
                    </section>

                    <section>
                        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-3">8. Privacy and Data Protection</h2>
                        <p>Your use of the Service is governed by our <a routerLink="/privacy" class="text-primary underline">Privacy Policy</a>, which complies with Kosovo's Law No. 06/L-082 on Personal Data Protection and the EU General Data Protection Regulation. By using the Service, you consent to the collection and processing of your data as described in the Privacy Policy.</p>
                    </section>

                    <section>
                        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-3">9. Intellectual Property</h2>
                        <p>The Service, its source code, design, and branding are owned by FLOSSK and protected by Law No. 2004/38 on Copyright and Related Rights of Kosovo and applicable international intellectual property laws. You may not copy, modify, distribute, sell, or create derivative works without explicit written permission, except as permitted by applicable open-source licenses.</p>
                    </section>

                    <section>
                        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-3">10. Community Elections and Voting</h2>
                        <p class="mb-2">The Service facilitates community elections. By participating, you agree that:</p>
                        <ul class="list-disc pl-6 space-y-1">
                            <li>Each member may cast one vote per election</li>
                            <li>Votes are recorded and linked to your account for audit purposes</li>
                            <li>Election results are published in aggregate form</li>
                            <li>Fraudulent or duplicate voting may result in account suspension</li>
                        </ul>
                    </section>

                    <section>
                        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-3">11. Suspension and Termination</h2>
                        <p class="mb-2">We reserve the right to suspend or terminate accounts for violations of these Terms, including but not limited to:</p>
                        <ul class="list-disc pl-6 space-y-1">
                            <li>Violation of these Terms of Service</li>
                            <li>Engaging in illegal activity through the platform</li>
                            <li>Harassing, threatening, or harming other users</li>
                            <li>Repeated upload of prohibited or infringing content</li>
                            <li>Unauthorized access or attempted breach of platform security</li>
                            <li>Extended period of inactivity (over two years)</li>
                        </ul>
                        <p class="mt-2">You may terminate your account at any time by contacting us. Upon termination, your data will be handled in accordance with our Privacy Policy.</p>
                    </section>

                    <section>
                        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-3">12. Limitation of Liability</h2>
                        <p>The Service is provided "as is" and "as available" without warranties of any kind, either express or implied. To the fullest extent permitted by the laws of the Republic of Kosovo, FLOSSK shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.</p>
                    </section>

                    <section>
                        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-3">13. Changes to Terms</h2>
                        <p>We may modify these Terms at any time. Continued use of the Service after changes are posted constitutes acceptance of the new Terms. We will notify users of material changes via email or platform notification at least 15 days before they take effect.</p>
                    </section>

                    <section>
                        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-3">14. Governing Law and Dispute Resolution</h2>
                        <p class="mb-2">These Terms are governed by the laws of the Republic of Kosovo. Any disputes arising from or relating to these Terms shall be subject to the exclusive jurisdiction of the courts of Prishtina, Kosovo.</p>
                        <p>Before initiating legal proceedings, parties agree to attempt to resolve the dispute through good-faith negotiation within 30 days.</p>
                    </section>

                    <section>
                        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-3">15. Contact</h2>
                        <p>
                            For questions about these Terms, contact:<br>
                            <strong>FLOSSK</strong> (Free Libre Open Source Software Kosova)<br>
                            Email: crm@flossk.org
                        </p>
                    </section>
                </div>
            </div>
        </div>
    `
})
export class TermsOfService {}
