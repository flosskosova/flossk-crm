import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { InputNumberModule } from 'primeng/inputnumber';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { MessageService } from 'primeng/api';
import { PosService, PosCategory, PosProduct, PosCustomer } from '@/pages/service/pos.service';

@Component({
    selector: 'app-pos-terminal',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ButtonModule, InputTextModule,
        DialogModule, ToastModule, InputNumberModule, TagModule, ProgressSpinnerModule
    ],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="flex items-center gap-4 mb-4 p-3 rounded-xl shadow-sm border transition-colors"
            [class]="openShift() ? 'bg-green-50/60 dark:bg-green-900/10 border-green-200 dark:border-green-800' : 'bg-surface-0 dark:bg-surface-800 border-surface-200 dark:border-surface-700'">
            @if (openShift(); as s) {
                <div class="flex items-center gap-4 flex-1 flex-wrap">
                    <span class="flex items-center gap-2">
                        <span class="relative flex h-2.5 w-2.5">
                            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                        </span>
                        <span class="text-sm font-semibold text-green-700 dark:text-green-400">Shift active</span>
                    </span>
                    <span class="text-sm text-surface-500 dark:text-surface-400">{{ s.operatorName }} &middot; since {{ s.startedAt | date:'shortTime' }}</span>
                    <div class="flex items-center gap-4 ml-auto text-sm">
                        <span class="text-surface-500">Starting <strong class="text-surface-900 dark:text-surface-0">€{{ s.startingCash.toFixed(2) }}</strong></span>
                        <span class="text-surface-500">Sales <strong class="text-surface-900 dark:text-surface-0">€{{ (s.totalSales || 0).toFixed(2) }}</strong></span>
                        <span class="text-surface-500">Orders <strong class="text-surface-900 dark:text-surface-0">{{ s.orderCount || 0 }}</strong></span>
                    </div>
                    <button pButton label="End Shift" icon="pi pi-stop-circle" severity="danger" [outlined]="true" size="small" (click)="openEndDialog()"></button>
                </div>
            } @else {
                <div class="flex items-center gap-2 flex-1">
                    <i class="pi pi-stopwatch text-surface-400 text-xl"></i>
                    <span class="text-sm text-surface-400">No active shift — start one to begin selling</span>
                    <button pButton label="Start Shift" icon="pi pi-play" size="small" class="ml-auto" (click)="showStartDialog = true"></button>
                </div>
            }
        </div>

        <div class="flex gap-4 h-[calc(100vh-14rem)]">
            <div class="flex-1 flex flex-col gap-4 min-w-0">
                <div class="flex gap-2 flex-nowrap overflow-x-auto pb-1">
                    <button pButton
                        label="All"
                        [rounded]="true"
                        [outlined]="selectedCategoryId() !== null"
                        size="small"
                        class="shrink-0"
                        (click)="selectedCategoryId.set(null); loadProducts()"></button>
                    @for (cat of categories(); track cat.id) {
                        <button pButton
                            [label]="cat.name"
                            [rounded]="true"
                            [outlined]="selectedCategoryId() !== cat.id"
                            size="small"
                            class="shrink-0"
                            (click)="selectedCategoryId.set(cat.id); loadProducts()"></button>
                    }
                </div>

                <div class="flex-1 overflow-y-auto p-1">
                    @if (loadingProducts()) {
                        <div class="flex items-center justify-center h-full">
                            <p-progressSpinner styleClass="w-10 h-10" strokeWidth="4" />
                        </div>
                    } @else if (products().length === 0) {
                        <div class="flex flex-col items-center justify-center h-full text-surface-400">
                            <i class="pi pi-box text-4xl mb-2"></i>
                            <span class="text-sm">No products in this category</span>
                        </div>
                    } @else {
                        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            @for (product of products(); track product.id) {
                                <div class="relative rounded-xl border p-3 transition-all duration-150 select-none"
                                    [class]="product.stock > 0
                                        ? 'bg-surface-0 dark:bg-surface-800 border-surface-200 dark:border-surface-700 cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-primary active:scale-[0.98]'
                                        : 'bg-surface-50 dark:bg-surface-800/50 border-surface-200 dark:border-surface-700 opacity-60 cursor-not-allowed'"
                                    (click)="selectProduct(product)">
                                    <div class="font-semibold text-surface-900 dark:text-surface-0 text-sm leading-snug">{{ product.name }}</div>
                                    <div class="text-primary font-bold text-lg mt-1">€{{ product.price.toFixed(2) }}</div>
                                    <div class="text-xs text-surface-400 mt-0.5">{{ product.categoryName }}</div>
                                    @if (product.stock === 0) {
                                        <p-tag value="Out of stock" severity="danger" styleClass="mt-2 text-xs" />
                                    } @else if (product.stock <= 5) {
                                        <p-tag [value]="'Only ' + product.stock + ' left'" severity="warn" styleClass="mt-2 text-xs" />
                                    } @else if (cartQtyFor(product.id) > 0) {
                                        <span class="absolute -top-2 -right-2 bg-primary text-primary-contrast text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow">{{ cartQtyFor(product.id) }}</span>
                                    }
                                </div>
                            }
                        </div>
                    }
                </div>
            </div>

            <div class="w-96 flex flex-col bg-surface-0 dark:bg-surface-800 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 p-4">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-bold text-surface-900 dark:text-surface-0 flex items-center gap-2">
                        <i class="pi pi-shopping-cart"></i> Cart
                        @if (posService.getCartItemCount() > 0) {
                            <p-tag [value]="posService.getCartItemCount().toString()" severity="info" />
                        }
                    </h3>
                    @if (posService.cart().length > 0) {
                        <button pButton icon="pi pi-trash" (click)="posService.clearCart()" class="p-button-text p-button-danger p-button-sm"></button>
                    }
                </div>

                <div class="flex gap-2 mb-3">
                    <input pInputText [(ngModel)]="customerSearch" placeholder="Search customer..." class="flex-1 text-sm"
                        (keyup.enter)="searchCustomers()" />
                    <button pButton icon="pi pi-search" [outlined]="true" (click)="searchCustomers()" class="p-button-sm"></button>
                </div>

                @if (customers().length > 0) {
                    <div class="mb-3 max-h-32 overflow-y-auto rounded-lg border border-surface-200 dark:border-surface-700">
                        @for (cust of customers(); track cust.id) {
                            <div class="flex items-center justify-between px-3 py-2 hover:bg-surface-100 dark:hover:bg-surface-700 cursor-pointer text-sm"
                                (click)="posService.selectedCustomer.set(cust); customers.set([]); customerSearch = cust.firstName + ' ' + cust.lastName">
                                <span>{{ cust.firstName }} {{ cust.lastName }}</span>
                                @if (posService.selectedCustomer()?.id === cust.id) {
                                    <i class="pi pi-check text-primary"></i>
                                }
                            </div>
                        }
                    </div>
                }

                @if (posService.selectedCustomer(); as c) {
                    <div class="flex items-center justify-between text-xs bg-primary/10 text-primary rounded-lg px-3 py-1.5 mb-3">
                        <span><i class="pi pi-user mr-1"></i>{{ c.firstName }} {{ c.lastName }}</span>
                        <i class="pi pi-times cursor-pointer" (click)="posService.selectedCustomer.set(null); customerSearch = ''"></i>
                    </div>
                }

                <div class="flex-1 overflow-y-auto space-y-2">
                    @for (item of posService.cart(); track item.product.id) {
                        <div class="flex items-center justify-between bg-surface-50 dark:bg-surface-700 rounded-lg p-2.5">
                            <div class="flex-1 min-w-0">
                                <div class="text-sm font-medium text-surface-900 dark:text-surface-0 truncate">{{ item.product.name }}</div>
                                <div class="text-xs text-surface-400">€{{ item.product.price.toFixed(2) }} each</div>
                            </div>
                            <div class="flex items-center gap-1.5">
                                <button pButton icon="pi pi-minus" (click)="posService.updateQuantity(item.product.id, item.quantity - 1)"
                                    class="p-button-text p-button-sm p-button-rounded !w-7 !h-7"></button>
                                <span class="font-bold text-sm w-6 text-center">{{ item.quantity }}</span>
                                <button pButton icon="pi pi-plus" (click)="incrementCartItem(item.product.id)"
                                    [disabled]="item.quantity >= item.product.stock"
                                    class="p-button-text p-button-sm p-button-rounded !w-7 !h-7"></button>
                                <button pButton icon="pi pi-times" (click)="posService.removeFromCart(item.product.id)"
                                    class="p-button-text p-button-sm p-button-rounded p-button-danger !w-7 !h-7 ml-1"></button>
                            </div>
                        </div>
                    } @empty {
                        <div class="flex flex-col items-center justify-center text-surface-400 h-full">
                            <i class="pi pi-shopping-cart text-4xl block mb-2"></i>
                            <span class="text-sm">Cart is empty</span>
                            <span class="text-xs mt-1">Tap a product to add it</span>
                        </div>
                    }
                </div>

                <div class="border-t border-surface-200 dark:border-surface-700 pt-3 mt-3 space-y-2">
                    <div class="flex justify-between text-sm">
                        <span class="text-surface-500">Subtotal</span>
                        <span class="font-bold text-surface-900 dark:text-surface-0">€{{ posService.getCartSubtotal().toFixed(2) }}</span>
                    </div>
                    <button pButton label="Process Payment" icon="pi pi-credit-card" [disabled]="posService.cart().length === 0 || !openShift()"
                        styleClass="w-full" size="large" (click)="showPaymentDialog = true"></button>
                    @if (!openShift()) {
                        <div class="text-xs text-red-500 text-center flex items-center justify-center gap-1">
                            <i class="pi pi-exclamation-circle"></i> Start a shift first
                        </div>
                    }
                </div>
            </div>
        </div>

        <p-dialog header="Process Payment" [(visible)]="showPaymentDialog" [modal]="true" [style]="{ width: '460px' }" [closable]="false">
            <div class="space-y-4">
                <div class="bg-surface-50 dark:bg-surface-700 rounded-lg p-3 space-y-1 text-sm">
                    @for (item of posService.cart(); track item.product.id) {
                        <div class="flex justify-between">
                            <span class="text-surface-600 dark:text-surface-300">{{ item.product.name }} <span class="text-surface-400">x{{ item.quantity }}</span></span>
                            <span>€{{ (item.product.price * item.quantity).toFixed(2) }}</span>
                        </div>
                    }
                    <div class="flex justify-between font-bold pt-1 border-t border-surface-300 dark:border-surface-500">
                        <span>Subtotal</span>
                        <span>€{{ posService.getCartSubtotal().toFixed(2) }}</span>
                    </div>
                </div>

                <div class="flex items-center gap-3 pt-1">
                    <span class="text-sm font-medium">Donation</span>
                    <button pButton
                        [label]="donating ? 'Yes' : 'No'"
                        [severity]="donating ? 'success' : 'secondary'"
                        [outlined]="!donating"
                        size="small"
                        (click)="donating = !donating; calculateChange()"></button>
                    @if (donating) {
                        <p-inputNumber [(ngModel)]="donationAmount" [min]="0" [max]="99999"
                            mode="currency" currency="EUR" styleClass="w-32"
                            (onInput)="calculateChange()"></p-inputNumber>
                    }
                </div>

                <div class="flex justify-between text-sm font-semibold border-t border-surface-200 dark:border-surface-700 pt-2">
                    <span>Total</span>
                    <span>€{{ (posService.getCartSubtotal() + (donating ? donationAmount : 0)).toFixed(2) }}</span>
                </div>

                <div>
                    <label class="block text-sm font-medium mb-1">Amount Given</label>
                    <p-inputNumber [(ngModel)]="amountGiven" [min]="0" [max]="99999" mode="currency" currency="EUR"
                        inputId="amount-given" styleClass="w-full text-xl font-bold"
                        (onInput)="calculateChange()"></p-inputNumber>
                </div>

                @if (amountGiven > 0 && amountGiven >= (posService.getCartSubtotal() + (donating ? donationAmount : 0))) {
                    <div class="bg-surface-50 dark:bg-surface-700 rounded-lg p-3">
                        <div class="flex justify-between text-sm">
                            <span>Amount Given</span>
                            <span class="font-bold">€{{ amountGiven.toFixed(2) }}</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span>Total</span>
                            <span class="font-bold">€{{ (posService.getCartSubtotal() + (donating ? donationAmount : 0)).toFixed(2) }}</span>
                        </div>
                        <div class="flex justify-between text-sm font-bold pt-1 border-t border-surface-300 dark:border-surface-500"
                            [class.text-green-600]="changeAmount() > 0" [class.text-surface-500]="changeAmount() === 0">
                            <span>{{ changeAmount() > 0 ? 'Change' : 'Exact amount' }}</span>
                            <span>{{ changeAmount() > 0 ? ('€' + changeAmount().toFixed(2)) : '€0.00' }}</span>
                        </div>
                    </div>
                }

                <div class="flex gap-2 justify-end pt-2 border-t border-surface-200 dark:border-surface-700">
                    <button pButton label="Cancel" [outlined]="true" [disabled]="submitting()" (click)="cancelPayment()"></button>
                    <button pButton label="Complete Payment" icon="pi pi-check" [loading]="submitting()" [disabled]="!canCompletePayment()" (click)="completePayment()"></button>
                </div>
            </div>
        </p-dialog>

        <p-dialog header="Start Shift" [(visible)]="showStartDialog" [modal]="true" [style]="{ width: '400px' }">
            <div class="space-y-3">
                <div>
                    <label class="block text-sm font-medium mb-1">Starting Cash (€)</label>
                    <p-inputNumber [(ngModel)]="startForm.startingCash" [min]="0" mode="currency" currency="EUR" styleClass="w-full"></p-inputNumber>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Notes</label>
                    <input pInputText [(ngModel)]="startForm.notes" class="w-full" />
                </div>
                <div class="flex gap-2 justify-end pt-2">
                    <button pButton label="Cancel" [outlined]="true" (click)="showStartDialog = false"></button>
                    <button pButton label="Start Shift" icon="pi pi-play" (click)="startShift()"></button>
                </div>
            </div>
        </p-dialog>

        <p-dialog header="End Shift" [(visible)]="showEndDialog" [modal]="true" [style]="{ width: '420px' }">
            @if (openShift(); as s) {
                <div class="space-y-3">
                    <div class="bg-surface-50 dark:bg-surface-700 rounded-lg p-3 text-sm space-y-1">
                        <div class="flex justify-between"><span>Starting Cash:</span><span>€{{ s.startingCash.toFixed(2) }}</span></div>
                        <div class="flex justify-between"><span>Sales:</span><span>€{{ (s.totalSales || 0).toFixed(2) }}</span></div>
                        <div class="flex justify-between font-bold border-t border-surface-300 dark:border-surface-500 pt-1"><span>Expected Cash:</span><span>€{{ ((s.startingCash || 0) + (s.totalSales || 0)).toFixed(2) }}</span></div>
                        <div class="flex justify-between"><span>Orders:</span><span>{{ s.orderCount || 0 }}</span></div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Ending Cash (€) <span class="text-red-500">*</span></label>
                        <p-inputNumber [(ngModel)]="endForm.endingCash" [min]="0" mode="currency" currency="EUR" styleClass="w-full"></p-inputNumber>
                    </div>
                    @if (endForm.endingCash > 0) {
                        <div class="rounded-lg p-3 text-sm font-semibold flex justify-between items-center"
                            [class]="endShiftVariance(s) === 0 ? 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300' : (endShiftVariance(s) > 0 ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400')">
                            <span>{{ endShiftVariance(s) === 0 ? 'Balanced' : (endShiftVariance(s) > 0 ? 'Over' : 'Short') }}</span>
                            <span>{{ endShiftVariance(s) > 0 ? '+' : '' }}€{{ endShiftVariance(s).toFixed(2) }}</span>
                        </div>
                    }
                    <div>
                        <label class="block text-sm font-medium mb-1">Notes</label>
                        <input pInputText [(ngModel)]="endForm.notes" class="w-full" />
                    </div>
                    <div class="flex gap-2 justify-end pt-2">
                        <button pButton label="Cancel" [outlined]="true" (click)="showEndDialog = false"></button>
                        <button pButton label="End Shift" icon="pi pi-stop-circle" severity="danger" (click)="endShift()"></button>
                    </div>
                </div>
            }
        </p-dialog>
    `
})
export class PosTerminal implements OnInit {
    categories = signal<PosCategory[]>([]);
    products = signal<PosProduct[]>([]);
    customers = signal<PosCustomer[]>([]);
    selectedCategoryId = signal<string | null>(null);
    openShift = signal<any>(null);
    loadingProducts = signal(true);
    submitting = signal(false);

    showPaymentDialog = false;
    amountGiven = 0;
    donating = false;
    donationAmount = 0;
    customerSearch = '';
    Math = Math;

    showStartDialog = false;
    showEndDialog = false;
    startForm = { startingCash: 0, notes: '' };
    endForm = { endingCash: 0, notes: '' };

    changeAmount = signal(0);

    canCompletePayment(): boolean {
        if (this.amountGiven <= 0) return false;
        const total = this.posService.getCartSubtotal() + (this.donating ? this.donationAmount : 0);
        return this.amountGiven >= total;
    }

    constructor(
        public posService: PosService,
        private messageService: MessageService
    ) {}

    ngOnInit() {
        this.loadCategories();
        this.loadProducts();
        this.loadOpenShift();
    }

    loadCategories() {
        this.posService.getCategories().subscribe(cats => this.categories.set(cats));
    }

    loadProducts() {
        this.loadingProducts.set(true);
        this.posService.getProducts(this.selectedCategoryId() ?? undefined)
            .subscribe({
                next: (prods) => {
                    this.products.set(prods.filter(p => p.isAvailable));
                    this.loadingProducts.set(false);
                },
                error: () => this.loadingProducts.set(false)
            });
    }

    loadOpenShift() {
        this.posService.getOpenShift().subscribe((res: any) => {
            this.openShift.set(res.shift ?? null);
        });
    }

    searchCustomers() {
        if (!this.customerSearch.trim()) return;
        this.posService.getCustomers(this.customerSearch).subscribe(c => this.customers.set(c));
    }

    cartQtyFor(productId: string): number {
        return this.posService.cart().find(i => i.product.id === productId)?.quantity ?? 0;
    }

    selectProduct(product: PosProduct) {
        if (product.stock <= 0 || this.cartQtyFor(product.id) >= product.stock) {
            if (product.stock > 0) {
                this.messageService.add({ severity: 'warn', summary: 'Stock limit', detail: `Only ${product.stock} in stock`, life: 2500 });
            }
            return;
        }
        this.posService.addToCart(product);
    }

    incrementCartItem(productId: string) {
        const item = this.posService.cart().find(i => i.product.id === productId);
        if (!item || item.quantity >= item.product.stock) return;
        this.posService.updateQuantity(productId, item.quantity + 1);
    }

    calculateChange() {
        const total = this.posService.getCartSubtotal() + (this.donating ? this.donationAmount : 0);
        this.changeAmount.set(Math.max(0, this.amountGiven - total));
    }

    cancelPayment() {
        this.showPaymentDialog = false;
        this.amountGiven = 0;
        this.donating = false;
        this.donationAmount = 0;
        this.changeAmount.set(0);
    }

    completePayment() {
        const subtotal = this.posService.getCartSubtotal();
        const donation = this.donating ? this.donationAmount : 0;
        const total = subtotal + donation;
        const amountGiven = this.amountGiven;
        const change = amountGiven - total;

        const order = {
            customerId: this.posService.selectedCustomer()?.id ?? null,
            customerName: this.posService.selectedCustomer() ? (this.posService.selectedCustomer()!.firstName + ' ' + this.posService.selectedCustomer()!.lastName) : null,
            subtotal,
            donation,
            amountGiven,
            paymentMethod: 'Cash',
            items: this.posService.cart().map(item => ({
                productId: item.product.id,
                productName: item.product.name,
                price: item.product.price,
                quantity: item.quantity,
                subtotal: item.product.price * item.quantity
            }))
        };

        this.submitting.set(true);
        this.posService.createOrder(order).subscribe({
            next: (res) => {
                this.submitting.set(false);
                this.messageService.add({ severity: 'success', summary: 'Payment Complete',
                    detail: `Order ${res.orderNumber} — Change: €${res.change.toFixed(2)}`, life: 5000 });
                this.posService.clearCart();
                this.posService.selectedCustomer.set(null);
                this.cancelPayment();
                this.loadProducts();
                this.loadOpenShift();
            },
            error: (err) => {
                this.submitting.set(false);
                this.messageService.add({ severity: 'error', summary: 'Payment failed', detail: err.error?.message || 'Something went wrong, please try again' });
            }
        });
    }

    startShift() {
        this.posService.startShift(this.startForm).subscribe({
            next: () => { this.messageService.add({ severity: 'success', detail: 'Shift started' }); this.showStartDialog = false; this.startForm = { startingCash: 0, notes: '' }; this.loadOpenShift(); },
            error: (err) => this.messageService.add({ severity: 'error', detail: err.error?.message || 'Failed to start shift' })
        });
    }

    openEndDialog() {
        this.endForm = { endingCash: 0, notes: '' };
        this.showEndDialog = true;
    }

    endShiftVariance(shift: any): number {
        const expected = (shift.startingCash || 0) + (shift.totalSales || 0);
        return this.endForm.endingCash - expected;
    }

    endShift() {
        const s = this.openShift();
        if (!s) return;
        this.posService.endShift(s.id, this.endForm).subscribe({
            next: () => { this.messageService.add({ severity: 'success', detail: 'Shift ended' }); this.showEndDialog = false; this.loadOpenShift(); },
            error: (err) => this.messageService.add({ severity: 'error', detail: err.error?.message || 'Failed to end shift' })
        });
    }
}
