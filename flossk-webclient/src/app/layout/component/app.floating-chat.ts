import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { AvatarModule } from 'primeng/avatar';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService, getInitials } from '@/pages/service/auth.service';

interface ChatMessage {
    text: string;
    sender: 'me' | 'other';
    time: Date;
}

@Component({
    selector: 'app-floating-chat',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, DialogModule, InputTextModule, AvatarModule, ScrollPanelModule, TooltipModule],
    styles: [`
        :host {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            z-index: 1100;
            display: block;
        }
        :host ::ng-deep .chat-dialog .p-dialog {
            border-radius: 1rem;
            overflow: hidden;
        }
        :host ::ng-deep .chat-dialog .p-dialog-header {
            padding: 1rem 1.25rem;
        }
        :host ::ng-deep .chat-dialog .p-dialog-content {
            padding: 0;
        }
        .chat-messages {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            padding: 1rem;
            height: 22rem;
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: var(--primary-color) transparent;
        }
        .chat-messages::-webkit-scrollbar {
            width: 4px;
        }
        .chat-messages::-webkit-scrollbar-track {
            background: transparent;
        }
        .chat-messages::-webkit-scrollbar-thumb {
            background-color: var(--primary-color);
            border-radius: 4px;
        }
        .chat-bubble {
            max-width: 75%;
            padding: 0.55rem 0.9rem;
            border-radius: 1rem;
            font-size: 0.875rem;
            line-height: 1.4;
        }
        .chat-bubble.me {
            align-self: flex-end;
            background: var(--primary-color);
            color: var(--primary-color-text);
            border-bottom-right-radius: 0.2rem;
        }
        .chat-bubble.other {
            align-self: flex-start;
            background: var(--surface-100);
            color: var(--text-color);
            border-bottom-left-radius: 0.2rem;
        }
        .chat-bubble .time {
            font-size: 0.7rem;
            opacity: 0.65;
            margin-top: 0.15rem;
            display: block;
            text-align: right;
        }
        .chat-input-area {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1rem;
            border-top: 1px solid var(--surface-border);
        }
        .chat-input-area input {
            flex: 1;
        }
    `],
    template: `
        <!-- Floating button -->
        <p-button
            icon="pi pi-comments"
            [rounded]="true"
            pTooltip="Chat"
            tooltipPosition="left"
            [style]="{ width: '3.5rem', height: '3.5rem', 'box-shadow': '0 4px 16px rgba(0,0,0,0.22)' }"
            (onClick)="open()"
        ></p-button>

        <!-- Chat dialog -->
        <p-dialog
            [(visible)]="visible"
            [modal]="false"
            [resizable]="false"
            [draggable]="true"
            [style]="{ width: '22rem', position: 'fixed', bottom: '6rem', right: '2rem' }"
            styleClass="chat-dialog"
            header="AI Chat"
            appendTo="body"
            (onHide)="visible = false"
        >
            <!-- Header extra content -->
            <ng-template #headericons>
                <p-avatar
                    [label]="getUserInitials()"
                    shape="circle"
                    size="normal"
                    [style]="{ 'background-color': 'var(--primary-color)', 'color': 'var(--primary-color-text)', 'font-size': '0.7rem' }"
                    class="mr-1"
                ></p-avatar>
            </ng-template>

            <!-- Messages area -->
            <div class="chat-messages" #messagesContainer>
                @if (messages().length === 0) {
                    <div class="flex flex-col items-center justify-center h-full text-muted-color">
                        <i class="pi pi-comments text-4xl mb-3 opacity-40"></i>
                        <span class="text-sm">No messages yet. Say hello!</span>
                    </div>
                }
                @for (msg of messages(); track $index) {
                    <div class="chat-bubble {{ msg.sender }}">
                        {{ msg.text }}
                        <span class="time">{{ msg.time | date:'HH:mm' }}</span>
                    </div>
                }
            </div>

            <!-- Input area -->
            <div class="chat-input-area">
                <input
                    pInputText
                    type="text"
                    [(ngModel)]="newMessage"
                    placeholder="Type a message..."
                    class="w-full"
                    (keydown.enter)="sendMessage()"
                />
                <p-button
                    icon="pi pi-send"
                    [rounded]="true"
                    [text]="true"
                    severity="primary"
                    (onClick)="sendMessage()"
                    [disabled]="!newMessage.trim()"
                ></p-button>
            </div>
        </p-dialog>
    `
})
export class AppFloatingChat {
    visible = false;
    newMessage = '';
    messages = signal<ChatMessage[]>([]);

    constructor(private authService: AuthService) {}

    open() {
        this.visible = true;
    }

    getUserInitials(): string {
        const user = this.authService.currentUser();
        return user ? getInitials(user.fullName ?? user.email ?? '') : '?';
    }

    sendMessage() {
        const text = this.newMessage.trim();
        if (!text) return;

        this.messages.update(msgs => [
            ...msgs,
            { text, sender: 'me', time: new Date() }
        ]);
        this.newMessage = '';
    }
}
