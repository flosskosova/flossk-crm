import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';

type IntegrationStatus = 'active' | 'dev-only' | 'prod-only' | 'planned' | 'inactive';
type IntegrationCategory = 'Email' | 'Security' | 'Infrastructure' | 'Database' | 'Frontend' | 'PDF & Documents' | 'Authentication' | 'Networking';

interface Integration {
    id: string;
    name: string;
    description: string;
    category: IntegrationCategory;
    status: IntegrationStatus;
    logoIcon?: string;           // PrimeIcons class
    logoText?: string;           // fallback 2-letter abbrev
    logoColor: string;           // hex bg
    usedFor: string[];
    environment?: string;        // e.g. "Development" | "Production" | "All"
    docsUrl?: string;
    version?: string;
    details?: string;
}

@Component({
    selector: 'app-integrations',
    standalone: true,
    imports: [CommonModule, FormsModule, TagModule, ButtonModule, DividerModule, TooltipModule, InputTextModule, IconField, InputIcon],
    styles: [`
        .integration-card {
            transition: transform 0.18s ease, box-shadow 0.18s ease;
            cursor: default;
        }
        .integration-card:hover {
            transform: translateY(-3px);
        }
        .logo-badge {
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 12px;
            font-weight: 700;
            font-size: 0.85rem;
            flex-shrink: 0;
        }
        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            display: inline-block;
            flex-shrink: 0;
        }
        .category-pill {
            border-radius: 9999px;
            padding: 0.2rem 0.8rem;
            font-size: 0.78rem;
            font-weight: 600;
            cursor: pointer;
            border: 2px solid transparent;
            transition: all 0.15s;
        }
        .used-for-chip {
            border-radius: 6px;
            padding: 0.15rem 0.5rem;
            font-size: 0.7rem;
            font-weight: 500;
        }
        .env-badge {
            border-radius: 4px;
            padding: 0.1rem 0.45rem;
            font-size: 0.68rem;
            font-weight: 700;
            letter-spacing: 0.04em;
            text-transform: uppercase;
        }
    `],
    template: `
    <div class="min-h-screen p-0">

        <!-- ── Header ── -->
        <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
                <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 m-0">Integrations</h1>
                <p class="text-muted-color mt-1">All external services and libraries wired into the FLOSSK platform</p>
            </div>
            <!-- Stats summary -->
            <div class="flex gap-3 flex-wrap">
                <div class="card mb-0 px-4 py-2 text-center min-w-20">
                    <div class="text-2xl font-bold text-green-500">{{ countByStatus('active') }}</div>
                    <div class="text-xs text-muted-color font-medium">Active</div>
                </div>
                <div class="card mb-0 px-4 py-2 text-center min-w-20">
                    <div class="text-2xl font-bold text-blue-500">{{ countByStatus('dev-only') + countByStatus('prod-only') }}</div>
                    <div class="text-xs text-muted-color font-medium">Env-scoped</div>
                </div>
                <div class="card mb-0 px-4 py-2 text-center min-w-20">
                    <div class="text-2xl font-bold text-yellow-500">{{ countByStatus('planned') }}</div>
                    <div class="text-xs text-muted-color font-medium">Planned</div>
                </div>
                <div class="card mb-0 px-4 py-2 text-center min-w-20">
                    <div class="text-2xl font-bold text-surface-400">{{ integrations.length }}</div>
                    <div class="text-xs text-muted-color font-medium">Total</div>
                </div>
            </div>
        </div>

        <!-- ── Filters row ── -->
        <div class="flex flex-wrap items-center gap-3 mb-6">
            <!-- Search -->
            <p-iconfield iconPosition="left" styleClass="flex-1 min-w-[200px] max-w-xs">
                <p-inputicon class="pi pi-search" />
                <input pInputText [(ngModel)]="searchQuery" placeholder="Search integrations..." class="w-full" />
            </p-iconfield>

            <!-- Category filters -->
            <div class="flex flex-wrap gap-2">
                <button *ngFor="let cat of allCategoryOptions"
                    class="category-pill"
                    [style.background]="activeCategory === cat ? getCategoryColor(cat) + '22' : 'var(--surface-100)'"
                    [style.color]="activeCategory === cat ? getCategoryColor(cat) : 'var(--text-color-secondary)'"
                    [style.borderColor]="activeCategory === cat ? getCategoryColor(cat) : 'transparent'"
                    (click)="activeCategory = cat">
                    {{ cat }}
                    <span class="ml-1 font-normal opacity-70"
                          *ngIf="cat !== 'All'">({{ countByCategory(cat) }})</span>
                </button>
            </div>

            <!-- Status filter -->
            <div class="flex gap-2 ml-auto">
                <button *ngFor="let s of statusFilters"
                    class="category-pill"
                    [style.background]="activeStatus === s.value ? s.color + '22' : 'var(--surface-100)'"
                    [style.color]="activeStatus === s.value ? s.color : 'var(--text-color-secondary)'"
                    [style.borderColor]="activeStatus === s.value ? s.color : 'transparent'"
                    (click)="activeStatus = s.value">
                    <span class="status-dot mr-1" [style.background]="s.color"></span>
                    {{ s.label }}
                </button>
            </div>
        </div>

        <!-- ── Cards grid (grouped by category) ── -->
        <ng-container *ngFor="let cat of visibleCategories">
            <div class="mb-8">
                <!-- Category heading -->
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-3 h-3 rounded-full" [style.background]="getCategoryColor(cat)"></div>
                    <span class="font-semibold text-lg text-surface-900 dark:text-surface-0">{{ cat }}</span>
                    <div class="flex-1 h-px bg-surface-200 dark:bg-surface-700"></div>
                    <span class="text-sm text-muted-color">{{ getFilteredByCategory(cat).length }} integration{{ getFilteredByCategory(cat).length !== 1 ? 's' : '' }}</span>
                </div>

                <!-- Cards -->
                <div class="grid grid-cols-12 gap-4">
                    <div *ngFor="let integration of getFilteredByCategory(cat)"
                         class="col-span-12 sm:col-span-6 xl:col-span-4">
                        <div class="card mb-0 integration-card h-full flex flex-col gap-3"
                             [class.opacity-60]="integration.status === 'inactive'"
                             [class.border-l-4]="true"
                             [style.border-left-color]="getStatusColor(integration.status)">

                            <!-- Top row: logo + name + status -->
                            <div class="flex items-start gap-3">
                                <!-- Logo -->
                                <div class="logo-badge" [style.background]="integration.logoColor + '22'">
                                    <i *ngIf="integration.logoIcon" [class]="integration.logoIcon + ' text-xl'"
                                       [style.color]="integration.logoColor"></i>
                                    <span *ngIf="!integration.logoIcon" [style.color]="integration.logoColor">
                                        {{ integration.logoText }}
                                    </span>
                                </div>

                                <!-- Name + category + env -->
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center gap-2 flex-wrap">
                                        <span class="font-bold text-surface-900 dark:text-surface-0 text-base leading-tight">{{ integration.name }}</span>
                                        <span *ngIf="integration.version" class="text-xs text-muted-color font-mono">v{{ integration.version }}</span>
                                    </div>
                                    <div class="flex items-center gap-2 mt-1 flex-wrap">
                                        <!-- Environment badge -->
                                        <span *ngIf="integration.environment"
                                              class="env-badge"
                                              [style.background]="getEnvColor(integration.environment) + '22'"
                                              [style.color]="getEnvColor(integration.environment)">
                                            {{ integration.environment }}
                                        </span>
                                        <!-- Status -->
                                        <div class="flex items-center gap-1">
                                            <span class="status-dot" [style.background]="getStatusColor(integration.status)"></span>
                                            <span class="text-xs font-medium" [style.color]="getStatusColor(integration.status)">
                                                {{ getStatusLabel(integration.status) }}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Description -->
                            <p class="text-sm text-muted-color m-0 leading-relaxed">{{ integration.description }}</p>

                            <!-- Extra details -->
                            <div *ngIf="integration.details" class="text-xs font-mono text-muted-color bg-surface-100 dark:bg-surface-800 rounded px-2 py-1">
                                {{ integration.details }}
                            </div>

                            <!-- Used-for chips -->
                            <div class="flex flex-wrap gap-1">
                                <span *ngFor="let use of integration.usedFor"
                                      class="used-for-chip bg-surface-100 dark:bg-surface-800 text-muted-color">
                                    {{ use }}
                                </span>
                            </div>

                            <!-- Footer: docs link -->
                            <div class="mt-auto pt-1 flex justify-end" *ngIf="integration.docsUrl">
                                <a [href]="integration.docsUrl" target="_blank" rel="noopener noreferrer"
                                   class="text-xs text-primary hover:underline flex items-center gap-1">
                                    <i class="pi pi-external-link text-xs"></i> Docs
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ng-container>

        <!-- Empty state -->
        <div *ngIf="visibleCategories.length === 0" class="card text-center py-16">
            <i class="pi pi-search text-5xl text-muted-color block mb-4"></i>
            <p class="text-muted-color text-lg">No integrations match your search.</p>
            <button class="mt-4 category-pill bg-primary text-white border-primary" (click)="resetFilters()">Clear filters</button>
        </div>

    </div>
    `
})
export class Integrations {
    searchQuery = '';
    activeCategory = 'All';
    activeStatus = 'all';

