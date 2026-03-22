import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { ProgressBarModule } from 'primeng/progressbar';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { debounceTime, Subscription } from 'rxjs';
import { LayoutService } from '../../../layout/service/layout.service';

type TransactionType = 'income' | 'expense';
type TransactionStatus = 'completed' | 'pending' | 'failed';

interface Transaction {
    id: number;
    date: Date;
    description: string;
    category: string;
    amount: number;
    type: TransactionType;
    status: TransactionStatus;
    paymentMethod: string;
    notes?: string;
}

interface BudgetCategory {
    name: string;
    icon: string;
    color: string;
    allocated: number;
    spent: number;
}

interface DonorEntry {
    name: string;
    amount: number;
    date: Date;
    anonymous: boolean;
    message?: string;
    type: 'one-time' | 'recurring';
}

@Component({
    selector: 'app-expenses',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ChartModule,
        TableModule,
        ButtonModule,
        TagModule,
        DialogModule,
        InputTextModule,
        InputNumberModule,
        SelectModule,
        DatePickerModule,
        TextareaModule,
        ToastModule,
        ToolbarModule,
        ProgressBarModule,
        DividerModule,
        TooltipModule
    ],
    providers: [MessageService],
    styles: [`
        .stat-card {
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .stat-card:hover {
            transform: translateY(-2px);
        }
        .donor-row:hover {
            background: var(--surface-hover);
        }
        .budget-bar-track {
            background: var(--surface-200);
            border-radius: 4px;
            overflow: hidden;
        }
        .category-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            display: inline-block;
        }
        .transaction-amount-income {
            color: #22c55e;
            font-weight: 600;
        }
        .transaction-amount-expense {
            color: #ef4444;
            font-weight: 600;
        }
    `],
    template: `
    <p-toast />

    <div class="min-h-screen p-0">

        <!-- ── Page Header ── -->
        <div class="mb-6">
            <div class="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 m-0">FLOSSK Finances</h1>
                    <p class="text-muted-color mt-1">Full transparency on our income, expenses &amp; donations</p>
                </div>
                <div class="flex gap-2">
                    <p-button label="Add Transaction" icon="pi pi-plus" (onClick)="openAddDialog()" />
                    <p-button label="Export" icon="pi pi-download" [outlined]="true" (onClick)="exportCSV()" />
                </div>
            </div>
        </div>

        <!-- ── KPI Cards ── -->
        <div class="grid grid-cols-12 gap-4 mb-6">

            <!-- Total Balance -->
            <div class="col-span-12 sm:col-span-6 xl:col-span-3">
                <div class="card mb-0 stat-card border-l-4 border-l-blue-500">
                    <div class="flex justify-between items-start mb-3">
                        <span class="text-muted-color font-medium">Total Balance</span>
                        <div class="w-10 h-10 flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-xl">
                            <i class="pi pi-wallet text-blue-500 text-lg"></i>
                        </div>
                    </div>
                    <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">{{ balance | currency:'EUR':'symbol':'1.2-2' }}</div>
                    <div class="mt-2 text-sm" [class.text-green-500]="balanceTrend >= 0" [class.text-red-500]="balanceTrend < 0">
                        <i [class]="balanceTrend >= 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'"></i>
                        {{ Math.abs(balanceTrend) | number:'1.1-1' }}% vs last month
                    </div>
                </div>
            </div>

            <!-- Total Income -->
            <div class="col-span-12 sm:col-span-6 xl:col-span-3">
                <div class="card mb-0 stat-card border-l-4 border-l-green-500">
                    <div class="flex justify-between items-start mb-3">
                        <span class="text-muted-color font-medium">Total Income</span>
                        <div class="w-10 h-10 flex items-center justify-center bg-green-100 dark:bg-green-400/10 rounded-xl">
                            <i class="pi pi-arrow-down-left text-green-500 text-lg"></i>
                        </div>
                    </div>
                    <div class="text-2xl font-bold text-green-600">{{ totalIncome | currency:'EUR':'symbol':'1.2-2' }}</div>
                    <div class="mt-2 text-sm text-muted-color">{{ currentYear }} YTD</div>
                </div>
            </div>

            <!-- Total Expenses -->
            <div class="col-span-12 sm:col-span-6 xl:col-span-3">
                <div class="card mb-0 stat-card border-l-4 border-l-red-500">
                    <div class="flex justify-between items-start mb-3">
                        <span class="text-muted-color font-medium">Total Expenses</span>
                        <div class="w-10 h-10 flex items-center justify-center bg-red-100 dark:bg-red-400/10 rounded-xl">
                            <i class="pi pi-arrow-up-right text-red-500 text-lg"></i>
                        </div>
                    </div>
                    <div class="text-2xl font-bold text-red-500">{{ totalExpenses | currency:'EUR':'symbol':'1.2-2' }}</div>
                    <div class="mt-2 text-sm text-muted-color">{{ currentYear }} YTD</div>
                </div>
            </div>

            <!-- Donations This Month -->
            <div class="col-span-12 sm:col-span-6 xl:col-span-3">
                <div class="card mb-0 stat-card border-l-4 border-l-pink-500">
                    <div class="flex justify-between items-start mb-3">
                        <span class="text-muted-color font-medium">Donations (month)</span>
                        <div class="w-10 h-10 flex items-center justify-center bg-pink-100 dark:bg-pink-400/10 rounded-xl">
                            <i class="pi pi-heart-fill text-pink-500 text-lg"></i>
                        </div>
                    </div>
                    <div class="text-2xl font-bold text-pink-500">{{ donationsThisMonth | currency:'EUR':'symbol':'1.2-2' }}</div>
                    <div class="mt-2 text-sm text-muted-color">{{ donorCount }} donors this month</div>
                </div>
            </div>
        </div>

        <!-- ── Charts Row ── -->
        <div class="grid grid-cols-12 gap-4 mb-6">

            <!-- Income vs Expenses Line Chart -->
            <div class="col-span-12 xl:col-span-8">
                <div class="card mb-0 h-full">
                    <div class="flex justify-between items-center mb-4">
                        <div class="font-semibold text-xl">Income vs Expenses</div>
                        <div class="flex gap-2">
                            <p-button *ngFor="let y of yearOptions" [label]="y.toString()" size="small"
                                [outlined]="selectedYear !== y" (onClick)="selectedYear = y; buildLineChart()" />
                        </div>
                    </div>
                    <p-chart type="line" [data]="lineChartData" [options]="lineChartOptions" style="height:280px" />
                </div>
            </div>

            <!-- Expense Breakdown Doughnut -->
            <div class="col-span-12 xl:col-span-4">
                <div class="card mb-0 h-full">
                    <div class="font-semibold text-xl mb-4">Expense Breakdown</div>
                    <p-chart type="doughnut" [data]="doughnutData" [options]="doughnutOptions" style="height:200px" />
                    <div class="mt-4 flex flex-col gap-2">
                        <div *ngFor="let cat of expenseCategories; let i = index" class="flex justify-between items-center text-sm">
                            <div class="flex items-center gap-2">
                                <span class="category-dot" [style.background]="expenseCategoryColors[i]"></span>
                                <span class="text-muted-color">{{ cat.label }}</span>
                            </div>
                            <span class="font-medium">{{ cat.value | currency:'EUR':'symbol':'1.0-0' }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ── Budget Tracker + Donations Row ── -->
        <div class="grid grid-cols-12 gap-4 mb-6">

            <!-- Budget Allocation -->
            <div class="col-span-12 xl:col-span-6">
                <div class="card mb-0 h-full">
                    <div class="font-semibold text-xl mb-4">
                        <i class="pi pi-chart-bar mr-2 text-primary"></i>Budget Tracker {{ currentYear }}
                    </div>
                    <div class="flex flex-col gap-4">
                        <div *ngFor="let cat of budgetCategories" class="p-3 rounded-lg bg-surface-50 dark:bg-surface-800">
                            <div class="flex justify-between items-center mb-2">
                                <div class="flex items-center gap-2">
                                    <i [class]="cat.icon + ' ' + cat.color"></i>
                                    <span class="font-medium">{{ cat.name }}</span>
                                </div>
                                <div class="text-right">
                                    <span class="font-bold">{{ cat.spent | currency:'EUR':'symbol':'1.0-0' }}</span>
                                    <span class="text-muted-color text-sm"> / {{ cat.allocated | currency:'EUR':'symbol':'1.0-0' }}</span>
                                </div>
                            </div>
                            <p-progressbar
                                [value]="getBudgetPercent(cat)"
                                [style]="{'height': '8px'}"
                                [styleClass]="getBudgetBarClass(cat)"
                                [showValue]="false" />
                            <div class="text-xs text-muted-color mt-1 text-right">
                                {{ getBudgetPercent(cat) | number:'1.0-0' }}% used · {{ cat.allocated - cat.spent | currency:'EUR':'symbol':'1.0-0' }} remaining
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Top Donors / Donation Feed -->
            <div class="col-span-12 xl:col-span-6">
                <div class="card mb-0 h-full">
                    <div class="flex justify-between items-center mb-4">
                        <div class="font-semibold text-xl">
                            <i class="pi pi-heart-fill mr-2 text-pink-500"></i>Recent Donations
                        </div>
                        <p-tag value="LIVE" severity="danger" [rounded]="true" styleClass="animate-pulse" />
                    </div>
                    <div class="flex flex-col gap-3">
                        <div *ngFor="let d of recentDonors"
                             class="donor-row flex items-center gap-3 p-3 rounded-lg border border-surface-200 dark:border-surface-700 cursor-pointer transition-all">
                            <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shrink-0"
                                 [style.background]="getDonorColor(d.name)">
                                {{ d.anonymous ? '?' : getInitials(d.name) }}
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="font-medium truncate">{{ d.anonymous ? 'Anonymous Supporter' : d.name }}</div>
                                <div class="text-xs text-muted-color">{{ d.date | date:'MMM d, y' }}
                                    <span *ngIf="d.type === 'recurring'" class="ml-1 text-blue-500">
                                        <i class="pi pi-sync text-xs"></i> recurring
                                    </span>
                                </div>
                                <div *ngIf="d.message" class="text-xs text-muted-color italic truncate mt-0.5">"{{ d.message }}"</div>
                            </div>
                            <div class="text-green-600 font-bold shrink-0">+{{ d.amount | currency:'EUR':'symbol':'1.0-0' }}</div>
                        </div>
                    </div>
                    <p-divider />
                    <div class="flex justify-between items-center text-sm text-muted-color">
                        <span>{{ totalDonors }} total donors • {{ recurringDonors }} recurring</span>
                        <span class="font-semibold text-surface-900 dark:text-surface-0">{{ totalDonations | currency:'EUR':'symbol':'1.2-2' }} raised</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- ── Transaction Table ── -->
        <div class="card mb-0">
            <p-toolbar class="mb-4 p-0! bg-transparent! border-none! shadow-none!">
                <ng-template #start>
                    <div class="font-semibold text-xl">
                        <i class="pi pi-list mr-2 text-primary"></i>All Transactions
                    </div>
                </ng-template>
                <ng-template #end>
                    <div class="flex gap-2 flex-wrap">
                        <p-button *ngFor="let f of typeFilters"
                            [label]="f.label" size="small"
                            [outlined]="activeTypeFilter !== f.value"
                            [severity]="f.severity"
                            (onClick)="activeTypeFilter = f.value" />
                    </div>
                </ng-template>
            </p-toolbar>

            <p-table
                [value]="filteredTransactions"
                [paginator]="true"
                [rows]="10"
                [rowsPerPageOptions]="[10, 25, 50]"
                [sortField]="'date'"
                [sortOrder]="-1"
                styleClass="p-datatable-sm">

                <ng-template #header>
                    <tr>
                        <th pSortableColumn="date" style="min-width:130px">Date <p-sortIcon field="date" /></th>
                        <th pSortableColumn="description" style="min-width:200px">Description <p-sortIcon field="description" /></th>
                        <th pSortableColumn="category" style="min-width:140px">Category <p-sortIcon field="category" /></th>
                        <th pSortableColumn="paymentMethod" style="min-width:130px">Method <p-sortIcon field="paymentMethod" /></th>
                        <th pSortableColumn="amount" style="min-width:120px">Amount <p-sortIcon field="amount" /></th>
                        <th style="min-width:110px">Status</th>
                        <th style="width:60px"></th>
                    </tr>
                </ng-template>

                <ng-template #body let-tx>
                    <tr>
                        <td>{{ tx.date | date:'MMM d, y' }}</td>
                        <td>
                            <span class="font-medium">{{ tx.description }}</span>
                            <div *ngIf="tx.notes" class="text-xs text-muted-color">{{ tx.notes }}</div>
                        </td>
                        <td>
                            <p-tag [value]="tx.category" [style]="getCategoryStyle(tx.category)" />
                        </td>
                        <td>
                            <div class="flex items-center gap-1 text-sm text-muted-color">
                                <i [class]="getMethodIcon(tx.paymentMethod)"></i>
                                {{ tx.paymentMethod }}
                            </div>
                        </td>
                        <td>
                            <span [class]="tx.type === 'income' ? 'transaction-amount-income' : 'transaction-amount-expense'">
                                {{ tx.type === 'income' ? '+' : '-' }}{{ tx.amount | currency:'EUR':'symbol':'1.2-2' }}
                            </span>
                        </td>
                        <td>
                            <p-tag [value]="tx.status | titlecase"
                                   [severity]="tx.status === 'completed' ? 'success' : tx.status === 'pending' ? 'warn' : 'danger'" />
                        </td>
                        <td>
                            <p-button icon="pi pi-trash" size="small" severity="danger" [text]="true"
                                pTooltip="Delete" (onClick)="deleteTransaction(tx)" />
                        </td>
                    </tr>
                </ng-template>

                <ng-template #emptymessage>
                    <tr>
                        <td colspan="7" class="text-center py-8 text-muted-color">
                            <i class="pi pi-inbox text-4xl block mb-3"></i>
                            No transactions found.
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

    </div>

    <!-- ── Add Transaction Dialog ── -->
    <p-dialog header="Add Transaction" [(visible)]="showDialog" [modal]="true" [style]="{width:'520px'}" [draggable]="false">
        <div class="flex flex-col gap-4 pt-2">

            <!-- Type toggle -->
            <div class="flex gap-2">
                <button *ngFor="let t of ['income','expense']"
                    class="flex-1 py-2 px-4 rounded-lg font-medium border-2 cursor-pointer transition-all"
                    [class.border-green-500]="newTx.type === 'income' && t === 'income'"
                    [class.bg-green-50]="newTx.type === 'income' && t === 'income'"
                    [class.dark:bg-green-900/20]="newTx.type === 'income' && t === 'income'"
                    [class.text-green-700]="newTx.type === 'income' && t === 'income'"
                    [class.border-red-500]="newTx.type === 'expense' && t === 'expense'"
                    [class.bg-red-50]="newTx.type === 'expense' && t === 'expense'"
                    [class.dark:bg-red-900/20]="newTx.type === 'expense' && t === 'expense'"
                    [class.text-red-700]="newTx.type === 'expense' && t === 'expense'"
                    [class.border-surface-300]="newTx.type !== t"
                    [class.text-muted-color]="newTx.type !== t"
                    (click)="setTxType(t)">
                    {{ t === 'income' ? '⬆ Income' : '⬇ Expense' }}
                </button>
            </div>

            <div class="grid grid-cols-2 gap-3">
                <div class="flex flex-col gap-1">
                    <label class="text-sm font-medium">Description *</label>
                    <input pInputText [(ngModel)]="newTx.description" placeholder="e.g. Server hosting" class="w-full" />
                </div>
                <div class="flex flex-col gap-1">
                    <label class="text-sm font-medium">Amount (€) *</label>
                    <p-inputnumber [(ngModel)]="newTx.amount" [minFractionDigits]="2" [maxFractionDigits]="2"
                        mode="decimal" placeholder="0.00" styleClass="w-full" />
                </div>
                <div class="flex flex-col gap-1">
                    <label class="text-sm font-medium">Category *</label>
                    <p-select [options]="categoryOptions" [(ngModel)]="newTx.category"
                        placeholder="Select category" styleClass="w-full" />
                </div>
                <div class="flex flex-col gap-1">
                    <label class="text-sm font-medium">Payment Method *</label>
                    <p-select [options]="paymentMethodOptions" [(ngModel)]="newTx.paymentMethod"
                        placeholder="Select method" styleClass="w-full" />
                </div>
                <div class="flex flex-col gap-1">
                    <label class="text-sm font-medium">Date *</label>
                    <p-datepicker [(ngModel)]="newTx.date" dateFormat="dd/mm/yy" [showIcon]="true" styleClass="w-full" />
                </div>
                <div class="flex flex-col gap-1">
                    <label class="text-sm font-medium">Status</label>
                    <p-select [options]="statusOptions" [(ngModel)]="newTx.status" styleClass="w-full" />
                </div>
            </div>
            <div class="flex flex-col gap-1">
                <label class="text-sm font-medium">Notes (optional)</label>
                <textarea pTextarea [(ngModel)]="newTx.notes" rows="2" placeholder="Any additional notes..." class="w-full"></textarea>
            </div>
        </div>
        <ng-template #footer>
            <p-button label="Cancel" [outlined]="true" (onClick)="showDialog = false" />
            <p-button label="Save Transaction" icon="pi pi-check" (onClick)="saveTransaction()" [disabled]="!isFormValid()" />
        </ng-template>
    </p-dialog>
    `
})
export class Expenses implements OnInit, OnDestroy {
    Math = Math;
    currentYear = new Date().getFullYear();
    selectedYear = this.currentYear;
    yearOptions = [this.currentYear - 1, this.currentYear];

