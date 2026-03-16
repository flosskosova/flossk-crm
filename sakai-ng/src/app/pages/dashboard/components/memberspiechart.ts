import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { forkJoin } from 'rxjs';
import { debounceTime, Subscription } from 'rxjs';
import { LayoutService } from '../../../layout/service/layout.service';
import { MembershipRequestsService } from '../../service/membership-requests.service';

@Component({
    standalone: true,
    selector: 'app-members-pie-chart-widget',
    imports: [CommonModule, ChartModule],
    template: `
        <div class="card mb-0">
            <div class="font-semibold text-xl mb-4">User Count</div>
            <p-chart type="pie" [data]="chartData" [options]="chartOptions" class="w-full md:w-80 mx-auto" />
        </div>
    `
})
export class MembersPieChartWidget implements OnInit, OnDestroy {
    chartData: any;
    chartOptions: any;
    approved = 0;
    pending = 0;
    rejected = 0;

    subscription!: Subscription;

    constructor(
        public layoutService: LayoutService,
        private membershipRequestsService: MembershipRequestsService
    ) {
        this.subscription = this.layoutService.configUpdate$
            .pipe(debounceTime(25))
            .subscribe(() => this.initChart());
    }

    ngOnInit() {
        forkJoin({
            approved: this.membershipRequestsService.getAll(1, 1000, 'Approved'),
            pending: this.membershipRequestsService.getAll(1, 1000, 'Pending'),
            rejected: this.membershipRequestsService.getAll(1, 1000, 'Rejected')
        }).subscribe({
            next: ({ approved, pending, rejected }) => {
                this.approved = approved.totalCount ?? approved.data?.length ?? 0;
                this.pending = pending.totalCount ?? pending.data?.length ?? 0;
                this.rejected = rejected.totalCount ?? rejected.data?.length ?? 0;
                this.initChart();
            },
            error: () => this.initChart()
        });
    }

    initChart() {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color');

        this.chartData = {
            labels: ['Approved', 'Pending', 'Rejected'],
            datasets: [
                {
                    data: [this.approved, this.pending, this.rejected],
                    backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
                    hoverBackgroundColor: ['#16a34a', '#d97706', '#dc2626']
                }
            ]
        };

        this.chartOptions = {
            plugins: {
                legend: {
                    labels: {
                        color: textColor,
                        usePointStyle: true,
                        font: { weight: 700 }
                    }
                }
            }
        };
    }

    ngOnDestroy() {
        this.subscription?.unsubscribe();
    }
}
