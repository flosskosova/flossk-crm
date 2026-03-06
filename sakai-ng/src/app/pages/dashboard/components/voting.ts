import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { DividerModule } from 'primeng/divider';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { DatePickerModule } from 'primeng/datepicker';
import { MultiSelectModule } from 'primeng/multiselect';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '@/pages/service/auth.service';
import { ElectionService, Election, ElectionSummary } from '@/pages/service/election.service';
import { environment } from '@environments/environment.prod';

@Component({
    selector: 'app-voting',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        CardModule,
        DialogModule,
        InputTextModule,
        TagModule,
        ProgressBarModule,
        DividerModule,
        ConfirmDialogModule,
        ToastModule,
        DatePickerModule,
        MultiSelectModule,
        SkeletonModule,
        TooltipModule
    ],
    providers: [ConfirmationService, MessageService],
    template: `
        <p-toast />
        <p-confirmDialog />

        <div class="flex flex-col">
            <!-- Page Header -->
            <div class="card">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h3 class="text-3xl font-bold text-surface-900 dark:text-surface-0 m-0 mb-2">Board Elections</h3>
                        <p class="text-surface-600 dark:text-surface-400 m-0">
                            Cast your vote for exactly 3 candidates. The top 3 most voted members will be promoted to Admin — the most voted will become the Leader.
                        </p>
                    </div>
                    <div class="flex gap-2" *ngIf="isAdmin">
                        <p-button label="New Election" icon="pi pi-plus" (onClick)="openCreateElectionDialog()" />
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h3 class="text-3xl font-bold text-surface-900 dark:text-surface-0 m-0 mb-2">Custom Election</h3>
                        <p class="text-surface-600 dark:text-surface-400 m-0">
                            Create a custom election of your choosing. Set your own rules.
                        </p>
                    </div>
                    <div class="flex gap-2" *ngIf="isAdmin">
                        <p-button label="New Election" icon="pi pi-plus" (onClick)="openCreateElectionDialog()" />
                    </div>
                </div>
            </div>

            <!-- Loading skeleton -->
            <div *ngIf="loading" class="card">
                <p-skeleton height="2rem" styleClass="mb-4" />
                <p-skeleton height="1rem" styleClass="mb-2" />
                <p-skeleton height="1rem" width="60%" />
            </div>

            <!-- Past Elections -->
            <div class="card" *ngIf="!loading && pastElections.length > 0">
                <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-4">Past Elections</h2>
                <div class="flex flex-col gap-3">
                    <div
                        *ngFor="let election of pastElections"
                        class="flex justify-between items-center p-4 bg-surface-50 dark:bg-surface-800 rounded-lg"
                    >
                        <div>
                            <div class="flex items-center gap-2 mb-1">
                                <h4 class="font-medium text-surface-900 dark:text-surface-0 m-0">{{ election.title }}</h4>
                                <p-tag *ngIf="election.isFinalized" value="Finalized" severity="secondary" />
                            </div>
                            <div class="flex items-center gap-4 text-sm text-surface-600 dark:text-surface-400">
                                <span>{{ election.endDate | date:'mediumDate' }}</span>
                                <span>{{ election.totalVotes }} votes</span>
                                <span>{{ election.candidateCount }} candidates</span>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <p-button
                                [label]="viewingPastElectionId === election.id ? 'Close Results' : 'View Results'"
                                [icon]="viewingPastElectionId === election.id ? 'pi pi-times' : 'pi pi-chart-bar'"
                                [outlined]="true"
                                size="small"
                                [loading]="loadingPastResults && viewingPastElectionId === election.id"
                                (onClick)="viewElectionResults(election)"
                            />
                            <p-button
                                *ngIf="isAdmin && !election.isFinalized"
                                icon="pi pi-trash"
                                [outlined]="true"
                                size="small"
                                severity="danger"
                                (onClick)="confirmDeleteElectionById(election.id)"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Past Election Inline Results -->
            <div class="card" *ngIf="viewingPastElection">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
                    <div class="flex items-center gap-3">
                        <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0 m-0">{{ viewingPastElection.title }}</h2>
                        <p-tag *ngIf="viewingPastElection.isFinalized" value="Finalized" severity="secondary" />
                    </div>
                    <span class="text-surface-600 dark:text-surface-400 text-sm">{{ viewingPastElection.totalVotes }} total votes &bull; Ended {{ viewingPastElection.endDate | date:'mediumDate' }}</span>
                </div>

                <div class="flex flex-wrap gap-3 mb-5">
                    <div class="flex items-center gap-2 text-sm">
                        <span class="inline-flex items-center justify-center bg-yellow-400 text-white rounded-full w-6 h-6 font-bold text-xs">1</span>
                        <span class="text-surface-700 dark:text-surface-300">Leader</span>
                    </div>
                    <div class="flex items-center gap-2 text-sm">
                        <span class="inline-flex items-center justify-center bg-primary text-white rounded-full w-6 h-6 font-bold text-xs">2</span>
                        <span class="text-surface-700 dark:text-surface-300">Admin</span>
                    </div>
                    <div class="flex items-center gap-2 text-sm">
                        <span class="inline-flex items-center justify-center bg-primary text-white rounded-full w-6 h-6 font-bold text-xs">3</span>
                        <span class="text-surface-700 dark:text-surface-300">Admin</span>
                    </div>
                </div>

                <div class="flex flex-col gap-3">
                    <ng-container *ngFor="let notice of getTieNotices(viewingPastElection)">
                        <div
                            class="flex items-center gap-3 rounded-lg px-4 py-3 border mb-1"
                            [class.bg-yellow-50]="notice.severity === 'warn'"
                            [class.dark:bg-yellow-900\/10]="notice.severity === 'warn'"
                            [class.border-yellow-300]="notice.severity === 'warn'"
                            [class.bg-blue-50]="notice.severity === 'info'"
                            [class.dark:bg-blue-900\/10]="notice.severity === 'info'"
                            [class.border-blue-200]="notice.severity === 'info'"
                        >
                            <i class="pi text-lg"
                                [class.pi-exclamation-triangle]="notice.severity === 'warn'"
                                [class.text-yellow-500]="notice.severity === 'warn'"
                                [class.pi-info-circle]="notice.severity === 'info'"
                                [class.text-blue-500]="notice.severity === 'info'"
                            ></i>
                            <span class="text-sm font-medium"
                                [class.text-yellow-800]="notice.severity === 'warn'"
                                [class.text-blue-800]="notice.severity === 'info'"
                            >{{ notice.message }}</span>
                        </div>
                    </ng-container>
                    <div
                        *ngFor="let candidate of viewingPastElection.candidates; let i = index"
                        class="flex items-center gap-4 rounded-xl p-4"
                        [class.bg-yellow-50]="i === 0"
                        [class.dark:bg-yellow-900\/10]="i === 0"
                        [class.border]="i < 3"
                        [class.border-yellow-300]="i === 0"
                        [class.border-primary-200]="i === 1 || i === 2"
                        [class.bg-primary-50]="i === 1 || i === 2"
                        [class.dark:bg-primary-900\/10]="i === 1 || i === 2"
                        [class.bg-surface-50]="i >= 3"
                        [class.dark:bg-surface-800]="i >= 3"
                    >
                        <div class="shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                            [class.bg-yellow-400]="i === 0"
                            [class.text-white]="i < 3"
                            [class.bg-primary]="i === 1 || i === 2"
                            [class.bg-surface-200]="i >= 3"
                            [class.dark:bg-surface-700]="i >= 3"
                            [class.text-surface-600]="i >= 3"
                        >{{ i + 1 }}</div>
                        <div class="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary font-bold text-sm shrink-0 select-none">
                            {{ getInitials(candidate.fullName) }}
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center justify-between mb-1">
                                <div class="flex items-center gap-2">
                                    <span class="font-medium text-surface-900 dark:text-surface-0">{{ candidate.fullName }}</span>
                                    <p-tag *ngIf="i === 0 && viewingPastElection.isFinalized" value="Leader" severity="warn" />
                                    <p-tag *ngIf="(i === 1 || i === 2) && viewingPastElection.isFinalized" value="Admin" severity="info" />
                                </div>
                                <span class="font-semibold text-primary text-sm whitespace-nowrap">
                                    {{ candidate.votes }} votes ({{ getVotePercentage(candidate.votes, viewingPastElection) }}%)
                                </span>
                            </div>
                            <p-progressbar [value]="getVotePercentage(candidate.votes, viewingPastElection)" [showValue]="false" styleClass="h-2" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Active / Upcoming Election -->
            <div *ngIf="!loading && activeElection" class="card">
                <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                    <div>
                        <div class="flex items-center gap-3 mb-2">
                            <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0 m-0">{{ activeElection.title }}</h2>
                            <p-tag [value]="activeElection.status" [severity]="getStatusSeverity(activeElection.status)" />
                            <p-tag *ngIf="activeElection.isFinalized" value="Finalized" severity="secondary" />
                        </div>
                        <p class="text-surface-600 dark:text-surface-400 m-0">{{ activeElection.description }}</p>
                    </div>
                    <div class="flex flex-col items-end gap-3">
                        <div class="flex items-center gap-6 text-sm text-surface-600 dark:text-surface-400">
                            <div class="flex items-center gap-2">
                                <i class="pi pi-calendar"></i>
                                <span>Ends {{ activeElection.endDate | date:'medium' }}</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <i class="pi pi-users"></i>
                                <span>{{ activeElection.totalVotes }} votes cast</span>
                            </div>
                        </div>
                        <!-- Admin actions -->
                        <div class="flex gap-2" *ngIf="isAdmin && !activeElection.isFinalized">
                            <p-button
                                icon="pi pi-pencil"
                                [outlined]="true"
                                size="small"
                                severity="secondary"
                                pTooltip="Edit election"
                                (onClick)="openEditElectionDialog(activeElection)"
                            />
                            <p-button
                                icon="pi pi-trash"
                                [outlined]="true"
                                size="small"
                                severity="danger"
                                pTooltip="Delete election"
                                (onClick)="confirmDeleteElection(activeElection)"
                            />
                        </div>
                    </div>
                </div>

                <!-- Upcoming — not started yet -->
                <div *ngIf="activeElection.status === 'upcoming'" class="text-center py-10">
                    <i class="pi pi-clock text-primary text-5xl mb-4 block"></i>
                    <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-2">Election Starting Soon</h3>
                    <p class="text-surface-600 dark:text-surface-400">
                        Voting opens on {{ activeElection.startDate | date:'medium' }}.
                        There are {{ activeElection.candidates.length }} candidates.
                    </p>
                </div>

                <!-- Voting Interface -->
                <div *ngIf="activeElection.status === 'active' && !activeElection.hasVoted">
                    <div class="flex items-center justify-between mb-5">
                        <p class="text-surface-600 dark:text-surface-400 m-0">Select exactly 3 candidates you want to support.</p>
                        <span class="text-sm font-semibold" [class.text-primary]="selectedCandidates.length === 3" [class.text-surface-500]="selectedCandidates.length !== 3">
                            {{ selectedCandidates.length }} / 3 selected
                        </span>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div
                            *ngFor="let candidate of activeElection.candidates"
                            class="border rounded-xl p-5 transition-all duration-200"
                            [class.cursor-pointer]="!isSelf(candidate.userId) && (isSelected(candidate.userId) || selectedCandidates.length < 3)"
                            [class.cursor-not-allowed]="isSelf(candidate.userId)"
                            [class.opacity-40]="isSelf(candidate.userId)"
                            [class.border-primary]="isSelected(candidate.userId)"
                            [class.border-2]="isSelected(candidate.userId)"
                            [class.bg-primary-50]="isSelected(candidate.userId)"
                            [class.dark:bg-primary-900\/20]="isSelected(candidate.userId)"
                            [class.border-surface-200]="!isSelected(candidate.userId) && !isSelf(candidate.userId)"
                            [class.dark:border-surface-700]="!isSelected(candidate.userId) && !isSelf(candidate.userId)"
                            [class.border-surface-200]="isSelf(candidate.userId)"
                            [class.opacity-60]="!isSelected(candidate.userId) && selectedCandidates.length === 3 && !isSelf(candidate.userId)"
                            (click)="toggleCandidate(candidate.userId)"
                        >
                            <div class="flex items-start gap-4">
                                <div class="relative shrink-0">
                                    <div class="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary font-bold text-xl select-none">
                                        {{ getInitials(candidate.fullName) }}
                                    </div>
                                    <div
                                        *ngIf="isSelected(candidate.userId)"
                                        class="absolute -top-1 -right-1 bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center"
                                    >
                                        <i class="pi pi-check text-xs"></i>
                                    </div>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center gap-2 mb-1">
                                        <h4 class="font-semibold text-surface-900 dark:text-surface-0 m-0">{{ candidate.fullName }}</h4>
                                        <p-tag *ngIf="isSelf(candidate.userId)" value="You" severity="secondary" />
                                    </div>
                                    <p class="text-sm text-surface-600 dark:text-surface-400 line-clamp-3 m-0">{{ candidate.biography || 'No biography provided.' }}</p>
                                    <p *ngIf="isSelf(candidate.userId)" class="text-xs text-surface-400 mt-1 m-0">You cannot vote for yourself.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="flex justify-end mt-6">
                        <p-button
                            label="Submit Votes"
                            icon="pi pi-check"
                            severity="success"
                            [loading]="submittingVote"
                            [disabled]="selectedCandidates.length !== 3"
                            (onClick)="submitVote()"
                        />
                    </div>
                </div>

                <!-- Already Voted -->
                <div *ngIf="activeElection.status === 'active' && activeElection.hasVoted" class="text-center py-10">
                    <i class="pi pi-check-circle text-green-500 text-5xl mb-4 block"></i>
                    <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-2">Thank You for Voting!</h3>
                    <p class="text-surface-600 dark:text-surface-400">
                        Your vote has been recorded. Results will be announced when the election period ends.
                    </p>
                </div>

                <!-- Results (finalized or admin live view) -->
                <div *ngIf="activeElection.isFinalized || showResults">
                    <p-divider *ngIf="activeElection.hasVoted || activeElection.status === 'active'" />
                    <div class="mt-4">
                        <div class="flex justify-between items-center mb-5">
                            <div class="flex items-center gap-3">
                                <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 m-0">
                                    {{ activeElection.isFinalized ? 'Final Results' : 'Live Results' }}
                                </h3>
                                <span *ngIf="activeElection.isFinalized" class="text-xs text-surface-500 dark:text-surface-400">
                                    Finalized {{ activeElection.finalizedAt | date:'medium' }}
                                </span>
                            </div>
                            <span class="text-surface-600 dark:text-surface-400 text-sm">{{ activeElection.totalVotes }} total votes</span>
                        </div>

                        <div class="flex flex-wrap gap-3 mb-6">
                            <div class="flex items-center gap-2 text-sm">
                                <span class="inline-flex items-center justify-center bg-yellow-400 text-white rounded-full w-6 h-6 font-bold text-xs">1</span>
                                <span class="text-surface-700 dark:text-surface-300">Leader</span>
                            </div>
                            <div class="flex items-center gap-2 text-sm">
                                <span class="inline-flex items-center justify-center bg-primary text-white rounded-full w-6 h-6 font-bold text-xs">2</span>
                                <span class="text-surface-700 dark:text-surface-300">Admin</span>
                            </div>
                            <div class="flex items-center gap-2 text-sm">
                                <span class="inline-flex items-center justify-center bg-primary text-white rounded-full w-6 h-6 font-bold text-xs">3</span>
                                <span class="text-surface-700 dark:text-surface-300">Admin</span>
                            </div>
                        </div>

                        <div class="flex flex-col gap-3">
                            <!-- Tie notices -->
                            <ng-container *ngFor="let notice of getTieNotices()">
                                <div
                                    class="flex items-center gap-3 rounded-lg px-4 py-3 border mb-1"
                                    [class.bg-yellow-50]="notice.severity === 'warn'"
                                    [class.dark:bg-yellow-900\/10]="notice.severity === 'warn'"
                                    [class.border-yellow-300]="notice.severity === 'warn'"
                                    [class.bg-blue-50]="notice.severity === 'info'"
                                    [class.dark:bg-blue-900\/10]="notice.severity === 'info'"
                                    [class.border-blue-200]="notice.severity === 'info'"
                                >
                                    <i class="pi text-lg"
                                        [class.pi-exclamation-triangle]="notice.severity === 'warn'"
                                        [class.text-yellow-500]="notice.severity === 'warn'"
                                        [class.pi-info-circle]="notice.severity === 'info'"
                                        [class.text-blue-500]="notice.severity === 'info'"
                                    ></i>
                                    <span class="text-sm font-medium"
                                        [class.text-yellow-800]="notice.severity === 'warn'"
                                        [class.text-blue-800]="notice.severity === 'info'"
                                    >{{ notice.message }}</span>
                                </div>
                            </ng-container>
                            <div
                                *ngFor="let candidate of activeElection.candidates; let i = index"
                                class="flex items-center gap-4 rounded-xl p-4"
                                [class.bg-yellow-50]="i === 0"
                                [class.dark:bg-yellow-900\/10]="i === 0"
                                [class.border]="i < 3"
                                [class.border-yellow-300]="i === 0"
                                [class.border-primary-200]="i === 1 || i === 2"
                                [class.bg-primary-50]="i === 1 || i === 2"
                                [class.dark:bg-primary-900\/10]="i === 1 || i === 2"
                                [class.bg-surface-50]="i >= 3"
                                [class.dark:bg-surface-800]="i >= 3"
                            >
                                <div class="shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                                    [class.bg-yellow-400]="i === 0"
                                    [class.text-white]="i < 3"
                                    [class.bg-primary]="i === 1 || i === 2"
                                    [class.bg-surface-200]="i >= 3"
                                    [class.dark:bg-surface-700]="i >= 3"
                                    [class.text-surface-600]="i >= 3"
                                >{{ i + 1 }}</div>

                                <div class="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary font-bold text-sm shrink-0 select-none">
                                    {{ getInitials(candidate.fullName) }}
                                </div>

                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center justify-between mb-1">
                                        <div class="flex items-center gap-2">
                                            <span class="font-medium text-surface-900 dark:text-surface-0">{{ candidate.fullName }}</span>
                                            <p-tag *ngIf="i === 0 && activeElection.isFinalized" value="Leader" severity="warn" />
                                            <p-tag *ngIf="(i === 1 || i === 2) && activeElection.isFinalized" value="Admin" severity="info" />
                                        </div>
                                        <span class="font-semibold text-primary text-sm whitespace-nowrap">
                                            {{ candidate.votes }} votes ({{ getVotePercentage(candidate.votes) }}%)
                                        </span>
                                    </div>
                                    <p-progressbar [value]="getVotePercentage(candidate.votes)" [showValue]="false" styleClass="h-2" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Live results toggle (active, not yet finalized) -->
                <div *ngIf="activeElection.status === 'active' && !activeElection.isFinalized" class="mt-6 text-center">
                    <p-button
                        [label]="showResults ? 'Hide Live Results' : 'View Live Results'"
                        icon="pi pi-chart-bar"
                        [outlined]="true"
                        size="small"
                        (onClick)="showResults = !showResults"
                    />
                </div>
            </div>

            <!-- No active/upcoming election -->
            <div *ngIf="!loading && !activeElection" class="card text-center py-12">
                <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-2">No Active Elections</h3>
                <p class="text-surface-600 dark:text-surface-400 mb-6">There are currently no elections in progress.</p>
            </div>

        </div>

        <!-- Create Election Dialog -->
        <p-dialog
            [(visible)]="createElectionDialog"
            header="Create Election"
            [modal]="true"
            [style]="{width: '32rem'}"
            (onHide)="resetElectionForm()"
        >
            <div class="flex flex-col gap-4">
                <div>
                    <label class="block font-medium text-surface-900 dark:text-surface-0 mb-2">Title</label>
                    <div class="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-md bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-200 font-semibold">
                        {{ electionForm.title }}
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block font-medium text-surface-900 dark:text-surface-0 mb-2">Start Date</label>
                        <p-datepicker
                            [(ngModel)]="electionForm.startDate"
                            [showTime]="true" [showIcon]="true" [showButtonBar]="true"
                            dateFormat="dd/mm/yy" hourFormat="24"
                            [minDate]="today"
                            placeholder="Select start date"
                            appendTo="body" styleClass="w-full"
                        />
                    </div>
                    <div>
                        <label class="block font-medium text-surface-900 dark:text-surface-0 mb-2">End Date</label>
                        <p-datepicker
                            [(ngModel)]="electionForm.endDate"
                            [showTime]="true" [showIcon]="true" [showButtonBar]="true"
                            dateFormat="dd/mm/yy" hourFormat="24"
                            [minDate]="electionForm.startDate"
                            placeholder="Select end date"
                            appendTo="body" styleClass="w-full"
                        />
                    </div>
                </div>
                <div>
                    <label class="block font-medium text-surface-900 dark:text-surface-0 mb-2">Candidates</label>
                    <p-multiselect
                        [(ngModel)]="selectedCandidateIds"
                        [options]="fullMemberOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Select Full Members as candidates"
                        [loading]="loadingFullMembers"
                        [filter]="true"
                        filterPlaceholder="Search members..."
                        appendTo="body" styleClass="w-full"
                    />
                    <small class="text-surface-500 mt-1 block">Minimum 4 candidates required.</small>
                </div>
            </div>
            <div class="flex justify-end gap-2 mt-6">
                <p-button label="Cancel" [outlined]="true" (onClick)="createElectionDialog = false" />
                <p-button
                    label="Create"
                    [loading]="savingElection"
                    [disabled]="!electionForm.startDate || !electionForm.endDate || selectedCandidateIds.length < 4"
                    (onClick)="createElection()"
                />
            </div>
        </p-dialog>

        <!-- Edit Election Dialog -->
        <p-dialog
            [(visible)]="editElectionDialog"
            [header]="editingElectionVotingStarted ? 'Edit Election (Voting In Progress)' : 'Edit Election'"
            [modal]="true"
            [style]="{width: '32rem'}"
            (onHide)="resetElectionForm()"
        >
            <div class="flex flex-col gap-4">
                <!-- Voting-started notice -->
                <div *ngIf="editingElectionVotingStarted" class="flex items-center gap-3 rounded-lg px-4 py-3 border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/10">
                    <i class="pi pi-lock text-yellow-500"></i>
                    <span class="text-sm text-yellow-800 dark:text-yellow-200">Voting has started. Only the end date can be changed.</span>
                </div>

                <!-- Start date: hidden once voting started -->
                <div *ngIf="!editingElectionVotingStarted" class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block font-medium text-surface-900 dark:text-surface-0 mb-2">Start Date</label>
                        <p-datepicker
                            [(ngModel)]="electionForm.startDate"
                            [showTime]="true" [showIcon]="true" [showButtonBar]="true"
                            dateFormat="dd/mm/yy" hourFormat="24"
                            placeholder="Select start date"
                            appendTo="body" styleClass="w-full"
                        />
                    </div>
                    <div>
                        <label class="block font-medium text-surface-900 dark:text-surface-0 mb-2">End Date</label>
                        <p-datepicker
                            [(ngModel)]="electionForm.endDate"
                            [showTime]="true" [showIcon]="true" [showButtonBar]="true"
                            dateFormat="dd/mm/yy" hourFormat="24"
                            [minDate]="electionForm.startDate"
                            placeholder="Select end date"
                            appendTo="body" styleClass="w-full"
                        />
                    </div>
                </div>

                <!-- End date only: shown when voting has started -->
                <div *ngIf="editingElectionVotingStarted">
                    <label class="block font-medium text-surface-900 dark:text-surface-0 mb-2">End Date</label>
                    <p-datepicker
                        [(ngModel)]="electionForm.endDate"
                        [showTime]="true" [showIcon]="true" [showButtonBar]="true"
                        dateFormat="dd/mm/yy" hourFormat="24"
                        [minDate]="today"
                        placeholder="Select end date"
                        appendTo="body" styleClass="w-full"
                    />
                </div>

                <!-- Candidates: hidden once voting started -->
                <div *ngIf="!editingElectionVotingStarted">
                    <label class="block font-medium text-surface-900 dark:text-surface-0 mb-2">Candidates</label>
                    <p-multiselect
                        [(ngModel)]="selectedCandidateIds"
                        [options]="fullMemberOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Select Full Members as candidates"
                        [loading]="loadingFullMembers"
                        [filter]="true"
                        filterPlaceholder="Search members..."
                        appendTo="body" styleClass="w-full"
                    />
                    <small class="text-surface-500 mt-1 block">Minimum 4 candidates required. Note: editing is blocked once voting has started.</small>
                </div>
            </div>
            <div class="flex justify-end gap-2 mt-6">
                <p-button label="Cancel" [outlined]="true" (onClick)="editElectionDialog = false" />
                <p-button
                    label="Save Changes"
                    [loading]="savingElection"
                    [disabled]="!electionForm.endDate || (!editingElectionVotingStarted && (!electionForm.startDate || selectedCandidateIds.length < 4))"
                    (onClick)="updateElection()"
                />
            </div>
        </p-dialog>
    `
})
export class Voting implements OnInit {
    private authService = inject(AuthService);
    private electionService = inject(ElectionService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);
    private http = inject(HttpClient);