    showDialog = false;
    activeTypeFilter: 'all' | 'income' | 'expense' = 'all';

    newTx: Partial<Transaction> & { type: TransactionType } = this.getEmptyTx();

    // ── Charts ──
    lineChartData: any;
    lineChartOptions: any;
    doughnutData: any;
    doughnutOptions: any;
    subscription!: Subscription;

    expenseCategoryColors = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899'];
    expenseCategories: { label: string; value: number }[] = [];

    // ── Data ──
    transactions: Transaction[] = [];
    recentDonors: DonorEntry[] = [];
    budgetCategories: BudgetCategory[] = [];

    typeFilters = [
        { label: 'All', value: 'all' as const, severity: undefined },
        { label: 'Income', value: 'income' as const, severity: 'success' as const },
        { label: 'Expenses', value: 'expense' as const, severity: 'danger' as const }
    ];

    categoryOptions = [
        'Events', 'Infrastructure', 'Operations', 'Marketing', 'Salaries',
        'Memberships', 'Donations', 'Grants', 'Sponsorships', 'Other'
    ];
    paymentMethodOptions = ['Bank Transfer', 'Cash', 'PayPal', 'Stripe', 'Crypto', 'Card'];
    statusOptions = ['completed', 'pending', 'failed'];

    constructor(private layoutService: LayoutService, private messageService: MessageService) {
        this.subscription = this.layoutService.configUpdate$
            .pipe(debounceTime(25))
            .subscribe(() => {
                this.buildLineChart();
                this.buildDoughnutChart();
            });
    }

