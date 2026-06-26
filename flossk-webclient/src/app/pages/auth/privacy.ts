import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';

@Component({
    selector: 'app-privacy',
    standalone: true,
    imports: [ButtonModule, RouterModule, RippleModule, AppFloatingConfigurator],
    template: ` <app-floating-configurator />
        <div class="bg-surface-50 dark:bg-surface-950 min-h-screen overflow-hidden">
            <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div class="flex items-center justify-between mb-8">
                    <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0">Privacy Policy</h1>
                    <p-button label="Back to Login" routerLink="/auth/login" severity="warn" icon="pi pi-arrow-left" />
                </div>
                <div class="bg-surface-0 dark:bg-surface-900 rounded-2xl p-8 space-y-6 text-surface-700 dark:text-surface-200 leading-relaxed">
                    <p class="text-sm text-muted-color">Last Updated: June 2026</p>

                    <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mt-8">1. Who We Are</h2>
                    <p>FLOSSK (Free Libre Open Source Software Kosova) and Prishtina Hackerspace operate the FLOSSK CRM platform ("the Platform"). We are the data controller responsible for the personal data collected through the Platform. If you have any questions about this policy or our data practices, please contact us at <a href="mailto:info@flossk.org" class="text-primary hover:underline">info&#64;flossk.org</a>.</p>

                    <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mt-8">2. What This Policy Covers</h2>
                    <p>This Privacy Policy explains how we collect, use, share, and protect your personal data when you access or use the FLOSSK CRM platform. It applies to all users including visitors, registered users, members, trainees, and administrators.</p>
                    <p>Our platform serves as a comprehensive community management system for FLOSSK and Prishtina Hackerspace, providing membership management, project collaboration, course enrollment, certificate issuance, event management, elections, inventory tracking, and related community services.</p>
                    <p>This policy is designed to comply with the General Data Protection Regulation (GDPR) (Regulation (EU) 2016/679) and applicable data protection laws of the Republic of Kosovo.</p>

                    <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mt-8">3. What Information We Collect</h2>

                    <p class="font-medium text-surface-900 dark:text-surface-0 mt-4">Information You Give Us</p>
                    <p><strong>Account Data.</strong> When you create an account, we collect your email address, first name, last name, and a password (which is immediately hashed using PBKDF2 and never stored in plain text).</p>
                    <p><strong>Profile Data.</strong> You may choose to provide a biography, location (city), phone number, website URL, social media links, skills, profile picture, profile banner, and CV. These are optional and help you connect with the community.</p>
                    <p><strong>Membership Data.</strong> When applying for membership, we collect your full address, date of birth, school or employer, ID card number, a personal statement, an ID card image, and your signature. Applicants under 14 must also provide a guardian's name and signature.</p>
                    <p><strong>Authentication Data.</strong> If you enable multi-factor authentication, we store TOTP secret keys (encrypted), WebAuthn passkey credentials (limited to public key material and credential identifiers), and recovery codes (hashed).</p>
                    <p><strong>Course & Certificate Data.</strong> We track course enrollments, session attendance, voucher redemptions, and issued certificates (event name, description, issuer, HMAC-SHA256 verification signature, and QR code).</p>
                    <p><strong>Communications.</strong> If you contact us, we keep a record of that correspondence. Platform announcements serve as official organizational communications.</p>
                    <p><strong>External Messages.</strong> Unauthenticated users may submit messages through a contact form, which collects their name, email address, and message content.</p>

                    <p class="font-medium text-surface-900 dark:text-surface-0 mt-4">Information Collected Automatically</p>
                    <p><strong>Audit Logs.</strong> We log administrative actions with IP addresses, user agent strings, timestamps, and affected entities. These logs are retained for one year and used for security monitoring and compliance.</p>
                    <p><strong>Usage Data.</strong> We track session activity, feature interactions, and last activity timestamps to improve the Platform and maintain security.</p>
                    <p><strong>Presence Data.</strong> When you are logged in, your online/offline status is visible to other authenticated users through our real-time presence system (powered by SignalR).</p>
                    <p><strong>Push Subscriptions.</strong> If you enable browser push notifications, we store an endpoint URL, encryption keys (P256dh and auth secret), and your user agent.</p>

                    <p class="font-medium text-surface-900 dark:text-surface-0 mt-4">Information from Third Parties</p>
                    <p>If you submit a Google Form that is integrated with our Platform (for course enrollment or similar purposes), we receive the form response data as configured by the form creator. Any such integration is subject to Google's privacy policy in addition to this policy.</p>

                    <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mt-8">4. How We Process Your Data</h2>
                    <p>We use the following technologies and methods to process and protect your data:</p>
                    <p><strong>Authentication & Authorization.</strong> All API requests are authenticated using JSON Web Tokens (JWT) with configurable expiry. Tokens contain your user ID, email, name, and role claims. By default, tokens expire after 60 minutes. If you check "Remember Me," tokens are extended to 10 days. Role-based access control (RBAC) ensures that users can only access data and features appropriate to their role (Admin, BoardMember, Full Member, User, Trainee).</p>
                    <p><strong>Password Security.</strong> Passwords are hashed using ASP.NET Core Identity's implementation of PBKDF2 before storage. We enforce password policies requiring a minimum of 6 characters with at least one uppercase letter, one lowercase letter, and one digit. Password reset tokens expire after 30 minutes and are invalidated after a single use.</p>
                    <p><strong>Multi-Factor Authentication.</strong> We support TOTP (Time-Based One-Time Passwords) compliant with RFC 6238, compatible with authenticator apps like Google Authenticator and Authy. We also support WebAuthn/FIDO2 passkeys for passwordless authentication using public-key cryptography. TOTP secrets are encrypted at rest. Passkey credentials are stored as COSE key objects and verified using ECDSA signature verification.</p>
                    <p><strong>Encryption.</strong> All data transmitted between your browser and our servers is encrypted using TLS/HTTPS. File uploads are scanned for malware using ClamAV before being stored on disk.</p>
                    <p><strong>File Handling.</strong> Uploaded files are validated against an allowed extension whitelist (.jpg, .jpeg, .png, .gif, .pdf, .doc, .docx, .xls, .xlsx, .pptx, .txt). Single file uploads are limited to 10 MB; batch uploads are limited to 50 MB total. Files are scanned by ClamAV in real time. Files detected as malicious are rejected and never stored. Clean files are stored with GUID-based filenames to prevent path traversal and enumeration.</p>
                    <p><strong>Audit Trail.</strong> We maintain immutable audit logs for all administrative and sensitive actions, recording who performed what action, on which entity, from which IP address, and at what time.</p>
                    <p><strong>Certificate Verification.</strong> Issued certificates include an HMAC-SHA256 signature and a unique verification token. QR codes on certificates link to our verification endpoint for authenticating certificate authenticity without exposing underlying personal data.</p>
                    <p><strong>Real-Time Features.</strong> SignalR is used for real-time presence indicators, live notifications, and collaborative features. Connections are authenticated using JWT tokens passed via query string.</p>
                    <p><strong>Push Notifications.</strong> Browser push notifications use the Web Push protocol with VAPID (Voluntary Application Server Identification) for authenticated message delivery. Push subscriptions are stored in our database and can be enabled or disabled by the user.</p>

                    <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mt-8">5. Why We Process Your Data (Legal Bases)</h2>
                    <p>Under GDPR, we rely on the following legal bases for processing your personal data:</p>
                    <p><strong>Contractual Necessity.</strong> We process your data to create and maintain your account, process membership applications, deliver Platform services, manage course enrollments, and issue certificates. Without this data, we cannot provide the services you request.</p>
                    <p><strong>Legal Obligation.</strong> We process and retain audit logs, membership records, and certain communications to comply with legal requirements, including data retention laws and lawful requests from public authorities.</p>
                    <p><strong>Legitimate Interests.</strong> We process data to maintain Platform security, prevent fraud and abuse, improve our services through usage analysis, enable community features (profiles, presence, leaderboards), and send administrative communications. We have balanced these interests against your privacy rights and believe they do not override your fundamental rights and freedoms.</p>
                    <p><strong>Consent.</strong> We rely on your consent for browser push notifications, optional profile information, and any future marketing communications. You may withdraw your consent at any time through your account settings or by contacting us.</p>

                    <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mt-8">6. Who We Share Your Data With</h2>
                    <p>We do not sell your personal data to anyone. We share data only as described below:</p>
                    <p><strong>Service Providers.</strong> We engage third parties that process data on our behalf and under our instructions. These include: PostgreSQL for database hosting, Resend and Gmail SMTP (via MailKit) for transactional email delivery, ClamAV for file virus scanning (operating within our own infrastructure), SignalR for real-time communications, and Caddy for reverse proxy and HTTPS termination. Each provider is contractually bound to implement appropriate security measures and may not use your data for their own purposes.</p>
                    <p><strong>Legal Obligations.</strong> We may disclose your data if required by law, court order, or lawful request from a public authority, or when we believe in good faith that disclosure is necessary to protect our rights, your safety, or the safety of others.</p>
                    <p><strong>Organizational Transfers.</strong> If FLOSSK or Prishtina Hackerspace undergoes a reorganization, merger, or transfer of assets, your data may be transferred to the acquiring entity, which will remain bound by this policy.</p>
                    <p><strong>Community Visibility.</strong> Certain information such as your name, biography, skills, and project affiliations may be visible to other authenticated users. You can manage what is visible through your account settings.</p>

                    <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mt-8">7. International Data Transfers</h2>
                    <p>Your personal data is primarily stored and processed on servers within the European Union and the Republic of Kosovo. When we use service providers located outside the European Economic Area (EEA), we ensure appropriate safeguards are in place, including Standard Contractual Clauses (SCCs) approved by the European Commission or adequacy decisions where applicable. By using the Platform, you acknowledge that your data may be transferred to and processed in countries outside your country of residence under these safeguards.</p>

                    <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mt-8">8. How Long We Keep Your Data</h2>
                    <p>We retain your personal data only as long as necessary for the purposes described in this policy. Account and profile data are kept for the duration of your account activity plus 90 days after deletion. Membership records are retained for the duration of membership plus one year, or longer if required by organizational bylaws. Audit logs are retained for one year. Certificate records are kept indefinitely for verification and attestation purposes. Uploaded files are deleted upon account deletion or removal request, subject to any applicable legal holds. Communications logs are retained for two years.</p>

                    <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mt-8">9. Your Rights</h2>
                    <p>Under the GDPR, you have the following rights regarding your personal data. Most of these can be exercised directly through your account settings or by contacting us at <a href="mailto:info@flossk.org" class="text-primary hover:underline">info&#64;flossk.org</a>.</p>
                    <p><strong>Right of Access (Article 15).</strong> You can request a copy of all personal data we hold about you. You can export your data as a JSON file directly through the "Export My Data" option in your account privacy settings.</p>
                    <p><strong>Right to Rectification (Article 16).</strong> You can correct inaccurate or incomplete data at any time through your account settings. For membership-related data that cannot be self-edited, contact us and we will make the correction promptly.</p>
                    <p><strong>Right to Erasure (Article 17).</strong> You can delete your account and associated personal data using the "Delete Account" option in your account privacy settings. Upon deletion, your profile data, uploaded files, and account information will be permanently removed. Certain data may be retained where required by law, such as audit logs and certificate records needed for ongoing verification.</p>
                    <p><strong>Right to Restrict Processing (Article 18).</strong> You can request that we limit how we use your data when you contest its accuracy, when processing is unlawful, or when you have objected to processing based on legitimate interests.</p>
                    <p><strong>Right to Data Portability (Article 20).</strong> You can receive your personal data in a structured, machine-readable format (JSON) using the export feature in your account settings. You may also request that we transmit this data directly to another controller where technically feasible.</p>
                    <p><strong>Right to Object (Article 21).</strong> You can object to processing based on legitimate interests, including profiling. You may also object to direct marketing at any time.</p>
                    <p><strong>Right to Withdraw Consent.</strong> Where processing is based on your consent (such as push notifications), you may withdraw consent at any time without affecting the lawfulness of processing carried out before withdrawal.</p>
                    <p><strong>Right to Lodge a Complaint.</strong> If you believe we have violated your data protection rights, you may lodge a complaint with the relevant supervisory authority in your country of residence, place of work, or the place of the alleged infringement.</p>

                    <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mt-8">10. Cookies</h2>
                    <p>We use only essential cookies necessary for the operation of the Platform. An authentication token cookie is set to maintain your session (expires after 60 minutes, or 10 days if you select "Remember Me"). A theme preference cookie stores your dark or light mode selection. We do not use tracking cookies, advertising cookies, or third-party analytics cookies. You can control cookie settings through your browser preferences, but disabling essential cookies may affect Platform functionality.</p>

                    <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mt-8">11. Children</h2>
                    <p>The Platform is intended for users aged 16 and above. We do not knowingly collect personal data from children under 16 without verifiable parental consent. Membership applicants under 14 are required to provide guardian consent and a guardian signature as part of their application. If you believe a child has provided us with personal data without appropriate consent, please contact us and we will take steps to delete that information.</p>

                    <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mt-8">12. Security</h2>
                    <p>We implement a range of technical and organizational measures to protect your personal data. These include TLS encryption for all data in transit, PBKDF2 password hashing, JWT-based authentication with configurable token expiry, multi-factor authentication (TOTP and WebAuthn passkeys), role-based access control, ClamAV virus scanning for all file uploads, immutable audit logging of administrative actions, file type and size restrictions on uploads, and HMAC-SHA256 signatures on certificates. Access to personal data within our organization is restricted to authorized personnel on a need-to-know basis. Despite these measures, no method of electronic storage or transmission is completely secure, and we cannot guarantee absolute security.</p>

                    <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mt-8">13. Data Breach Notification</h2>
                    <p>In the event of a data breach that poses a risk to your rights and freedoms, we will notify the relevant supervisory authority within 72 hours as required by law. If the breach is likely to result in a high risk to your rights, we will also notify affected users without undue delay, providing information about the nature of the breach, its likely consequences, and the measures we have taken or propose to take.</p>

                    <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mt-8">14. Changes to This Policy</h2>
                    <p>We may update this Privacy Policy to reflect changes in our practices, legal requirements, or operational needs. Material changes will be communicated through Platform announcements and, where appropriate, by email. The "Last Updated" date at the top of this page indicates when the policy was last revised. Your continued use of the Platform after changes are posted constitutes acceptance of the updated policy.</p>

                    <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mt-8">15. Contact</h2>
                    <p>If you have questions, concerns, or requests regarding this Privacy Policy or our data processing practices, please contact us at <a href="mailto:info@flossk.org" class="text-primary hover:underline">info&#64;flossk.org</a> or by mail at FLOSSK, Prishtina, Republic of Kosovo. We will respond to your request within 30 days.</p>

                    <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mt-8">16. Governing Law</h2>
                    <p>This Privacy Policy is governed by the General Data Protection Regulation (GDPR) and the applicable laws of the Republic of Kosovo. Any disputes arising under this policy shall be subject to the jurisdiction of the courts of Prishtina, Kosovo.</p>
                </div>
            </div>
        </div>`
})
export class Privacy {}
