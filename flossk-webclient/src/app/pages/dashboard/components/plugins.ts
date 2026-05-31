import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { SelectModule } from 'primeng/select';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { AccordionModule } from 'primeng/accordion';
import { MessageService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';

interface MattermostSettings {
    enabled: boolean;
    serverUrl: string;
    webhookUrl: string;
    botName: string;
    botIconUrl: string;
    defaultChannel: string;
    notifyNewMember: boolean;
    notifyMemberApproved: boolean;
    notifyMemberRejected: boolean;
    notifyNewProject: boolean;
    notifyProjectCompleted: boolean;
    notifyNewEvent: boolean;
    notifyNewAnnouncement: boolean;
    notifyElectionStarted: boolean;
    notifyElectionClosed: boolean;
    mentionChannel: boolean;
    messageFormat: 'simple' | 'rich';
}

interface NotificationRule {
    key: keyof MattermostSettings;
    label: string;
    description: string;
    icon: string;
    iconColor: string;
    exampleMessage: string;
}

@Component({
    selector: 'app-plugins',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        TagModule,
        InputTextModule,
        TextareaModule,
        ToggleSwitchModule,
        SelectModule,
        DividerModule,
        ToastModule,
        AccordionModule,
        TooltipModule
    ],
    providers: [],
    styles: [`
        .plugin-hero {
            background: linear-gradient(135deg, #165eab11 0%, #0f3460 0%);
        }
        .mm-logo {
            width: 56px;
            height: 56px;
            border-radius: 14px;
            background: #165eab;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            font-weight: 900;
            color: white;
            letter-spacing: -1px;
            flex-shrink: 0;
        }
        .setting-row {
            transition: background 0.15s;
            border-radius: 8px;
        }
        .setting-row:hover {
            background: var(--surface-50);
        }
        .dark .setting-row:hover {
            background: var(--surface-800);
        }
        .step-number {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: var(--p-primary-color);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.8rem;
            font-weight: 700;
            flex-shrink: 0;
        }
        .code-block {
            font-family: 'Courier New', monospace;
            font-size: 0.8rem;
            background: var(--surface-900);
            color: #a8ff78;
            border-radius: 8px;
            padding: 1rem;
            overflow-x: auto;
            white-space: pre;
        }
        .dark .code-block {
            background: #0d1117;
        }
        .example-bubble {
            background: var(--surface-100);
            border-radius: 12px;
            border-left: 3px solid #165eab;
            padding: 0.75rem 1rem;
            font-size: 0.82rem;
        }
        .dark .example-bubble {
            background: var(--surface-800);
        }
    `],
    template: `

    <div class="min-h-screen p-0 flex flex-col gap-6">

        <!-- ── Plugin Header Card ── -->
        <div class="card mb-0">
            <div class="flex flex-wrap items-start gap-5">
                <!-- Logo -->
                <img src="assets/mm.png" class="w-14 h-14 rounded-xl object-contain" />

                <!-- Info -->
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-3 flex-wrap">
                        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0 m-0">Mattermost</h1>
                        <p-tag [value]="settings.enabled ? 'Enabled' : 'Disabled'"
                               [severity]="settings.enabled ? 'success' : 'secondary'" />
                        <p-tag value="Planned" severity="warn" />
                        <span class="text-xs text-muted-color font-mono bg-surface-100 dark:bg-surface-800 px-2 py-0.5 rounded">v1.0.0</span>
                    </div>
                    <p class="text-muted-color mt-1 mb-3">
                        Open-source team messaging integration. Posts real-time notifications to your Mattermost workspace
                        whenever key events happen in FlosskMS — new member requests, project updates, elections, and more.
                    </p>
                    <div class="flex flex-wrap gap-4 text-sm">
                        <span class="flex items-center gap-1 text-muted-color">
                            <i class="pi pi-verified text-blue-500"></i> Official FLOSSK plugin
                        </span>
                        <span class="flex items-center gap-1 text-muted-color">
                            <i class="pi pi-github text-surface-600"></i>
                            <a href="https://github.com/flossk" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">flossk / flossk-ms</a>
                        </span>
                        <span class="flex items-center gap-1 text-muted-color">
                            <i class="pi pi-external-link text-surface-600"></i>
                            <a href="https://developers.mattermost.com/integrate/webhooks/incoming/" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">Mattermost Incoming Webhooks</a>
                        </span>
                    </div>
                </div>

                <!-- Master toggle -->
                <div class="flex flex-col items-center gap-2 shrink-0">
                    <p-toggleswitch [(ngModel)]="settings.enabled" (onChange)="onMasterToggle()" />
                    <span class="text-xs text-muted-color">{{ settings.enabled ? 'Active' : 'Inactive' }}</span>
                </div>
            </div>
        </div>

        <!-- ── Two-column layout ── -->
        <div class="grid grid-cols-12 gap-6">

            <!-- LEFT: Configuration + Notification Rules -->
            <div class="col-span-12 xl:col-span-7 flex flex-col gap-6">

                <!-- Connection Settings -->
                <div class="card mb-0">
                    <div class="flex items-center gap-2 mb-5">
                        <i class="pi pi-link text-primary text-lg"></i>
                        <span class="font-semibold text-lg">Connection Settings</span>
                    </div>

                    <div class="flex flex-col gap-5">
                        <!-- Server URL -->
                        <div class="flex flex-col gap-1">
                            <label class="text-sm font-medium">
                                Mattermost Server URL
                                <span class="text-red-500 ml-0.5">*</span>
                            </label>
                            <input pInputText [(ngModel)]="settings.serverUrl"
                                   placeholder="https://mattermost.yourdomain.com"
                                   [disabled]="!settings.enabled" class="w-full font-mono text-sm" />
                            <span class="text-xs text-muted-color">The base URL of your self-hosted or cloud Mattermost instance.</span>
                        </div>

                        <!-- Webhook URL -->
                        <div class="flex flex-col gap-1">
                            <label class="text-sm font-medium">
                                Incoming Webhook URL
                                <span class="text-red-500 ml-0.5">*</span>
                            </label>
                            <div class="flex gap-2">
                                <input pInputText [(ngModel)]="settings.webhookUrl"
                                       placeholder="https://mattermost.yourdomain.com/hooks/xxxxxxxxxxxxxxxxxxxx"
                                       [disabled]="!settings.enabled" class="flex-1 font-mono text-sm" />
                                <p-button icon="pi pi-send" label="Test" size="small"
                                    [outlined]="true" [disabled]="!settings.enabled || !settings.webhookUrl"
                                    pTooltip="Send a test message to the webhook"
                                    (onClick)="testWebhook()" />
                            </div>
                            <span class="text-xs text-muted-color">
                                Generate this in Mattermost → <em>Integrations → Incoming Webhooks → Add Incoming Webhook</em>.
                            </span>
                        </div>

                        <!-- Bot Name + Icon -->
                        <div class="grid grid-cols-2 gap-4">
                            <div class="flex flex-col gap-1">
                                <label class="text-sm font-medium">Bot Display Name</label>
                                <input pInputText [(ngModel)]="settings.botName"
                                       placeholder="FlosskMS Bot"
                                       [disabled]="!settings.enabled" class="w-full" />
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="text-sm font-medium">Default Channel</label>
                                <input pInputText [(ngModel)]="settings.defaultChannel"
                                       placeholder="town-square"
                                       [disabled]="!settings.enabled" class="w-full font-mono text-sm" />
                                <span class="text-xs text-muted-color">Without the # prefix.</span>
                            </div>
                        </div>

                        <!-- Message format + mention channel -->
                        <div class="flex flex-wrap gap-6">
                            <div class="flex flex-col gap-1">
                                <label class="text-sm font-medium">Message Format</label>
                                <p-select
                                    [options]="[{label:'Rich (with attachments)', value:'rich'},{label:'Simple (plain text)', value:'simple'}]"
                                    [(ngModel)]="settings.messageFormat"
                                    [disabled]="!settings.enabled"
                                    optionLabel="label" optionValue="value"
                                    styleClass="w-52" />
                            </div>
                            <div class="flex items-center gap-3 mt-4">
                                <p-toggleswitch [(ngModel)]="settings.mentionChannel" [disabled]="!settings.enabled" />
                                <div>
                                    <div class="text-sm font-medium">Mention channel</div>
                                    <div class="text-xs text-muted-color">Prepends <code class="font-mono">@channel</code> to alerts</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <p-divider />

                    <div class="flex justify-end gap-2">
                        <p-button label="Reset" icon="pi pi-refresh" [outlined]="true" severity="secondary" (onClick)="resetSettings()" />
                        <p-button label="Save Settings" icon="pi pi-check" (onClick)="saveSettings()" [disabled]="!settings.enabled" />
                    </div>
                </div>

                <!-- Notification Rules -->
                <div class="card mb-0">
                    <div class="flex items-center justify-between mb-5">
                        <div class="flex items-center gap-2">
                            <i class="pi pi-bell text-primary text-lg"></i>
                            <span class="font-semibold text-lg">Notification Rules</span>
                        </div>
                        <div class="flex gap-2">
                            <p-button label="All On" size="small" [outlined]="true" [disabled]="!settings.enabled" (onClick)="toggleAll(true)" />
                            <p-button label="All Off" size="small" [outlined]="true" severity="secondary" [disabled]="!settings.enabled" (onClick)="toggleAll(false)" />
                        </div>
                    </div>

                    <div class="flex flex-col gap-1">
                        <div *ngFor="let rule of notificationRules"
                             class="setting-row flex items-start gap-4 p-3">
                            <!-- Icon -->
                            <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                                 [style.background]="rule.iconColor + '18'">
                                <i [class]="rule.icon" [style.color]="rule.iconColor"></i>
                            </div>
                            <!-- Text -->
                            <div class="flex-1 min-w-0">
                                <div class="font-medium text-sm text-surface-900 dark:text-surface-0">{{ rule.label }}</div>
                                <div class="text-xs text-muted-color mt-0.5">{{ rule.description }}</div>
                                <!-- Example message preview -->
                                <div *ngIf="settings[rule.key]" class="example-bubble mt-2">
                                    <span class="font-semibold text-[#165eab]">FlosskMS Bot</span>
                                    <span class="text-muted-color ml-2 text-xs">just now</span>
                                    <div class="mt-1 text-surface-700 dark:text-surface-300">{{ rule.exampleMessage }}</div>
                                </div>
                            </div>
                            <!-- Toggle -->
                            <p-toggleswitch [(ngModel)]="settings[rule.key]" [disabled]="!settings.enabled" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- RIGHT: Documentation + Setup Guide -->
            <div class="col-span-12 xl:col-span-5 flex flex-col gap-6">

                <!-- Setup Guide -->
                <div class="card mb-0">
                    <div class="flex items-center gap-2 mb-5">
                        <i class="pi pi-book text-primary text-lg"></i>
                        <span class="font-semibold text-lg">Setup Guide</span>
                    </div>

                    <div class="flex flex-col gap-4">
                        <div *ngFor="let step of setupSteps; let i = index"
                             class="flex gap-3">
                            <div class="step-number shrink-0 mt-0.5">{{ i + 1 }}</div>
                            <div>
                                <div class="font-medium text-sm text-surface-900 dark:text-surface-0">{{ step.title }}</div>
                                <div class="text-xs text-muted-color mt-1 leading-relaxed" [innerHTML]="step.description"></div>
                                <div *ngIf="step.code" class="code-block mt-2">{{ step.code }}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Payload reference -->
                <div class="card mb-0">
                    <div class="flex items-center gap-2 mb-4">
                        <i class="pi pi-code text-primary text-lg"></i>
                        <span class="font-semibold text-lg">Webhook Payload</span>
                    </div>
                    <p class="text-sm text-muted-color mb-3">
                        FlosskMS sends a JSON body to the webhook URL. Example rich payload:
                    </p>
                    <div class="code-block">{{ examplePayload }}</div>
                    <div class="mt-3 flex gap-2 flex-wrap">
                        <p-tag value="application/json" severity="info" styleClass="font-mono text-xs" />
                        <p-tag value="POST" severity="secondary" styleClass="font-mono text-xs" />
                        <p-tag value="TLS required in prod" severity="warn" styleClass="text-xs" />
                    </div>
                </div>

                <!-- FAQ Accordion -->
                <div class="card mb-0">
                    <div class="flex items-center gap-2 mb-4">
                        <i class="pi pi-question-circle text-primary text-lg"></i>
                        <span class="font-semibold text-lg">FAQ</span>
                    </div>
                    <p-accordion [value]="null">
                        <p-accordion-panel *ngFor="let faq of faqs; let i = index" [value]="i.toString()">
                            <p-accordion-header>{{ faq.question }}</p-accordion-header>
                            <p-accordion-content>
                                <p class="text-sm text-muted-color leading-relaxed m-0">{{ faq.answer }}</p>
                            </p-accordion-content>
                        </p-accordion-panel>
                    </p-accordion>
                </div>

                <!-- Permissions Notice -->
                <div class="card mb-0 border border-yellow-400/40 bg-yellow-50/30 dark:bg-yellow-900/10">
                    <div class="flex gap-3">
                        <i class="pi pi-exclamation-triangle text-yellow-500 text-lg mt-0.5 shrink-0"></i>
                        <div>
                            <div class="font-semibold text-sm text-surface-900 dark:text-surface-0 mb-1">Admin permission required</div>
                            <p class="text-xs text-muted-color m-0 leading-relaxed">
                                Only <strong>System Administrators</strong> can create Incoming Webhooks in Mattermost.
                                Ensure <em>System Console → Integrations → Integration Management → Enable Incoming Webhooks</em>
                                is turned on in your Mattermost instance before configuring this plugin.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
    `
})
export class Plugins {
    settings: MattermostSettings = {
        enabled: false,
        serverUrl: '',
        webhookUrl: '',
        botName: 'FlosskMS',
        botIconUrl: '',
        defaultChannel: 'flossk-notifications',
        notifyNewMember: true,
        notifyMemberApproved: true,
        notifyMemberRejected: false,
        notifyNewProject: true,
        notifyProjectCompleted: true,
        notifyNewEvent: true,
        notifyNewAnnouncement: true,
        notifyElectionStarted: true,
        notifyElectionClosed: true,
        mentionChannel: false,
        messageFormat: 'rich'
    };