    statusFilters = [
        { label: 'All',       value: 'all',       color: '#6b7280' },
        { label: 'Active',    value: 'active',    color: '#22c55e' },
        { label: 'Env-scoped',value: 'env',       color: '#3b82f6' },
        { label: 'Planned',   value: 'planned',   color: '#f59e0b' },
    ];

    integrations: Integration[] = [
        // ── Email ──
        {
            id: 'gmail-smtp',
            name: 'Gmail SMTP',
            description: 'Sends transactional emails (password resets, notifications) via Google\'s SMTP relay using MailKit in the development environment.',
            category: 'Email',
            status: 'dev-only',
            logoIcon: 'pi pi-envelope',
            logoColor: '#EA4335',
            environment: 'Development',
            usedFor: ['Password resets', 'Member notifications', 'Email verification'],
            details: 'smtp.gmail.com:587 · STARTTLS',
            docsUrl: 'https://support.google.com/mail/answer/7126229',
            version: undefined
        },
        {
            id: 'resend',
            name: 'Resend',
            description: 'Production-grade transactional email API. Replaces SMTP in production for reliable, high-deliverability email delivery.',
            category: 'Email',
            status: 'prod-only',
            logoText: 'RS',
            logoColor: '#000000',
            environment: 'Production',
            usedFor: ['Password resets', 'Member notifications'],
            docsUrl: 'https://resend.com/docs',
            version: '0.2.1'
        },
        // ── Security ──
        {
            id: 'clamav',
            name: 'ClamAV',
            description: 'Open-source antivirus daemon that scans every uploaded file before it is stored. Runs as a sidecar Docker container and communicates over TCP.',
            category: 'Security',
            status: 'active',
            logoIcon: 'pi pi-shield',
            logoColor: '#ef4444',
            environment: 'All',
            usedFor: ['File upload scanning', 'Malware detection', 'Membership documents'],
            details: 'TCP socket · port 3310 · zPING health-check',
            docsUrl: 'https://docs.clamav.net'
        },
        // ── Authentication ──
        {
            id: 'jwt',
            name: 'JWT Bearer Auth',
            description: 'Stateless authentication via signed JSON Web Tokens using ASP.NET Core Identity. Tokens carry role claims used for role-based access control across all API endpoints.',
            category: 'Authentication',
            status: 'active',
            logoIcon: 'pi pi-lock',
            logoColor: '#8b5cf6',
            environment: 'All',
            usedFor: ['Login / logout', 'Role-based access', 'API authorization'],
            details: 'HS256 · configurable expiry',
            docsUrl: 'https://jwt.io/introduction',
            version: '8.3.1'
        },
        {
            id: 'aspnet-identity',
            name: 'ASP.NET Core Identity',
            description: 'Membership system powering user registration, password hashing, role management, and token generation for the FlosskMS platform.',
            category: 'Authentication',
            status: 'active',
            logoText: '.ID',
            logoColor: '#512BD4',
            environment: 'All',
            usedFor: ['User management', 'Password hashing', 'Role management'],
            docsUrl: 'https://learn.microsoft.com/aspnet/core/security/authentication/identity',
            version: '10.0'
        },
        // ── Database ──
        {
            id: 'postgres',
            name: 'PostgreSQL',
            description: 'Primary relational database for all platform data — members, projects, events, inventory, elections, certificates, and more.',
            category: 'Database',
            status: 'active',
            logoIcon: 'pi pi-database',
            logoColor: '#336791',
            environment: 'All',
            usedFor: ['All platform data', 'Member records', 'Event management'],
            details: 'postgres:16-alpine · EF Core + Npgsql',
            docsUrl: 'https://www.postgresql.org/docs',
            version: '16'
        },
        // ── Infrastructure ──
        {
            id: 'caddy',
            name: 'Caddy',
            description: 'Automatic HTTPS reverse proxy that terminates SSL and routes traffic to the Angular frontend and .NET API. Configured via a Caddyfile.',
            category: 'Networking',
            status: 'active',
            logoIcon: 'pi pi-globe',
            logoColor: '#00adb5',
            environment: 'Production',
            usedFor: ['HTTPS termination', 'Reverse proxy', 'Static file serving'],
            details: 'caddy:2-alpine · ports 80 & 443',
            docsUrl: 'https://caddyserver.com/docs',
            version: '2'
        },
        {
            id: 'docker',
            name: 'Docker',
            description: 'All services (API, frontend, DB, ClamAV, reverse proxy) are containerised and orchestrated via Docker Compose for both development and production.',
            category: 'Infrastructure',
            status: 'active',
            logoIcon: 'pi pi-box',
            logoColor: '#2496ED',
            environment: 'All',
            usedFor: ['Containerisation', 'Dev/prod parity', 'Service orchestration'],
            docsUrl: 'https://docs.docker.com'
        },
        {
            id: 'swagger',
            name: 'Swagger / OpenAPI',
            description: 'Auto-generated interactive API documentation powered by Swashbuckle. Includes Bearer authentication support for testing secured endpoints directly in the browser.',
            category: 'Infrastructure',
            status: 'active',
            logoText: 'SW',
            logoColor: '#85EA2D',
            environment: 'Development',
            usedFor: ['API documentation', 'Endpoint testing', 'Schema export'],
            docsUrl: 'https://swagger.io/docs',
            version: '6.9.0'
        },
        // ── PDF & Documents ──
        {
            id: 'questpdf',
            name: 'QuestPDF',
            description: 'Fluent .NET library used to generate pixel-perfect membership certificates as PDF files, with custom templates and dynamic member data baked in.',
            category: 'PDF & Documents',
            status: 'active',
            logoText: 'PDF',
            logoColor: '#f97316',
            environment: 'All',
            usedFor: ['Certificate generation', 'PDF exports'],
            docsUrl: 'https://www.questpdf.com/documentation',
            version: '2025.12.1'
        },
        {
            id: 'skiasharp',
            name: 'SkiaSharp',
            description: '2D graphics library (built on Google Skia) used for image rendering and compositing within certificate template generation.',
            category: 'PDF & Documents',
            status: 'active',
            logoText: 'SK',
            logoColor: '#a855f7',
            environment: 'All',
            usedFor: ['Image rendering', 'Certificate thumbnails'],
            docsUrl: 'https://github.com/mono/SkiaSharp',
            version: '3.119.2'
        },
        {
            id: 'openxml',
            name: 'DocumentFormat.OpenXml',
            description: 'Microsoft Open XML SDK enabling the application to read and write Office document formats (.docx, .xlsx) for data imports and report exports.',
            category: 'PDF & Documents',
            status: 'active',
            logoText: 'OX',
            logoColor: '#217346',
            environment: 'All',
            usedFor: ['Document imports', 'Report exports'],
            docsUrl: 'https://learn.microsoft.com/office/open-xml/open-xml-sdk',
            version: '3.5.1'
        },
        // ── Frontend ──
        {
            id: 'primeng',
            name: 'PrimeNG',
            description: 'Comprehensive UI component library for Angular providing tables, dialogs, charts, forms, menus and all core UI building blocks throughout the platform.',
            category: 'Frontend',
            status: 'active',
            logoIcon: 'pi pi-prime',
            logoColor: '#7B5BFF',
            environment: 'All',
            usedFor: ['UI components', 'Data tables', 'Forms', 'Charts'],
            docsUrl: 'https://primeng.org',
            version: '20'
        },
        {
            id: 'fullcalendar',
            name: 'FullCalendar',
            description: 'Feature-rich calendar library integrated into the dashboard for displaying project deadlines, events, and hackerspace bookings across day, week, and month views.',
            category: 'Frontend',
            status: 'active',
            logoIcon: 'pi pi-calendar',
            logoColor: '#3788d8',
            environment: 'All',
            usedFor: ['Event calendar', 'Project deadlines', 'Booking schedule'],
            docsUrl: 'https://fullcalendar.io/docs',
            version: '6.1.20'
        },
        {
            id: 'chartjs',
            name: 'Chart.js',
            description: 'Canvas-based charting library powering all analytics visualisations — doughnut charts, line graphs, bar charts, and pie charts across the dashboard.',
            category: 'Frontend',
            status: 'active',
            logoIcon: 'pi pi-chart-bar',
            logoColor: '#FF6384',
            environment: 'All',
            usedFor: ['Analytics charts', 'Finance graphs', 'Member stats'],
            docsUrl: 'https://www.chartjs.org/docs',
            version: '4.4.2'
        },
        {
            id: 'leaflet',
            name: 'Leaflet',
            description: 'Lightweight interactive maps library used in the Kosovo Map Widget to display hackerspace locations and member distribution across the country.',
            category: 'Frontend',
            status: 'active',
            logoIcon: 'pi pi-map',
            logoColor: '#199900',
            environment: 'All',
            usedFor: ['Kosovo map widget', 'Location display'],
            docsUrl: 'https://leafletjs.com/reference.html',
            version: '1.9.4'
        },
        {
            id: 'signature-pad',
            name: 'Signature Pad',
            description: 'Captures smooth hand-drawn digital signatures on canvas, used in the membership application form so applicants can sign their statement digitally.',
            category: 'Frontend',
            status: 'active',
            logoIcon: 'pi pi-pen-to-square',
            logoColor: '#14b8a6',
            environment: 'All',
            usedFor: ['Membership form signature', 'Digital consent'],
            docsUrl: 'https://github.com/szimek/signature_pad',
            version: '5.1.3'
        },
        // ── Planned ──
        {
            id: 'mattermost',
            name: 'Mattermost',
            description: 'Planned open-source messaging integration. Will allow automatic notifications (new member requests, project updates, election results) to be posted to FLOSSK team channels.',
            category: 'Infrastructure',
            status: 'planned',
            logoText: 'MM',
            logoColor: '#165eab',
            usedFor: ['Team notifications', 'Member alerts', 'Project updates'],
            docsUrl: 'https://developers.mattermost.com/integrate/webhooks/incoming'
        },
        {
            id: 'github',
            name: 'GitHub',
            description: 'Planned integration to link FLOSSK projects to their GitHub repositories — showing open issues, commit activity, and contributor data directly in the Projects dashboard.',
            category: 'Infrastructure',
            status: 'planned',
            logoIcon: 'pi pi-github',
            logoColor: '#24292e',
            usedFor: ['Project repos', 'Contribution tracking', 'Open issues'],
            docsUrl: 'https://docs.github.com/en/rest'
        },
    ];