    ngOnInit() {
        this.seedData();
        this.buildLineChart();
        this.buildDoughnutChart();
    }

    ngOnDestroy() {
        this.subscription?.unsubscribe();
    }

    // ── Computed getters ──
    get totalIncome(): number {
        return this.transactions
            .filter(t => t.type === 'income' && t.status === 'completed' && t.date.getFullYear() === this.selectedYear)
            .reduce((s, t) => s + t.amount, 0);
    }

    get totalExpenses(): number {
        return this.transactions
            .filter(t => t.type === 'expense' && t.status === 'completed' && t.date.getFullYear() === this.selectedYear)
            .reduce((s, t) => s + t.amount, 0);
    }

    get balance(): number { return this.totalIncome - this.totalExpenses; }

    get balanceTrend(): number {
        const lastMonthIncome = this.transactions
            .filter(t => t.type === 'income' && t.status === 'completed' && this.isLastMonth(t.date))
            .reduce((s, t) => s + t.amount, 0);
        const lastMonthExpense = this.transactions
            .filter(t => t.type === 'expense' && t.status === 'completed' && this.isLastMonth(t.date))
            .reduce((s, t) => s + t.amount, 0);
        const prev = lastMonthIncome - lastMonthExpense;
        if (prev === 0) return 0;
        return ((this.balance - prev) / Math.abs(prev)) * 100;
    }

