import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Customer {
    id: bigint;
    name: string;
    email: string;
    address: string;
    phone: string;
}
export interface SalesOrder {
    id: bigint;
    customerName: string;
    status: string;
    createdAt: bigint;
    totalAmount: number;
    customerId: bigint;
    items: Array<OrderItem>;
}
export interface SessionToken {
    token: string;
    username: string;
    role: string;
}
export interface OrderItem {
    productId: bigint;
    productName: string;
    quantity: bigint;
    unitPrice: number;
}
export interface Supplier {
    id: bigint;
    contactName: string;
    name: string;
    email: string;
    phone: string;
}
export interface PurchaseOrder {
    id: bigint;
    status: string;
    supplierName: string;
    createdAt: bigint;
    totalAmount: number;
    items: Array<OrderItem>;
    supplierId: bigint;
}
export interface DashboardStats {
    totalProducts: bigint;
    totalStockValue: number;
    pendingSalesCount: bigint;
    totalSalesRevenue: number;
    lowStockProducts: Array<Product>;
}
export interface Product {
    id: bigint;
    stockQuantity: bigint;
    lowStockThreshold: bigint;
    name: string;
    unit: string;
    pricePerUnit: number;
    category: string;
}
export interface UserProfile {
    username: string;
    role: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface StaffAccount {
    name: string;
    username: string;
}
export interface CustomerAccount {
    name: string;
    username: string;
}
export interface PackingMaster {
    id: bigint;
    packingName: string;
    itemName: string;
    packingType: string;
    standardWeight: number;
    tareWeight: number;
    marka: string;
    size: string;
    unitType: string;
    isReturnable: boolean;
    crateCategory: string;
    crateCode: string;
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createCustomer(token: string, name: string, phone: string, email: string, address: string): Promise<bigint>;
    createProduct(token: string, name: string, category: string, unit: string, pricePerUnit: number, stockQuantity: bigint, lowStockThreshold: bigint): Promise<bigint>;
    createPurchaseOrder(token: string, supplierId: bigint, supplierName: string, items: Array<OrderItem>): Promise<bigint>;
    createSalesOrder(token: string, customerId: bigint, customerName: string, items: Array<OrderItem>): Promise<bigint>;
    createSupplier(token: string, name: string, contactName: string, phone: string, email: string): Promise<bigint>;
    deleteCustomer(token: string, customerId: bigint): Promise<boolean>;
    deleteProduct(token: string, productId: bigint): Promise<boolean>;
    deleteSupplier(token: string, supplierId: bigint): Promise<boolean>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCustomer(token: string, customerId: bigint): Promise<Customer | null>;
    getDashboardStats(token: string): Promise<DashboardStats>;
    getProduct(productId: bigint): Promise<Product | null>;
    getPurchaseOrder(token: string, orderId: bigint): Promise<PurchaseOrder | null>;
    getSalesOrder(token: string, orderId: bigint): Promise<SalesOrder | null>;
    getSupplier(token: string, supplierId: bigint): Promise<Supplier | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listCustomers(token: string): Promise<Array<Customer>>;
    listProducts(): Promise<Array<Product>>;
    listPurchaseOrders(token: string): Promise<Array<PurchaseOrder>>;
    listSalesOrders(token: string): Promise<Array<SalesOrder>>;
    listSuppliers(token: string): Promise<Array<Supplier>>;
    login(username: string, password: string): Promise<SessionToken | null>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateCustomer(token: string, customerId: bigint, name: string, phone: string, email: string, address: string): Promise<boolean>;
    updateProduct(token: string, productId: bigint, name: string, category: string, unit: string, pricePerUnit: number, stockQuantity: bigint, lowStockThreshold: bigint): Promise<boolean>;
    updatePurchaseOrderStatus(token: string, orderId: bigint, newStatus: string): Promise<boolean>;
    updateSalesOrderStatus(token: string, orderId: bigint, newStatus: string): Promise<boolean>;
    updateSupplier(token: string, supplierId: bigint, name: string, contactName: string, phone: string, email: string): Promise<boolean>;
    addStaff(token: string, name: string, username: string, password: string): Promise<boolean>;
    removeStaff(token: string, username: string): Promise<boolean>;
    listStaff(token: string): Promise<Array<StaffAccount>>;
    addCustomerLogin(token: string, name: string, username: string, password: string): Promise<boolean>;
    removeCustomerLogin(token: string, username: string): Promise<boolean>;
    listCustomerLogins(token: string): Promise<Array<CustomerAccount>>;
    createPacking(token: string, packingName: string, itemName: string, packingType: string, standardWeight: number, tareWeight: number, marka: string, size: string, unitType: string, isReturnable: boolean, crateCategory: string, crateCode: string): Promise<bigint>;
    listPackings(token: string): Promise<Array<PackingMaster>>;
    getPacking(token: string, packingId: bigint): Promise<PackingMaster | null>;
    deletePacking(token: string, packingId: bigint): Promise<boolean>;
}
