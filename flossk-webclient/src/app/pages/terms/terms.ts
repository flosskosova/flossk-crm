import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-terms',
    standalone: true,
    imports: [RouterModule, ButtonModule, CommonModule],
    template: `
        <div class="bg-surface-50 dark:bg-surface-950 min-h-screen flex items-start justify-center py-8 px-4">
            <div class="w-full max-w-4xl my-8">
                <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                    <div class="w-full bg-surface-0 dark:bg-surface-900 py-12 px-8 sm:px-16" style="border-radius: 53px">
                        <div class="text-center mb-8">
                            <img class="h-16 sm:h-20 w-auto mx-auto" src="assets/images/logo.png" alt="FLOSSK">
                            <h1 class="text-3xl font-bold mt-6 text-surface-900 dark:text-surface-0">Terms of Service</h1>
                            <p class="text-muted-color mt-2">Last updated: July 2025</p>
                        </div>

                        <div class="space-y-8 text-surface-700 dark:text-surface-200 text-sm leading-relaxed max-w-none">

                            <section>
                                <h2 class="text-xl font-semibold mb-3 text-surface-900 dark:text-surface-0">1. Introduction</h2>
                                <p>Welcome to the FLOSSK CRM platform, operated by FLOSSK (Free Libre Open Source Software Kosova) and Prishtina Hackerspace ("we," "us," or "our"). These Terms of Service govern your access to and use of the Platform, including all features, services, and content provided through it.</p>
                                <p class="mt-3">The Platform is a comprehensive community management system that supports membership management, project collaboration, course enrollment and training, certificate issuance, elections and voting, event management, inventory tracking, announcements, real-time communications, and other services for the FLOSSK and Prishtina Hackerspace community. It is built using ASP.NET Core and Angular, with JWT-based authentication, PostgreSQL database storage, and various supporting technologies described in this document.</p>
                                <p class="mt-3">By creating an account, accessing, or using any part of the Platform, you agree to be bound by these Terms. If you do not agree to any part of these Terms, you must not create an account or use the Platform. If you are accepting these Terms on behalf of a legal entity, you represent that you have the authority to bind that entity.</p>
                            </section>

                            <section>
                                <h2 class="text-xl font-semibold mb-3 text-surface-900 dark:text-surface-0">2. Definitions</h2>
                                <p>"Platform" means the FLOSSK CRM web application, its APIs, and all related services and content. "User" means any individual who creates an account on the Platform. "Member" means a User whose membership application has been approved through the Platform's membership process. "Content" means any information, text, files, images, signatures, or other materials submitted to the Platform. "Services" means all features and functionalities offered through the Platform. "Personal Data" has the meaning given in applicable data protection laws, including the GDPR.</p>
                            </section>

                            <section>
                                <h2 class="text-xl font-semibold mb-3 text-surface-900 dark:text-surface-0">3. Eligibility and Accounts</h2>
                                <p>You must be at least 16 years of age to create an account. Individuals under 16 may only use the Platform under the supervision of a parent or legal guardian. Applicants under 14 must provide verified guardian consent and a guardian signature as part of the membership application process.</p>
                                <p class="mt-3">When creating an account, you agree to provide accurate and complete information and to keep that information up to date. You are solely responsible for maintaining the confidentiality of your password and any authentication credentials, including passkeys or TOTP secrets if you enable multi-factor authentication. You must notify us immediately at <a href="mailto:info@flossk.org" class="text-primary hover:underline">info@flossk.org</a> if you suspect any unauthorized use of your account.</p>
                                <p class="mt-3">We reserve the right to refuse registration, suspend accounts, or terminate accounts at our sole discretion, including when we suspect fraudulent, abusive, or illegal activity.</p>
                            </section>

                            <section>
                                <h2 class="text-xl font-semibold mb-3 text-surface-900 dark:text-surface-0">4. Account Roles</h2>
                                <p>The Platform supports several account roles with different permission levels. Trainee accounts are limited to course participation via voucher registration. User accounts provide access to general Platform features. Full Member accounts include additional privileges such as voting in elections and project creation. BoardMember accounts have administrative authority over membership approvals. Admin accounts have full system access and configuration rights. Roles are granted and modified in accordance with FLOSSK and Prishtina Hackerspace governance policies and may be changed at any time as reasonably necessary.</p>
                            </section>

                            <section>
                                <h2 class="text-xl font-semibold mb-3 text-surface-900 dark:text-surface-0">5. Services</h2>
                                <p class="font-medium text-surface-900 dark:text-surface-0">Membership Management.</p>
                                <p>The membership application process requires submission of personal information including your full name, address, date of birth, phone number, email, identification documents, and a personal statement. This information is used for identity verification and record-keeping. Approved members agree to abide by FLOSSK and Prishtina Hackerspace community standards and bylaws.</p>
                                <p class="font-medium text-surface-900 dark:text-surface-0 mt-3">Project Collaboration.</p>
                                <p>Users and Members may create and participate in projects. Project moderators are responsible for managing their project's content, team, and compliance with these Terms. Contributions to projects are tracked and may be reflected in community leaderboards.</p>
                                <p class="font-medium text-surface-900 dark:text-surface-0 mt-3">Courses and Training.</p>
                                <p>Courses may require registration through vouchers or direct enrollment. Course content, schedules, and instructor assignments may change with reasonable notice. Course-related Google Form integrations are subject to Google's terms and privacy policy in addition to these Terms.</p>
                                <p class="font-medium text-surface-900 dark:text-surface-0 mt-3">Certificates.</p>
                                <p>Certificates are issued upon completion of qualifying activities and include HMAC-SHA256 digital signatures for authenticity verification via QR code. Certificates may be revoked by administrators for cause, including fraudulent acquisition or violation of these Terms.</p>
                                <p class="font-medium text-surface-900 dark:text-surface-0 mt-3">Elections.</p>
                                <p>Eligible Members may participate in organizational elections. Each eligible Member may cast up to three votes per election. Voting records are maintained for electoral integrity.</p>
                                <p class="font-medium text-surface-900 dark:text-surface-0 mt-3">Inventory and Resources.</p>
                                <p>Physical inventory items may be checked in and out through the Platform. Users are responsible for items checked out in their name and must report damage, loss, or theft immediately.</p>
                            </section>

                            <section>
                                <h2 class="text-xl font-semibold mb-3 text-surface-900 dark:text-surface-0">6. Acceptable Use</h2>
                                <p>You agree to use the Platform only for lawful purposes. You may not:</p>
                                <ul class="list-disc pl-6 mt-2 space-y-1">
                                    <li>Violate any applicable law</li>
                                    <li>Impersonate any person or entity</li>
                                    <li>Upload harmful or malicious content including viruses or malware</li>
                                    <li>Attempt to gain unauthorized access to any part of the Platform, other accounts, or connected systems</li>
                                    <li>Interfere with the operation of the Platform or its infrastructure</li>
                                    <li>Use automated tools (bots, scrapers, crawlers) without our written permission</li>
                                    <li>Place unreasonable load on the Platform</li>
                                    <li>Infringe third-party intellectual property rights</li>
                                    <li>Distribute unsolicited commercial communications</li>
                                </ul>
                            </section>

                            <section>
                                <h2 class="text-xl font-semibold mb-3 text-surface-900 dark:text-surface-0">7. Content</h2>
                                <p>You retain ownership of Content you submit to the Platform. By submitting Content, you grant us a non-exclusive, royalty-free, worldwide license to use, reproduce, and display that Content solely for operating and providing the Platform services. You represent that you own or have the necessary rights to all Content you submit and that it does not infringe any third-party rights. The Platform itself, including its underlying technology and original content, is owned by FLOSSK and Prishtina Hackerspace and is protected by applicable intellectual property laws.</p>
                            </section>

                            <section>
                                <h2 class="text-xl font-semibold mb-3 text-surface-900 dark:text-surface-0">8. File Uploads</h2>
                                <p>The Platform allows file uploads for profiles (pictures, banners, CVs), membership applications (ID cards, signatures), project resources, certificate templates, course materials, inventory images, and general file storage. All uploaded files are scanned using ClamAV antivirus software before storage. Files detected as malicious are rejected immediately and not stored. Only permitted file types are accepted (.jpg, .jpeg, .png, .gif, .pdf, .doc, .docx, .xls, .xlsx, .pptx, .txt). Individual files are limited to 10 MB; batch uploads are limited to 50 MB total. Uploaded files are stored on secure servers with restricted access and are deleted upon account deletion or removal request, subject to legal holds.</p>
                            </section>

                            <section>
                                <h2 class="text-xl font-semibold mb-3 text-surface-900 dark:text-surface-0">9. Privacy and Data Processing</h2>
                                <p>Our Privacy Policy describes what personal data we collect, how we process it, and your rights regarding your data. The following is a summary of our data processing practices that are relevant to your use of the Platform.</p>
                                <p class="font-medium text-surface-900 dark:text-surface-0 mt-3">Authentication.</p>
                                <p>When you log in, we issue a JWT that contains your user ID, email, name, and role. This token is verified on every API request. If you enable "Remember Me," your session persists for up to 10 days. You may also enable multi-factor authentication using TOTP (compatible with authenticator apps) or WebAuthn passkeys (using public-key cryptography).</p>
                                <p class="font-medium text-surface-900 dark:text-surface-0 mt-3">Data Storage.</p>
                                <p>Your data is stored in a PostgreSQL database. Passwords are hashed using PBKDF2 and are never stored in plain text. TOTP secrets are encrypted at rest. Passkey credentials are stored as COSE key objects derived from FIDO2 authenticators.</p>
                                <p class="font-medium text-surface-900 dark:text-surface-0 mt-3">Communications.</p>
                                <p>Transactional emails (password resets, membership notifications, certificate issuances) are sent via Gmail SMTP or Resend. Browser push notifications use the Web Push protocol with VAPID authentication. Real-time features use SignalR with JWT-based connection authentication.</p>
                                <p class="font-medium text-surface-900 dark:text-surface-0 mt-3">Audit.</p>
                                <p>Administrative and sensitive actions are logged with IP addresses, user agents, and timestamps. These logs are retained for one year and used for security monitoring and compliance.</p>
                                <p class="font-medium text-surface-900 dark:text-surface-0 mt-3">Security.</p>
                                <p>All communications are encrypted using TLS. File uploads are virus-scanned. Access to data is controlled through role-based authorization. Certificates are signed using HMAC-SHA256 for offline verification.</p>
                            </section>

                            <section>
                                <h2 class="text-xl font-semibold mb-3 text-surface-900 dark:text-surface-0">10. Third-Party Services</h2>
                                <p>The Platform integrates with several third-party services to provide its functionality. These include PostgreSQL for database storage, ClamAV for file virus scanning, Resend and Gmail SMTP for email delivery, Web Push / VAPID for browser notifications, SignalR for real-time features, Google Forms for course enrollment (optional integration by course creators), and Caddy for reverse proxy and HTTPS termination. Each third-party service operates under its own terms and privacy policies. We are not responsible for the practices of these third parties. Planned integrations include Mattermost and GitHub, which will be subject to additional terms when activated.</p>
                            </section>

                            <section>
                                <h2 class="text-xl font-semibold mb-3 text-surface-900 dark:text-surface-0">11. Limitation of Liability</h2>
                                <p>To the maximum extent permitted by applicable law, FLOSSK and Prishtina Hackerspace, including their officers, directors, volunteers, and agents, shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of or inability to use the Platform, any content obtained through the Platform, unauthorized access to or alteration of your data, or any conduct of third parties on the Platform. Our total liability for any claims under these Terms shall not exceed the greater of €100 or any amounts you have paid to us in the twelve months preceding the claim.</p>
                            </section>

                            <section>
                                <h2 class="text-xl font-semibold mb-3 text-surface-900 dark:text-surface-0">12. Disclaimer of Warranties</h2>
                                <p>The Platform is provided on an "as is" and "as available" basis without warranties of any kind, either express or implied, including merchantability, fitness for a particular purpose, non-infringement, or course of performance. We do not warrant that the Platform will function uninterrupted, secure, or error-free; that defects will be corrected; that our servers are free of viruses; or that your content will be preserved or retrievable.</p>
                            </section>

                            <section>
                                <h2 class="text-xl font-semibold mb-3 text-surface-900 dark:text-surface-0">13. Termination</h2>
                                <p>We may terminate or suspend your account at any time without prior notice for violation of these Terms, illegal or fraudulent activity, behavior harmful to others or the Platform, extended inactivity, or as required by law enforcement. You may terminate your account at any time using the account deletion feature in your settings. Upon termination, your right to use the Platform ceases immediately. Sections that by their nature should survive termination, including Sections 7 (Content), 11 (Limitation of Liability), and 12 (Disclaimer of Warranties), shall remain in effect.</p>
                            </section>

                            <section>
                                <h2 class="text-xl font-semibold mb-3 text-surface-900 dark:text-surface-0">14. Indemnification</h2>
                                <p>You agree to indemnify and hold harmless FLOSSK and Prishtina Hackerspace from any claims, liabilities, damages, and expenses arising out of your access to or use of the Platform, your violation of these Terms, your violation of any third-party rights, or any content you submit.</p>
                            </section>

                            <section>
                                <h2 class="text-xl font-semibold mb-3 text-surface-900 dark:text-surface-0">15. Governing Law</h2>
                                <p>These Terms are governed by the laws of the Republic of Kosovo. Any disputes shall be subject to the exclusive jurisdiction of the courts of Prishtina, Kosovo. Nothing in this section prevents us from seeking injunctive relief in any jurisdiction to protect our rights or property.</p>
                            </section>

                            <section>
                                <h2 class="text-xl font-semibold mb-3 text-surface-900 dark:text-surface-0">16. Changes to These Terms</h2>
                                <p>We may modify these Terms at any time. Material changes will be communicated through Platform announcements, email, or a notice on the login page. Changes become effective upon posting. Your continued use of the Platform after changes are posted constitutes acceptance. If you do not agree to the modified Terms, you must discontinue use and delete your account.</p>
                            </section>

                            <section>
                                <h2 class="text-xl font-semibold mb-3 text-surface-900 dark:text-surface-0">17. Severability</h2>
                                <p>If any provision of these Terms is held to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.</p>
                            </section>

                            <section>
                                <h2 class="text-xl font-semibold mb-3 text-surface-900 dark:text-surface-0">18. Contact</h2>
                                <p>For questions about these Terms, please contact us at <a href="mailto:info@flossk.org" class="text-primary hover:underline">info@flossk.org</a> or by mail at FLOSSK, Prishtina, Republic of Kosovo.</p>
                            </section>

                        </div>

                        <div class="text-center mt-8 pt-6 border-t border-surface">
                            <p-button label="Back to Login" routerLink="/auth/login" styleClass="p-button-outlined"></p-button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class Terms {}
