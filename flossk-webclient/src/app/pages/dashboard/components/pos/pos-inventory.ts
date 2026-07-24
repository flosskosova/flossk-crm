import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { SelectModule } from 'primeng/select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PosService, PosCategory, PosProduct } from '@/pages/service/pos.service';

@Component({
    selector: 'app-pos-inventory',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ButtonModule, TableModule, DialogModule, TabsModule,
        InputTextModule, InputNumberModule, ToastModule, ConfirmDialogModule, TagModule,
        ToggleSwitchModule, SelectModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-confirmDialog />
        <p-toast />
        <div class="card">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-bold text-surface-900 dark:text-surface-0">Inventory Management</h2>
                <div class="flex gap-2">
                    <button pButton label="New Category" icon="pi pi-plus" [outlined]="true" (click)="showCategoryDialog = true; editingCategory = null; categoryForm = {name:'',description:'',sortOrder:0}"></button>
                    <button pButton label="New Product" icon="pi pi-plus" severity="success" (click)="showProductDialog = true; editingProduct = null; productForm = {name:'',price:0,stock:0,categoryId:'',isAvailable:true}"></button>
                </div>
            </div>

            <p-tabs value="0">
                <p-tablist>
                    <p-tab value="0">Products</p-tab>
                    <p-tab value="1">Categories</p-tab>
                </p-tablist>
                <p-tabpanels>
                    <p-tabpanel value="0">
                        <p-table #productsTable [value]="products()" [paginator]="true" [rows]="15" [globalFilterFields]="['name','categoryName']" [loading]="loading()">
                            <ng-template pTemplate="caption">
                                <div class="flex justify-end">
                                    <span class="relative">
                                        <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 text-sm"></i>
                                        <input pInputText placeholder="Search products..." (input)="productsTable.filterGlobal($any($event.target).value, 'contains')" class="text-sm pl-8" />
                                    </span>
                                </div>
                            </ng-template>
                            <ng-template pTemplate="header">
                                <tr>
                                    <th>Name</th>
                                    <th>Category</th>
                                    <th>Price</th>
                                    <th>Stock</th>
                                    <th>Available</th>
                                    <th class="text-right">Actions</th>
                                </tr>
                            </ng-template>
                            <ng-template pTemplate="body" let-p>
                                <tr>
                                    <td class="font-medium text-surface-900 dark:text-surface-0">{{ p.name }}</td>
                                    <td>{{ p.categoryName }}</td>
                                    <td>€{{ p.price.toFixed(2) }}</td>
                                    <td>
                                        <p-tag [value]="p.stock.toString()" [severity]="p.stock === 0 ? 'danger' : (p.stock <= 5 ? 'warn' : 'success')" />
                                    </td>
                                    <td>
                                        <p-tag [value]="p.isAvailable ? 'Available' : 'Hidden'" [severity]="p.isAvailable ? 'success' : 'secondary'" />
                                    </td>
                                    <td class="text-right">
                                        <button pButton icon="pi pi-pencil" class="p-button-sm p-button-text" (click)="editProduct(p)"></button>
                                        <button pButton icon="pi pi-trash" class="p-button-sm p-button-text p-button-danger" (click)="confirmDeleteProduct(p)"></button>
                                    </td>
                                </tr>
                            </ng-template>
                            <ng-template pTemplate="emptymessage">
                                <tr>
                                    <td colspan="6">
                                        <div class="flex flex-col items-center justify-center text-surface-400 py-8">
                                            <i class="pi pi-box text-3xl mb-2"></i>
                                            <span class="text-sm">No products yet</span>
                                        </div>
                                    </td>
                                </tr>
                            </ng-template>
                        </p-table>
                    </p-tabpanel>

                    <p-tabpanel value="1">
                        <p-table [value]="categories()" [loading]="loading()">
                            <ng-template pTemplate="header">
                                <tr>
                                    <th>Name</th>
                                    <th>Description</th>
                                    <th>Order</th>
                                    <th class="text-right">Actions</th>
                                </tr>
                            </ng-template>
                            <ng-template pTemplate="body" let-c>
                                <tr>
                                    <td class="font-medium text-surface-900 dark:text-surface-0">{{ c.name }}</td>
                                    <td class="text-surface-500">{{ c.description || '-' }}</td>
                                    <td>{{ c.sortOrder }}</td>
                                    <td class="text-right">
                                        <button pButton icon="pi pi-pencil" class="p-button-sm p-button-text" (click)="editCategory(c)"></button>
                                        <button pButton icon="pi pi-trash" class="p-button-sm p-button-text p-button-danger" (click)="confirmDeleteCategory(c)"></button>
                                    </td>
                                </tr>
                            </ng-template>
                            <ng-template pTemplate="emptymessage">
                                <tr>
                                    <td colspan="4">
                                        <div class="flex flex-col items-center justify-center text-surface-400 py-8">
                                            <i class="pi pi-tags text-3xl mb-2"></i>
                                            <span class="text-sm">No categories yet</span>
                                        </div>
                                    </td>
                                </tr>
                            </ng-template>
                        </p-table>
                    </p-tabpanel>
                </p-tabpanels>
            </p-tabs>
        </div>

        <p-dialog [header]="editingProduct ? 'Edit Product' : 'New Product'" [(visible)]="showProductDialog" [modal]="true" [style]="{ width: '420px' }" [breakpoints]="{ '575px': '95vw' }">
            <div class="space-y-3">
                <div>
                    <label class="block text-sm font-medium mb-1">Name</label>
                    <input pInputText [(ngModel)]="productForm.name" class="w-full" />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Category</label>
                    <p-select [(ngModel)]="productForm.categoryId" [options]="categories()" optionLabel="name" optionValue="id" placeholder="Select a category" styleClass="w-full" />
                </div>
                <div class="flex flex-col sm:flex-row gap-3">
                    <div class="flex-1">
                        <label class="block text-sm font-medium mb-1">Price (€)</label>
                        <p-inputNumber [(ngModel)]="productForm.price" [min]="0" mode="currency" currency="EUR" styleClass="w-full"></p-inputNumber>
                    </div>
                    <div class="flex-1">
                        <label class="block text-sm font-medium mb-1">Stock</label>
                        <p-inputNumber [(ngModel)]="productForm.stock" [min]="0" styleClass="w-full"></p-inputNumber>
                    </div>
                </div>
                <div class="flex items-center justify-between bg-surface-50 dark:bg-surface-700 rounded-lg px-3 py-2.5">
                    <div>
                        <div class="text-sm font-medium">Available for sale</div>
                        <div class="text-xs text-surface-400">Hidden products won't appear at the terminal</div>
                    </div>
                    <p-toggleswitch [(ngModel)]="productForm.isAvailable" />
                </div>
                <div class="flex gap-2 justify-end pt-2 border-t border-surface-200 dark:border-surface-700">
                    <button pButton label="Cancel" [outlined]="true" (click)="showProductDialog = false"></button>
                    <button pButton [label]="editingProduct ? 'Update' : 'Create'" [loading]="saving()" (click)="saveProduct()"></button>
                </div>
            </div>
        </p-dialog>

        <p-dialog [header]="editingCategory ? 'Edit Category' : 'New Category'" [(visible)]="showCategoryDialog" [modal]="true" [style]="{ width: '400px' }" [breakpoints]="{ '575px': '95vw' }">
            <div class="space-y-3">
                <div>
                    <label class="block text-sm font-medium mb-1">Name</label>
                    <input pInputText [(ngModel)]="categoryForm.name" class="w-full" />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Description</label>
                    <input pInputText [(ngModel)]="categoryForm.description" class="w-full" />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Sort Order</label>
                    <p-inputNumber [(ngModel)]="categoryForm.sortOrder" [min]="0" styleClass="w-full"></p-inputNumber>
                </div>
                <div class="flex gap-2 justify-end pt-2">
                    <button pButton label="Cancel" [outlined]="true" (click)="showCategoryDialog = false"></button>
                    <button pButton [label]="editingCategory ? 'Update' : 'Create'" [loading]="saving()" (click)="saveCategory()"></button>
                </div>
            </div>
        </p-dialog>
    `
})
export class PosInventory implements OnInit {
    categories = signal<PosCategory[]>([]);
    products = signal<PosProduct[]>([]);
    loading = signal(false);
    saving = signal(false);

    showProductDialog = false;
    showCategoryDialog = false;
    editingProduct: PosProduct | null = null;
    editingCategory: PosCategory | null = null;
    productForm = { name: '', price: 0, stock: 0, categoryId: '', isAvailable: true };
    categoryForm = { name: '', description: '', sortOrder: 0 };

    constructor(
        private posService: PosService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.loading.set(true);
        this.posService.getCategories().subscribe(c => this.categories.set(c));
        this.posService.getProducts().subscribe({
            next: (p) => { this.products.set(p); this.loading.set(false); },
            error: () => this.loading.set(false)
        });
    }

    editProduct(p: PosProduct) {
        this.editingProduct = p;
        this.productForm = { name: p.name, price: p.price, stock: p.stock, categoryId: p.categoryId, isAvailable: p.isAvailable };
        this.showProductDialog = true;
    }

    saveProduct() {
        const data = this.productForm;
        this.saving.set(true);
        const done = () => { this.saving.set(false); this.showProductDialog = false; this.loadData(); };
        if (this.editingProduct) {
            this.posService.updateProduct(this.editingProduct.id, data).subscribe({
                next: () => { this.messageService.add({ severity: 'success', detail: 'Product updated' }); done(); },
                error: (err) => { this.saving.set(false); this.messageService.add({ severity: 'error', detail: err.error?.message || 'Failed' }); }
            });
        } else {
            this.posService.createProduct(data).subscribe({
                next: () => { this.messageService.add({ severity: 'success', detail: 'Product created' }); done(); },
                error: (err) => { this.saving.set(false); this.messageService.add({ severity: 'error', detail: err.error?.message || 'Failed' }); }
            });
        }
    }

    confirmDeleteProduct(p: PosProduct) {
        this.confirmationService.confirm({
            message: `Delete "${p.name}"?`,
            accept: () => {
                this.posService.deleteProduct(p.id).subscribe({
                    next: () => { this.messageService.add({ severity: 'success', detail: 'Deleted' }); this.loadData(); },
                    error: () => this.messageService.add({ severity: 'error', detail: 'Failed' })
                });
            }
        });
    }

    editCategory(c: PosCategory) {
        this.editingCategory = c;
        this.categoryForm = { name: c.name, description: c.description || '', sortOrder: c.sortOrder };
        this.showCategoryDialog = true;
    }

    saveCategory() {
        const data = this.categoryForm;
        this.saving.set(true);
        const done = () => { this.saving.set(false); this.showCategoryDialog = false; this.loadData(); };
        if (this.editingCategory) {
            this.posService.updateCategory(this.editingCategory.id, data).subscribe({
                next: () => { this.messageService.add({ severity: 'success', detail: 'Category updated' }); done(); },
                error: (err) => { this.saving.set(false); this.messageService.add({ severity: 'error', detail: err.error?.message || 'Failed' }); }
            });
        } else {
            this.posService.createCategory(data).subscribe({
                next: () => { this.messageService.add({ severity: 'success', detail: 'Category created' }); done(); },
                error: (err) => { this.saving.set(false); this.messageService.add({ severity: 'error', detail: err.error?.message || 'Failed' }); }
            });
        }
    }

    confirmDeleteCategory(c: PosCategory) {
        this.confirmationService.confirm({
            message: `Delete category "${c.name}"?`,
            accept: () => {
                this.posService.deleteCategory(c.id).subscribe({
                    next: () => { this.messageService.add({ severity: 'success', detail: 'Deleted' }); this.loadData(); },
                    error: (err) => this.messageService.add({ severity: 'error', detail: err.error?.message || 'Failed' })
                });
            }
        });
    }
}