    isAdmin = false;
    loading = false;
    submittingVote = false;
    savingElection = false;
    showResults = false;
    viewingPastElectionId = '';
    viewingPastElection: Election | null = null;
    loadingPastResults = false;
    selectedCandidates: string[] = [];
    currentUserId = '';
    today = new Date();
    currentYear = new Date().getFullYear();

    activeElection: Election | null = null;
    pastElections: ElectionSummary[] = [];

    createElectionDialog = false;
    editElectionDialog = false;
    editingElectionId = '';
    editingElectionVotingStarted = false;

    electionForm: { title: string; startDate: Date; endDate: Date } = {
        title: '',
        startDate: new Date(),
        endDate: new Date()
    };

    fullMemberOptions: { label: string; value: string }[] = [];
    selectedCandidateIds: string[] = [];
    loadingFullMembers = false;

    ngOnInit() {
        const currentUser = this.authService.currentUser();
        this.isAdmin = !!(currentUser?.roles?.includes('Admin') || currentUser?.role === 'Admin');
        this.currentUserId = currentUser?.id ?? '';
        this.loadElections();
    }

    // -------------------------------------------------------------------------
    // Data loading
    // -------------------------------------------------------------------------

    loadElections() {
        this.loading = true;
        this.electionService.getAll().subscribe({
            next: (summaries) => {
                const sorted = summaries.sort(
                    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
                );

                const current = sorted.find(e => e.status === 'active' || e.status === 'upcoming');
                this.pastElections = sorted.filter(e => e.status === 'completed');

                if (current) {
                    this.loadElectionDetail(current.id);
                } else {
                    this.activeElection = null;
                    this.loading = false;
                }
            },
            error: () => {
                this.loading = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load elections.', life: 4000 });
            }
        });
    }