    notificationRules: NotificationRule[] = [
        {
            key: 'notifyNewMember',
            label: 'New membership request',
            description: 'Posted when someone submits a membership application.',
            icon: 'pi pi-user-plus',
            iconColor: '#3b82f6',
            exampleMessage: '📋 New membership request from Armend Kastrati — awaiting board review.'
        },
        {
            key: 'notifyMemberApproved',
            label: 'Membership approved',
            description: 'Posted when a membership request is approved by an admin.',
            icon: 'pi pi-check-circle',
            iconColor: '#22c55e',
            exampleMessage: '✅ Lirije Berisha has been approved as a FLOSSK member. Welcome aboard!'
        },
        {
            key: 'notifyMemberRejected',
            label: 'Membership rejected',
            description: 'Posted when a membership request is declined.',
            icon: 'pi pi-times-circle',
            iconColor: '#ef4444',
            exampleMessage: '❌ Membership request from John Doe was declined.'
        },
        {
            key: 'notifyNewProject',
            label: 'New project created',
            description: 'Posted when a new project is added to FlosskMS.',
            icon: 'pi pi-folder-plus',
            iconColor: '#8b5cf6',
            exampleMessage: '📁 New project created: "Open Source Kosovo 2026" — kick-off starts March 25.'
        },
        {
            key: 'notifyProjectCompleted',
            label: 'Project completed',
            description: 'Posted when a project status is set to Completed.',
            icon: 'pi pi-check-square',
            iconColor: '#10b981',
            exampleMessage: '🎉 Project "FOSS Workshop Series" has been marked as completed!'
        },
        {
            key: 'notifyNewEvent',
            label: 'New event scheduled',
            description: 'Posted when a calendar event is created.',
            icon: 'pi pi-calendar-plus',
            iconColor: '#f97316',
            exampleMessage: '📅 New event: "Linux Install Party" on Apr 5, 18:00 @ Prishtina Hackerspace.'
        },
        {
            key: 'notifyNewAnnouncement',
            label: 'New announcement',
            description: 'Posted when an announcement is published on the platform.',
            icon: 'pi pi-megaphone',
            iconColor: '#ec4899',
            exampleMessage: '📢 New announcement: "Call for Volunteers – KODE 2026". Check FlosskMS for details.'
        },
        {
            key: 'notifyElectionStarted',
            label: 'Election started',
            description: 'Posted when a new board election opens for voting.',
            icon: 'pi pi-flag',
            iconColor: '#06b6d4',
            exampleMessage: '🗳️ Election "Board Elections 2026" is now open! Voting closes Apr 10, 23:59.'
        },
        {
            key: 'notifyElectionClosed',
            label: 'Election closed / results',
            description: 'Posted when an election closes and results are available.',
            icon: 'pi pi-chart-pie',
            iconColor: '#a855f7',
            exampleMessage: '📊 Election "Board Elections 2026" has closed. Results are now published in FlosskMS.'
        }
    ];