    categories: IntegrationCategory[] = [
        'Email', 'Security', 'Authentication', 'Database', 'Networking',
        'Infrastructure', 'PDF & Documents', 'Frontend'
    ];

    get allCategoryOptions(): string[] {
        return ['All', ...this.categories];
    }

    get filteredIntegrations(): Integration[] {
        return this.integrations.filter(i => {
            const matchSearch = !this.searchQuery ||
                i.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                i.description.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                i.usedFor.some(u => u.toLowerCase().includes(this.searchQuery.toLowerCase()));

            const matchCategory = this.activeCategory === 'All' || i.category === this.activeCategory;

            const matchStatus = this.activeStatus === 'all' ||
                (this.activeStatus === 'active' && i.status === 'active') ||
                (this.activeStatus === 'env' && (i.status === 'dev-only' || i.status === 'prod-only')) ||
                (this.activeStatus === 'planned' && i.status === 'planned');

            return matchSearch && matchCategory && matchStatus;
        });
    }

    get visibleCategories(): string[] {
        const seen = new Set<string>();
        return this.filteredIntegrations
            .map(i => i.category)
            .filter(c => { if (seen.has(c)) return false; seen.add(c); return true; });
    }

    getFilteredByCategory(cat: string): Integration[] {
        return this.filteredIntegrations.filter(i => i.category === cat);
    }