    loadElectionDetail(id: string) {
        this.electionService.getById(id).subscribe({
            next: (election) => {
                // Sort candidates by votes descending so rank indices are #1, #2, #3…
                election.candidates = [...election.candidates].sort((a, b) => b.votes - a.votes);
                this.activeElection = election;
                this.selectedCandidates = [];
                this.showResults = false;
                this.loading = false;
            },
            error: () => {
                this.loading = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load election details.', life: 4000 });
            }
        });
    }

    // -------------------------------------------------------------------------
    // Voting
    // -------------------------------------------------------------------------

    submitVote() {
        if (!this.activeElection || this.selectedCandidates.length !== 3) return;
        this.confirmationService.confirm({
            message: 'Are you sure you want to submit your 3 votes? This cannot be changed.',
            header: 'Confirm Votes',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.submittingVote = true;
                this.electionService.castVote(this.activeElection!.id, { candidateUserIds: this.selectedCandidates }).subscribe({
                    next: () => {
                        this.submittingVote = false;
                        this.messageService.add({ severity: 'success', summary: 'Votes Submitted', detail: 'Your votes have been recorded.', life: 3000 });
                        this.loadElectionDetail(this.activeElection!.id);
                    },
                    error: (err) => {
                        this.submittingVote = false;
                        const msg = err?.error?.Error ?? 'Failed to submit votes.';
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: msg, life: 4000 });
                    }
                });
            }
        });
    }

    // -------------------------------------------------------------------------
    // Create election
    // -------------------------------------------------------------------------

    openCreateElectionDialog() {
        this.electionForm = {
            title: `Annual Board Elections ${this.currentYear}`,
            startDate: new Date(),
            endDate: new Date()
        };
        this.selectedCandidateIds = [];
        this.createElectionDialog = true;
        this.loadFullMembers();
    }

    createElection() {
        this.savingElection = true;
        this.electionService.create({
            title: this.electionForm.title,
            startDate: this.electionForm.startDate.toISOString(),
            endDate: this.electionForm.endDate.toISOString(),
            candidateIds: this.selectedCandidateIds
        }).subscribe({
            next: () => {
                this.savingElection = false;
                this.createElectionDialog = false;
                this.messageService.add({ severity: 'success', summary: 'Election Created', detail: 'New election has been created.', life: 3000 });
                this.loadElections();
            },
            error: (err) => {
                this.savingElection = false;
                const msg = err?.error?.Error ?? 'Failed to create election.';
                this.messageService.add({ severity: 'error', summary: 'Error', detail: msg, life: 4000 });
            }
        });
    }

    // -------------------------------------------------------------------------
    // Edit election
    // -------------------------------------------------------------------------

    openEditElectionDialog(election: Election) {
        this.editingElectionId = election.id;
        this.editingElectionVotingStarted = election.totalVotes > 0;
        this.electionForm = {
            title: election.title,
            startDate: new Date(election.startDate),
            endDate: new Date(election.endDate)
        };
        this.selectedCandidateIds = election.candidates.map(c => c.userId);
        this.editElectionDialog = true;
        if (!this.editingElectionVotingStarted) this.loadFullMembers();
    }

    updateElection() {
        this.savingElection = true;
        this.electionService.update(this.editingElectionId, {
            startDate: this.electionForm.startDate.toISOString(),
            endDate: this.electionForm.endDate.toISOString(),
            candidateIds: this.selectedCandidateIds
        }).subscribe({
            next: () => {
                this.savingElection = false;
                this.editElectionDialog = false;
                this.messageService.add({ severity: 'success', summary: 'Election Updated', detail: 'Changes saved.', life: 3000 });
                this.loadElectionDetail(this.editingElectionId);
            },
            error: (err) => {
                this.savingElection = false;
                const msg = err?.error?.Error ?? 'Failed to update election.';
                this.messageService.add({ severity: 'error', summary: 'Error', detail: msg, life: 4000 });
            }
        });
    }

    // -------------------------------------------------------------------------
    // Delete election
    // -------------------------------------------------------------------------

    confirmDeleteElection(election: Election) {
        this.confirmDeleteElectionById(election.id);
    }

    confirmDeleteElectionById(id: string) {
        this.confirmationService.confirm({
            message: 'Delete this election? This action cannot be undone.',
            header: 'Delete Election',
            icon: 'pi pi-trash',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.electionService.delete(id).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Election deleted.', life: 3000 });
                        this.loadElections();
                    },
                    error: (err) => {
                        const msg = err?.error?.Error ?? 'Failed to delete election.';
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: msg, life: 4000 });
                    }
                });
            }
        });
    }

    // -------------------------------------------------------------------------
    // View past election results
    // -------------------------------------------------------------------------

    viewElectionResults(summary: ElectionSummary) {
        if (this.viewingPastElectionId === summary.id) {
            this.viewingPastElectionId = '';
            this.viewingPastElection = null;
            return;
        }
        this.loadingPastResults = true;
        this.viewingPastElectionId = summary.id;
        this.viewingPastElection = null;
        this.electionService.getById(summary.id).subscribe({
            next: (election) => {
                election.candidates = [...election.candidates].sort((a, b) => b.votes - a.votes);
                this.viewingPastElection = election;
                this.loadingPastResults = false;
            },
            error: () => {
                this.loadingPastResults = false;
                this.viewingPastElectionId = '';
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load results.', life: 4000 });
            }
        });
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    loadFullMembers() {
        this.loadingFullMembers = true;
        this.http.get<any>(`${environment.apiUrl}/Auth/users?page=1&pageSize=200`).subscribe({
            next: (response) => {
                const users: any[] = response.users ?? [];
                const currentUser = this.authService.currentUser();
                const options = users
                    .filter((u: any) => {
                        const roles = u.roles as string[];
                        return roles.includes('Full Member') || roles.includes('Admin');
                    })
                    .map((u: any) => ({ label: `${u.firstName} ${u.lastName}`, value: u.id }));

                // The API excludes the current user from its response, so add them back
                // if they hold an eligible role
                if (currentUser?.id) {
                    const currentRoles = currentUser.roles ?? (currentUser.role ? [currentUser.role] : []);
                    const eligible = currentRoles.includes('Full Member') || currentRoles.includes('Admin');
                    if (eligible && !options.some(o => o.value === currentUser.id)) {
                        const label = (currentUser.fullName ?? `${currentUser.firstName ?? ''} ${currentUser.lastName ?? ''}`.trim()) || currentUser.email;
                        options.unshift({ label: `${label} (you)`, value: currentUser.id });
                    }
                }

                this.fullMemberOptions = options;
                this.loadingFullMembers = false;
            },
            error: () => { this.loadingFullMembers = false; }
        });
    }

    resetElectionForm() {
        this.editingElectionId = '';
        this.editingElectionVotingStarted = false;
        this.selectedCandidateIds = [];
    }

    getInitials(fullName: string): string {
        if (!fullName) return '?';
        const parts = fullName.trim().split(' ').filter(p => p.length > 0);
        if (parts.length === 1) return parts[0][0].toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    isSelected(userId: string): boolean {
        return this.selectedCandidates.includes(userId);
    }

    isSelf(userId: string): boolean {
        return userId === this.currentUserId;
    }

    toggleCandidate(userId: string) {
        if (this.isSelf(userId)) return;
        if (this.isSelected(userId)) {
            this.selectedCandidates = this.selectedCandidates.filter(id => id !== userId);
        } else if (this.selectedCandidates.length < 3) {
            this.selectedCandidates = [...this.selectedCandidates, userId];
        }
    }

    getStatusSeverity(status: string): 'success' | 'info' | 'warn' {
        switch (status) {
            case 'active':    return 'success';
            case 'completed': return 'info';
            case 'upcoming':  return 'warn';
            default:          return 'info';
        }
    }

    getVotePercentage(votes: number, election?: Election | null): number {
        const el = election ?? this.activeElection;
        if (!el || el.totalVotes === 0) return 0;
        return Math.round((votes / el.totalVotes) * 100);
    }

    getTieNotices(election?: Election | null): { message: string; severity: 'warn' | 'info' }[] {
        const candidates = (election ?? this.activeElection)?.candidates;
        if (!candidates || candidates.length < 2) return [];

        const notices: { message: string; severity: 'warn' | 'info' }[] = [];
        const join = (names: string[]) =>
            names.length <= 2
                ? names.join(' and ')
                : names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];

        let i = 0;
        while (i < candidates.length) {
            const v = candidates[i].votes;
            let j = i;
            while (j < candidates.length && candidates[j].votes === v) j++;
            const size = j - i;

            // Only emit notices for tied groups that overlap with the top-3 positions (indices 0-2)
            if (size >= 2 && i <= 2) {
                const names = candidates.slice(i, j).map(c => c.fullName);
                const nameStr = join(names);
                let message: string;
                let severity: 'warn' | 'info' = 'info';

                if (i === 0) {
                    severity = 'warn';
                    if (size === 2)
                        message = `Leader position tied between ${nameStr}`;
                    else if (j <= 3)
                        message = `Top ${size} positions all tied between ${nameStr}`;
                    else
                        message = `Leader and multiple positions tied between ${nameStr}`;
                } else if (i === 1) {
                    if (j <= 3)
                        message = `2nd place (Admin) tied between ${nameStr}`;
                    else {
                        severity = 'warn';
                        message = `2nd and 3rd place (Admin) tied between ${nameStr}`;
                    }
                } else {
                    // i === 2: 3rd place tied with someone outside the top 3
                    severity = 'warn';
                    message = `Last Admin spot (3rd place) tied between ${nameStr}`;
                }

                notices.push({ message: message!, severity });
            }
            i = j;
        }
        return notices;
    }
}
