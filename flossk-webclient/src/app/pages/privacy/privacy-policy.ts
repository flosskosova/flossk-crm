import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-privacy-policy',
    standalone: true,
    imports: [RouterModule, ButtonModule],
    template: `
        <div class="min-h-screen bg-surface-50 dark:bg-surface-950">
            <div class="max-w-3xl mx-auto px-6 py-16">
                <p-button label="&larr; Back" severity="secondary" variant="text" routerLink="/auth/login" class="mb-8 block" />

                <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 mb-2">Privacy Policy</h1>
                <p class="text-sm text-surface-500 dark:text-surface-400 mb-12">Effective June 25, 2026</p>

                <div class="space-y-10 text-surface-700 dark:text-surface-300 leading-relaxed">
                    <section>
                        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-3">1. Introduction</h2>
                        <p class="mb-2">FLOSSK CRM ("we," "our," "us") is the community management platform operated by FLOSSK (Free Libre Open Source Software Kosova). We are committed to protecting your privacy and handling your personal data in compliance with Kosovo's Law No. 06/L-082 on Personal Data Protection and the EU General Data Protection Regulation (GDPR).</p>
                        <p>This policy explains what data we collect, why we collect it, and your rights regarding your personal information.</p>
                    </section>

                    <section>
                        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-3">2. Information We Collect</h2>

                        <h3 class="font-medium text-surface-900 dark:text-surface-0 mt-5 mb-2">2.1 Account Information</h3>
                        <p class="mb-2">When you register, we collect:</p>
                        <ul class="list-disc pl-6 space-y-1">
                            <li>First and last name</li>
                            <li>Email address</li>
                            <li>Password (stored as a salted hash; we never store plaintext passwords)</li>
                            <li>Phone number (optional)</li>
                        </ul>

                        <h3 class="font-medium text-surface-900 dark:text-surface-0 mt-5 mb-2">2.2 Profile Information</h3>
                        <p class="mb-2">You may voluntarily provide:</p>
                        <ul class="list-disc pl-6 space-y-1">
                            <li>Profile picture and banner image</li>
                            <li>Biography and skills</li>
                            <li>Location (city level)</li>
                            <li>Social media links (GitHub, LinkedIn, X/Twitter, Instagram, YouTube, Spotify, Steam, personal website)</li>
                            <li>CV or resume (PDF upload)</li>
                        </ul>

                        <h3 class="font-medium text-surface-900 dark:text-surface-0 mt-5 mb-2">2.3 Membership Application Data</h3>
                        <p class="mb-2">If you apply for full membership, we collect:</p>
                        <ul class="list-disc pl-6 space-y-1">
                            <li>Full name, physical address, and city of residence</li>
                            <li>National ID card number and date of birth</li>
                            <li>Phone number and email address</li>
                            <li>School or employer name</li>
                            <li>Personal statement</li>
                            <li>Digital signature (captured as PNG image)</li>
                            <li>Guardian signature (for applicants under 14)</li>
                        </ul>

                        <h3 class="font-medium text-surface-900 dark:text-surface-0 mt-5 mb-2">2.4 Usage Data</h3>
                        <ul class="list-disc pl-6 space-y-1">
                            <li>Activity logs recording actions you perform (creating projects, editing resources, etc.) for audit purposes</li>
                            <li>Online presence status and last activity timestamp</li>
                            <li>RFID card identifiers for physical hackerspace access</li>
                            <li>Push notification subscription data (endpoint and encryption keys, only with consent)</li>
                        </ul>

                        <h3 class="font-medium text-surface-900 dark:text-surface-0 mt-5 mb-2">2.5 Course, Form, and File Data</h3>
                        <ul class="list-disc pl-6 space-y-1">
                            <li>Course reviews (optionally anonymous)</li>
                            <li>Google Forms responses submitted through our platform</li>
                            <li>Course voucher redemption data and associated email addresses</li>
                            <li>Uploaded files and generated certificates containing your name and event details</li>
                        </ul>
                    </section>

                    <section>
                        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-3">3. How We Use Your Information</h2>
                        <p class="mb-2">We use your data for:</p>
                        <ul class="list-disc pl-6 space-y-1">
                            <li>Providing and maintaining the platform and its features</li>
                            <li>Processing membership applications</li>
                            <li>Authenticating users and securing accounts</li>
                            <li>Generating certificates and official documents</li>
                            <li>Conducting community elections and voting</li>
                            <li>Managing hackerspace inventory and checkouts</li>
                            <li>Facilitating project collaboration among members</li>
                            <li>Sending administrative notifications (with consent)</li>
                            <li>Auditing actions for security and accountability</li>
                            <li>Complying with legal obligations under Kosovo and EU law</li>
                        </ul>
                    </section>

                    <section>
                        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-3">4. Legal Basis for Processing</h2>
                        <p class="mb-2">Under Article 6 of Law No. 06/L-082 and Article 6 of GDPR, we process your data only when we have a valid legal basis:</p>
                        <ul class="list-disc pl-6 space-y-1">
                            <li><strong>Consent</strong> &mdash; for optional profile data and push notifications; you may withdraw at any time</li>
                            <li><strong>Contractual necessity</strong> &mdash; for account creation, membership management, and service delivery</li>
                            <li><strong>Legal obligation</strong> &mdash; for record-keeping required by applicable Kosovo and EU laws</li>
                            <li><strong>Legitimate interests</strong> &mdash; for security auditing, community management, and platform improvement</li>
                        </ul>
                    </section>

                    <section>
                        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-3">5. Data Sharing and Third Parties</h2>
                        <p class="mb-2">We do not sell your personal data. We share data only with limited third-party processors under data processing agreements compliant with Article 28 of Law No. 06/L-082 and Article 28 of GDPR:</p>
                        <ul class="list-disc pl-6 space-y-1">
                            <li><strong>PostgreSQL</strong> &mdash; database hosting (all stored data)</li>
                            <li><strong>Resend</strong> &mdash; transactional email delivery (email address, name)</li>
                            <li><strong>Google Forms</strong> &mdash; course form responses (data you submit)</li>
                            <li><strong>ClamAV</strong> &mdash; file virus scanning (file contents processed in memory, not stored)</li>
                            <li><strong>OpenStreetMap via Leaflet</strong> &mdash; map display (your city-level location)</li>
                        </ul>
                        <p class="mt-3">We do not use Google Analytics, Facebook Pixel, or any advertising or tracking services.</p>
                    </section>

                    <section>
                        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-3">6. Data Retention</h2>
                        <ul class="list-disc pl-6 space-y-1">
                            <li>Account data is retained until you request deletion</li>
                            <li>Activity logs are retained for up to three years for audit purposes</li>
                            <li>Membership application data is retained for the duration of your membership</li>
                            <li>Uploaded files are retained until deleted by the uploader or an administrator</li>
                        </ul>
                    </section>

                    <section>
                        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-3">7. Your Rights</h2>
                        <p class="mb-2">Under Articles 16&ndash;24 of Law No. 06/L-082 and Articles 15&ndash;22 of GDPR, you have the right to:</p>
                        <ul class="list-disc pl-6 space-y-1">
                            <li>Access the personal data we hold about you</li>
                            <li>Request correction of inaccurate or incomplete data</li>
                            <li>Request deletion of your data (right to be forgotten)</li>
                            <li>Restrict processing of your data in certain circumstances</li>
                            <li>Receive your data in a structured, machine-readable format (data portability)</li>
                            <li>Object to processing based on legitimate interests or direct marketing</li>
                            <li>Withdraw consent at any time</li>
                        </ul>
                        <p class="mt-3">To exercise any of these rights, contact us at crm@flossk.org. We will respond within 30 days as required by Article 22 of Law No. 06/L-082. You also have the right to lodge a complaint with the Kosovo Agency for Personal Data Protection (Agjencia p&euml;r Mbrojtjen e t&euml; Dh&euml;nave Personale).</p>
                    </section>

                    <section>
                        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-3">8. Data Security</h2>
                        <p class="mb-2">We implement technical and organizational measures as required by Article 24 of Law No. 06/L-082 and Article 32 of GDPR:</p>
                        <ul class="list-disc pl-6 space-y-1">
                            <li>Passwords hashed via ASP.NET Core Identity (PBKDF2 algorithm)</li>
                            <li>JWT bearer tokens with configurable expiry for API authentication</li>
                            <li>File virus scanning via ClamAV before storage</li>
                            <li>Role-based access control (User, Full Member, Admin)</li>
                            <li>Comprehensive audit logging of all user actions</li>
                            <li>HTTPS encryption in transit</li>
                        </ul>
                    </section>

                    <section>
                        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-3">9. Local Storage and Cookies</h2>
                        <p class="mb-2">We use browser local storage for essential functionality only. We do not use cookies for tracking or advertising:</p>
                        <ul class="list-disc pl-6 space-y-1">
                            <li><strong>auth_token</strong> &mdash; your JWT authentication token (required for login)</li>
                            <li><strong>app_theme</strong> &mdash; your dark or light theme preference</li>
                            <li><strong>layout_*</strong> &mdash; UI customization preferences</li>
                        </ul>
                    </section>

                    <section>
                        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-3">10. International Data Transfers</h2>
                        <p>Your data is stored on servers within the European Union. If we transfer data outside the EU/EEA or Kosovo, we ensure appropriate safeguards are in place as required by Articles 45&ndash;49 of GDPR and Article 26 of Law No. 06/L-082.</p>
                    </section>

                    <section>
                        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-3">11. Changes to This Policy</h2>
                        <p>We may update this policy to reflect changes in our practices or legal obligations. Material changes will be notified via email or platform notification at least 15 days before they take effect.</p>
                    </section>

                    <section>
                        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-3">12. Contact and Supervisory Authority</h2>
                        <p class="mb-3">
                            <strong>Data Controller:</strong> FLOSSK (Free Libre Open Source Software Kosova)<br>
                            Email: crm@flossk.org
                        </p>
                        <p>
                            <strong>Supervisory Authority:</strong> Agjencia p&euml;r Mbrojtjen e t&euml; Dh&euml;nave Personale<br>
                            Website: amdp.rks-gov.net
                        </p>
                    </section>
                </div>
            </div>
        </div>
    `
})
export class PrivacyPolicy {}