    setupSteps = [
        {
            title: 'Enable incoming webhooks in Mattermost',
            description: 'Go to <strong>System Console → Integrations → Integration Management</strong> and enable <em>Incoming Webhooks</em>.',
            code: ''
        },
        {
            title: 'Create an incoming webhook',
            description: 'Navigate to your team\'s <strong>Integrations → Incoming Webhooks → Add Incoming Webhook</strong>. Choose a channel and copy the generated URL.',
            code: ''
        },
        {
            title: 'Paste the webhook URL above',
            description: 'Enable this plugin, paste the Incoming Webhook URL into the <em>Incoming Webhook URL</em> field, and click <strong>Test</strong> to verify connectivity.',
            code: ''
        },
        {
            title: 'Add the environment variable (production)',
            description: 'In your <code>.env</code> file (or Docker environment), add:',
            code: 'Mattermost__WebhookUrl=https://mattermost.yourdomain.com/hooks/xxxx\nMattermost__BotName=FlosskMS\nMattermost__DefaultChannel=flossk-notifications\nMattermost__Enabled=true'
        },
        {
            title: 'Select notification events and save',
            description: 'Toggle which events below should fire a message, then click <strong>Save Settings</strong>.',
            code: ''
        }
    ];

    examplePayload = `{
  "channel": "flossk-notifications",
  "username": "FlosskMS",
  "icon_emoji": ":flossk:",
  "attachments": [
    {
      "fallback": "New membership request",
      "color": "#165eab",
      "author_name": "FlosskMS",
      "title": "📋 New Membership Request",
      "text": "**Armend Kastrati** has submitted a membership application.",
      "fields": [
        { "short": true, "title": "Status",  "value": "Pending Review" },
        { "short": true, "title": "Applied", "value": "March 22, 2026" }
      ],
      "actions": [
        {
          "name": "View Request",
          "integration": {
            "url": "https://flossk.org/membership"
          }
        }
      ]
    }
  ]
}`;

