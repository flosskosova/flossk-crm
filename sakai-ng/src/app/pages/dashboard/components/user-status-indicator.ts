import { Component, Input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';
import { PresenceService } from '@/pages/service/presence.service';

@Component({
    selector: 'user-status-indicator',
    standalone: true,
    imports: [CommonModule, TooltipModule],
    template: `
        <span
            class="user-status-dot"
            [ngClass]="dotClass()"
            [class.user-status-dot--sm]="size === 'sm'"
            [class.user-status-dot--md]="size === 'md'"
            [class.user-status-dot--lg]="size === 'lg'"
            [class.user-status-dot--xl]="size === 'xl'"
            [pTooltip]="tooltipText()"
            tooltipPosition="top"
        ></span>
    `,
    styles: [`
        :host { display: inline-block; }

        .user-status-dot {
            display: inline-block;
            border-radius: 50%;
            border: 2px solid var(--surface-card, #fff);
        }

        .user-status-dot--sm {
            width: 10px;
            height: 10px;
        }

        .user-status-dot--md {
            width: 14px;
            height: 14px;
        }

        .user-status-dot--lg {
            width: 18px;
            height: 18px;
        }

        .user-status-dot--xl {
            width: 40px;
            height: 40px;
            border-width: 3px;
        }

        .status-online {
            background-color: #22c55e;
        }

        .status-idle {
            background-color: #eab308;
        }

        .status-offline {
            background-color: #9ca3af;
        }
    `]
})
export class UserStatusIndicator {
    @Input({ required: true }) userId!: string;
    @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'sm';

    private presenceService = inject(PresenceService);

    presence = computed(() => this.presenceService.getPresence(this.userId));

    dotClass = computed(() => {
        const status = this.presence().status;
        return {
            'status-online': status === 'Online',
            'status-idle': status === 'Idle',
            'status-offline': status === 'Offline'
        };
    });

    tooltipText = computed(() => {
        const p = this.presence();
        if (p.status === 'Online') return 'Online';
        if (p.status === 'Idle') return 'Idle';
        if (p.lastActivityAt) {
            const date = new Date(p.lastActivityAt);
            return `Last seen: ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
        }
        return 'Offline';
    });
}
