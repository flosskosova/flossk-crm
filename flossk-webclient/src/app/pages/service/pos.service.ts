import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment.prod';

export interface PosCategory {
    id: string;
    name: string;
    description?: string;
    sortOrder: number;
}

export interface PosProduct {
    id: string;
    name: string;
    price: number;
    stock: number;
    isAvailable: boolean;
    categoryId: string;
    categoryName: string;
}

export interface PosCustomer {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    totalSpent: number;
    visitCount: number;
    lastVisitAt?: string;
}

export interface PosOrderItem {
    productId: string;
    productName: string;
    price: number;
    quantity: number;
    subtotal: number;
}

export interface PosOrder {
    id: string;
    orderNumber: string;
    customerId?: string;
    customerName?: string;
    operatorName?: string;
    subtotal: number;
    donation: number;
    total: number;
    amountGiven: number;
    change: number;
    paymentMethod: string;
    notes?: string;
    createdAt: string;
    items: PosOrderItem[];
}

export interface PosPaymentLog {
    id: string;
    orderId: string;
    orderNumber: string;
    customerName?: string;
    operatorName: string;
    subtotal: number;
    donation: number;
    total: number;
    amountGiven: number;
    change: number;
    paymentMethod: string;
    action: string;
    createdAt: string;
}

export interface PosShift {
    id: string;
    operatorName: string;
    startingCash: number;
    endingCash?: number;
    expectedCash?: number;
    totalSales?: number;
    totalDonations?: number;
    orderCount?: number;
    status: string;
    notes?: string;
    startedAt: string;
    endedAt?: string;
}

export interface PosAnalytics {
    currentMonth: PosMonthlySummary;
    monthlyHistory: PosMonthlySummary[];
    topProducts: PosTopProduct[];
    topCustomers: PosTopCustomer[];
    dailySales: PosDailySale[];
    totalRevenue: number;
    totalDonations: number;
    totalOrders: number;
    averageOrderValue: number;
    donationCount: number;
    paymentMethodBreakdown: PosPaymentMethodBreakdown[];
    peakHours: PosHourlySummary[];
}

export interface PosMonthlySummary {
    year: number;
    month: number;
    totalSales: number;
    totalDonations: number;
    totalRevenue: number;
    orderCount: number;
    customerCount: number;
    averageOrderValue: number;
}

export interface PosPaymentMethodBreakdown {
    method: string;
    total: number;
    count: number;
}

export interface PosHourlySummary {
    hour: number;
    orderCount: number;
    revenue: number;
}

export interface PosTopProduct {
    productId: string;
    productName: string;
    totalQuantity: number;
    totalRevenue: number;
}

export interface PosTopCustomer {
    customerId: string;
    customerName: string;
    totalSpent: number;
    visitCount: number;
    lastVisitAt?: string;
}

export interface PosDailySale {
    date: string;
    totalSales: number;
    totalDonations: number;
    orderCount: number;
}

export interface PosDonationLog {
    id: string;
    orderId: string;
    orderNumber: string;
    customerName?: string;
    operatorName: string;
    donation: number;
    subtotal: number;
    total: number;
    paymentMethod: string;
    action: string;
    createdAt: string;
}

export interface PosOperator {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    isPosOperator: boolean;
    roles?: string[];
}

export interface CartItem {
    product: PosProduct;
    quantity: number;
}

@Injectable({ providedIn: 'root' })
export class PosService {
    private readonly API = `${environment.apiUrl}/Pos`;

    cart = signal<CartItem[]>([]);
    selectedCustomer = signal<PosCustomer | null>(null);

    constructor(private http: HttpClient) {}

    // Categories
    getCategories(): Observable<PosCategory[]> {
        return this.http.get<PosCategory[]>(`${this.API}/categories`);
    }

    createCategory(data: Partial<PosCategory>): Observable<PosCategory> {
        return this.http.post<PosCategory>(`${this.API}/categories`, data);
    }

    updateCategory(id: string, data: Partial<PosCategory>): Observable<any> {
        return this.http.put(`${this.API}/categories/${id}`, data);
    }

    deleteCategory(id: string): Observable<any> {
        return this.http.delete(`${this.API}/categories/${id}`);
    }

    // Products
    getProducts(categoryId?: string): Observable<PosProduct[]> {
        const params = categoryId ? `?categoryId=${categoryId}` : '';
        return this.http.get<PosProduct[]>(`${this.API}/products${params}`);
    }

