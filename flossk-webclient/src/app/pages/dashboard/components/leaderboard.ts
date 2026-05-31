import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarModule } from 'primeng/avatar';
import { ProgressBarModule } from 'primeng/progressbar';
import { SkeletonModule } from 'primeng/skeleton';
import { ContributionsService, LeaderboardEntry } from '../../service/contributions.service';
import { environment } from '@environments/environment.prod';

@Component({
    selector: 'app-leaderboard',
    standalone: true,
    imports: [CommonModule, AvatarModule, ProgressBarModule, SkeletonModule],
    template: `
    <div class="grid grid-cols-12 gap-4">

        <!-- Loading State -->
        <ng-container *ngIf="isLoading">
            <div class="col-span-12 lg:col-span-4">
                <div class="card">
                    <div class="font-semibold text-xl mb-4">🏆 Top Contributors</div>
                    <div class="flex flex-col gap-3">
                        <div *ngFor="let _ of [1,2,3,4,5]" class="flex items-center gap-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                            <p-skeleton shape="circle" size="2.5rem"></p-skeleton>
                            <p-skeleton shape="circle" size="3rem"></p-skeleton>
                            <div class="flex-1">
                                <p-skeleton width="60%" height="1rem" styleClass="mb-2"></p-skeleton>
                                <p-skeleton width="40%" height="0.75rem"></p-skeleton>
                            </div>
                            <p-skeleton width="3rem" height="2rem"></p-skeleton>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-span-12 lg:col-span-8">
                <div class="card">
                    <div class="font-semibold text-xl mb-4">Contribution Breakdown</div>
                    <div class="grid grid-cols-12 gap-4">
                        <div *ngFor="let _ of [1,2,3,4,5,6]" class="col-span-12 sm:col-span-4">
                            <div class="p-4 border border-surface rounded-lg">
                                <p-skeleton width="100%" height="8rem"></p-skeleton>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ng-container>

        <!-- Empty State -->
        <ng-container *ngIf="!isLoading && leaderboard.length === 0">
            <div class="col-span-12">
                <div class="card">
                    <div class="flex flex-col items-center justify-center py-12 text-center">
                        <i class="pi pi-trophy text-6xl text-muted-color mb-4"></i>
                        <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-2">No contributions yet</h3>
                        <p class="text-muted-color">Contributions are tracked when projects are completed. Complete a project to see the leaderboard!</p>
                    </div>
                </div>
            </div>
        </ng-container>

        <!-- Leaderboard Data -->
        <ng-container *ngIf="!isLoading && leaderboard.length > 0">

            <!-- Top Contributors Ranking -->
            <div class="col-span-12 lg:col-span-4">
                <div class="card">
                    <div class="font-semibold text-xl mb-4">🏆 Top Contributors</div>
                    <div class="flex flex-col gap-3">
                        <div *ngFor="let entry of leaderboard; let i = index"
                             class="flex items-center gap-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg transition-all hover:shadow-md">
                            <!-- Rank Badge -->
                            <div class="flex items-center justify-center w-10 h-10 rounded-full font-bold text-white shrink-0"
                                 [ngClass]="{
                                    'bg-yellow-500': i === 0,
                                    'bg-gray-400': i === 1,
                                    'bg-orange-600': i === 2,
                                    'bg-blue-500': i > 2
                                 }">
                                {{ entry.rank }}
                            </div>
                            <!-- Avatar -->
                            <p-avatar
                                [image]="getAvatarUrl(entry)"
                                [label]="!entry.profilePictureUrl ? getInitials(entry) : undefined"
                                shape="circle"
                                size="large"
                                [style]="!entry.profilePictureUrl ? {'background-color': 'var(--primary-color)', 'color': 'var(--primary-color-text)'} : {}"
                            ></p-avatar>
                            <!-- Name & Email -->
                            <div class="flex-1 min-w-0">
                                <div class="font-semibold text-surface-900 dark:text-surface-0 truncate">{{ entry.firstName }} {{ entry.lastName }}</div>
                                <div class="text-sm text-muted-color truncate">{{ entry.projectsCompleted }} project{{ entry.projectsCompleted !== 1 ? 's' : '' }} completed</div>
                            </div>
                            <!-- Score -->
                            <div class="text-right shrink-0">
                                <div class="text-2xl font-bold text-primary">{{ entry.totalScore }}</div>
                                <div class="text-xs text-muted-color">points</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Contribution Breakdown -->
            <div class="col-span-12 lg:col-span-8">
                <div class="card">
                    <div class="font-semibold text-xl mb-4">Contribution Breakdown</div>
                    <div class="grid grid-cols-12 gap-4">
                        <div *ngFor="let entry of leaderboard; let i = index" class="col-span-12 sm:col-span-4">
                            <div class="p-4 border border-surface rounded-lg">
                                <!-- Header with medal -->
                                <div class="flex items-center gap-3 mb-4">
                                    <span class="text-2xl">{{ i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '#' + (i + 1) }}</span>
                                    <p-avatar
                                        [image]="getAvatarUrl(entry)"
                                        [label]="!entry.profilePictureUrl ? getInitials(entry) : undefined"
                                        shape="circle"
                                        [style]="!entry.profilePictureUrl ? {'background-color': 'var(--primary-color)', 'color': 'var(--primary-color-text)'} : {}"
                                    ></p-avatar>
                                    <div class="font-semibold text-surface-900 dark:text-surface-0 truncate">{{ entry.firstName }} {{ entry.lastName }}</div>
                                </div>
                                <!-- Stats -->
                                <div class="flex flex-col gap-3 text-sm">
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-2 text-muted-color">
                                            <i class="pi pi-check-circle text-green-500"></i>
                                            <span>Objectives</span>
                                        </div>
                                        <div class="font-bold text-lg text-green-600 dark:text-green-400">{{ entry.totalObjectivesCompleted }}</div>
                                    </div>
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-2 text-muted-color">
                                            <i class="pi pi-file text-blue-500"></i>
                                            <span>Resources</span>
                                        </div>
                                        <div class="font-bold text-lg text-blue-600 dark:text-blue-400">{{ entry.totalResourcesCreated }}</div>
                                    </div>
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-2 text-muted-color">
                                            <i class="pi pi-hammer text-purple-500"></i>
                                            <span>Projects</span>
                                        </div>
                                        <div class="font-bold text-lg text-purple-600 dark:text-purple-400">{{ entry.projectsCompleted }}</div>
                                    </div>
                                    <div class="mt-2 pt-3 border-t border-surface">
                                        <div class="flex items-center justify-between">
                                            <span class="text-muted-color font-medium">Total Score</span>
                                            <span class="font-bold text-xl text-primary">{{ entry.totalScore }}</span>
                                        </div>
                                        <p-progressbar
                                            [value]="getScorePercentage(entry)"
                                            [showValue]="false"
                                            styleClass="mt-2"
                                            [style]="{'height': '6px'}"
                                        ></p-progressbar>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </ng-container>
    </div>
    `
})
export class Leaderboard implements OnInit {
    leaderboard: LeaderboardEntry[] = [];
    isLoading = true;
    maxScore = 0;

    constructor(private contributionsService: ContributionsService) {}

    ngOnInit() {
        this.loadLeaderboard();
    }

    loadLeaderboard() {
        this.isLoading = true;
        this.contributionsService.getLeaderboard().subscribe({
            next: (data) => {
                this.leaderboard = data;
                this.maxScore = data.length > 0 ? data[0].totalScore : 0;
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading leaderboard:', err);
                this.isLoading = false;
            }
        });
    }

    getAvatarUrl(entry: LeaderboardEntry): string | undefined {
        if (!entry.profilePictureUrl) return undefined;
        return entry.profilePictureUrl.startsWith('http')
            ? entry.profilePictureUrl
            : `${environment.baseUrl}${entry.profilePictureUrl}`;
    }

    getInitials(entry: LeaderboardEntry): string {
        return `${(entry.firstName?.[0] || '').toUpperCase()}${(entry.lastName?.[0] || '').toUpperCase()}`;
    }

    getScorePercentage(entry: LeaderboardEntry): number {
        if (this.maxScore === 0) return 0;
        return (entry.totalScore / this.maxScore) * 100;
    }
}
