import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '@/environments/environment';
import { CommonModule } from '@angular/common';

interface CertificateVerification {
    recipientName: string;
    eventName: string;
    description?: string;
    issuedDate: string;
    issuedByName: string;
    hmacSignature: string;
    status: string;
}

@Component({
    selector: 'app-verify-certificate',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
        <div class="verify-page">
            <div class="top-bar">
                <div class="top-bar-inner">
                    <a routerLink="/" class="top-bar-logo">
                        <img src="assets/images/flossk_logo_dark_mode.png" alt="">
                        FLOSSK
                    </a>
                    <span class="top-bar-tag">Verify</span>
                </div>
            </div>

            <div class="container">
                @if (loading) {
                    <div class="card loading-state">
                        <div class="loading-logo-wrap">
                            <img src="assets/images/flossk_logo_dark_mode.png" alt="FLOSSK" class="loading-logo">
                        </div>
                        <p class="loading-text">Checking credential</p>
                    </div>
                }

                @if (error) {
                    <div class="card error-state">
                        <div class="error-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="15" y1="9" x2="9" y2="15"/>
                                <line x1="9" y1="9" x2="15" y2="15"/>
                            </svg>
                        </div>
                        <h2 class="error-title">Certificate not found</h2>
                        <p class="error-desc">{{ errorMessage }}</p>
                        <a routerLink="/" class="error-link">Go to FLOSSK &rarr;</a>
                    </div>
                }

                @if (cert && !loading) {
                    <div class="card">
                        <div class="verified-section">
                            <div class="logo-mark">
                                <img src="assets/images/flossk_logo_dark_mode.png" alt="">
                                <span>FLOSSK &mdash; Kosovo</span>
                            </div>
                            <div class="verified-badge" [class.revoked]="cert.status === 'Revoked'">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="20 6 9 17 4 12"/>
                                </svg>
                                <span>{{ cert.status === 'Revoked' ? 'Revoked' : 'Verified' }}</span>
                            </div>
                            <h1 class="recipient-name">{{ cert.recipientName }}</h1>
                            <p class="recipient-label">Recipient</p>
                            <div class="hero-accent"></div>
                        </div>

                        <div class="credential-body">
                            <div class="credential-grid">
                                <div class="cred-field full">
                                    <span class="cred-label">Program</span>
                                    <span class="cred-value">{{ cert.eventName }}</span>
                                </div>

                                @if (cert.description) {
                                    <div class="cred-field full">
                                        <span class="cred-label">Description</span>
                                        <span class="description-text">{{ cert.description }}</span>
                                    </div>
                                }

                                <div class="cred-field">
                                    <span class="cred-label">Date Issued</span>
                                    <span class="cred-value" style="font-weight:500">{{ formatDate(cert.issuedDate) }}</span>
                                </div>

                                <div class="cred-field">
                                    <span class="cred-label">Issued By</span>
                                    <span class="cred-value" style="font-weight:500">{{ cert.issuedByName }}</span>
                                </div>

                                <div class="fingerprint-box">
                                    <p class="fp-label">Verification ID</p>
                                    <p class="fp-value">{{ cert.hmacSignature }}</p>
                                </div>
                            </div>
                        </div>

                        <div class="card-footer">
                            Free/Libre Open Source Software Kosova
                        </div>
                    </div>
                }
            </div>
        </div>
    `,
    styles: [`
        .verify-page {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            min-height: 100vh;
            background: #f8f7f4;
            color: #1a1a18;
        }
        .top-bar {
            padding: 0 2rem;
            height: 64px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-bottom: 1px solid #e8e6e1;
        }
        .top-bar-inner {
            width: 100%;
            max-width: 580px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .top-bar-logo {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 1rem;
            font-weight: 700;
            color: #1a1a18;
            letter-spacing: -0.02em;
            text-decoration: none;
        }
        .top-bar-logo img { height: 24px; width: auto; opacity: 0.8; }
        .top-bar-tag {
            font-size: 0.75rem;
            color: #9ca3af;
            font-weight: 500;
        }
        .container {
            max-width: 580px;
            margin: 0 auto;
            padding: 3.5rem 1.5rem;
        }
        .card {
            background: #ffffff;
            border-radius: 20px;
            overflow: hidden;
            animation: fadeUp 0.5s ease-out;
        }
        @keyframes fadeUp {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .loading-state {
            padding: 5rem 2rem;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1.5rem;
        }
        .loading-logo-wrap {
            position: relative;
            width: 180px;
            height: 90px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .loading-logo {
            width: 150px;
            height: auto;
            position: relative;
            z-index: 2;
            opacity: 0.5;
            animation: breathe 2.4s ease-in-out infinite;
        }
        @keyframes breathe {
            0%, 100% { opacity: 0.35; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(1.03); }
        }
        .loading-text { color: #9ca3af; font-size: 0.8rem; font-weight: 500; letter-spacing: 0.03em; }
        .error-state { padding: 4rem 2rem; text-align: center; }
        .error-icon {
            width: 48px; height: 48px;
            margin: 0 auto 1.25rem;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #dc2626;
            opacity: 0.7;
        }
        .error-icon svg { width: 24px; height: 24px; }
        .error-title { font-size: 1rem; font-weight: 700; color: #1a1a18; margin-bottom: 0.5rem; }
        .error-desc { font-size: 0.85rem; color: #9ca3af; line-height: 1.6; margin-bottom: 2rem; max-width: 320px; margin-left: auto; margin-right: auto; }
        .error-link {
            display: inline-flex;
            align-items: center;
            gap: 0.3rem;
            font-size: 0.85rem;
            font-weight: 600;
            color: #c9a800;
            text-decoration: none;
        }
        .error-link:hover { color: #9a7d00; }
        .verified-section {
            padding: 2.5rem 2.5rem 0;
            text-align: center;
        }
        .verified-section .logo-mark {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.4rem;
            margin-bottom: 1.5rem;
        }
        .verified-section .logo-mark img { height: 18px; width: auto; opacity: 0.35; }
        .verified-section .logo-mark span { font-size: 0.65rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: #d1d5db; }
        .verified-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.3rem 0.8rem 0.3rem 0.5rem;
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 100px;
            font-size: 0.7rem;
            font-weight: 600;
            color: #16a34a;
            margin-bottom: 1.5rem;
        }
        .verified-badge svg { width: 14px; height: 14px; }
        .verified-badge.revoked {
            background: #fef2f2;
            border-color: #fecaca;
            color: #dc2626;
        }
        .recipient-name {
            font-family: 'Outfit', sans-serif;
            font-size: 2.2rem;
            font-weight: 500;
            color: #1a1a18;
            line-height: 1.15;
            letter-spacing: -0.03em;
            margin-bottom: 0.35rem;
        }
        .recipient-label {
            font-size: 0.8rem;
            color: #9ca3af;
            font-weight: 500;
        }
        .hero-accent {
            width: 24px;
            height: 2px;
            background: #c9a800;
            margin: 1.25rem auto 0;
            border-radius: 1px;
        }
        .credential-body {
            padding: 1.75rem 2.5rem 2.5rem;
        }
        .credential-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
        }
        @media (max-width: 520px) {
            .credential-grid { grid-template-columns: 1fr; }
        }
        .cred-field {
            padding: 1rem;
            background: #f8f7f4;
            border-radius: 12px;
        }
        .cred-field.full { grid-column: 1 / -1; }
        .cred-label {
            display: block;
            font-size: 0.65rem;
            font-weight: 600;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            color: #9ca3af;
            margin-bottom: 0.35rem;
        }
        .cred-value {
            font-size: 0.95rem;
            font-weight: 600;
            color: #1a1a18;
            line-height: 1.4;
        }
        .description-text {
            font-size: 0.85rem;
            color: #6b7280;
            line-height: 1.5;
            margin-top: 0.15rem;
        }
        .fingerprint-box {
            grid-column: 1 / -1;
            margin-top: 0.5rem;
            padding: 0.75rem 1rem;
            background: #f8f7f4;
            border-radius: 12px;
        }
        .fp-label {
            font-size: 0.6rem;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #9ca3af;
            margin-bottom: 0.3rem;
        }
        .fp-value {
            font-family: 'SF Mono', 'Cascadia Code', 'JetBrains Mono', monospace;
            font-size: 0.65rem;
            color: #d1d5db;
            word-break: break-all;
            line-height: 1.5;
        }
        .card-footer {
            padding: 1.25rem 2.5rem;
            text-align: center;
            border-top: 1px solid #f0efeb;
            font-size: 0.7rem;
            color: #d1d5db;
            line-height: 1.5;
        }
        @media (max-width: 520px) {
            .container { padding: 1rem; }
            .verified-section { padding: 2rem 1.25rem 0; }
            .credential-body { padding: 1.25rem; }
            .recipient-name { font-size: 1.6rem; }
            .top-bar { padding: 0 1rem; }
        }
    `]
})
export class VerifyCertificate implements OnInit {
    cert: CertificateVerification | null = null;
    loading = true;
    error = false;
    errorMessage = 'This verification link is invalid or the certificate no longer exists.';

    constructor(
        private route: ActivatedRoute,
        private http: HttpClient
    ) {}

    ngOnInit() {
        const token = this.route.snapshot.paramMap.get('token');
        if (!token) {
            this.error = true;
            this.loading = false;
            return;
        }

        const start = Date.now();
        this.http.get<CertificateVerification>(`${environment.apiUrl}/Certificates/verify/${token}`).subscribe({
            next: (data) => {
                const elapsed = Date.now() - start;
                const delay = Math.max(0, 3000 - elapsed);
                setTimeout(() => {
                    this.cert = data;
                    this.loading = false;
                }, delay);
            },
            error: () => {
                const elapsed = Date.now() - start;
                const delay = Math.max(0, 3000 - elapsed);
                setTimeout(() => {
                    this.error = true;
                    this.loading = false;
                }, delay);
            }
        });
    }

    formatDate(s: string): string {
        if (!s) return '';
        const d = new Date(s);
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
}
