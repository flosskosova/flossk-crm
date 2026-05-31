import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TagModule } from 'primeng/tag';
import { environment } from '@environments/environment.prod';

interface CertificateVerification {
    status: string;
    eventName: string;
    description: string;
    recipientName: string;
    issuedDate: string;
    issuedByName: string;
    hmacSignature: string;
}

@Component({
    selector: 'app-verify-certificate',
    standalone: true,
    imports: [CommonModule, RouterModule, TagModule],
    template: `
        <div class="min-h-screen flex items-center justify-center p-6" style="background: linear-gradient(135deg, #1c1805 0%, #0a0900 100%);">
            <div class="w-full" style="max-width: 560px;">

                <!-- Loading -->
                @if (loading) {
                    <div class="flex flex-col items-center gap-4" style="color: #eacb2c;">
                        <i class="pi pi-spin pi-spinner" style="font-size: 2.5rem;"></i>
                        <span class="text-lg" style="color: #c9a800;">Verifying certificate...</span>
                    </div>
                }

                <!-- Not found / error -->
                @if (!loading && error) {
                    <div class="rounded-2xl overflow-hidden shadow-2xl" style="background:#181306; border: 1px solid rgba(234,203,44,0.12);">
                        <div class="flex flex-col items-center gap-3 p-10 text-center">
                            <div class="flex items-center justify-center w-20 h-20 rounded-full mb-2" style="background: rgba(239,68,68,0.15);">
                                <i class="pi pi-times-circle text-red-500" style="font-size: 2.5rem;"></i>
                            </div>
                            <h2 class="text-2xl font-bold text-white m-0">Invalid Certificate</h2>
                            <p class="m-0" style="color: #a89a6a;">This certificate could not be found or the verification link is invalid.</p>
                        </div>
                    </div>
                }

                <!-- Result -->
                @if (!loading && cert) {
                    <div class="rounded-2xl overflow-hidden shadow-2xl" style="background:#181306; border: 1px solid rgba(234,203,44,0.15);">

                        <!-- Header banner -->
                        <div class="flex flex-col items-center gap-2 px-8 py-8 text-center" style="background: linear-gradient(135deg, #c9a800 0%, #7a5e00 100%);">
                            <img src="assets/images/flossk_logo_dark_mode.png" alt="FLOSSK" style="height:48px; object-fit:contain;" onerror="this.style.display='none'" />
                            <h1 class="text-white font-bold m-0" style="font-size:1.4rem; letter-spacing:0.05em; text-shadow: 0 1px 3px rgba(0,0,0,0.4);">CERTIFICATE VERIFICATION</h1>
                        </div>

                        <!-- Status badge -->
                        <div class="flex justify-center pt-6 pb-2">
                            @if (cert.status === 'Issued') {
                                <div class="flex items-center gap-2 px-5 py-2 rounded-full" style="background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.4);">
                                    <i class="pi pi-verified text-green-400" style="font-size:1.2rem;"></i>
                                    <span class="text-green-400 font-semibold">Valid &amp; Authentic</span>
                                </div>
                            } @else {
                                <div class="flex items-center gap-2 px-5 py-2 rounded-full" style="background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.4);">
                                    <i class="pi pi-ban text-red-400" style="font-size:1.2rem;"></i>
                                    <span class="text-red-400 font-semibold">Revoked</span>
                                </div>
                            }
                        </div>

                        <!-- Certificate details -->
                        <div class="px-8 py-6 flex flex-col gap-5">

                            <div class="text-center">
                                <p class="text-sm m-0 mb-1" style="color: #a89a6a;">Awarded to</p>
                                <h2 class="text-white font-bold m-0" style="font-size:1.6rem;">{{ cert.recipientName }}</h2>
                            </div>

                            <div class="rounded-xl p-5 flex flex-col gap-4" style="background: rgba(234,203,44,0.06); border: 1px solid rgba(234,203,44,0.1);">
                                <div class="flex flex-col gap-1">
                                    <span class="text-xs uppercase tracking-widest" style="color: #c9a800;">Event / Program</span>
                                    <span class="text-white font-semibold">{{ cert.eventName }}</span>
                                </div>

                                @if (cert.description) {
                                    <div class="flex flex-col gap-1">
                                        <span class="text-xs uppercase tracking-widest" style="color: #c9a800;">Description</span>
                                        <span class="text-sm" style="color: #d4c48a;">{{ cert.description }}</span>
                                    </div>
                                }

                                <div class="flex flex-col sm:flex-row gap-4">
                                    <div class="flex flex-col gap-1 flex-1">
                                        <span class="text-xs uppercase tracking-widest" style="color: #c9a800;">Date Issued</span>
                                        <span class="text-white font-semibold">{{ cert.issuedDate | date:'MMMM d, y' }}</span>
                                    </div>
                                    <div class="flex flex-col gap-1 flex-1">
                                        <span class="text-xs uppercase tracking-widest" style="color: #c9a800;">Issued By</span>
                                        <span class="text-white font-semibold">{{ cert.issuedByName }}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- HMAC fingerprint -->
                            <div class="flex flex-col gap-1">
                                <span class="text-xs uppercase tracking-widest" style="color: #6b5600;">Verification Fingerprint</span>
                                <span class="font-mono text-xs break-all" style="color: #6b5600;">{{ cert.hmacSignature }}</span>
                            </div>
                        </div>

                        <!-- Footer -->
                        <div class="px-8 py-4 text-center" style="border-top: 1px solid rgba(234,203,44,0.1);">
                            <p class="text-xs m-0" style="color: #6b5600;">This certificate was issued by <strong style="color: #a89a6a;">FLOSSK</strong> — Free/Libre Open Source Software Kosova</p>
                        </div>
                    </div>
                }

            </div>
        </div>
    `
})
export class VerifyCertificate implements OnInit {
    loading = true;
    cert: CertificateVerification | null = null;
    error = false;

    constructor(private route: ActivatedRoute, private http: HttpClient) {}

    ngOnInit() {
        const token = this.route.snapshot.paramMap.get('token');
        if (!token) {
            this.error = true;
            this.loading = false;
            return;
        }

        this.http.get<CertificateVerification>(`${environment.apiUrl}/Certificates/verify/${token}`).subscribe({
            next: (data) => {
                this.cert = data;
                this.loading = false;
            },
            error: () => {
                this.error = true;
                this.loading = false;
            }
        });
    }
}