    countByStatus(status: IntegrationStatus | string): number {
        return this.integrations.filter(i => i.status === status).length;
    }

    countByCategory(cat: string): number {
        return this.integrations.filter(i => i.category === cat).length;
    }

    getStatusColor(status: IntegrationStatus): string {
        const map: Record<IntegrationStatus, string> = {
            'active':    '#22c55e',
            'dev-only':  '#3b82f6',
            'prod-only': '#8b5cf6',
            'planned':   '#f59e0b',
            'inactive':  '#9ca3af'
        };
        return map[status];
    }

    getStatusLabel(status: IntegrationStatus): string {
        const map: Record<IntegrationStatus, string> = {
            'active':    'Active',
            'dev-only':  'Dev only',
            'prod-only': 'Prod only',
            'planned':   'Planned',
            'inactive':  'Inactive'
        };
        return map[status];
    }

    getCategoryColor(cat: string): string {
        const map: Record<string, string> = {
            'Email':            '#EA4335',
            'Security':         '#ef4444',
            'Authentication':   '#8b5cf6',
            'Database':         '#336791',
            'Networking':       '#00adb5',
            'Infrastructure':   '#2496ED',
            'PDF & Documents':  '#f97316',
            'Frontend':         '#7B5BFF',
            'All':              '#6b7280'
        };
        return map[cat] ?? '#6b7280';
    }

    getEnvColor(env: string): string {
        if (env === 'Development') return '#3b82f6';
        if (env === 'Production')  return '#8b5cf6';
        return '#22c55e';
    }

    resetFilters() {
        this.searchQuery = '';
        this.activeCategory = 'All';
        this.activeStatus = 'all';
    }
}