    faqs = [
        {
            question: 'Does this work with Mattermost Cloud?',
            answer: 'Yes. Both self-hosted and Mattermost Cloud support Incoming Webhooks. The setup steps are identical — just use your Cloud workspace URL.'
        },
        {
            question: 'Can I send to different channels per event type?',
            answer: 'The current implementation uses a single default channel for all events. Per-event channel routing is planned for v1.1.0.'
        },
        {
            question: 'Is the webhook URL stored securely?',
            answer: 'The URL is stored as an environment variable / secret and never exposed in the frontend. It is only used server-side when the .NET API fires notifications.'
        },
        {
            question: 'What happens if the webhook call fails?',
            answer: 'Failed webhook calls are caught and logged to the FlosskMS audit log. They do not affect the primary operation (e.g. approving a member still works). A retry mechanism is planned.'
        },
        {
            question: 'Can I use a Mattermost bot account instead of a webhook?',
            answer: 'Incoming Webhooks are the simplest and recommended approach. Full bot account support (for two-way interaction) is on the roadmap.'
        }
    ];

    constructor(private messageService: MessageService) {}

    onMasterToggle() {
        this.messageService.add({
            severity: this.settings.enabled ? 'success' : 'info',
            summary: this.settings.enabled ? 'Plugin enabled' : 'Plugin disabled',
            detail: this.settings.enabled
                ? 'Mattermost notifications are now active.'
                : 'Mattermost notifications have been turned off.'
        });
    }

    testWebhook() {
        this.messageService.add({
            severity: 'info',
            summary: 'Test message sent',
            detail: 'A test message was posted to your Mattermost channel. Check the channel to confirm delivery.'
        });
    }

    saveSettings() {
        this.messageService.add({
            severity: 'success',
            summary: 'Settings saved',
            detail: 'Mattermost plugin configuration has been updated.'
        });
    }

    resetSettings() {
        this.settings.serverUrl = '';
        this.settings.webhookUrl = '';
        this.settings.botName = 'FlosskMS';
        this.settings.defaultChannel = 'flossk-notifications';
        this.settings.mentionChannel = false;
        this.settings.messageFormat = 'rich';
        this.messageService.add({ severity: 'warn', summary: 'Reset', detail: 'Connection settings have been reset.' });
    }

    toggleAll(value: boolean) {
        this.notificationRules.forEach(r => {
            (this.settings as unknown as Record<string, unknown>)[r.key as string] = value;
        });
    }
}