    get donationsThisMonth(): number {
        const now = new Date();
        return this.transactions
            .filter(t => t.type === 'income' && t.category === 'Donations' &&
                t.date.getMonth() === now.getMonth() && t.date.getFullYear() === now.getFullYear())
            .reduce((s, t) => s + t.amount, 0);
    }

    get donorCount(): number {
        const now = new Date();
        return this.recentDonors.filter(
            d => d.date.getMonth() === now.getMonth() && d.date.getFullYear() === now.getFullYear()
        ).length;
    }

    get totalDonors(): number { return this.recentDonors.length; }
    get recurringDonors(): number { return this.recentDonors.filter(d => d.type === 'recurring').length; }
    get totalDonations(): number { return this.recentDonors.reduce((s, d) => s + d.amount, 0); }

    get filteredTransactions(): Transaction[] {
        if (this.activeTypeFilter === 'all') return this.transactions;
        return this.transactions.filter(t => t.type === this.activeTypeFilter);
    }

    // ── Chart builders ──
    buildLineChart() {
        const ds = getComputedStyle(document.documentElement);
        const textColor = ds.getPropertyValue('--text-color');
        const borderColor = ds.getPropertyValue('--surface-border');
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

        const incomeByMonth = Array(12).fill(0);
        const expenseByMonth = Array(12).fill(0);

        this.transactions
            .filter(t => t.status === 'completed' && t.date.getFullYear() === this.selectedYear)
            .forEach(t => {
                const m = t.date.getMonth();
                if (t.type === 'income') incomeByMonth[m] += t.amount;
                else expenseByMonth[m] += t.amount;
            });

        this.lineChartData = {
            labels: months,
            datasets: [
                {
                    label: 'Income',
                    data: incomeByMonth,
                    fill: true,
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34,197,94,0.1)',
                    tension: 0.4,
                    pointBackgroundColor: '#22c55e',
                    pointRadius: 4
                },
                {
                    label: 'Expenses',
                    data: expenseByMonth,
                    fill: true,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239,68,68,0.1)',
                    tension: 0.4,
                    pointBackgroundColor: '#ef4444',
                    pointRadius: 4
                }
            ]
        };

        this.lineChartOptions = {
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: textColor } },
                tooltip: {
                    callbacks: {
                        label: (ctx: any) => ` €${ctx.parsed.y.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`
                    }
                }
            },
            scales: {
                x: { ticks: { color: textColor }, grid: { color: borderColor } },
                y: {
                    ticks: {
                        color: textColor,
                        callback: (v: number) => `€${(v / 1000).toFixed(0)}k`
                    },
                    grid: { color: borderColor }
                }
            }
        };
    }

    buildDoughnutChart() {
        const ds = getComputedStyle(document.documentElement);
        const textColor = ds.getPropertyValue('--text-color');

        const catMap: Record<string, number> = {};
        this.transactions
            .filter(t => t.type === 'expense' && t.status === 'completed')
            .forEach(t => { catMap[t.category] = (catMap[t.category] ?? 0) + t.amount; });

        this.expenseCategories = Object.entries(catMap)
            .sort((a, b) => b[1] - a[1])
            .map(([label, value]) => ({ label, value }));

        this.doughnutData = {
            labels: this.expenseCategories.map(c => c.label),
            datasets: [{
                data: this.expenseCategories.map(c => c.value),
                backgroundColor: this.expenseCategoryColors,
                hoverOffset: 6
            }]
        };

        this.doughnutOptions = {
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx: any) => ` ${ctx.label}: €${ctx.parsed.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`
                    }
                }
            }
        };
    }

    // ── Helpers ──
    getBudgetPercent(cat: BudgetCategory): number {
        return Math.min(100, Math.round((cat.spent / cat.allocated) * 100));
    }

    getBudgetBarClass(cat: BudgetCategory): string {
        const pct = this.getBudgetPercent(cat);
        if (pct >= 90) return '!bg-red-500';
        if (pct >= 70) return '!bg-yellow-500';
        return '!bg-green-500';
    }

    getCategoryStyle(category: string): Record<string, string> {
        const map: Record<string, string> = {
            'Events': '#3b82f6',
            'Infrastructure': '#8b5cf6',
            'Operations': '#f97316',
            'Marketing': '#ec4899',
            'Salaries': '#ef4444',
            'Memberships': '#22c55e',
            'Donations': '#10b981',
            'Grants': '#06b6d4',
            'Sponsorships': '#a855f7',
            'Other': '#6b7280'
        };
        const color = map[category] ?? '#6b7280';
        return { background: color + '22', color, border: '1px solid ' + color + '44' };
    }

    getMethodIcon(method: string): string {
        const map: Record<string, string> = {
            'Bank Transfer': 'pi pi-building-columns',
            'Cash': 'pi pi-money-bill',
            'PayPal': 'pi pi-paypal',
            'Stripe': 'pi pi-credit-card',
            'Crypto': 'pi pi-bitcoin',
            'Card': 'pi pi-credit-card'
        };
        return (map[method] ?? 'pi pi-wallet') + ' text-muted-color mr-1';
    }

    getDonorColor(name: string): string {
        const colors = ['#6366f1','#8b5cf6','#ec4899','#14b8a6','#f97316','#3b82f6','#22c55e'];
        let hash = 0;
        for (const ch of name) hash = (hash << 5) - hash + ch.charCodeAt(0);
        return colors[Math.abs(hash) % colors.length];
    }

    getInitials(name: string): string {
        return name.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
    }

    private isLastMonth(date: Date): boolean {
        const now = new Date();
        const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return date.getFullYear() === lm.getFullYear() && date.getMonth() === lm.getMonth();
    }

    // ── Dialog ──
    setTxType(t: string) {
        this.newTx.type = t as TransactionType;
    }

    openAddDialog() {
        this.newTx = this.getEmptyTx();
        this.showDialog = true;
    }

    getEmptyTx(): Partial<Transaction> & { type: TransactionType } {
        return { type: 'expense', description: '', amount: 0, category: '', paymentMethod: '', date: new Date(), status: 'completed', notes: '' };
    }

    isFormValid(): boolean {
        return !!(this.newTx.description && this.newTx.amount && this.newTx.amount > 0 &&
            this.newTx.category && this.newTx.paymentMethod && this.newTx.date);
    }

    saveTransaction() {
        if (!this.isFormValid()) return;
        const tx: Transaction = {
            id: Date.now(),
            date: this.newTx.date!,
            description: this.newTx.description!,
            category: this.newTx.category!,
            amount: this.newTx.amount!,
            type: this.newTx.type,
            status: (this.newTx.status as TransactionStatus) ?? 'completed',
            paymentMethod: this.newTx.paymentMethod!,
            notes: this.newTx.notes
        };
        this.transactions = [tx, ...this.transactions];
        this.buildLineChart();
        this.buildDoughnutChart();
        this.updateBudgetSpent();
        this.showDialog = false;
        this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Transaction added successfully.' });
    }

    deleteTransaction(tx: Transaction) {
        this.transactions = this.transactions.filter(t => t.id !== tx.id);
        this.buildLineChart();
        this.buildDoughnutChart();
        this.updateBudgetSpent();
        this.messageService.add({ severity: 'info', summary: 'Deleted', detail: 'Transaction removed.' });
    }

    exportCSV() {
        const header = ['Date','Description','Category','Payment Method','Amount','Type','Status'];
        const rows = this.filteredTransactions.map(t => [
            t.date.toISOString().split('T')[0], t.description, t.category, t.paymentMethod,
            t.amount.toFixed(2), t.type, t.status
        ]);
        const csv = [header, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'flossk-finances.csv';
        a.click();
        URL.revokeObjectURL(a.href);
    }

    private updateBudgetSpent() {
        this.budgetCategories = this.budgetCategories.map(cat => ({
            ...cat,
            spent: this.transactions
                .filter(t => t.type === 'expense' && t.status === 'completed' && t.category === cat.name)
                .reduce((s, t) => s + t.amount, 0)
        }));
    }

    // ── Seed data ──
    private seedData() {
        const y = this.currentYear;
        this.transactions = [
            // Income
            { id: 1,  date: new Date(y,0,5),  description: 'EU Open Source Grant',       category: 'Grants',        amount: 8000,  type: 'income',  status: 'completed', paymentMethod: 'Bank Transfer' },
            { id: 2,  date: new Date(y,0,15), description: 'Membership Fees – January',   category: 'Memberships',   amount: 420,   type: 'income',  status: 'completed', paymentMethod: 'Bank Transfer' },
            { id: 3,  date: new Date(y,1,3),  description: 'Mozilla Foundation Donation', category: 'Donations',     amount: 2500,  type: 'income',  status: 'completed', paymentMethod: 'Bank Transfer', notes: 'Annual support' },
            { id: 4,  date: new Date(y,1,15), description: 'Membership Fees – February',  category: 'Memberships',   amount: 390,   type: 'income',  status: 'completed', paymentMethod: 'Bank Transfer' },
            { id: 5,  date: new Date(y,2,1),  description: 'Space Rental Income',         category: 'Operations',    amount: 600,   type: 'income',  status: 'completed', paymentMethod: 'Cash' },
            { id: 6,  date: new Date(y,2,12), description: 'KODE Sponsorship',            category: 'Sponsorships',  amount: 3000,  type: 'income',  status: 'completed', paymentMethod: 'Bank Transfer', notes: 'Annual KODE conference sponsor' },
            { id: 7,  date: new Date(y,2,15), description: 'Membership Fees – March',     category: 'Memberships',   amount: 410,   type: 'income',  status: 'completed', paymentMethod: 'Bank Transfer' },
            { id: 8,  date: new Date(y,3,10), description: 'Workshop Ticket Sales',       category: 'Events',        amount: 750,   type: 'income',  status: 'completed', paymentMethod: 'Stripe' },
            { id: 9,  date: new Date(y,3,15), description: 'Membership Fees – April',     category: 'Memberships',   amount: 430,   type: 'income',  status: 'completed', paymentMethod: 'Bank Transfer' },
            { id: 10, date: new Date(y,4,8),  description: 'Individual Donations',        category: 'Donations',     amount: 980,   type: 'income',  status: 'completed', paymentMethod: 'PayPal' },
            { id: 11, date: new Date(y,4,15), description: 'Membership Fees – May',       category: 'Memberships',   amount: 445,   type: 'income',  status: 'completed', paymentMethod: 'Bank Transfer' },
            { id: 12, date: new Date(y,5,20), description: 'Open Source Day Tickets',     category: 'Events',        amount: 1200,  type: 'income',  status: 'completed', paymentMethod: 'Stripe' },
            // Expenses
            { id: 20, date: new Date(y,0,8),  description: 'Server Hosting (AWS)',        category: 'Infrastructure',amount: 180,   type: 'expense', status: 'completed', paymentMethod: 'Card',          notes: 'Monthly AWS bill' },
            { id: 21, date: new Date(y,0,10), description: 'Office Supplies',             category: 'Operations',    amount: 95,    type: 'expense', status: 'completed', paymentMethod: 'Cash' },
            { id: 22, date: new Date(y,0,20), description: 'Social Media Ads',            category: 'Marketing',     amount: 150,   type: 'expense', status: 'completed', paymentMethod: 'Card' },
            { id: 23, date: new Date(y,1,5),  description: 'Venue – PHP Kosovo Meetup',   category: 'Events',        amount: 250,   type: 'expense', status: 'completed', paymentMethod: 'Cash' },
            { id: 24, date: new Date(y,1,8),  description: 'Server Hosting (AWS)',        category: 'Infrastructure',amount: 180,   type: 'expense', status: 'completed', paymentMethod: 'Card' },
            { id: 25, date: new Date(y,1,14), description: 'Catering – Members Meeting',  category: 'Operations',    amount: 120,   type: 'expense', status: 'completed', paymentMethod: 'Cash' },
            { id: 26, date: new Date(y,2,8),  description: 'Server Hosting (AWS)',        category: 'Infrastructure',amount: 180,   type: 'expense', status: 'completed', paymentMethod: 'Card' },
            { id: 27, date: new Date(y,2,15), description: 'Printed Materials',           category: 'Marketing',     amount: 220,   type: 'expense', status: 'completed', paymentMethod: 'Bank Transfer' },
            { id: 28, date: new Date(y,2,22), description: 'KODE Conference Venue',       category: 'Events',        amount: 1800,  type: 'expense', status: 'completed', paymentMethod: 'Bank Transfer' },
            { id: 29, date: new Date(y,3,8),  description: 'Server Hosting (AWS)',        category: 'Infrastructure',amount: 180,   type: 'expense', status: 'completed', paymentMethod: 'Card' },
            { id: 30, date: new Date(y,3,12), description: 'Domain Renewals',             category: 'Infrastructure',amount: 45,    type: 'expense', status: 'completed', paymentMethod: 'Card' },
            { id: 31, date: new Date(y,3,18), description: 'Workshop – Speaker Honorarium',category: 'Events',       amount: 300,   type: 'expense', status: 'completed', paymentMethod: 'Bank Transfer' },
            { id: 32, date: new Date(y,4,8),  description: 'Server Hosting (AWS)',        category: 'Infrastructure',amount: 180,   type: 'expense', status: 'completed', paymentMethod: 'Card' },
            { id: 33, date: new Date(y,4,20), description: 'Accounting Services',         category: 'Operations',    amount: 200,   type: 'expense', status: 'completed', paymentMethod: 'Bank Transfer' },
            { id: 34, date: new Date(y,5,8),  description: 'Server Hosting (AWS)',        category: 'Infrastructure',amount: 180,   type: 'expense', status: 'completed', paymentMethod: 'Card' },
            { id: 35, date: new Date(y,5,15), description: 'Open Source Day Catering',   category: 'Events',        amount: 650,   type: 'expense', status: 'completed', paymentMethod: 'Cash' },
            { id: 36, date: new Date(y,5,22), description: 'Volunteer T-Shirts',         category: 'Events',        amount: 380,   type: 'expense', status: 'completed', paymentMethod: 'Bank Transfer' },
            { id: 37, date: new Date(y,1,28), description: 'VPS Upgrade',                category: 'Infrastructure',amount: 60,    type: 'expense', status: 'pending',   paymentMethod: 'Card',          notes: 'Awaiting approval' },
        ];

        this.recentDonors = [
            { name: 'Armend Kastrati',    amount: 50,  date: new Date(y,5,20), anonymous: false, type: 'recurring', message: 'Keep up the great FOSS work!' },
            { name: 'Anonymous',          amount: 100, date: new Date(y,5,18), anonymous: true,  type: 'one-time' },
            { name: 'Lirije Berisha',     amount: 25,  date: new Date(y,5,15), anonymous: false, type: 'recurring' },
            { name: 'Mentor Gashi',       amount: 200, date: new Date(y,5,12), anonymous: false, type: 'one-time',  message: 'Love what FLOSSK does for Kosovo.' },
            { name: 'Tech4Kosovo',        amount: 500, date: new Date(y,4,30), anonymous: false, type: 'one-time',  message: 'Corporate matching donation.' },
            { name: 'DrenУка',           amount: 30,  date: new Date(y,4,25), anonymous: false, type: 'recurring' },
            { name: 'Anonymous',          amount: 75,  date: new Date(y,4,20), anonymous: true,  type: 'one-time' },
        ];

        this.budgetCategories = [
            { name: 'Events',          icon: 'pi pi-calendar',    color: 'text-blue-500',   allocated: 5000, spent: 0 },
            { name: 'Infrastructure',  icon: 'pi pi-server',      color: 'text-purple-500', allocated: 2500, spent: 0 },
            { name: 'Operations',      icon: 'pi pi-cog',         color: 'text-orange-500', allocated: 1500, spent: 0 },
            { name: 'Marketing',       icon: 'pi pi-megaphone',   color: 'text-pink-500',   allocated: 1000, spent: 0 },
            { name: 'Salaries',        icon: 'pi pi-users',       color: 'text-red-500',    allocated: 6000, spent: 0 },
        ];

        this.updateBudgetSpent();
    }
}