    createProduct(data: Partial<PosProduct>): Observable<any> {
        return this.http.post(`${this.API}/products`, data);
    }

    updateProduct(id: string, data: Partial<PosProduct>): Observable<any> {
        return this.http.put(`${this.API}/products/${id}`, data);
    }

    deleteProduct(id: string): Observable<any> {
        return this.http.delete(`${this.API}/products/${id}`);
    }

    // Customers
    getCustomers(search?: string): Observable<PosCustomer[]> {
        const params = search ? `?search=${encodeURIComponent(search)}` : '';
        return this.http.get<PosCustomer[]>(`${this.API}/customers${params}`);
    }

    createCustomer(data: Partial<PosCustomer>): Observable<PosCustomer> {
        return this.http.post<PosCustomer>(`${this.API}/customers`, data);
    }

    updateCustomer(id: string, data: Partial<PosCustomer>): Observable<any> {
        return this.http.put(`${this.API}/customers/${id}`, data);
    }

    // Orders
    createOrder(data: any): Observable<PosOrder> {
        return this.http.post<PosOrder>(`${this.API}/orders`, data);
    }

    getOrders(from?: string, to?: string, page = 1, pageSize = 50): Observable<any> {
        let params = `?page=${page}&pageSize=${pageSize}`;
        if (from) params += `&from=${from}`;
        if (to) params += `&to=${to}`;
        return this.http.get(`${this.API}/orders${params}`);
    }

    // Payment Logs
    getPaymentLogs(from?: string, to?: string, page = 1, pageSize = 50): Observable<any> {
        let params = `?page=${page}&pageSize=${pageSize}`;
        if (from) params += `&from=${from}`;
        if (to) params += `&to=${to}`;
        return this.http.get(`${this.API}/payment-logs${params}`);
    }

    // Donation Logs
    getDonationLogs(from?: string, to?: string, page = 1, pageSize = 50): Observable<any> {
        let params = `?page=${page}&pageSize=${pageSize}`;
        if (from) params += `&from=${from}`;
        if (to) params += `&to=${to}`;
        return this.http.get(`${this.API}/donation-logs${params}`);
    }

    // Analytics
    getAnalytics(from?: string, to?: string): Observable<PosAnalytics> {
        let params = '';
        if (from) params += `?from=${from}`;
        if (to) params += `${params ? '&' : '?'}to=${to}`;
        return this.http.get<PosAnalytics>(`${this.API}/analytics${params}`);
    }

    // Operators
    getOperators(): Observable<PosOperator[]> {
        return this.http.get<PosOperator[]>(`${this.API}/operators`);
    }

    addOperator(userId: string): Observable<any> {
        return this.http.post(`${this.API}/operators/${userId}`, {});
    }

    removeOperator(userId: string): Observable<any> {
        return this.http.delete(`${this.API}/operators/${userId}`);
    }

    // Shifts
    startShift(data: { startingCash: number; notes?: string }): Observable<PosShift> {
        return this.http.post<PosShift>(`${this.API}/shifts/start`, data);
    }

    endShift(id: string, data: { endingCash: number; notes?: string }): Observable<PosShift> {
        return this.http.post<PosShift>(`${this.API}/shifts/${id}/end`, data);
    }

    getOpenShift(): Observable<any> {
        return this.http.get(`${this.API}/shifts/open`);
    }

    getShifts(page = 1, pageSize = 20): Observable<any> {
        return this.http.get(`${this.API}/shifts?page=${page}&pageSize=${pageSize}`);
    }

    // Cart management
    addToCart(product: PosProduct) {
        this.cart.update(items => {
            const existing = items.find(i => i.product.id === product.id);
            if (existing) {
                return items.map(i =>
                    i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
                );
            }
            return [...items, { product, quantity: 1 }];
        });
    }

    removeFromCart(productId: string) {
        this.cart.update(items => items.filter(i => i.product.id !== productId));
    }

    updateQuantity(productId: string, quantity: number) {
        if (quantity <= 0) {
            this.removeFromCart(productId);
            return;
        }
        this.cart.update(items =>
            items.map(i => i.product.id === productId ? { ...i, quantity } : i)
        );
    }

    clearCart() {
        this.cart.set([]);
    }

    getCartSubtotal(): number {
        return this.cart().reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    }

    getCartItemCount(): number {
        return this.cart().reduce((sum, item) => sum + item.quantity, 0);
    }
}
